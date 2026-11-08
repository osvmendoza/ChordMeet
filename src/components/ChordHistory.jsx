import React, { useState } from 'react';
import { History, Trash2, Copy, Check } from 'lucide-react';

export default function ChordHistory({ 
  history = [], 
  onClear, 
  accentColor = '#38bdf8',
  theme = null 
}) {
  const [copied, setCopied] = useState(false);

  const cardBg = theme?.cardBg || 'bg-slate-900/90 border-slate-800 text-slate-100';
  const subText = theme?.subText || 'text-slate-400';

  const handleCopy = () => {
    if (history.length === 0) return;
    const progressionText = history.map((h) => h.chord).join('  ➔  ');
    navigator.clipboard.writeText(progressionText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (history.length === 0) return null;

  return (
    <div className={`w-full rounded-xl border p-2.5 flex items-center justify-between gap-3 shadow-md transition-all ${cardBg}`}>
      <div className="flex items-center gap-2 shrink-0">
        <History className="w-3.5 h-3.5" style={{ color: accentColor }} />
        <span className="text-[11px] font-bold uppercase tracking-wider opacity-80 hidden sm:inline">
          Progresión:
        </span>
      </div>

      {/* Chord Sequence Chips */}
      <div className="flex-1 flex items-center gap-2 overflow-x-auto py-0.5 no-scrollbar">
        {history.map((item, idx) => (
          <div key={item.id || idx} className="flex items-center gap-1.5 shrink-0">
            <span 
              className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg border transition-all"
              style={{
                backgroundColor: idx === history.length - 1 ? `${accentColor}25` : 'rgba(0,0,0,0.2)',
                borderColor: idx === history.length - 1 ? `${accentColor}60` : 'rgba(255,255,255,0.1)',
                color: idx === history.length - 1 ? accentColor : 'inherit',
                transform: idx === history.length - 1 ? 'scale(1.05)' : 'none'
              }}
            >
              {item.chord}
            </span>
            {idx < history.length - 1 && (
              <span className="text-[10px] opacity-40">➔</span>
            )}
          </div>
        ))}
      </div>

      {/* Action Buttons: Copy & Clear */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={handleCopy}
          className="p-1 rounded-lg hover:bg-black/20 text-slate-400 hover:text-slate-200 transition-colors"
          title="Copiar progresión armónica"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={onClear}
          className="p-1 rounded-lg hover:bg-black/20 text-slate-400 hover:text-rose-400 transition-colors"
          title="Borrar historial de acordes"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
