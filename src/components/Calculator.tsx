import { useState } from 'react';

const BUTTONS = [
  ['AC', '+/-', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['0', '.', '='],
];

export default function Calculator() {
  const [display, setDisplay] = useState('0');
  const [prev, setPrev] = useState('');
  const [op, setOp] = useState('');
  const [reset, setReset] = useState(false);

  const handleBtn = (btn: string) => {
    if (btn === 'AC') { setDisplay('0'); setPrev(''); setOp(''); setReset(false); return; }
    if (btn === '+/-') { setDisplay(d => String(-parseFloat(d))); return; }
    if (btn === '%') { setDisplay(d => String(parseFloat(d) / 100)); return; }

    if (['÷', '×', '−', '+'].includes(btn)) {
      setPrev(display); setOp(btn); setReset(true); return;
    }

    if (btn === '=') {
      if (!op || !prev) return;
      const a = parseFloat(prev), b = parseFloat(display);
      const map: Record<string, number> = { '÷': a / b, '×': a * b, '−': a - b, '+': a + b };
      setDisplay(String(parseFloat(map[op].toFixed(10))));
      setPrev(''); setOp(''); setReset(true); return;
    }

    if (btn === '.') {
      if (reset) { setDisplay('0.'); setReset(false); return; }
      if (!display.includes('.')) setDisplay(d => d + '.'); return;
    }

    if (reset) { setDisplay(btn); setReset(false); return; }
    setDisplay(d => d === '0' ? btn : d.length < 12 ? d + btn : d);
  };

  const isOp = (b: string) => ['÷', '×', '−', '+'].includes(b);
  const displayNum = display.length > 9 ? parseFloat(display).toExponential(3) : display;

  return (
    <div className="w-full max-w-xs mx-auto">
      <div className="mb-3">
        <h3 className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Калькулятор</h3>
        <div className="bg-secondary rounded-2xl p-4 text-right mb-2">
          <div className="text-muted-foreground text-xs h-4">{op ? `${prev} ${op}` : ''}</div>
          <div className="text-foreground text-4xl font-light font-oswald overflow-hidden">{displayNum}</div>
        </div>
      </div>
      <div className="grid gap-2" style={{ gridTemplateRows: 'repeat(5, 1fr)' }}>
        {BUTTONS.map((row, ri) => (
          <div key={ri} className="flex gap-2">
            {row.map((btn) => {
              const isZero = btn === '0';
              const isOpBtn = isOp(btn);
              const isEq = btn === '=';
              const isMeta = ['AC', '+/-', '%'].includes(btn);
              return (
                <button
                  key={btn}
                  onClick={() => handleBtn(btn)}
                  className={`
                    ${isZero ? 'flex-[2] justify-start pl-6' : 'flex-1'} 
                    h-14 rounded-full font-medium text-lg flex items-center justify-center transition-all active:scale-95
                    ${isEq ? 'bg-foreground text-background hover:opacity-90' : ''}
                    ${isOpBtn ? 'bg-foreground/20 text-foreground hover:bg-foreground/30' : ''}
                    ${isMeta ? 'bg-muted text-foreground hover:bg-muted/80' : ''}
                    ${!isEq && !isOpBtn && !isMeta ? 'bg-card border border-border text-foreground hover:bg-secondary' : ''}
                  `}
                >
                  {btn}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
