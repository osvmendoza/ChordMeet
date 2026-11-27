import React from 'react';
import { 
  Piano, 
  Music, 
  BookOpen, 
  LayoutGrid, 
  Settings, 
  Timer,
  Sliders,
  Maximize2
} from 'lucide-react';
import { ChordMeetIcon } from './BrandLogo';

export default function ActivityBar({
  activeView = null,
  onSelectView,
  onToggleMetronome,
  metronomeActive = false,
  onOpenSettings,
  onSelectPreset,
  theme = null,
  accentColor = '#00fff2'
}) {
  const isLight = theme?.mode === 'light';
  const barBg = isLight 
    ? 'bg-slate-200/90 border-slate-300 text-slate-700' 
    : 'bg-slate-950/95 border-slate-800 text-slate-400';

  return (
    <aside 
      className={`w-12 shrink-0 flex flex-col items-center justify-between py-3 border-r select-none z-30 transition-colors ${barBg}`}
      title="Barra de Actividades (VS Code Style)"
    >
      {/* Top Group: Component Focus & Layouts */}
      <div className="flex flex-col items-center gap-3 w-full">
        {/* ChordMeet Brand App Icon */}
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 shadow-md cursor-pointer hover:scale-105 transition-transform"
          title="ChordMeet Studio"
        >
          <ChordMeetIcon
            className="w-7 h-7"
            color={theme?.brandColor || accentColor}
            cutoutColor={theme?.faviconCutout || '#040710'}
          />
        </div>

        {/* Chords Shortcut */}
        <button
          onClick={() => onSelectView('chords')}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all relative group ${
            activeView === 'chords' 
              ? 'text-white' 
              : 'hover:text-slate-200 hover:bg-white/10'
          }`}
          title="Ver Detector de Acordes"
        >
          <Music className="w-4 h-4" />
          {activeView === 'chords' && (
            <span 
              className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r"
              style={{ backgroundColor: accentColor }}
            />
          )}
        </button>

        {/* Staff Shortcut */}
        <button
          onClick={() => onSelectView('staff')}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all relative group ${
            activeView === 'staff' 
              ? 'text-white' 
              : 'hover:text-slate-200 hover:bg-white/10'
          }`}
          title="Ver Pentagrama (Grand Staff)"
        >
          <BookOpen className="w-4 h-4" />
          {activeView === 'staff' && (
            <span 
              className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r"
              style={{ backgroundColor: accentColor }}
            />
          )}
        </button>

        {/* Keyboard Shortcut */}
        <button
          onClick={() => onSelectView('keyboard')}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all relative group ${
            activeView === 'keyboard' 
              ? 'text-white' 
              : 'hover:text-slate-200 hover:bg-white/10'
          }`}
          title="Ver Teclado Interactivo"
        >
          <Piano className="w-4 h-4" />
          {activeView === 'keyboard' && (
            <span 
              className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r"
              style={{ backgroundColor: accentColor }}
            />
          )}
        </button>

        {/* Layout Presets dropdown/button */}
        <button
          onClick={() => onSelectPreset()}
          className="w-9 h-9 rounded-lg flex items-center justify-center hover:text-slate-200 hover:bg-white/10 transition-all text-slate-400"
          title="Plantillas de Diseño (Zonas VS Code)"
        >
          <LayoutGrid className="w-4 h-4" />
        </button>

        {/* Metronome quick toggle */}
        <button
          onClick={onToggleMetronome}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all relative ${
            metronomeActive 
              ? 'text-amber-400 bg-amber-400/10' 
              : 'hover:text-slate-200 hover:bg-white/10'
          }`}
          title="Abrir Metrónomo de Clases"
        >
          <Timer className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Group: Settings (like VS Code Cog) */}
      <div className="flex flex-col items-center gap-2 w-full">
        <button
          onClick={onOpenSettings}
          className="w-9 h-9 rounded-lg flex items-center justify-center hover:text-slate-200 hover:bg-white/10 transition-all text-slate-400"
          title="Ajustes de Vista y Teclas"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
