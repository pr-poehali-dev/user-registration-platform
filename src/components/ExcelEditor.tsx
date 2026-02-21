import { useState, useCallback, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import Icon from '@/components/ui/icon';

const ROWS = 30;
const COLS = 12;
const MIN_COL_WIDTH = 80;
const MAX_COL_WIDTH = 260;

type CellData = Record<string, string>;
type ColWidths = Record<number, number>;

function colLetter(i: number) {
  return String.fromCharCode(65 + i);
}

function measureText(text: string): number {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  ctx.font = '13px Roboto, sans-serif';
  return Math.ceil(ctx.measureText(text).width) + 20;
}

interface Props {
  onBack: () => void;
}

export default function ExcelEditor({ onBack }: Props) {
  const [cells, setCells] = useState<CellData>({});
  const [tableName, setTableName] = useState('Новая таблица');
  const [editingName, setEditingName] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [colWidths, setColWidths] = useState<ColWidths>({});
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const resizing = useRef<{ col: number; startX: number; startW: number } | null>(null);

  const cellKey = (r: number, c: number) => `${r}_${c}`;

  const getColWidth = (c: number) => colWidths[c] ?? MIN_COL_WIDTH;

  const handleChange = useCallback((r: number, c: number, val: string) => {
    setCells(prev => {
      const next = { ...prev, [cellKey(r, c)]: val };
      // Auto-expand column width
      const needed = measureText(val);
      setColWidths(cw => {
        const cur = cw[c] ?? MIN_COL_WIDTH;
        if (needed > cur && needed <= MAX_COL_WIDTH) return { ...cw, [c]: needed };
        return cw;
      });
      return next;
    });
  }, []);

  useEffect(() => {
    if (editingName && nameRef.current) nameRef.current.focus();
  }, [editingName]);

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
    const cellH = 28, headerW = 40;
    const widths = Array.from({ length: COLS }, (_, c) => getColWidth(c));
    const totalW = headerW + widths.reduce((a, b) => a + b, 0);
    canvas.width = totalW;
    canvas.height = cellH + ROWS * cellH;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = '12px Roboto, sans-serif';

    let x = headerW;
    for (let c = 0; c < COLS; c++) {
      const w = widths[c];
      ctx.fillStyle = '#333';
      ctx.fillRect(x, 0, w - 1, cellH - 1);
      ctx.fillStyle = '#aaa';
      ctx.fillText(colLetter(c), x + w / 2 - 4, 18);
      x += w;
    }
    for (let r = 0; r < ROWS; r++) {
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, cellH + r * cellH, headerW - 1, cellH - 1);
      ctx.fillStyle = '#aaa';
      ctx.fillText(String(r + 1), 6, cellH + r * cellH + 18);
      x = headerW;
      for (let c = 0; c < COLS; c++) {
        const w = widths[c];
        ctx.fillStyle = '#111';
        ctx.fillRect(x, cellH + r * cellH, w - 1, cellH - 1);
        const val = cells[cellKey(r, c)] || '';
        if (val) {
          ctx.fillStyle = '#f0f0f0';
          ctx.fillText(val.substring(0, Math.floor(w / 7)), x + 4, cellH + r * cellH + 18);
        }
        x += w;
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
        const val = cells[cellKey(r, c)] || '';
        row.push(val.includes(',') ? `"${val}"` : val);
      }
      csv += row.join(',') + '\n';
    }
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${tableName}.csv`;
    link.click();
    setShowSaveMenu(false);
  };

  const clearAll = () => {
    if (confirm('Очистить всю таблицу?')) {
      setCells({});
      setColWidths({});
    }
  };

  // Column resize
  const startResize = (e: React.MouseEvent, col: number) => {
    e.preventDefault();
    resizing.current = { col, startX: e.clientX, startW: getColWidth(col) };
    const onMove = (ev: MouseEvent) => {
      if (!resizing.current) return;
      const delta = ev.clientX - resizing.current.startX;
      const newW = Math.max(MIN_COL_WIDTH, Math.min(MAX_COL_WIDTH, resizing.current.startW + delta));
      setColWidths(cw => ({ ...cw, [resizing.current!.col]: newW }));
    };
    const onUp = () => {
      resizing.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div className="flex flex-col h-full relative" onClick={() => showSaveMenu && setShowSaveMenu(false)}>
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-card shrink-0">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-secondary transition-colors shrink-0">
          <Icon name="ChevronLeft" size={18} className="text-muted-foreground" />
        </button>

        {/* Editable table name */}
        <div className="flex items-center gap-1.5 group">
          {editingName ? (
            <input
              ref={nameRef}
              value={tableName}
              onChange={e => setTableName(e.target.value)}
              onBlur={() => setEditingName(false)}
              onKeyDown={e => e.key === 'Enter' && setEditingName(false)}
              className="bg-secondary border border-accent rounded-lg px-2 py-1 text-foreground font-medium text-sm outline-none min-w-0 w-44"
            />
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-secondary transition-colors group"
            >
              <span className="font-medium text-sm text-foreground">{tableName}</span>
              <Icon name="Pencil" size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
        </div>

        <div className="flex-1" />

        {saved && (
          <span className="text-xs text-green-400 flex items-center gap-1 animate-fade-in">
            <Icon name="Check" size={12} />Сохранено
          </span>
        )}

        {selectedCell && (
          <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-md font-mono">
            {selectedCell}
          </span>
        )}

        <div className="relative" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setShowSaveMenu(v => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Icon name="Save" size={14} />
            Сохранить
            <Icon name="ChevronDown" size={12} />
          </button>
          {showSaveMenu && (
            <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-xl z-20 w-52 animate-scale-in overflow-hidden">
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
                Скачать как CSV
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto">
        <table className="border-collapse" style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th className="excel-header-cell sticky left-0 z-10" style={{ width: 40, minWidth: 40 }}>#</th>
              {Array.from({ length: COLS }, (_, c) => (
                <th
                  key={c}
                  className="excel-header-cell relative select-none"
                  style={{ width: getColWidth(c), minWidth: getColWidth(c) }}
                >
                  {colLetter(c)}
                  {/* Resize handle */}
                  <div
                    onMouseDown={e => startResize(e, c)}
                    className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-accent/60 transition-colors"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: ROWS }, (_, r) => (
              <tr key={r}>
                <td className="excel-header-cell sticky left-0 z-10 text-right" style={{ width: 40, minWidth: 40 }}>{r + 1}</td>
                {Array.from({ length: COLS }, (_, c) => {
                  const key = cellKey(r, c);
                  const cellLabel = `${colLetter(c)}${r + 1}`;
                  return (
                    <td key={c} className="p-0" style={{ width: getColWidth(c), minWidth: getColWidth(c) }}>
                      <input
                        className={`excel-cell w-full ${selectedCell === cellLabel ? 'border-accent bg-secondary z-[1] relative' : ''}`}
                        style={{ width: '100%' }}
                        value={cells[key] || ''}
                        onChange={e => handleChange(r, c, e.target.value)}
                        onFocus={() => setSelectedCell(cellLabel)}
                        onBlur={() => setSelectedCell(null)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Floating action buttons — bottom right */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-10">
        <button
          onClick={saveToAccount}
          disabled={saving}
          title="Сохранить в аккаунт"
          className="w-10 h-10 rounded-xl bg-foreground text-background flex items-center justify-center shadow-lg hover:opacity-90 transition-all hover:scale-105 active:scale-95"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
          ) : (
            <Icon name="CloudUpload" size={18} />
          )}
        </button>
        <button
          onClick={saveAsCSV}
          title="Скачать CSV"
          className="w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center shadow-lg hover:border-ring transition-all hover:scale-105 active:scale-95"
        >
          <Icon name="FileSpreadsheet" size={18} className="text-foreground" />
        </button>
        <button
          onClick={saveAsImage}
          title="Скачать как картинку"
          className="w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center shadow-lg hover:border-ring transition-all hover:scale-105 active:scale-95"
        >
          <Icon name="Image" size={18} className="text-foreground" />
        </button>
        <button
          onClick={clearAll}
          title="Очистить таблицу"
          className="w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center shadow-lg hover:border-destructive hover:text-destructive transition-all hover:scale-105 active:scale-95"
        >
          <Icon name="Trash2" size={18} className="text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
