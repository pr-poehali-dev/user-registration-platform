import { useState } from 'react';
import Icon from '@/components/ui/icon';

const LANGUAGES = [
  { code: 'ru', name: 'Русский' },
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'zh', name: '中文' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'ar', name: 'العربية' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'pl', name: 'Polski' },
  { code: 'uk', name: 'Українська' },
  { code: 'kk', name: 'Қазақша' },
];

export default function Translator() {
  const [from, setFrom] = useState('ru');
  const [to, setTo] = useState('en');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const translate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError('');
    try {
      const fromName = LANGUAGES.find(l => l.code === from)?.name || from;
      const toName = LANGUAGES.find(l => l.code === to)?.name || to;
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(input)}&langpair=${from}|${to}`);
      const data = await res.json();
      if (data.responseStatus === 200) {
        setOutput(data.responseData.translatedText);
      } else {
        setError('Не удалось перевести. Попробуйте позже.');
      }
    } catch {
      setError('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  const swap = () => {
    setFrom(to);
    setTo(from);
    setInput(output);
    setOutput(input);
  };

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-xs text-muted-foreground uppercase tracking-widest mb-4">Переводчик</h3>

      {/* Language selectors */}
      <div className="flex items-center gap-2 mb-4">
        <select
          value={from}
          onChange={e => setFrom(e.target.value)}
          className="flex-1 bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-ring appearance-none"
        >
          {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
        </select>
        <button
          onClick={swap}
          className="p-2 rounded-xl bg-secondary border border-border hover:bg-muted transition-colors"
          title="Поменять языки"
        >
          <Icon name="ArrowLeftRight" size={16} className="text-foreground" />
        </button>
        <select
          value={to}
          onChange={e => setTo(e.target.value)}
          className="flex-1 bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-ring appearance-none"
        >
          {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
        </select>
      </div>

      {/* Input */}
      <div className="flex-1 flex flex-col gap-3 min-h-0">
        <div className="flex-1 flex flex-col min-h-0">
          <label className="text-xs text-muted-foreground mb-1">Текст для перевода</label>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) translate(); }}
            placeholder="Введите текст..."
            className="flex-1 bg-secondary border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:border-ring resize-none text-sm min-h-[100px]"
          />
        </div>

        <button
          onClick={translate}
          disabled={loading || !input.trim()}
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" /> : <Icon name="Languages" size={16} />}
          Перевести
        </button>

        {error && <div className="text-destructive text-xs">{error}</div>}

        <div className="flex-1 flex flex-col min-h-0">
          <label className="text-xs text-muted-foreground mb-1">Перевод</label>
          <div className="flex-1 bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground min-h-[100px] overflow-auto whitespace-pre-wrap">
            {output || <span className="text-muted-foreground">Здесь появится перевод...</span>}
          </div>
        </div>

        {output && (
          <button
            onClick={() => navigator.clipboard.writeText(output)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors self-end"
          >
            <Icon name="Copy" size={12} />
            Копировать
          </button>
        )}
      </div>
    </div>
  );
}
