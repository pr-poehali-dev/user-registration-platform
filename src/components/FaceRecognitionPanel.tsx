import { useState, useRef, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';
import Icon from '@/components/ui/icon';

interface Person {
  id: number;
  full_name: string;
  photo_url: string | null;
}

interface Props {
  onClose: () => void;
}

const MIN_W = 320;
const MAX_W = 720;
const MIN_H = 300;
const MAX_H = window.innerHeight - 80;

export default function FaceRecognitionPanel({ onClose }: Props) {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imgNaturalSize, setImgNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [matched, setMatched] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Panel size — resizable
  const [panelW, setPanelW] = useState(400);
  const [panelH, setPanelH] = useState(500);
  const resizing = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);

  // Auto-resize panel when big image loaded
  useEffect(() => {
    if (!imgNaturalSize) return;
    const ratio = imgNaturalSize.w / imgNaturalSize.h;
    const targetW = Math.min(Math.max(imgNaturalSize.w * 0.5, MIN_W), MAX_W);
    const imgDisplayH = targetW / ratio;
    const newH = Math.min(Math.max(imgDisplayH + 260, MIN_H), MAX_H);
    setPanelW(Math.round(targetW));
    setPanelH(Math.round(newH));
  }, [imgNaturalSize]);

  const loadAndSearch = async (dataUrl: string) => {
    setUploadedImage(dataUrl);
    setLoading(true);
    setSearched(false);
    setMatched([]);
    try {
      const res = await api.people.list();
      const allPeople: Person[] = res.people || [];
      const withPhotos = allPeople.filter(p => p.photo_url);
      setMatched(withPhotos);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const dataUrl = e.target?.result as string;
      // Get natural image size
      const img = new Image();
      img.onload = () => setImgNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
      img.src = dataUrl;
      loadAndSearch(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
  }, []);

  // Resize drag from top-left corner
  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizing.current = { startX: e.clientX, startY: e.clientY, startW: panelW, startH: panelH };
    const onMove = (ev: MouseEvent) => {
      if (!resizing.current) return;
      const dw = resizing.current.startX - ev.clientX; // drag left = wider
      const dh = resizing.current.startY - ev.clientY; // drag up = taller
      setPanelW(Math.min(MAX_W, Math.max(MIN_W, resizing.current.startW + dw)));
      setPanelH(Math.min(MAX_H, Math.max(MIN_H, resizing.current.startH + dh)));
    };
    const onUp = () => {
      resizing.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleDownload = () => {
    if (!matched.length) return;
    const canvas = document.createElement('canvas');
    const cols = Math.min(matched.length, 4);
    const rows = Math.ceil(matched.length / cols);
    const cardW = 180, cardH = 220, pad = 16;
    canvas.width = cols * (cardW + pad) + pad;
    canvas.height = rows * (cardH + pad) + pad + 48;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f0f0f0';
    ctx.font = 'bold 18px Roboto, sans-serif';
    ctx.fillText('Найденные люди', pad, 32);

    let loaded = 0;
    const total = matched.filter(p => p.photo_url).length || 1;
    const finishDownload = () => {
      const link = document.createElement('a');
      link.download = 'найденные_люди.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    matched.forEach((p, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = pad + col * (cardW + pad);
      const y = 48 + pad + row * (cardH + pad);

      ctx.fillStyle = '#1a1a1a';
      ctx.roundRect(x, y, cardW, cardH, 12);
      ctx.fill();

      ctx.fillStyle = '#aaaaaa';
      ctx.font = '12px Roboto, sans-serif';
      ctx.fillText(p.full_name.substring(0, 22), x + 8, y + cardH - 10);

      if (p.photo_url) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(x + 8, y + 8, cardW - 16, cardH - 40, 8);
          ctx.clip();
          ctx.drawImage(img, x + 8, y + 8, cardW - 16, cardH - 40);
          ctx.restore();
          loaded++;
          if (loaded >= total) finishDownload();
        };
        img.onerror = () => { loaded++; if (loaded >= total) finishDownload(); };
        img.src = p.photo_url;
      }
    });

    if (!matched.some(p => p.photo_url)) finishDownload();
  };

  // Computed image display height inside panel
  const imgDisplayH = (() => {
    if (!imgNaturalSize) return 160;
    const ratio = imgNaturalSize.w / imgNaturalSize.h;
    const displayW = panelW - 32; // padding
    return Math.min(Math.round(displayW / ratio), panelH - 200);
  })();

  return (
    <div
      className="fixed bottom-6 right-6 z-50 bg-card border border-border rounded-2xl shadow-2xl flex flex-col animate-slide-in-right overflow-hidden"
      style={{ width: panelW, height: panelH }}
    >
      {/* Resize handle — top-left corner */}
      <div
        onMouseDown={startResize}
        className="absolute top-0 left-0 w-5 h-5 cursor-nw-resize z-20 flex items-center justify-center group"
        title="Потяни чтобы изменить размер"
      >
        <div className="w-3 h-3 border-l-2 border-t-2 border-muted-foreground/30 rounded-tl-sm group-hover:border-accent/60 transition-colors" />
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0 bg-secondary/50">
        <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
          <Icon name="ScanFace" size={18} className="text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-foreground">Определить людей</div>
          <div className="text-xs text-muted-foreground truncate">
            {searched && matched.length > 0 ? `Найдено ${matched.length} чел. в базе` : 'Загрузи групповое фото'}
          </div>
        </div>
        {/* Resize hint */}
        <span className="text-xs text-muted-foreground/40 select-none hidden sm:block">{panelW}×{panelH}</span>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors shrink-0">
          <Icon name="X" size={16} className="text-muted-foreground" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Upload zone */}
        <div
          onClick={() => fileRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          className={`relative rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${dragging ? 'border-accent bg-accent/10' : 'border-border hover:border-ring hover:bg-secondary/50'}`}
          style={{ height: uploadedImage ? imgDisplayH : 110 }}
        >
          {uploadedImage ? (
            <>
              <img
                src={uploadedImage}
                alt="uploaded"
                className="w-full h-full object-contain bg-black/30"
              />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2 text-white text-sm font-medium bg-black/60 px-3 py-1.5 rounded-xl">
                  <Icon name="Upload" size={14} />
                  Заменить фото
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <Icon name="ImagePlus" size={28} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Нажми или перетащи фото</span>
            </div>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center gap-3 py-3">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">Ищу в базе данных...</span>
          </div>
        )}

        {/* Results */}
        {searched && !loading && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Icon name="Users" size={15} className="text-accent" />
                <span className="text-sm font-medium text-foreground">
                  {matched.length > 0 ? `Найдено: ${matched.length}` : 'Никого не найдено'}
                </span>
              </div>
              {matched.length > 0 && (
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity"
                >
                  <Icon name="Download" size={12} />
                  Скачать
                </button>
              )}
            </div>

            {matched.length === 0 ? (
              <div className="text-center py-4">
                <Icon name="UserX" size={32} className="text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">В базе нет людей с фотографиями</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {matched.map(person => (
                  <div
                    key={person.id}
                    className="flex items-center gap-3 p-2 rounded-xl bg-secondary/60 border border-border/50 hover:border-accent/40 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-muted border border-border">
                      {person.photo_url ? (
                        <img src={person.photo_url} alt={person.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Icon name="User" size={16} className="text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{person.full_name}</p>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                        <span className="text-xs text-green-400">В базе данных</span>
                      </div>
                    </div>
                    <Icon name="CheckCircle" size={15} className="text-green-400 shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
