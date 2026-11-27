import React from 'react';

export default function SustainPedal({
  isPressed = false,
  value = 0,
  onToggle = null,
  invertPolarity = false,
  onTogglePolarity = null,
  selectedChannel = '1',
  sustainDecayTime = 4.0,
  onChangeDecayTime = null,
  accentColor = '#00fff2',
  theme = null
}) {
  const isLight = theme?.mode === 'light';
  const pedalBox = theme?.pedalBox || 'bg-[#081022]/95 border-[#0068ff]/35 text-[#e6fffd]';
  const subText = theme?.subText || 'text-slate-400';
  const optionClass = isLight ? 'bg-white text-slate-900' : 'bg-[#081022] text-slate-100';

  return (
    <div className={`flex items-center gap-3 rounded-xl border px-3 py-1.5 shadow-lg transition-all ${pedalBox}`}>
      {/* 3D Mechanical Pedal Graphic */}
      <div 
        onClick={() => onToggle && onToggle(!isPressed ? 127 : 0)}
        className="cursor-pointer group flex flex-col items-center select-none shrink-0"
        title="Haz clic para activar/desactivar pedal de sustain"
      >
        <div className={`w-10 h-14 rounded-lg p-1 flex flex-col items-center justify-end relative shadow-inner border ${
          isLight ? 'bg-slate-200/80 border-slate-300' : 'bg-black/45 border-white/10'
        }`}>
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
                ? `linear-gradient(to bottom, #94a3b8 0%, ${accentColor}cc 55%, ${accentColor} 100%)`
                : 'linear-gradient(to bottom, #e2e8f0 0%, #94a3b8 65%, #475569 100%)',
              boxShadow: isPressed
                ? `0 0 14px ${accentColor}, inset 0 2px 4px rgba(255,255,255,0.5)`
                : '0 3px 6px rgba(0,0,0,0.55), inset 0 2px 3px rgba(255,255,255,0.4)'
            }}
          >
            {/* Metallic shine line */}
            <div className="w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-sm" />
          </div>
        </div>
      </div>

      {/* Info labels and CC status */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span 
            className={`w-2 h-2 rounded-full transition-colors ${
              isPressed ? 'animate-ping' : 'opacity-40'
            }`}
            style={{ backgroundColor: isPressed ? accentColor : '#64748b' }}
          />
          <span className="text-xs font-bold uppercase tracking-wider opacity-90">
            Pedal Sustain (CC 64)
          </span>
          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
            isLight
              ? 'text-slate-600 bg-slate-100 border-slate-300'
              : 'text-slate-300 bg-black/25 border-white/10'
          }`}>
            Canal {selectedChannel === 'all' ? 'Omni' : selectedChannel}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border transition-all ${
              isPressed
                ? ''
                : isLight
                  ? 'bg-slate-100 text-slate-500 border-slate-300'
                  : 'bg-black/25 text-slate-400 border-white/10'
            }`}
            style={isPressed ? {
              backgroundColor: `${accentColor}22`,
              color: accentColor,
              borderColor: `${accentColor}66`
            } : undefined}
          >
            {isPressed ? 'ACTIVO' : 'LIBERADO'}
          </span>
          <span className={`text-[11px] font-mono ${subText}`}>
            Valor: {value}
          </span>

          {/* User Configurable Acoustic Piano Decay Time */}
          {onChangeDecayTime && (
            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-mono ${
              isLight ? 'bg-slate-100 border-slate-300' : 'bg-black/25 border-white/10'
            }`}>
              <span className="opacity-70">Decaimiento:</span>
              <select
                value={sustainDecayTime}
                onChange={(e) => onChangeDecayTime(parseFloat(e.target.value))}
                className="bg-transparent font-bold focus:outline-none cursor-pointer"
                style={{ color: accentColor }}
                title="Simula la resonancia acústica real: la nota decae gradualmente con el pedal presionado en orden de pulsación. Al soltar el pedal, todas las notas se apagan al instante."
              >
                <option value="2" className={optionClass}>2.0s (Rápido)</option>
                <option value="3.5" className={optionClass}>3.5s (Vertical)</option>
                <option value="4" className={optionClass}>4.0s (Estándar)</option>
                <option value="5" className={optionClass}>5.0s (Piano de Cola)</option>
                <option value="8" className={optionClass}>8.0s (Concierto)</option>
                <option value="12" className={optionClass}>12.0s (Largo)</option>
                <option value="999" className={optionClass}>Infinito (Hasta soltar pedal)</option>
              </select>
            </div>
          )}

          {onTogglePolarity && (
            <button
              onClick={onTogglePolarity}
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded border transition-colors ${
                invertPolarity 
                  ? 'bg-[#ff007a]/20 text-[#ff4da6] border-[#ff007a]/55' 
                  : isLight
                    ? 'bg-slate-100 text-slate-600 border-slate-300 hover:text-slate-900'
                    : 'bg-black/25 text-slate-400 border-white/10 hover:text-white'
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
