import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import Icon from '@/components/ui/icon';

const ROWS = 30;
const COLS = 12;

type CellData = Record<string, string>;

function colLetter(i: number) {
  return String.fromCharCode(65 + i);
}

interface Props {
  onBack: () => void;
}

export default function ExcelEditor({ onBack }: Props) {
  const [cells, setCells] = useState<CellData>({});
  const [tableName, setTableName] = useState('Новая таблица');
  const [saving, setSaving] = useState(false);
  const [saveMode, setSaveMode] = useState<'account' | null>(null);
  const [saved, setSaved] = useState(false);
  const [showSaveMenu, setShowSaveMenu] = useState(false);

  const cellKey = (r: number, c: number) => `${r}_${c}`;

  const handleChange = useCallback((r: number, c: number, val: string) => {
    setCells(prev => ({ ...prev, [cellKey(r, c)]: val }));
  }, []);

  const saveToAccount = async () => {
    setSaving(true);
    try {
      await api.tables.create(tableName, cells);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
      setShowSaveMenu(false);
    }
  };

  const saveAsImage = () => {
    const canvas = document.createElement('canvas');
    const cellW = 100, cellH = 28, headerW = 40;
    canvas.width = headerW + COLS * cellW;
    canvas.height = cellH + ROWS * cellH;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = '12px Roboto, sans-serif';

    for (let c = 0; c < COLS; c++) {
      ctx.fillStyle = '#333';
      ctx.fillRect(headerW + c * cellW, 0, cellW - 1, cellH - 1);
      ctx.fillStyle = '#aaa';
      ctx.fillText(colLetter(c), headerW + c * cellW + 35, 18);
    }
    for (let r = 0; r < ROWS; r++) {
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, cellH + r * cellH, headerW - 1, cellH - 1);
      ctx.fillStyle = '#aaa';
      ctx.fillText(String(r + 1), 10, cellH + r * cellH + 18);
      for (let c = 0; c < COLS; c++) {
        ctx.fillStyle = '#111';
        ctx.fillRect(headerW + c * cellW, cellH + r * cellH, cellW - 1, cellH - 1);
        const val = cells[cellKey(r, c)] || '';
        if (val) {
          ctx.fillStyle = '#f0f0f0';
          ctx.fillText(val.substring(0, 14), headerW + c * cellW + 4, cellH + r * cellH + 18);
        }
      }
    }
    const link = document.createElement('a');
    link.download = `${tableName}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    setShowSaveMenu(false);
  };

  const saveAsCSV = () => {
    let csv = '';
    for (let r = 0; r < ROWS; r++) {
      const row = [];
      for (let c = 0; c < COLS; c++) {
        row.push(cells[cellKey(r, c)] || '');
      }
      csv += row.join(',') + '\n';
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${tableName}.csv`;
    link.click();
    setShowSaveMenu(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-card shrink-0">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
          <Icon name="ChevronLeft" size={18} className="text-muted-foreground" />
        </button>
        <input
          value={tableName}
          onChange={e => setTableName(e.target.value)}
          className="bg-transparent border-none outline-none text-foreground font-medium text-sm w-48"
        />
        <div className="flex-1" />

        {saved && <span className="text-xs text-green-400 flex items-center gap-1"><Icon name="Check" size={12} />Сохранено</span>}

        <div className="relative">
          <button
            onClick={() => setShowSaveMenu(v => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Icon name="Save" size={14} />
            Сохранить
            <Icon name="ChevronDown" size={12} />
          </button>
          {showSaveMenu && (
            <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-xl z-10 w-52 animate-scale-in overflow-hidden">
              <button onClick={saveToAccount} disabled={saving} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-foreground hover:bg-secondary transition-colors">
                <Icon name="CloudUpload" size={16} />
                Сохранить в аккаунте
              </button>
              <button onClick={saveAsImage} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-foreground hover:bg-secondary transition-colors border-t border-border">
                <Icon name="Image" size={16} />
                Скачать как картинку
              </button>
              <button onClick={saveAsCSV} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-foreground hover:bg-secondary transition-colors border-t border-border">
                <Icon name="FileSpreadsheet" size={16} />
                Скачать как Excel (CSV)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="excel-header-cell w-10 sticky left-0 z-10">#</th>
              {Array.from({ length: COLS }, (_, c) => (
                <th key={c} className="excel-header-cell">{colLetter(c)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: ROWS }, (_, r) => (
              <tr key={r}>
                <td className="excel-header-cell sticky left-0 z-10 text-right">{r + 1}</td>
                {Array.from({ length: COLS }, (_, c) => (
                  <td key={c} className="p-0">
                    <input
                      className="excel-cell"
                      value={cells[cellKey(r, c)] || ''}
                      onChange={e => handleChange(r, c, e.target.value)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
