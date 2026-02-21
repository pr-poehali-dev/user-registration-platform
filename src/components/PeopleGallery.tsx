import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Icon from '@/components/ui/icon';

interface Person {
  id: number;
  full_name: string;
  photo_url: string | null;
  created_at: string;
}

interface Props {
  refreshKey: number;
}

export default function PeopleGallery({ refreshKey }: Props) {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<Person | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    api.people.list().then(res => {
      if (res.people) setPeople(res.people);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [refreshKey]);

  const handleDelete = async (id: number) => {
    setDeleting(id);
    try {
      await api.people.delete(id);
      setPeople(prev => prev.filter(p => p.id !== id));
      if (lightbox?.id === id) setLightbox(null);
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (people.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Icon name="Users" size={48} className="text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Ещё не добавлено ни одного человека</p>
        <p className="text-xs text-muted-foreground mt-1">Нажмите «Добавить» чтобы начать</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-5 pb-4">
        {people.map((person, idx) => (
          <div
            key={person.id}
            className="flex flex-col items-center gap-3 animate-fade-in group relative"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            {/* Photo card */}
            <div
              className="relative w-36 h-36 rounded-2xl border-2 border-border overflow-hidden bg-secondary flex items-center justify-center cursor-pointer hover:border-ring hover:scale-105 transition-all duration-200"
              onClick={() => setLightbox(person)}
            >
              {person.photo_url ? (
                <img src={person.photo_url} alt={person.full_name} className="w-full h-full object-cover" />
              ) : (
                <Icon name="User" size={48} className="text-muted-foreground" />
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Icon name="ZoomIn" size={24} className="text-white" />
              </div>
            </div>

            {/* Name + delete */}
            <div className="text-center w-36 relative">
              <p className="text-sm font-medium text-foreground leading-tight truncate">{person.full_name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date(person.created_at).toLocaleDateString('ru-RU')}
              </p>

              {/* Delete button — показывается при hover */}
              {confirmDelete === person.id ? (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-card border border-destructive rounded-xl px-2 py-1 shadow-lg whitespace-nowrap z-10 animate-scale-in">
                  <span className="text-xs text-destructive">Удалить?</span>
                  <button
                    onClick={() => handleDelete(person.id)}
                    disabled={deleting === person.id}
                    className="px-2 py-0.5 rounded-lg bg-destructive text-white text-xs font-medium hover:opacity-90 transition-opacity"
                  >
                    {deleting === person.id ? '...' : 'Да'}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="px-2 py-0.5 rounded-lg bg-secondary text-foreground text-xs hover:bg-muted transition-colors"
                  >
                    Нет
                  </button>
                </div>
              ) : null}
            </div>

            {/* Delete icon */}
            <button
              onClick={e => { e.stopPropagation(); setConfirmDelete(person.id); }}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95 shadow-md"
            >
              <Icon name="X" size={12} className="text-white" />
            </button>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative bg-card border border-border rounded-2xl overflow-hidden shadow-2xl max-w-2xl w-full animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <div>
                <p className="font-semibold text-foreground">{lightbox.full_name}</p>
                <p className="text-xs text-muted-foreground">{new Date(lightbox.created_at).toLocaleDateString('ru-RU')}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setConfirmDelete(lightbox.id); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors text-sm"
                >
                  <Icon name="Trash2" size={14} />
                  Удалить
                </button>
                <button
                  onClick={() => setLightbox(null)}
                  className="p-1.5 rounded-xl hover:bg-secondary transition-colors"
                >
                  <Icon name="X" size={18} className="text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Photo */}
            {lightbox.photo_url ? (
              <img
                src={lightbox.photo_url}
                alt={lightbox.full_name}
                className="w-full max-h-[70vh] object-contain bg-black"
              />
            ) : (
              <div className="flex items-center justify-center py-20 bg-secondary">
                <Icon name="User" size={80} className="text-muted-foreground" />
              </div>
            )}

            {/* Confirm delete in lightbox */}
            {confirmDelete === lightbox.id && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center animate-fade-in">
                <div className="bg-card border border-destructive rounded-2xl p-6 text-center shadow-2xl">
                  <Icon name="AlertTriangle" size={36} className="text-destructive mx-auto mb-3" />
                  <p className="font-semibold text-foreground mb-1">Удалить {lightbox.full_name}?</p>
                  <p className="text-sm text-muted-foreground mb-4">Это действие нельзя отменить</p>
                  <div className="flex items-center gap-3 justify-center">
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="px-4 py-2 rounded-xl bg-secondary text-foreground text-sm hover:bg-muted transition-colors"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={() => handleDelete(lightbox.id)}
                      disabled={deleting === lightbox.id}
                      className="px-4 py-2 rounded-xl bg-destructive text-white text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      {deleting === lightbox.id ? 'Удаляю...' : 'Удалить'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
