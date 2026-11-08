import React from 'react';
import { 
  Piano, 
  Usb, 
  Volume2, 
  VolumeX, 
  Palette, 
  Tag, 
  RotateCcw,
  Sliders
} from 'lucide-react';
import { KEY_SIGNATURES, COLOR_PRESETS, KEYBOARD_CONFIGS } from '../utils/musicHelpers';

export default function HeaderControls({
  // MIDI states
  inputs = [],
  selectedInputId = 'all',
  onSelectInput,
  isMidiSupported = true,
  midiError = null,
  
  // Keyboard configurations
  keyCount = 61,
  onChangeKeyCount,
  labelMode = 'c-only',
  onChangeLabelMode,
  accentColor = '#38bdf8',
  onChangeAccentColor,

  // Key signature
  keySignature = 'C',
  onChangeKeySignature,

  // Audio synthesizer
  audioEnabled = true,
  onToggleAudio,
  audioVolume = 0.3,
  onChangeAudioVolume,

  // Reset
  onClearNotes
}) {
  return (
    <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* Brand / Title */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-sky-500 to-indigo-600 rounded-xl shadow-lg shadow-sky-500/20 text-white">
            <Piano className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-white">
                ChordMeet
              </h1>
              <span className="text-[10px] font-semibold uppercase bg-sky-500/20 text-sky-400 border border-sky-500/30 px-1.5 py-0.5 rounded">
                Live Piano
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Web MIDI API • Tonal.js • VexFlow
            </p>
          </div>
        </div>

        {/* MIDI Connection Status & Selector */}
        <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5">
          <Usb className={`w-4 h-4 ${inputs.length > 0 ? 'text-emerald-400' : 'text-slate-500'}`} />
          {inputs.length > 0 ? (
            <select
              value={selectedInputId}
              onChange={(e) => onSelectInput(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-slate-200">
                Todos los teclados ({inputs.length})
              </option>
              {inputs.map((dev) => (
                <option key={dev.id} value={dev.id} className="bg-slate-900 text-slate-200">
                  {dev.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-amber-400 font-medium">
              Modo Virtual (Sin MIDI USB)
            </span>
          )}
        </div>

        {/* Quick Config Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Key Count Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={keyCount}
              onChange={(e) => onChangeKeyCount(Number(e.target.value))}
              className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer"
            >
              {Object.keys(KEYBOARD_CONFIGS).map((num) => (
                <option key={num} value={num} className="bg-slate-900 text-slate-200">
                  {KEYBOARD_CONFIGS[num].name}
                </option>
              ))}
            </select>
          </div>

          {/* Key Signature Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs">
            <span className="text-slate-400 font-medium">Key:</span>
            <select
              value={keySignature}
              onChange={(e) => onChangeKeySignature(e.target.value)}
              className="bg-transparent text-xs font-bold text-indigo-400 focus:outline-none cursor-pointer"
            >
              {KEY_SIGNATURES.map((sig) => (
                <option key={sig.id} value={sig.id} className="bg-slate-900 text-slate-200">
                  {sig.label}
                </option>
              ))}
            </select>
          </div>

          {/* Note Labels Toggle */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={labelMode}
              onChange={(e) => onChangeLabelMode(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="c-only" className="bg-slate-900 text-slate-200">Solo Do (C1, C2...)</option>
              <option value="all" className="bg-slate-900 text-slate-200">Todas las notas</option>
              <option value="none" className="bg-slate-900 text-slate-200">Sin notas</option>
            </select>
          </div>

          {/* Color Picker with Presets */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-1.5">
            <Palette className="w-3.5 h-3.5 text-slate-400" />
            <div className="flex items-center gap-1">
              {COLOR_PRESETS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => onChangeAccentColor(color.value)}
                  className={`w-4 h-4 rounded-full transition-transform ${
                    accentColor === color.value ? 'scale-125 ring-2 ring-white/60' : 'hover:scale-110 opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
              <input
                type="color"
                value={accentColor}
                onChange={(e) => onChangeAccentColor(e.target.value)}
                className="w-5 h-5 rounded-full cursor-pointer bg-transparent border-none ml-1 p-0"
                title="Color personalizado"
              />
            </div>
          </div>

          {/* Virtual Audio Sound Toggle */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-1.5">
            <button
              onClick={onToggleAudio}
              className={`text-xs flex items-center gap-1 transition-colors ${
                audioEnabled ? 'text-emerald-400 font-semibold' : 'text-slate-500 hover:text-slate-400'
              }`}
              title={audioEnabled ? 'Sonido virtual activado' : 'Sonido virtual desactivado'}
            >
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden md:inline">{audioEnabled ? 'Audio ON' : 'Audio OFF'}</span>
            </button>
            {audioEnabled && (
              <input
                type="range"
                min="0.05"
                max="0.8"
                step="0.05"
                value={audioVolume}
                onChange={(e) => onChangeAudioVolume(parseFloat(e.target.value))}
                className="w-14 accent-emerald-400 cursor-pointer hidden md:block"
                title="Volumen del sintetizador"
              />
            )}
          </div>

          {/* Panic / Clear button */}
          <button
            onClick={onClearNotes}
            className="p-1.5 bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-xl transition-colors"
            title="Limpiar todas las notas activas (Pánico)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
