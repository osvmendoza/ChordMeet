import React from 'react';
import { 
  Usb, 
  Volume2, 
  VolumeX, 
  Palette, 
  RotateCcw,
  EyeOff,
  Grid2X2
} from 'lucide-react';
import { KEY_SIGNATURES, COLOR_PRESETS } from '../utils/musicHelpers';
import { THEMES } from '../utils/themeConfig';
import { ChordMeetIcon } from './BrandLogo';

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
  accentColor = '#0068ff',
  onChangeAccentColor,

  // Key signature
  keySignature = 'C',
  onChangeKeySignature,

  // Theme
  currentThemeId = 'classic',
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
  const isLight = theme?.mode === 'light';
  const headerBg = theme?.headerBg || 'bg-[#070d1d]/95 border-[#0068ff]/35 text-[#e6fffd]';
  const pillBg = theme?.navbarPillBg || 'bg-[#040814]/90 border border-[#0068ff]/35 text-[#c7fbff]';
  const optionClass = isLight ? 'bg-white text-slate-900' : 'bg-[#081022] text-slate-100';
  const brandColor = theme?.brandColor || accentColor;

  return (
    <header className={`backdrop-blur-md border-b px-3 py-1.5 z-40 shadow-sm transition-colors duration-200 select-none ${headerBg}`}>
      <div className="max-w-full mx-auto flex flex-wrap items-center justify-between gap-2">
        
        {/* Left: Brand Logo, MIDI Device & Quick Audio */}
        <div className="flex items-center gap-2">
          {/* ChordMeet Brand Mark */}
          <div
            className="flex items-center gap-1.5 pr-1 shrink-0"
            title="ChordMeet — Piano MIDI & Acordes en Tiempo Real"
          >
            <ChordMeetIcon
              className="w-6 h-6 shrink-0 transition-transform hover:scale-105"
              color={brandColor}
              cutoutColor={theme?.faviconCutout}
            />
            <span className="font-extrabold text-xs tracking-tight hidden xl:inline">
              Chord<span style={{ color: brandColor }}>Meet</span>
            </span>
          </div>

          {/* MIDI Connection Status & Selector */}
          <div className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs ${pillBg}`}>
            <Usb
              className="w-3.5 h-3.5"
              style={{ color: inputs.length > 0 ? accentColor : undefined, opacity: inputs.length > 0 ? 1 : 0.55 }}
            />
            {inputs.length > 0 ? (
              <select
                value={selectedInputId}
                onChange={(e) => onSelectInput(e.target.value)}
                className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer max-w-[140px] truncate"
              >
                <option value="all" className={optionClass}>
                  Todos ({inputs.length})
                </option>
                {inputs.map((dev) => (
                  <option key={dev.id} value={dev.id} className={optionClass}>
                    {dev.name}
                  </option>
                ))}
              </select>
            ) : (
              <span
                className="text-xs font-semibold"
                style={{ color: isLight ? '#0068ff' : brandColor }}
              >
                Virtual MIDI
              </span>
            )}
          </div>

          {/* MIDI Channel Filter (Channel 1, All, etc.) */}
          <div className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs ${pillBg}`}>
            <span className="opacity-60 text-[11px]">Canal:</span>
            <select
              value={selectedChannel}
              onChange={(e) => onSelectChannel && onSelectChannel(e.target.value)}
              className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
              style={{ color: accentColor }}
              title="Filtro de canal MIDI (para evitar interferencias en el pedal de sustain)"
            >
              <option value="1" className={optionClass}>Canal 1 (Recomendado)</option>
              <option value="all" className={optionClass}>Todos (Omni)</option>
              {Array.from({ length: 15 }, (_, i) => i + 2).map((ch) => (
                <option key={ch} value={String(ch)} className={optionClass}>
                  Canal {ch}
                </option>
              ))}
            </select>
          </div>

          {/* Natural Acoustic Piano Decay Time Selector */}
          <div className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs ${pillBg}`}>
            <span className="opacity-60 text-[11px]">Decaimiento:</span>
            <select
              value={sustainDecayTime}
              onChange={(e) => onChangeDecayTime && onChangeDecayTime(parseFloat(e.target.value))}
              className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
              style={{ color: theme?.secondaryColor || accentColor }}
              title="Simula la resonancia acústica real: la nota decae gradualmente con el pedal presionado en orden de pulsación. Al soltar el pedal, todas las notas se apagan al instante."
            >
              <option value="2" className={optionClass}>2.0s (Rápido)</option>
              <option value="3.5" className={optionClass}>3.5s (Vertical)</option>
              <option value="4" className={optionClass}>4.0s (Estándar)</option>
              <option value="5" className={optionClass}>5.0s (Cola)</option>
              <option value="8" className={optionClass}>8.0s (Concierto)</option>
              <option value="12" className={optionClass}>12.0s (Largo)</option>
              <option value="999" className={optionClass}>Infinito</option>
            </select>
          </div>

          {/* Virtual Audio Sound Toggle */}
          <div className={`flex items-center gap-1 rounded-lg px-2 py-1 ${pillBg}`}>
            <button
              onClick={onToggleAudio}
              className={`text-xs flex items-center gap-1 transition-colors ${
                audioEnabled ? '' : 'opacity-40 hover:opacity-80'
              }`}
              style={{ color: audioEnabled ? accentColor : undefined }}
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
                className="w-12 cursor-pointer hidden sm:block"
                style={{ accentColor }}
                title="Volumen del sintetizador"
              />
            )}
          </div>

          {/* Clear notes */}
          <button
            onClick={onClearNotes}
            className={`p-1.5 rounded-lg transition-colors border ${
              isLight
                ? 'bg-[#eef3fc] hover:bg-[#dce7fb] border-[#cddaf5] text-slate-600 hover:text-[#0068ff]'
                : 'bg-white/5 hover:bg-white/15 border-white/10 text-slate-300 hover:text-white'
            }`}
            title="Pánico / Limpiar notas activas"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Center: Music Settings (Key, Tema, Color) */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Key Signature Selector */}
          <div className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs ${pillBg}`}>
            <span className="opacity-60 text-[11px]">Key:</span>
            <select
              value={keySignature}
              onChange={(e) => onChangeKeySignature(e.target.value)}
              className="bg-transparent font-bold focus:outline-none cursor-pointer"
              style={{ color: accentColor }}
            >
              {KEY_SIGNATURES.map((sig) => (
                <option key={sig.id} value={sig.id} className={optionClass}>
                  {sig.label}
                </option>
              ))}
            </select>
          </div>

          {/* Theme Selector */}
          <div className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs ${pillBg}`}>
            <span className="opacity-60 text-[11px]">Tema:</span>
            <select
              value={currentThemeId}
              onChange={(e) => onChangeTheme(e.target.value)}
              className="bg-transparent font-semibold focus:outline-none cursor-pointer"
            >
              {Object.values(THEMES).map((t) => (
                <option
                  key={t.id}
                  value={t.id}
                  className={t.mode === 'light' ? 'bg-white text-slate-900' : 'bg-[#081022] text-slate-100'}
                >
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Color Picker Presets */}
          <div className={`flex items-center gap-1.5 rounded-lg px-2 py-1 ${pillBg}`}>
            <Palette className="w-3.5 h-3.5 opacity-60" />
            <div className="flex items-center gap-1.5">
              {COLOR_PRESETS.slice(0, 4).map((c) => (
                <button
                  key={c.value}
                  onClick={() => onChangeAccentColor(c.value)}
                  className={`w-3.5 h-3.5 rounded-full transition-transform ${
                    accentColor.toLowerCase() === c.value.toLowerCase()
                      ? `scale-125 ring-2 ${isLight ? 'ring-slate-900/75' : 'ring-white/85'}`
                      : 'opacity-75 hover:opacity-100'
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
          <div className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs ${pillBg}`}>
            <Grid2X2 className="w-3.5 h-3.5 opacity-60" />
            <select
              value={layoutMode}
              onChange={(e) => onChangeLayoutMode(e.target.value)}
              className="bg-transparent font-semibold focus:outline-none cursor-pointer"
              title="Distribución y fusión de los 4 cuadrantes"
            >
              <option value="grid" className={optionClass}>
                4 Cuadrantes (2x2)
              </option>
              <option value="merge-bottom" className={optionClass}>
                2 Arriba + Fusionar Abajo
              </option>
              <option value="merge-top" className={optionClass}>
                Fusionar Arriba + 2 Abajo
              </option>
              <option value="merge-left" className={optionClass}>
                Fusionar Izquierda + 2 Derecha
              </option>
              <option value="merge-right" className={optionClass}>
                2 Izquierda + Fusionar Derecha
              </option>
            </select>
          </div>

          {/* Ocultar Barra (Atajo: H) */}
          <button
            onClick={onHideNavbar}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
              isLight
                ? 'bg-[#0068ff]/10 hover:bg-[#0068ff]/20 border-[#0068ff]/30 text-[#0068ff]'
                : 'bg-white/10 hover:bg-white/20 border-white/10'
            }`}
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
