import React from 'react';

export default function SustainPedal({
  isPressed = false,
  value = 0,
  onToggle = null,
  invertPolarity = false,
  onTogglePolarity = null,
  selectedChannel = '1',
  accentColor = '#38bdf8',
  theme = null
}) {
  const pedalBox = theme?.pedalBox || 'bg-slate-900/90 border-slate-800 text-slate-100';
  const subText = theme?.subText || 'text-slate-400';

  return (
    <div className={`flex items-center gap-3 rounded-xl border px-3 py-1.5 shadow-lg transition-all ${pedalBox}`}>
      {/* 3D Mechanical Pedal Graphic */}
      <div 
        onClick={() => onToggle && onToggle(!isPressed ? 127 : 0)}
        className="cursor-pointer group flex flex-col items-center select-none shrink-0"
        title="Haz clic para activar/desactivar pedal de sustain"
      >
        <div className="w-10 h-14 bg-black/40 rounded-lg p-1 flex flex-col items-center justify-end relative shadow-inner border border-black/30">
          {/* Pedal base slot */}
          <div className="w-6 h-1.5 bg-black/60 rounded-t-sm mb-0.5" />

          {/* Physical Pedal Lever */}
          <div
            className={`w-5 rounded-sm transition-all duration-100 ease-out origin-top ${
              isPressed
                ? 'h-8 translate-y-0.5 scale-y-95 shadow-lg'
                : 'h-10 group-hover:brightness-110'
            }`}
            style={{
              background: isPressed
                ? `linear-gradient(to bottom, #d97706 0%, #b45309 60%, ${accentColor} 100%)`
                : 'linear-gradient(to bottom, #f59e0b 0%, #d97706 70%, #92400e 100%)',
              boxShadow: isPressed
                ? `0 0 14px ${accentColor}, inset 0 2px 4px rgba(255,255,255,0.4)`
                : '0 3px 6px rgba(0,0,0,0.6), inset 0 2px 3px rgba(255,255,255,0.3)'
            }}
          >
            {/* Metallic shine line */}
            <div className="w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-sm" />
          </div>
        </div>
      </div>

      {/* Info labels and CC status */}
      <div className="flex flex-col gap-0.5">
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
          <span className="text-[10px] font-mono text-slate-400 bg-black/20 px-1.5 py-0.2 rounded border border-white/5">
            Canal {selectedChannel === 'all' ? 'Omni' : selectedChannel}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded transition-all ${
              isPressed
                ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40'
                : 'bg-black/20 text-slate-500 border border-black/30'
            }`}
          >
            {isPressed ? 'ACTIVO' : 'LIBERADO'}
          </span>
          <span className={`text-[11px] font-mono ${subText}`}>
            Valor: {value}
          </span>
          {onTogglePolarity && (
            <button
              onClick={onTogglePolarity}
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded border transition-colors ${
                invertPolarity 
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' 
                  : 'bg-black/20 text-slate-400 border-white/10 hover:text-white'
              }`}
              title="Invierte si el pedal se activa al soltar y se apaga al pisar"
            >
              {invertPolarity ? 'Polaridad: Inv' : 'Polaridad: Normal'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
