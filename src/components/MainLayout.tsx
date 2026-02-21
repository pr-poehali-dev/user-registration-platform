import { useState } from 'react';
import { User } from '@/pages/Index';
import Icon from '@/components/ui/icon';
import AddPersonModal from '@/components/AddPersonModal';
import PeopleGallery from '@/components/PeopleGallery';
import ExcelEditor from '@/components/ExcelEditor';
import Calculator from '@/components/Calculator';
import Translator from '@/components/Translator';
import ProfilePanel from '@/components/ProfilePanel';

type View = 'home' | 'excel' | 'people' | 'profile';

interface Props {
  user: User;
  onLogout: () => void;
}

export default function MainLayout({ user, onLogout }: Props) {
  const [view, setView] = useState<View>('home');
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [refreshPeople, setRefreshPeople] = useState(0);

  const handlePersonAdded = () => {
    setRefreshPeople(r => r + 1);
    setShowAddPerson(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="h-12 border-b border-border flex items-center px-4 gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <Icon name="Bot" size={20} className="text-foreground" />
          <span className="font-oswald text-lg font-semibold text-foreground">RoboDesk</span>
        </div>
        <div className="flex-1" />
        <nav className="flex items-center gap-1">
          {[
            { id: 'home', label: 'Главная', icon: 'Home' },
            { id: 'people', label: 'Люди', icon: 'Users' },
            { id: 'excel', label: 'Таблица', icon: 'Table' },
            { id: 'profile', label: 'Профиль', icon: 'User' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id as View)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${view === item.id ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
            >
              <Icon name={item.icon} size={14} />
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}
        </nav>
        <button
          onClick={() => setView('profile')}
          className="ml-2 flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-secondary transition-colors text-sm text-foreground"
        >
          <Icon name="User" size={14} />
          <span className="font-medium">{user.login}</span>
        </button>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {view === 'home' && (
          <div className="flex flex-1 overflow-hidden">
            {/* Left sidebar — actions */}
            <aside className="w-56 border-r border-border flex flex-col p-4 gap-3 shrink-0">
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-widest mb-2">Действия</div>
              <button
                onClick={() => setView('excel')}
                className="flex-1 max-h-40 flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-secondary hover:bg-muted hover:border-ring transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-foreground/10 flex items-center justify-center group-hover:bg-foreground/20 transition-colors">
                  <Icon name="Table" size={24} className="text-foreground" />
                </div>
                <span className="text-sm font-medium text-foreground">Создать</span>
                <span className="text-xs text-muted-foreground">Excel-таблица</span>
              </button>
              <button
                onClick={() => setShowAddPerson(true)}
                className="flex-1 max-h-40 flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-secondary hover:bg-muted hover:border-ring transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-foreground/10 flex items-center justify-center group-hover:bg-foreground/20 transition-colors">
                  <Icon name="UserPlus" size={24} className="text-foreground" />
                </div>
                <span className="text-sm font-medium text-foreground">Добавить</span>
                <span className="text-xs text-muted-foreground">Человека</span>
              </button>
              <button
                onClick={() => setView('people')}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-secondary hover:bg-muted hover:border-ring transition-all text-sm text-foreground"
              >
                <Icon name="Images" size={16} />
                Общие фото
              </button>
              <div className="flex-1" />
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all text-sm text-muted-foreground"
              >
                <Icon name="LogOut" size={16} />
                Выйти
              </button>
            </aside>

            {/* Right — calculator + translator */}
            <main className="flex-1 flex overflow-hidden">
              <div className="flex-1 p-4 border-r border-border overflow-auto">
                <Translator />
              </div>
              <div className="w-72 p-4 overflow-auto shrink-0">
                <Calculator />
              </div>
            </main>
          </div>
        )}

        {view === 'people' && (
          <div className="flex-1 overflow-auto p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-oswald text-2xl font-semibold">Общие фото</h2>
              <button
                onClick={() => setShowAddPerson(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Icon name="UserPlus" size={16} />
                Добавить
              </button>
            </div>
            <PeopleGallery refreshKey={refreshPeople} />
          </div>
        )}

        {view === 'excel' && (
          <div className="flex-1 overflow-hidden animate-fade-in">
            <ExcelEditor onBack={() => setView('home')} />
          </div>
        )}

        {view === 'profile' && (
          <div className="flex-1 overflow-auto p-6 animate-fade-in">
            <ProfilePanel user={user} onLogout={onLogout} />
          </div>
        )}
      </div>

      {showAddPerson && (
        <AddPersonModal onClose={() => setShowAddPerson(false)} onAdded={handlePersonAdded} />
      )}
    </div>
  );
}