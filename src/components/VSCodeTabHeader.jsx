import React, { useState } from 'react';
import { 
  Piano, 
  Music, 
  BookOpen, 
  X, 
  MoreHorizontal, 
  MoveRight, 
  MoveDown, 
  MoveUp, 
  Columns,
  GripHorizontal
} from 'lucide-react';

const WIDGET_METADATA = {
  keyboard: {
    id: 'keyboard',
    title: 'Teclado.midi',
    icon: Piano,
    badge: 'MIDI In'
  },
  chords: {
    id: 'chords',
    title: 'Acordes.tonal',
    icon: Music,
    badge: 'Harmony'
  },
  staff: {
    id: 'staff',
    title: 'Partitura.vexflow',
    icon: BookOpen,
    badge: 'Staff'
  }
};

export default function VSCodeTabHeader({
  zoneId,                     // 'sidebar' | 'main' | 'bottom'
  widgets = [],               // ['chords', 'staff']
  activeWidgetId,             // Currently selected tab
  onSelectTab,
  onMoveWidget,               // (widgetId, targetZone)
  onCloseWidget,              // (widgetId)
  accentColor = '#00fff2',
  theme = null
}) {
  const [menuOpenForWidget, setMenuOpenForWidget] = useState(null);

  const isLight = theme?.mode === 'light';
  const headerBg = isLight 
    ? 'bg-slate-200/80 border-slate-300' 
    : 'bg-slate-950/80 border-slate-800/80';
  const activeTabBg = isLight
    ? 'bg-white text-slate-900 border-t-2'
    : 'bg-slate-900 text-slate-100 border-t-2';
  const inactiveTabBg = isLight
    ? 'bg-slate-200/60 text-slate-600 hover:bg-slate-100'
    : 'bg-slate-950/40 text-slate-400 hover:bg-slate-900/60';

  const handleDragStart = (e, widgetId) => {
    e.dataTransfer.setData('text/plain', widgetId);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className={`flex items-center justify-between border-b px-2 select-none h-9 text-xs transition-colors ${headerBg}`}>
      {/* Tabs list */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar h-full">
        {widgets.map((widgetId) => {
          const meta = WIDGET_METADATA[widgetId] || { title: widgetId, icon: Music };
          const IconComponent = meta.icon;
          const isActive = activeWidgetId === widgetId;

          return (
            <div
              key={widgetId}
              draggable
              onDragStart={(e) => handleDragStart(e, widgetId)}
              onClick={() => onSelectTab && onSelectTab(widgetId)}
              className={`flex items-center gap-2 px-3 h-full cursor-pointer border-r border-white/5 transition-all relative group ${
                isActive ? activeTabBg : inactiveTabBg
              }`}
              style={{
                borderTopColor: isActive ? accentColor : 'transparent'
              }}
              title="Arrastra esta pestaña para moverla a otra zona de la pantalla"
            >
              <GripHorizontal className="w-3 h-3 opacity-0 group-hover:opacity-60 cursor-grab shrink-0" />
              <IconComponent className="w-3.5 h-3.5 shrink-0" style={{ color: isActive ? accentColor : undefined }} />
              <span className="font-mono font-medium truncate max-w-[130px]">
                {meta.title}
              </span>

              {/* Tab Quick Actions Menu */}
              <div className="relative ml-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpenForWidget(menuOpenForWidget === widgetId ? null : widgetId);
                  }}
                  className="p-0.5 rounded hover:bg-black/20 opacity-40 group-hover:opacity-100 transition-opacity"
                  title="Mover panel a otra zona"
                >
                  <MoreHorizontal className="w-3 h-3" />
                </button>

                {/* Move Dropdown */}
                {menuOpenForWidget === widgetId && (
                  <div 
                    className="absolute left-0 mt-1.5 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl py-1 z-50 text-slate-200 text-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                      Mover a Zona:
                    </div>
                    {zoneId !== 'sidebar' && (
                      <button
                        onClick={() => {
                          onMoveWidget(widgetId, 'sidebar');
                          setMenuOpenForWidget(null);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-indigo-600 hover:text-white flex items-center gap-2"
                      >
                        <Columns className="w-3 h-3" />
                        <span>Barra Lateral (Izquierda)</span>
                      </button>
                    )}
                    {zoneId !== 'main' && (
                      <button
                        onClick={() => {
                          onMoveWidget(widgetId, 'main');
                          setMenuOpenForWidget(null);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-indigo-600 hover:text-white flex items-center gap-2"
                      >
                        <MoveUp className="w-3 h-3" />
                        <span>Editor Central</span>
                      </button>
                    )}
                    {zoneId !== 'bottom' && (
                      <button
                        onClick={() => {
                          onMoveWidget(widgetId, 'bottom');
                          setMenuOpenForWidget(null);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-indigo-600 hover:text-white flex items-center gap-2"
                      >
                        <MoveDown className="w-3 h-3" />
                        <span>Panel Inferior (Terminal)</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Zone hint label on right */}
      <div className="text-[10px] font-mono opacity-40 px-2 uppercase tracking-wider hidden sm:block">
        Zona: {zoneId === 'sidebar' ? 'Lateral' : zoneId === 'main' ? 'Editor' : 'Terminal'}
      </div>
    </div>
  );
}
