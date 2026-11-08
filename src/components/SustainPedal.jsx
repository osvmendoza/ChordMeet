import React from 'react';

export default function SustainPedal({
  isPressed = false,
  value = 0,
  onToggle = null,
  accentColor = '#38bdf8',
  theme = null
}) {
  const pedalBox = theme?.pedalBox || 'bg-slate-900/90 border-slate-800 text-slate-100';
  const subText = theme?.subText || 'text-slate-400';

  return (
    <div className={`flex items-center gap-4 rounded-xl border px-4 py-2.5 shadow-lg transition-all ${pedalBox}`}>
      {/* 3D Mechanical Pedal Graphic */}
      <div 
        onClick={() => onToggle && onToggle(!isPressed ? 127 : 0)}
        className="cursor-pointer group flex flex-col items-center select-none"
        title="Haz clic para activar/desactivar pedal de sustain"
      >
        <div className="w-14 h-20 bg-black/40 rounded-lg p-1.5 flex flex-col items-center justify-end relative shadow-inner border border-black/30">
          {/* Pedal base slot */}
          <div className="w-8 h-2 bg-black/60 rounded-t-sm mb-1" />

          {/* Physical Pedal Lever */}
          <div
            className={`w-7 rounded-sm transition-all duration-100 ease-out origin-top ${
              isPressed
                ? 'h-11 translate-y-1 scale-y-95 shadow-lg'
                : 'h-13 group-hover:brightness-110'
            }`}
            style={{
              background: isPressed
                ? `linear-gradient(to bottom, #d97706 0%, #b45309 60%, ${accentColor} 100%)`
                : 'linear-gradient(to bottom, #f59e0b 0%, #d97706 70%, #92400e 100%)',
              boxShadow: isPressed
                ? `0 0 16px ${accentColor}, inset 0 2px 4px rgba(255,255,255,0.4)`
                : '0 4px 8px rgba(0,0,0,0.6), inset 0 2px 3px rgba(255,255,255,0.3)'
            }}
          >
            {/* Metallic shine line */}
            <div className="w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-sm" />
          </div>
        </div>
      </div>

      {/* Info labels and CC status */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span 
            className={`w-2 h-2 rounded-full transition-colors ${
              isPressed ? 'animate-ping' : 'opacity-40'
            }`}
            style={{ backgroundColor: isPressed ? accentColor : '#64748b' }}
          />
          <span className="text-xs font-bold uppercase tracking-wider opacity-90">
            Pedal Sustain (CC 64)
          </span>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <span
            className={`text-xs font-mono font-bold px-2 py-0.5 rounded transition-all ${
              isPressed
                ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40'
                : 'bg-black/20 text-slate-500 border border-black/30'
            }`}
          >
            {isPressed ? 'SUSTAIN ACTIVO' : 'LIBERADO'}
          </span>
          <span className={`text-[11px] font-mono ${subText}`}>
            Valor: {value}
          </span>
        </div>
      </div>
    </div>
  );
}
