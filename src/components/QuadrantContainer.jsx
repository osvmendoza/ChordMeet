import React, { useState } from 'react';
import { 
  Piano, 
  Music, 
  BookOpen, 
  Timer, 
  History, 
  Circle,
  Square, 
  GripHorizontal,
  ChevronDown,
  Layers,
  Sparkles,
  Video,
  Camera
} from 'lucide-react';

export const WIDGET_OPTIONS = [
  { id: 'keyboard', name: 'Teclado Interactivo', icon: Piano },
  { id: 'staff', name: 'Pentagrama (Grand Staff)', icon: BookOpen },
  { id: 'chords', name: 'Detector de Acordes', icon: Music },
  { id: 'camera', name: 'Cámara de Video', icon: Video },
  { id: 'metronome', name: 'Metrónomo Digital', icon: Timer },
  { id: 'history', name: 'Progresión Armónica', icon: History },
  { id: 'recorder', name: 'Grabadora y Looper MIDI', icon: Circle },
  { id: 'empty', name: 'Cuadrante Vacío', icon: Square }
];

export default function QuadrantContainer({
  quadrantId,                  // 'q1' | 'q2' | 'q3' | 'q4' | 'merged'
  title = '',
  widgetId = 'empty',
  onChangeWidget,              // (widgetId)
  onDragStartWidget,           // (widgetId, sourceQuadrant)
  onDropWidget,                // (targetQuadrant)
  isDropTarget = false,
  accentColor = '#00fff2',
  theme = null,
  children
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const currentOption = WIDGET_OPTIONS.find((w) => w.id === widgetId) || WIDGET_OPTIONS[0];
  const IconComponent = currentOption.icon;

  const isLight = theme?.mode === 'light';
  const cardBg = theme?.cardBg || (isLight 
    ? 'bg-white border-slate-300 text-slate-800 shadow-md' 
    : 'bg-slate-900/90 border-slate-800/80 text-slate-100 shadow-xl');
  const headerBg = theme?.cardHeaderBg || theme?.headerBg || (isLight 
    ? 'bg-slate-100/90 border-slate-300' 
    : 'bg-slate-950/80 border-slate-800/80');

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', widgetId);
    e.dataTransfer.setData('source-quadrant', quadrantId);
    e.dataTransfer.effectAllowed = 'move';
    if (onDragStartWidget) onDragStartWidget(widgetId, quadrantId);
  };

  return (
    <div 
      className={`h-full w-full flex flex-col rounded-xl border overflow-hidden relative shadow-lg transition-colors duration-150 ${cardBg}`}
    >
      {/* Quadrant Tab Header */}
      <div className={`h-8 px-2 flex items-center justify-between border-b select-none shrink-0 text-xs transition-colors ${headerBg}`}>
        {/* Left: Draggable Tab */}
        <div 
          draggable={widgetId !== 'empty'}
          onDragStart={handleDragStart}
          className={`flex items-center gap-1.5 px-2 py-1 rounded transition-all ${
            widgetId !== 'empty' 
              ? 'cursor-grab hover:bg-white/10 active:cursor-grabbing font-semibold' 
              : 'opacity-50'
          }`}
          style={{ color: widgetId !== 'empty' ? accentColor : undefined }}
          title={widgetId !== 'empty' ? 'Arrastra esta pestaña a cualquier otro cuadrante' : ''}
        >
          {widgetId !== 'empty' && (
            <GripHorizontal className="w-3 h-3 opacity-60 hover:opacity-100" />
          )}
          <IconComponent className="w-3.5 h-3.5" />
          <span className="font-mono text-[11px] truncate max-w-[150px]">
            {currentOption.name}
          </span>
        </div>

        {/* Right: Widget Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-white/10 text-[10px] font-mono opacity-70 hover:opacity-100 transition-opacity"
            title="Cambiar contenido del cuadrante"
          >
            <span className="hidden sm:inline">Cambiar</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {dropdownOpen && (
            <div 
              className={`absolute right-0 mt-1 w-48 border rounded-lg shadow-2xl py-1 z-50 text-xs backdrop-blur-md ${
                isLight 
                  ? 'bg-white border-slate-300 text-slate-800' 
                  : (theme?.cardBg || 'bg-slate-900 border-slate-700 text-slate-200')
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border-b ${
                isLight ? 'text-slate-500 border-slate-200' : 'text-slate-400 border-white/10'
              }`}>
                Seleccionar Vista:
              </div>
              {WIDGET_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    onChangeWidget(opt.id);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 hover:bg-[#0068ff] hover:text-white flex items-center gap-2 transition-colors ${
                    widgetId === opt.id ? 'font-bold bg-white/5' : ''
                  }`}
                  style={widgetId === opt.id ? { color: accentColor } : undefined}
                >
                  <opt.icon className="w-3.5 h-3.5" />
                  <span>{opt.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quadrant Body */}
      <div className="flex-1 w-full h-full overflow-hidden relative">
        {widgetId === 'empty' ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-4 text-center">
            <Square className="w-8 h-8 mb-2 opacity-30 stroke-[1.5]" />
            <p className="text-xs font-medium opacity-70">Cuadrante Vacío</p>
            <p className="text-[11px] opacity-40 mt-1 max-w-[200px]">
              Arrastra una pestaña aquí o usa el menú superior para elegir qué mostrar
            </p>
          </div>
        ) : (
          <div className="w-full h-full overflow-hidden">
            {children}
          </div>
        )}

        {/* Drop Highlight Indicator */}
        {isDropTarget && (
          <div 
            className="absolute inset-0 border-2 border-dashed flex items-center justify-center z-50 pointer-events-none backdrop-blur-xs"
            style={{
              backgroundColor: `${accentColor}22`,
              borderColor: accentColor
            }}
          >
            <div
              className="bg-[#040710]/95 text-white px-3 py-1.5 rounded-lg shadow-2xl text-xs font-bold border flex items-center gap-2"
              style={{ borderColor: accentColor }}
            >
              <Sparkles className="w-4 h-4" style={{ color: accentColor }} />
              <span>Soltar en este Cuadrante</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
