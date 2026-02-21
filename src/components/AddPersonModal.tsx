import { useState, useRef } from 'react';
import { api } from '@/lib/api';
import Icon from '@/components/ui/icon';

interface Props {
  onClose: () => void;
  onAdded: () => void;
}

export default function AddPersonModal({ onClose, onAdded }: Props) {
  const [fullName, setFullName] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoData, setPhotoData] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const result = ev.target?.result as string;
      setPhotoPreview(result);
      setPhotoData(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) { setError('Введите ФИО'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await api.people.add(fullName.trim(), photoData || undefined);
      if (res.error) { setError(res.error); return; }
      onAdded();
    } catch {
      setError('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="font-oswald text-xl font-semibold">Добавить человека</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary transition-colors">
            <Icon name="X" size={18} className="text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">ФИО</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Фамилия Имя Отчество"
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:border-ring transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Фотография</label>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
            <div
              onClick={() => fileRef.current?.click()}
              className="w-full h-40 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-ring hover:bg-secondary transition-all"
            >
              {photoPreview ? (
                <img src={photoPreview} className="h-full w-full object-cover rounded-2xl" alt="Превью" />
              ) : (
                <>
                  <Icon name="Camera" size={32} className="text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Нажмите для выбора фото</span>
                </>
              )}
            </div>
          </div>

          {error && <div className="text-destructive text-sm">{error}</div>}

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors">
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />}
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
