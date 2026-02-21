import { useState, useEffect } from 'react';
import AuthPage from '@/components/AuthPage';
import MainLayout from '@/components/MainLayout';
import { api } from '@/lib/api';

export interface User {
  user_id: number;
  login: string;
  token: string;
}

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    api.auth.check(token).then(res => {
      if (res.user_id) {
        setUser({ user_id: res.user_id, login: res.login, token });
      } else {
        localStorage.removeItem('token');
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleLogin = (userData: User) => {
    localStorage.setItem('token', userData.token);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <AuthPage onLogin={handleLogin} />;
  return <MainLayout user={user} onLogout={handleLogout} />;
}
