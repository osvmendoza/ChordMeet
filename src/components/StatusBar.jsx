import React from 'react';
import { 
  Usb, 
  GitBranch, 
  Layout, 
  Music, 
  Piano, 
  Timer,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export default function StatusBar({
  inputsCount = 0,
  activeChord = null,
  keySignature = 'C',
  currentTheme = 'studio',
  onOpenPresets,
  onToggleMetronome,
  metronomeActive = false,
  accentColor = '#38bdf8',
  theme = null
}) {
  const isLight = theme?.mode === 'light';
  const barBg = isLight
    ? 'bg-sky-600 text-white'
    : 'bg-[#007acc] text-white'; // Classic VS Code blue status bar

  return (
    <footer 
      className={`h-6 text-[11px] font-mono px-3 flex items-center justify-between select-none z-30 shadow-md ${barBg}`}
      style={{
        backgroundColor: theme?.id === 'classic' 
          ? '#52291a' 
          : theme?.id === 'jazz' 
            ? '#2b1b3d' 
            : undefined
      }}
    >
      {/* Left Items */}
      <div className="flex items-center gap-3">
        {/* Remote / Branch */}
        <div className="flex items-center gap-1 opacity-90 hover:opacity-100 cursor-pointer">
          <GitBranch className="w-3 h-3" />
          <span>main*</span>
        </div>

        {/* MIDI Hardware Status */}
        <div className="flex items-center gap-1.5 opacity-90 hover:opacity-100 cursor-pointer">
          <Usb className="w-3 h-3" />
          <span>{inputsCount > 0 ? `MIDI USB (${inputsCount})` : 'MIDI Virtual'}</span>
        </div>

        {/* Current Key */}
        <div className="hidden sm:flex items-center gap-1 opacity-90">
          <span>Key: {keySignature} Maj</span>
        </div>

        {/* Live Chord Indicator */}
        {activeChord && (
          <div className="flex items-center gap-1 px-1.5 py-0.2 rounded bg-white/20 font-bold">
            <Music className="w-2.5 h-2.5" />
            <span>{activeChord}</span>
          </div>
        )}
      </div>

      {/* Right Items */}
      <div className="flex items-center gap-3">
        {/* Metronome status */}
        <div 
          onClick={onToggleMetronome}
          className="flex items-center gap-1 cursor-pointer hover:bg-white/10 px-1.5 py-0.5 rounded transition-colors"
          title="Alternar Metrónomo"
        >
          <Timer className="w-3 h-3" />
          <span>{metronomeActive ? 'Metrónomo: ON' : 'Metrónomo: OFF'}</span>
        </div>

        {/* Layout Presets button */}
        <div 
          onClick={onOpenPresets}
          className="flex items-center gap-1 cursor-pointer hover:bg-white/10 px-1.5 py-0.5 rounded transition-colors"
          title="Cambiar distribución de zonas (VS Code Layouts)"
        >
          <Layout className="w-3 h-3" />
          <span className="hidden md:inline">Zonas VS Code</span>
        </div>

        {/* Encoding / Status */}
        <span className="hidden lg:inline opacity-75">UTF-8</span>
        <span className="hidden lg:inline opacity-75">React 18</span>
      </div>
    </footer>
  );
}
