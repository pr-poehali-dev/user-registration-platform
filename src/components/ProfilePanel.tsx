import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { User } from '@/pages/Index';
import Icon from '@/components/ui/icon';

interface TableItem {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  data: Record<string, string>;
}

interface Props {
  user: User;
  onLogout: () => void;
}

export default function ProfilePanel({ user, onLogout }: Props) {
  const [tables, setTables] = useState<TableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<TableItem | null>(null);

  useEffect(() => {
    api.tables.list().then(res => {
      if (res.tables) setTables(res.tables);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const colLetter = (i: number) => String.fromCharCode(65 + i);

  return (
    <div className="max-w-3xl mx-auto">
      {/* User card */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-secondary border border-border flex items-center justify-center">
          <Icon name="User" size={32} className="text-foreground" />
        </div>
        <div className="flex-1">
          <h2 className="font-oswald text-2xl font-semibold text-foreground">{user.login}</h2>
          <p className="text-muted-foreground text-sm">ID: {user.user_id}</p>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
        >
          <Icon name="LogOut" size={16} />
          Выйти
        </button>
      </div>

      {/* Saved tables */}
      <div>
        <h3 className="font-oswald text-lg font-semibold mb-4 flex items-center gap-2">
          <Icon name="FileSpreadsheet" size={20} />
          Сохранённые таблицы
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tables.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <Icon name="Table" size={40} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Нет сохранённых таблиц</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tables.map(table => (
              <div key={table.id} className="bg-card border border-border rounded-2xl p-4 hover:border-ring transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-foreground">{table.name}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(table.updated_at).toLocaleDateString('ru-RU')}
                    </span>
                    <button
                      onClick={() => setSelectedTable(selectedTable?.id === table.id ? null : table)}
                      className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                    >
                      <Icon name={selectedTable?.id === table.id ? 'ChevronUp' : 'ChevronDown'} size={16} className="text-muted-foreground" />
                    </button>
                  </div>
                </div>

                {selectedTable?.id === table.id && (
                  <div className="overflow-auto mt-3 border border-border rounded-xl animate-fade-in max-h-64">
                    <table className="border-collapse text-xs">
                      <thead>
                        <tr>
                          <th className="excel-header-cell w-8">#</th>
                          {Array.from({ length: 12 }, (_, c) => (
                            <th key={c} className="excel-header-cell">{colLetter(c)}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: 10 }, (_, r) => (
                          <tr key={r}>
                            <td className="excel-header-cell">{r + 1}</td>
                            {Array.from({ length: 12 }, (_, c) => (
                              <td key={c} className="excel-cell text-xs">{(table.data as Record<string, string>)[`${r}_${c}`] || ''}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
