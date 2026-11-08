import React from 'react';
import { X, Check, Layout, Columns, MoveDown, MoveUp } from 'lucide-react';

export const LAYOUT_PRESETS = [
  {
    id: 'sidebar-left',
    name: 'Pentagrama a la Izquierda (VS Code Explorer)',
    description: 'Pentagrama en la barra lateral izquierda, acordes en el centro y teclado abajo en la terminal.',
    zones: {
      sidebar: ['staff'],
      main: ['chords'],
      bottom: ['keyboard'],
      sidebarOpen: true
    }
  },
  {
    id: 'keyboard-top',
    name: 'Teclado Arriba e Información Abajo',
    description: 'Teclado en el editor principal superior; acordes y pentagrama abajo en el panel terminal.',
    zones: {
      sidebar: [],
      main: ['keyboard'],
      bottom: ['chords', 'staff'],
      sidebarOpen: false
    }
  },
  {
    id: 'standard-split',
    name: 'Estándar de Estudio (Acordes + Partitura)',
    description: 'Acordes y pentagrama lado a lado en el editor central; teclado en la parte inferior.',
    zones: {
      sidebar: [],
      main: ['chords', 'staff'],
      bottom: ['keyboard'],
      sidebarOpen: false
    }
  },
  {
    id: 'chords-left',
    name: 'Acordes a la Izquierda y Pentagrama al Centro',
    description: 'Cifrado armónico continuo a la izquierda, gran pentagrama en el centro y teclado abajo.',
    zones: {
      sidebar: ['chords'],
      main: ['staff'],
      bottom: ['keyboard'],
      sidebarOpen: true
    }
  }
];

export default function LayoutPresetsModal({
  isOpen = false,
  onClose,
  onApplyPreset,
  accentColor = '#38bdf8',
  theme = null
}) {
  if (!isOpen) return null;

  const cardBg = theme?.cardBg || 'bg-slate-900 border-slate-700 text-slate-100';

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`w-full max-w-lg rounded-2xl border p-5 shadow-2xl animate-in zoom-in-95 duration-150 ${cardBg}`}>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Layout className="w-4 h-4" style={{ color: accentColor }} />
            <h2 className="text-sm font-bold uppercase tracking-wider">
              Distribuciones de Zonas (Estilo VS Code)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Presets List */}
        <div className="grid grid-cols-1 gap-2.5 my-4">
          {LAYOUT_PRESETS.map((preset) => (
            <div
              key={preset.id}
              onClick={() => {
                onApplyPreset(preset.zones);
                onClose();
              }}
              className="p-3 rounded-xl border border-white/10 hover:border-indigo-500 bg-white/5 hover:bg-white/10 cursor-pointer transition-all flex items-start gap-3 group"
            >
              <div 
                className="p-2 rounded-lg bg-black/30 group-hover:bg-indigo-500/20 transition-colors shrink-0 mt-0.5"
                style={{ color: accentColor }}
              >
                <Columns className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <h3 className="text-xs font-bold text-slate-200 group-hover:text-white">
                  {preset.name}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  {preset.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Tip */}
        <div className="pt-2 border-t border-white/10 text-[11px] text-slate-400 flex items-center justify-between">
          <span>💡 También puedes arrastrar cualquier pestaña libremente con el ratón</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-slate-200 font-semibold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
