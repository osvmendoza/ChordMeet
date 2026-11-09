import React from 'react';
import { 
  Usb, 
  Volume2, 
  VolumeX, 
  Palette, 
  RotateCcw,
  EyeOff,
  Grid2X2,
  Columns,
  Rows
} from 'lucide-react';
import { KEY_SIGNATURES, COLOR_PRESETS } from '../utils/musicHelpers';
import { THEMES } from '../utils/themeConfig';

export default function HeaderControls({
  // MIDI states
  inputs = [],
  selectedInputId = 'all',
  onSelectInput,
  selectedChannel = '1',
  onSelectChannel,
  sustainDecayTime = 1.5,
  onChangeDecayTime,
  
  // Keyboard configurations
  keyCount = 61,
  onChangeKeyCount,
  accentColor = '#38bdf8',
  onChangeAccentColor,

  // Key signature
  keySignature = 'C',
  onChangeKeySignature,

  // Theme
  currentThemeId = 'studio',
  onChangeTheme,
  theme = null,

  // Quadrant Layout Mode (Fusión de cuadrantes)
  layoutMode = 'grid', // 'grid', 'merge-top', 'merge-bottom', 'merge-left', 'merge-right'
  onChangeLayoutMode,

  // Audio synthesizer
  audioEnabled = true,
  onToggleAudio,
  audioVolume = 0.3,
  onChangeAudioVolume,

  // Reset
  onClearNotes,

  // Hide Navbar
  onHideNavbar
}) {
  const headerBg = theme?.headerBg || 'bg-slate-900/95 border-slate-800 text-white';

  return (
    <header className={`backdrop-blur-md border-b px-3 py-1.5 z-40 shadow-sm transition-colors duration-200 select-none ${headerBg}`}>
      <div className="max-w-full mx-auto flex flex-wrap items-center justify-between gap-2">
        
        {/* Left: MIDI Device & Quick Audio */}
        <div className="flex items-center gap-2">
          {/* MIDI Connection Status & Selector */}
          <div className="flex items-center gap-1.5 bg-black/20 border border-white/10 rounded-lg px-2 py-1 text-xs">
            <Usb className={`w-3.5 h-3.5 ${inputs.length > 0 ? 'text-emerald-400' : 'text-slate-500'}`} />
            {inputs.length > 0 ? (
              <select
                value={selectedInputId}
                onChange={(e) => onSelectInput(e.target.value)}
                className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer max-w-[140px] truncate"
              >
                <option value="all" className="bg-slate-900 text-slate-200">
                  Todos ({inputs.length})
                </option>
                {inputs.map((dev) => (
                  <option key={dev.id} value={dev.id} className="bg-slate-900 text-slate-200">
                    {dev.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs text-amber-500 font-medium">
                Virtual MIDI
              </span>
            )}
          </div>

          {/* MIDI Channel Filter (Channel 1, All, etc.) */}
          <div className="flex items-center gap-1 bg-black/20 border border-white/10 rounded-lg px-2 py-1 text-xs">
            <span className="opacity-60 text-[11px]">Canal:</span>
            <select
              value={selectedChannel}
              onChange={(e) => onSelectChannel && onSelectChannel(e.target.value)}
              className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer text-sky-400"
              title="Filtro de canal MIDI (para evitar interferencias en el pedal de sustain)"
            >
              <option value="1" className="bg-slate-900 text-slate-100">Canal 1 (Recomendado)</option>
              <option value="all" className="bg-slate-900 text-slate-100">Todos (Omni)</option>
              {Array.from({ length: 15 }, (_, i) => i + 2).map((ch) => (
                <option key={ch} value={String(ch)} className="bg-slate-900 text-slate-100">
                  Canal {ch}
                </option>
              ))}
            </select>
          </div>

          {/* Natural Acoustic Piano Decay Time Selector */}
          <div className="flex items-center gap-1 bg-black/20 border border-white/10 rounded-lg px-2 py-1 text-xs">
            <span className="opacity-60 text-[11px]">Decaimiento:</span>
            <select
              value={sustainDecayTime}
              onChange={(e) => onChangeDecayTime && onChangeDecayTime(parseFloat(e.target.value))}
              className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer text-amber-400"
              title="Simula la resonancia acústica real: la nota decae gradualmente con el pedal presionado en orden de pulsación. Al soltar el pedal, todas las notas se apagan al instante."
            >
              <option value="2" className="bg-slate-900 text-slate-100">2.0s (Rápido)</option>
              <option value="3.5" className="bg-slate-900 text-slate-100">3.5s (Vertical)</option>
              <option value="4" className="bg-slate-900 text-slate-100">4.0s (Estándar)</option>
              <option value="5" className="bg-slate-900 text-slate-100">5.0s (Cola)</option>
              <option value="8" className="bg-slate-900 text-slate-100">8.0s (Concierto)</option>
              <option value="12" className="bg-slate-900 text-slate-100">12.0s (Largo)</option>
              <option value="999" className="bg-slate-900 text-slate-100">Infinito</option>
            </select>
          </div>

          {/* Virtual Audio Sound Toggle */}
          <div className="flex items-center gap-1 bg-black/20 border border-white/10 rounded-lg px-2 py-1">
            <button
              onClick={onToggleAudio}
              className={`text-xs flex items-center gap-1 transition-colors ${
                audioEnabled ? 'text-emerald-400' : 'opacity-40 hover:opacity-80'
              }`}
              title={audioEnabled ? 'Sonido activado' : 'Sonido desactivado'}
            >
              {audioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
            {audioEnabled && (
              <input
                type="range"
                min="0.05"
                max="0.8"
                step="0.05"
                value={audioVolume}
                onChange={(e) => onChangeAudioVolume(parseFloat(e.target.value))}
                className="w-12 accent-emerald-400 cursor-pointer hidden sm:block"
                title="Volumen del sintetizador"
              />
            )}
          </div>

          {/* Clear notes */}
          <button
            onClick={onClearNotes}
            className="p-1 bg-black/20 hover:bg-black/30 border border-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
            title="Pánico / Limpiar notas activas"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Center: Music Settings (Key, Tema, Color) */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Key Signature Selector */}
          <div className="flex items-center gap-1 bg-black/20 border border-white/10 rounded-lg px-2 py-1 text-xs">
            <span className="opacity-60 text-[11px]">Key:</span>
            <select
              value={keySignature}
              onChange={(e) => onChangeKeySignature(e.target.value)}
              className="bg-transparent font-bold focus:outline-none cursor-pointer"
              style={{ color: accentColor }}
            >
              {KEY_SIGNATURES.map((sig) => (
                <option key={sig.id} value={sig.id} className="bg-slate-900 text-slate-200">
                  {sig.label}
                </option>
              ))}
            </select>
          </div>

          {/* Theme Selector */}
          <div className="flex items-center gap-1 bg-black/20 border border-white/10 rounded-lg px-2 py-1 text-xs">
            <span className="opacity-60 text-[11px]">Tema:</span>
            <select
              value={currentThemeId}
              onChange={(e) => onChangeTheme(e.target.value)}
              className="bg-transparent font-semibold focus:outline-none cursor-pointer"
            >
              <option value="studio" className="bg-slate-900 text-slate-100">Estudio Neón</option>
              <option value="classic" className="bg-slate-900 text-slate-100">Clásico Concierto</option>
              <option value="jazz" className="bg-slate-900 text-slate-100">Jazz Lounge</option>
              <option value="light" className="bg-slate-100 text-slate-900">Conservatorio Claro</option>
            </select>
          </div>

          {/* Color Picker Presets */}
          <div className="flex items-center gap-1 bg-black/20 border border-white/10 rounded-lg px-2 py-1">
            <Palette className="w-3.5 h-3.5 opacity-60" />
            <div className="flex items-center gap-1">
              {COLOR_PRESETS.slice(0, 4).map((c) => (
                <button
                  key={c.value}
                  onClick={() => onChangeAccentColor(c.value)}
                  className={`w-3.5 h-3.5 rounded-full transition-transform ${
                    accentColor === c.value ? 'scale-125 ring-2 ring-white/80' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
              <input
                type="color"
                value={accentColor}
                onChange={(e) => onChangeAccentColor(e.target.value)}
                className="w-4 h-4 rounded-full cursor-pointer bg-transparent border-none p-0 ml-0.5"
                title="Color personalizado"
              />
            </div>
          </div>
        </div>

        {/* Right: Quadrant Merge Selector & Hide Navbar Button */}
        <div className="flex items-center gap-2">
          
          {/* Fusión de Cuadrantes Dropdown */}
          <div className="flex items-center gap-1 bg-black/20 border border-white/10 rounded-lg px-2 py-1 text-xs">
            <Grid2X2 className="w-3.5 h-3.5 opacity-60" />
            <select
              value={layoutMode}
              onChange={(e) => onChangeLayoutMode(e.target.value)}
              className="bg-transparent font-semibold focus:outline-none cursor-pointer"
              title="Distribución y fusión de los 4 cuadrantes"
            >
              <option value="grid" className="bg-slate-900 text-slate-100">
                4 Cuadrantes (2x2)
              </option>
              <option value="merge-bottom" className="bg-slate-900 text-slate-100">
                2 Arriba + Fusionar Abajo
              </option>
              <option value="merge-top" className="bg-slate-900 text-slate-100">
                Fusionar Arriba + 2 Abajo
              </option>
              <option value="merge-left" className="bg-slate-900 text-slate-100">
                Fusionar Izquierda + 2 Derecha
              </option>
              <option value="merge-right" className="bg-slate-900 text-slate-100">
                2 Izquierda + Fusionar Derecha
              </option>
            </select>
          </div>

          {/* Ocultar Barra (Atajo: H) */}
          <button
            onClick={onHideNavbar}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold transition-all border border-white/10"
            title="Ocultar barra de navegación (Presiona 'H' en cualquier momento para alternar)"
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ocultar (H)</span>
          </button>
        </div>

      </div>
    </header>
  );
}
