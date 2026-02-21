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

  useEffect(() => {
    setLoading(true);
    api.people.list().then(res => {
      if (res.people) setPeople(res.people);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [refreshKey]);

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
    <div className="flex gap-6 overflow-x-auto pb-4">
      {people.map((person, idx) => (
        <div
          key={person.id}
          className="flex flex-col items-center gap-3 min-w-[160px] animate-fade-in"
          style={{ animationDelay: `${idx * 60}ms` }}
        >
          <div className="w-32 h-32 rounded-2xl border-2 border-border overflow-hidden bg-secondary flex items-center justify-center">
            {person.photo_url ? (
              <img src={person.photo_url} alt={person.full_name} className="w-full h-full object-cover" />
            ) : (
              <Icon name="User" size={48} className="text-muted-foreground" />
            )}
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground leading-tight">{person.full_name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(person.created_at).toLocaleDateString('ru-RU')}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
