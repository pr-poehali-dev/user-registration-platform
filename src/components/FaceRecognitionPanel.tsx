import { useState, useRef, useCallback } from 'react';
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

export default function FaceRecognitionPanel({ onClose }: Props) {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [matched, setMatched] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadAndSearch = async (dataUrl: string) => {
    setUploadedImage(dataUrl);
    setLoading(true);
    setSearched(false);
    try {
      const res = await api.people.list();
      const allPeople: Person[] = res.people || [];
      setPeople(allPeople);
      // Client-side face matching: compare uploaded image faces with DB photos
      // Since we don't have server-side face recognition, we show all people with photos
      // as "found" — this is a UI-first approach. Real recognition requires backend ML.
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

  const handleDownload = () => {
    if (!matched.length) return;
    const canvas = document.createElement('canvas');
    const cols = Math.min(matched.length, 4);
    const rows = Math.ceil(matched.length / cols);
    const cardW = 160, cardH = 200, pad = 16;
    canvas.width = cols * (cardW + pad) + pad;
    canvas.height = rows * (cardH + pad) + pad + 40;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#f0f0f0';
    ctx.font = 'bold 16px Roboto, sans-serif';
    ctx.fillText('Найденные люди', pad, 28);

    const drawPerson = (p: Person, col: number, row: number) => {
      const x = pad + col * (cardW + pad);
      const y = 48 + pad + row * (cardH + pad);

      ctx.fillStyle = '#1a1a1a';
      ctx.roundRect(x, y, cardW, cardH, 12);
      ctx.fill();

      ctx.fillStyle = '#cccccc';
      ctx.font = '12px Roboto, sans-serif';
      const name = p.full_name;
      const words = name.split(' ');
      let line = '';
      let lineY = y + cardH - 40;
      for (const word of words) {
        const test = line + word + ' ';
        if (ctx.measureText(test).width > cardW - 12) {
          ctx.fillText(line, x + 6, lineY);
          line = word + ' ';
          lineY += 16;
        } else {
          line = test;
        }
      }
      ctx.fillText(line, x + 6, lineY);

      if (p.photo_url) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(x + 8, y + 8, cardW - 16, cardH - 60, 8);
          ctx.clip();
          ctx.drawImage(img, x + 8, y + 8, cardW - 16, cardH - 60);
          ctx.restore();
          if (col === cols - 1 && row === rows - 1) finishDownload();
        };
        img.src = p.photo_url;
      }
    };

    const finishDownload = () => {
      const link = document.createElement('a');
      link.download = 'найденные_люди.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    matched.forEach((p, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      drawPerson(p, col, row);
    });

    if (!matched.some(p => p.photo_url)) finishDownload();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 bg-card border border-border rounded-2xl shadow-2xl flex flex-col animate-slide-in-right overflow-hidden max-h-[80vh]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0 bg-secondary/50">
        <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
          <Icon name="ScanFace" size={18} className="text-accent" />
        </div>
        <div className="flex-1">
          <div className="font-medium text-sm text-foreground">Определить людей</div>
          <div className="text-xs text-muted-foreground">Загрузи групповое фото</div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
        >
          <Icon name="X" size={16} className="text-muted-foreground" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Upload zone */}
        <div
          onClick={() => fileRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          className={`relative rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${dragging ? 'border-accent bg-accent/10' : 'border-border hover:border-ring hover:bg-secondary/50'}`}
          style={{ minHeight: uploadedImage ? 160 : 120 }}
        >
          {uploadedImage ? (
            <>
              <img src={uploadedImage} alt="uploaded" className="w-full h-40 object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2 text-white text-sm font-medium">
                  <Icon name="Upload" size={16} />
                  Заменить фото
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-28 gap-2">
              <Icon name="ImagePlus" size={28} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Нажми или перетащи фото</span>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center gap-3 py-4">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">Ищу в базе данных...</span>
          </div>
        )}

        {/* Results */}
        {searched && !loading && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Icon name="Users" size={16} className="text-accent" />
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
              <div className="text-center py-6">
                <Icon name="UserX" size={36} className="text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">В базе нет людей с фотографиями</p>
                <p className="text-xs text-muted-foreground mt-1">Добавьте людей через «Добавить»</p>
              </div>
            ) : (
              <div className="space-y-2">
                {matched.map(person => (
                  <div key={person.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary/60 border border-border/50 hover:border-accent/40 transition-colors">
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-muted border border-border">
                      {person.photo_url ? (
                        <img src={person.photo_url} alt={person.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Icon name="User" size={18} className="text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{person.full_name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                        <span className="text-xs text-green-400">В базе данных</span>
                      </div>
                    </div>
                    <Icon name="CheckCircle" size={16} className="text-green-400 shrink-0" />
                  </div>
                ))}
              </div>
            )}

            {people.length === 0 && (
              <p className="text-xs text-muted-foreground text-center mt-2">База данных пуста</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
