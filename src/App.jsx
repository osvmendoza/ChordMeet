import React, { useState, useEffect, useCallback } from 'react';
import HeaderControls from './components/HeaderControls';
import ChordDisplay from './components/ChordDisplay';
import Staff from './components/Staff';
import Keyboard from './components/Keyboard';
import SustainPedal from './components/SustainPedal';
import { useWebMidi } from './hooks/useWebMidi';
import { synth } from './utils/audioSynth';
import { Info, Keyboard as KeyboardIcon } from 'lucide-react';

// Computer QWERTY keyboard map for virtual testing (C4 to E5)
const QWERTY_MIDI_MAP = {
  'a': 60, // C4
  'w': 61, // C#4
  's': 62, // D4
  'e': 63, // D#4
  'd': 64, // E4
  'f': 65, // F4
  't': 66, // F#4
  'g': 67, // G4
  'y': 68, // G#4
  'h': 69, // A4
  'u': 70, // A#4
  'j': 71, // B4
  'k': 72, // C5
  'o': 73, // C#5
  'l': 74, // D5
  'p': 75, // D#5
  ';': 76, // E5
  ' ': 'sustain' // Space bar toggles sustain
};

export default function App() {
  // App preferences state
  const [keyCount, setKeyCount] = useState(61);
  const [labelMode, setLabelMode] = useState('c-only'); // 'c-only', 'all', 'none'
  const [accentColor, setAccentColor] = useState('#38bdf8');
  const [keySignature, setKeySignature] = useState('C');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [audioVolume, setAudioVolume] = useState(0.35);

  // Web MIDI Hook
  const {
    activeNotes,
    sustainedNotes,
    allAudibleNotes,
    sustainPedal,
    sustainValue,
    inputs,
    selectedInputId,
    setSelectedInputId,
    isSupported,
    error: midiError,
    triggerNoteOn,
    triggerNoteOff,
    handleSustainChange,
    clearAllNotes
  } = useWebMidi({
    playAudio: audioEnabled,
    holdNotesWithSustain: true
  });

  // Handle synth volume changes
  const handleVolumeChange = (vol) => {
    setAudioVolume(vol);
    synth.setVolume(vol);
  };

  const handleToggleAudio = () => {
    const nextState = !audioEnabled;
    setAudioEnabled(nextState);
    synth.setEnabled(nextState);
  };

  // Keyboard QWERTY event listeners for testing without physical MIDI
  useEffect(() => {
    const pressedKeys = new Set();

    const handleKeyDown = (e) => {
      // Ignore if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

      const key = e.key.toLowerCase();
      if (pressedKeys.has(key)) return; // Prevent key repeat

      if (key === ' ') {
        e.preventDefault();
        handleSustainChange(127);
        pressedKeys.add(key);
        return;
      }

      const midi = QWERTY_MIDI_MAP[key];
      if (midi) {
        e.preventDefault();
        pressedKeys.add(key);
        triggerNoteOn(midi, 0.85);
      }
    };

    const handleKeyUp = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

      const key = e.key.toLowerCase();
      pressedKeys.delete(key);

      if (key === ' ') {
        e.preventDefault();
        handleSustainChange(0);
        return;
      }

      const midi = QWERTY_MIDI_MAP[key];
      if (midi) {
        e.preventDefault();
        triggerNoteOff(midi);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [triggerNoteOn, triggerNoteOff, handleSustainChange]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-sky-500 selection:text-white">
      {/* 1. Header with Controls */}
      <HeaderControls
        inputs={inputs}
        selectedInputId={selectedInputId}
        onSelectInput={setSelectedInputId}
        isMidiSupported={isSupported}
        midiError={midiError}
        keyCount={keyCount}
        onChangeKeyCount={setKeyCount}
        labelMode={labelMode}
        onChangeLabelMode={setLabelMode}
        accentColor={accentColor}
        onChangeAccentColor={setAccentColor}
        keySignature={keySignature}
        onChangeKeySignature={setKeySignature}
        audioEnabled={audioEnabled}
        onToggleAudio={handleToggleAudio}
        audioVolume={audioVolume}
        onChangeAudioVolume={handleVolumeChange}
        onClearNotes={clearAllNotes}
      />

      {/* Main Classroom Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6 justify-between">
        
        {/* Info Banner when in Virtual Mode */}
        {inputs.length === 0 && (
          <div className="bg-sky-950/40 border border-sky-800/60 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-sky-200 shadow-sm">
            <div className="flex items-center gap-2.5">
              <Info className="w-4 h-4 text-sky-400 shrink-0" />
              <span>
                Conecta tu <strong>teclado MIDI USB</strong> para empezar a tocar en vivo. También puedes usar el ratón o las teclas 
                <span className="font-mono bg-sky-900/60 px-1.5 py-0.5 rounded mx-1 text-sky-300">A, W, S, E, D, F, G...</span> y 
                <span className="font-mono bg-sky-900/60 px-1.5 py-0.5 rounded mx-1 text-sky-300">Espacio</span> para el sustain.
              </span>
            </div>
            <div className="hidden md:flex items-center gap-1.5 text-slate-400">
              <KeyboardIcon className="w-3.5 h-3.5" />
              <span>Modo Virtual Listo</span>
            </div>
          </div>
        )}

        {/* 2. Middle Section: Split into Chord Visualizer & Grand Staff */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-[300px]">
          {/* Chord Visualizer (Left side: 5 cols on lg) */}
          <section className="lg:col-span-5 flex flex-col">
            <ChordDisplay 
              activeNotes={allAudibleNotes} 
              accentColor={accentColor} 
            />
          </section>

          {/* Grand Staff in Real Time (Right side: 7 cols on lg) */}
          <section className="lg:col-span-7 flex flex-col">
            <Staff
              activeNotes={allAudibleNotes}
              keySignature={keySignature}
              accentColor={accentColor}
            />
          </section>
        </div>

        {/* 3. Bottom Section: Piano Keyboard + Sustain Pedal Indicator */}
        <section className="flex flex-col gap-3 mt-auto">
          {/* Piano Keyboard Component */}
          <Keyboard
            activeNotes={activeNotes}
            sustainedNotes={sustainedNotes}
            keyCount={keyCount}
            labelMode={labelMode}
            accentColor={accentColor}
            onNoteOn={triggerNoteOn}
            onNoteOff={triggerNoteOff}
          />

          {/* Sustain Pedal Graphic & Quick Status bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            <SustainPedal
              isPressed={sustainPedal}
              value={sustainValue}
              onToggle={handleSustainChange}
              accentColor={accentColor}
            />

            {/* Quick status tips */}
            <div className="text-right text-xs text-slate-500 hidden sm:block">
              <p>Optimizada para transmisión en <span className="text-slate-400 font-medium">OBS Studio</span> y clases por <span className="text-slate-400 font-medium">Zoom / Meet</span></p>
              <p className="text-[11px] text-slate-600 mt-0.5">Detección polifónica por hardware USB sin latencia</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
