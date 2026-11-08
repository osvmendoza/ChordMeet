import React, { useState, useEffect, useRef, useCallback } from 'react';
import HeaderControls from './components/HeaderControls';
import QuadrantContainer from './components/QuadrantContainer';
import ChordDisplay, { formatChordSymbol } from './components/ChordDisplay';
import Staff from './components/Staff';
import Keyboard from './components/Keyboard';
import SustainPedal from './components/SustainPedal';
import ChordHistory from './components/ChordHistory';
import Metronome from './components/Metronome';
import MidiRecorder from './components/MidiRecorder';

import { useWebMidi } from './hooks/useWebMidi';
import { synth } from './utils/audioSynth';
import { THEMES } from './utils/themeConfig';
import { midiToHarmonicNoteName, harmonizeChordSymbol, getScaleNotes } from './utils/musicHelpers';
import { Chord, Midi } from '@tonaljs/tonal';
import { Eye, GripVertical, GripHorizontal } from 'lucide-react';

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
  const [currentThemeId, setCurrentThemeId] = useState('studio');
  const [keyCount, setKeyCount] = useState(61);
  const [labelMode, setLabelMode] = useState('c-only');
  const [accentColor, setAccentColor] = useState('#38bdf8');
  const [keySignature, setKeySignature] = useState('C');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [audioVolume, setAudioVolume] = useState(0.35);

  // Navbar Visibility state (Toggleable with 'H')
  const [navbarVisible, setNavbarVisible] = useState(true);

  // 4 Quadrants State (q1: Top-Left, q2: Top-Right, q3: Bottom-Left, q4: Bottom-Right)
  // Default: Q1 = Chords, Q2 = Staff, Q3 = Keyboard (merged full bottom by default), Q4 = Metronome
  const [quadrants, setQuadrants] = useState({
    q1: 'chords',
    q2: 'staff',
    q3: 'keyboard',
    q4: 'history'
  });

  // Quadrant Merge Mode:
  // 'grid' (4 quadrants 2x2)
  // 'merge-bottom' (2 top + 1 merged bottom full width - ideal for piano)
  // 'merge-top' (1 merged top full width + 2 bottom)
  // 'merge-left' (1 merged left full height + 2 right)
  // 'merge-right' (2 left + 1 merged right full height)
  const [layoutMode, setLayoutMode] = useState('merge-bottom');

  // Split percentages (Cartesian 2-axis dividers)
  const [splitX, setSplitX] = useState(50); // Left % vs Right % (15 to 85)
  const [splitY, setSplitY] = useState(48); // Top % vs Bottom % (15 to 85)

  // Drag and drop state
  const [dragOverQuadrant, setDragOverQuadrant] = useState(null);
  const [draggedWidget, setDraggedWidget] = useState(null);
  const [chordHistory, setChordHistory] = useState([]);

  const activeTheme = THEMES[currentThemeId] || THEMES.studio;
  const gridContainerRef = useRef(null);

  // Web MIDI Hook
  const {
    activeNotes,
    sustainedNotes,
    sustainedNoteDurations,
    allAudibleNotes,
    sustainPedal,
    sustainValue,
    inputs,
    selectedInputId,
    setSelectedInputId,
    selectedChannel,
    setSelectedChannel,
    sustainDecayTime,
    setSustainDecayTime,
    invertPedalPolarity,
    setInvertPedalPolarity,
    isSupported,
    triggerNoteOn,
    triggerNoteOff,
    handleSustainChange,
    clearAllNotes
  } = useWebMidi({
    playAudio: audioEnabled,
    holdNotesWithSustain: true
  });

  // Track chord history
  useEffect(() => {
    if (allAudibleNotes.length >= 2) {
      const noteNames = allAudibleNotes.map((m) => midiToHarmonicNoteName(m, keySignature));
      const pitchClasses = noteNames.map((n) => n.replace(/\d+/, ''));
      const detected = Chord.detect(Array.from(new Set(pitchClasses)));
      if (detected.length > 0) {
        let chordName = formatChordSymbol(detected[0]);
        chordName = harmonizeChordSymbol(chordName, keySignature);
        setChordHistory((prev) => {
          if (prev.length > 0 && prev[prev.length - 1].chord === chordName) {
            return prev;
          }
          const next = [...prev, { id: Date.now(), chord: chordName }];
          return next.slice(-7);
        });
      }
    }
  }, [allAudibleNotes, keySignature]);

  // Keyboard shortcut: Toggle Navbar with 'H'
  useEffect(() => {
    const handleShortcut = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        setNavbarVisible((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  // Keyboard QWERTY event listeners for testing without physical MIDI
  useEffect(() => {
    const pressedKeys = new Set();

    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

      const key = e.key.toLowerCase();
      if (pressedKeys.has(key)) return;

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

  // Handle Drag & Drop between quadrants (Swaps or moves)
  const handleDropOnQuadrant = (targetQ, e) => {
    e.preventDefault();
    const widgetId = e.dataTransfer.getData('text/plain') || draggedWidget;
    const srcQ = e.dataTransfer.getData('source-quadrant');
    if (!widgetId) return;

    setQuadrants((prev) => {
      const next = { ...prev };
      if (srcQ && srcQ !== targetQ) {
        // Swap contents
        const existingInTarget = prev[targetQ];
        next[targetQ] = widgetId;
        next[srcQ] = existingInTarget || 'empty';
      } else {
        next[targetQ] = widgetId;
      }
      return next;
    });

    setDragOverQuadrant(null);
    setDraggedWidget(null);
  };

  // Resizing vertical divider (X axis: Left vs Right)
  const handleXResizeStart = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startRatio = splitX;
    const container = gridContainerRef.current;
    if (!container) return;
    const totalW = container.clientWidth;

    const onMouseMove = (moveEvent) => {
      const delta = moveEvent.clientX - startX;
      const deltaPct = (delta / totalW) * 100;
      const newRatio = Math.min(85, Math.max(15, Math.round(startRatio + deltaPct)));
      setSplitX(newRatio);
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Resizing horizontal divider (Y axis: Top vs Bottom)
  const handleYResizeStart = (e) => {
    e.preventDefault();
    const startY = e.clientY;
    const startRatio = splitY;
    const container = gridContainerRef.current;
    if (!container) return;
    const totalH = container.clientHeight;

    const onMouseMove = (moveEvent) => {
      const delta = moveEvent.clientY - startY;
      const deltaPct = (delta / totalH) * 100;
      const newRatio = Math.min(85, Math.max(15, Math.round(startRatio + deltaPct)));
      setSplitY(newRatio);
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Change Theme
  const handleThemeChange = (newThemeId) => {
    setCurrentThemeId(newThemeId);
    const newTheme = THEMES[newThemeId];
    if (newTheme?.defaultAccent) {
      setAccentColor(newTheme.defaultAccent);
    }
  };

  // Synth controls
  const handleVolumeChange = (vol) => {
    setAudioVolume(vol);
    synth.setVolume(vol);
  };

  const handleToggleAudio = () => {
    const nextState = !audioEnabled;
    setAudioEnabled(nextState);
    synth.setEnabled(nextState);
  };

  // Render widget inside any quadrant
  const renderWidgetContent = (widgetId) => {
    switch (widgetId) {
      case 'keyboard':
        return (
          <div className="w-full h-full flex flex-col justify-between p-1.5 gap-1.5 overflow-hidden">
            <div className="flex-1 w-full overflow-hidden">
              <Keyboard
                activeNotes={activeNotes}
                sustainedNotes={sustainedNotes}
                sustainedNoteDurations={sustainedNoteDurations}
                sustainDecayTime={sustainDecayTime}
                keySignature={keySignature}
                scaleNotes={getScaleNotes(keySignature)}
                keyCount={keyCount}
                labelMode={labelMode}
                accentColor={accentColor}
                theme={activeTheme}
                onNoteOn={triggerNoteOn}
                onNoteOff={triggerNoteOff}
              />
            </div>
            {/* Integrated Pedal bar */}
            <div className="flex items-center justify-between gap-3 px-1 shrink-0">
              <SustainPedal
                isPressed={sustainPedal}
                value={sustainValue}
                onToggle={handleSustainChange}
                selectedChannel={selectedChannel}
                sustainDecayTime={sustainDecayTime}
                onChangeDecayTime={setSustainDecayTime}
                invertPolarity={invertPedalPolarity}
                onTogglePolarity={() => setInvertPedalPolarity(!invertPedalPolarity)}
                accentColor={accentColor}
                theme={activeTheme}
              />
              <span className="text-[10px] font-mono opacity-50 hidden sm:inline">
                {inputs.length > 0 ? `MIDI USB: ${inputs[0].name}` : 'Modo Virtual Teclado'}
              </span>
            </div>
          </div>
        );

      case 'staff':
        return (
          <div className="w-full h-full p-1.5 overflow-auto">
            <Staff
              activeNotes={allAudibleNotes}
              keySignature={keySignature}
              accentColor={accentColor}
              theme={activeTheme}
            />
          </div>
        );

      case 'chords':
        return (
          <div className="w-full h-full p-1.5 overflow-auto">
            <ChordDisplay
              activeNotes={allAudibleNotes}
              keySignature={keySignature}
              accentColor={accentColor}
              theme={activeTheme}
            />
          </div>
        );

      case 'metronome':
        return (
          <div className="w-full h-full flex items-center justify-center p-3">
            <Metronome accentColor={accentColor} theme={activeTheme} />
          </div>
        );

      case 'history':
        return (
          <div className="w-full h-full flex flex-col justify-center p-3">
            <ChordHistory
              history={chordHistory}
              onClear={() => setChordHistory([])}
              accentColor={accentColor}
              theme={activeTheme}
            />
          </div>
        );

      case 'recorder':
        return (
          <div className="w-full h-full p-2 overflow-auto">
            <MidiRecorder
              activeNotes={activeNotes}
              onTriggerNoteOn={triggerNoteOn}
              onTriggerNoteOff={triggerNoteOff}
              accentColor={accentColor}
              theme={activeTheme}
            />
          </div>
        );

      default:
        return null;
    }
  };

  // Render a specific quadrant with its dropzone
  const renderQuadrant = (qId) => (
    <div
      className="w-full h-full overflow-hidden"
      onDragOver={(e) => {
        e.preventDefault();
        setDragOverQuadrant(qId);
      }}
      onDragLeave={() => setDragOverQuadrant(null)}
      onDrop={(e) => handleDropOnQuadrant(qId, e)}
    >
      <QuadrantContainer
        quadrantId={qId}
        widgetId={quadrants[qId] || 'empty'}
        onChangeWidget={(newWidget) => setQuadrants((prev) => ({ ...prev, [qId]: newWidget }))}
        onDragStartWidget={(wId) => setDraggedWidget(wId)}
        isDropTarget={dragOverQuadrant === qId}
        accentColor={accentColor}
        theme={activeTheme}
      >
        {renderWidgetContent(quadrants[qId])}
      </QuadrantContainer>
    </div>
  );

  return (
    <div className={`h-screen w-screen flex flex-col overflow-hidden transition-colors duration-200 select-none ${activeTheme.bgClass}`}>
      
      {/* 1. Compact Navbar (Hidden when navbarVisible is false) */}
      {navbarVisible && (
        <HeaderControls
          inputs={inputs}
          selectedInputId={selectedInputId}
          onSelectInput={setSelectedInputId}
          selectedChannel={selectedChannel}
          onSelectChannel={setSelectedChannel}
          sustainDecayTime={sustainDecayTime}
          onChangeDecayTime={setSustainDecayTime}
          keyCount={keyCount}
          onChangeKeyCount={setKeyCount}
          accentColor={accentColor}
          onChangeAccentColor={setAccentColor}
          keySignature={keySignature}
          onChangeKeySignature={setKeySignature}
          currentThemeId={currentThemeId}
          onChangeTheme={handleThemeChange}
          theme={activeTheme}
          layoutMode={layoutMode}
          onChangeLayoutMode={setLayoutMode}
          audioEnabled={audioEnabled}
          onToggleAudio={handleToggleAudio}
          audioVolume={audioVolume}
          onChangeAudioVolume={handleVolumeChange}
          onClearNotes={clearAllNotes}
          onHideNavbar={() => setNavbarVisible(false)}
        />
      )}

      {/* Floating Toggle Button when Navbar is Hidden */}
      {!navbarVisible && (
        <button
          onClick={() => setNavbarVisible(true)}
          className="fixed top-2.5 right-3 z-50 px-2.5 py-1 rounded-lg bg-black/60 hover:bg-black/90 text-white/80 hover:text-white text-xs font-semibold backdrop-blur-md border border-white/20 shadow-xl opacity-40 hover:opacity-100 transition-all flex items-center gap-1.5"
          title="Mostrar barra de navegación (Atajo: tecla H)"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Barra (H)</span>
        </button>
      )}

      {/* 2. 4-Quadrant Cartesian Canvas with Merging & Resizing */}
      <main 
        ref={gridContainerRef}
        className="flex-1 w-full h-full p-2 overflow-hidden flex flex-col relative"
      >
        {/* LAYOUT A: 'grid' (4 Cuadrantes 2x2 estándar) */}
        {layoutMode === 'grid' && (
          <div className="w-full h-full flex flex-col overflow-hidden">
            {/* Top Row: Q1 (Left) + Q2 (Right) */}
            <div className="flex w-full overflow-hidden" style={{ height: `${splitY}%` }}>
              <div className="h-full overflow-hidden" style={{ width: `${splitX}%` }}>
                {renderQuadrant('q1')}
              </div>
              
              {/* Vertical Divider X */}
              <div
                onMouseDown={handleXResizeStart}
                className="w-2 hover:w-2.5 cursor-col-resize z-30 flex items-center justify-center group bg-transparent hover:bg-indigo-500/20 rounded transition-all select-none"
                title="Arrastra para cambiar el ancho de las columnas"
              >
                <div className="h-10 w-0.5 rounded-full bg-slate-600/40 group-hover:bg-indigo-400 transition-colors" />
              </div>

              <div className="h-full flex-1 overflow-hidden">
                {renderQuadrant('q2')}
              </div>
            </div>

            {/* Horizontal Divider Y */}
            <div
              onMouseDown={handleYResizeStart}
              className="h-2 hover:h-2.5 cursor-row-resize z-30 flex items-center justify-center group bg-transparent hover:bg-indigo-500/20 rounded transition-all select-none"
              title="Arrastra para cambiar la altura de las filas"
            >
              <div className="w-12 h-0.5 rounded-full bg-slate-600/40 group-hover:bg-indigo-400 transition-colors" />
            </div>

            {/* Bottom Row: Q3 (Left) + Q4 (Right) */}
            <div className="flex-1 flex w-full overflow-hidden">
              <div className="h-full overflow-hidden" style={{ width: `${splitX}%` }}>
                {renderQuadrant('q3')}
              </div>

              {/* Vertical Divider X */}
              <div
                onMouseDown={handleXResizeStart}
                className="w-2 hover:w-2.5 cursor-col-resize z-30 flex items-center justify-center group bg-transparent hover:bg-indigo-500/20 rounded transition-all select-none"
                title="Arrastra para cambiar el ancho de las columnas"
              >
                <div className="h-10 w-0.5 rounded-full bg-slate-600/40 group-hover:bg-indigo-400 transition-colors" />
              </div>

              <div className="h-full flex-1 overflow-hidden">
                {renderQuadrant('q4')}
              </div>
            </div>
          </div>
        )}

        {/* LAYOUT B: 'merge-bottom' (2 Arriba Q1 & Q2 + Fusionar Abajo Q3 a lo ancho) */}
        {layoutMode === 'merge-bottom' && (
          <div className="w-full h-full flex flex-col overflow-hidden">
            {/* Top Row: Q1 and Q2 */}
            <div className="flex w-full overflow-hidden" style={{ height: `${splitY}%` }}>
              <div className="h-full overflow-hidden" style={{ width: `${splitX}%` }}>
                {renderQuadrant('q1')}
              </div>
              
              {/* Vertical Divider X */}
              <div
                onMouseDown={handleXResizeStart}
                className="w-2 hover:w-2.5 cursor-col-resize z-30 flex items-center justify-center group bg-transparent hover:bg-indigo-500/20 rounded transition-all select-none"
                title="Arrastra para cambiar la proporción izquierda / derecha"
              >
                <div className="h-10 w-0.5 rounded-full bg-slate-600/40 group-hover:bg-indigo-400 transition-colors" />
              </div>

              <div className="h-full flex-1 overflow-hidden">
                {renderQuadrant('q2')}
              </div>
            </div>

            {/* Horizontal Divider Y */}
            <div
              onMouseDown={handleYResizeStart}
              className="h-2 hover:h-2.5 cursor-row-resize z-30 flex items-center justify-center group bg-transparent hover:bg-indigo-500/20 rounded transition-all select-none"
              title="Arrastra para cambiar la altura del teclado / panel inferior"
            >
              <div className="w-16 h-0.5 rounded-full bg-slate-600/40 group-hover:bg-indigo-400 transition-colors" />
            </div>

            {/* Bottom Row: Merged Q3 spanning 100% full width */}
            <div className="flex-1 w-full overflow-hidden">
              {renderQuadrant('q3')}
            </div>
          </div>
        )}

        {/* LAYOUT C: 'merge-top' (Fusionar Arriba Q1 a lo ancho + 2 Abajo Q3 & Q4) */}
        {layoutMode === 'merge-top' && (
          <div className="w-full h-full flex flex-col overflow-hidden">
            {/* Top Row: Merged Q1 spanning 100% full width */}
            <div className="w-full overflow-hidden" style={{ height: `${splitY}%` }}>
              {renderQuadrant('q1')}
            </div>

            {/* Horizontal Divider Y */}
            <div
              onMouseDown={handleYResizeStart}
              className="h-2 hover:h-2.5 cursor-row-resize z-30 flex items-center justify-center group bg-transparent hover:bg-indigo-500/20 rounded transition-all select-none"
              title="Arrastra para cambiar la altura del panel superior"
            >
              <div className="w-16 h-0.5 rounded-full bg-slate-600/40 group-hover:bg-indigo-400 transition-colors" />
            </div>

            {/* Bottom Row: Q3 and Q4 */}
            <div className="flex-1 flex w-full overflow-hidden">
              <div className="h-full overflow-hidden" style={{ width: `${splitX}%` }}>
                {renderQuadrant('q3')}
              </div>

              <div
                onMouseDown={handleXResizeStart}
                className="w-2 hover:w-2.5 cursor-col-resize z-30 flex items-center justify-center group bg-transparent hover:bg-indigo-500/20 rounded transition-all select-none"
                title="Arrastra para cambiar el ancho de las columnas"
              >
                <div className="h-10 w-0.5 rounded-full bg-slate-600/40 group-hover:bg-indigo-400 transition-colors" />
              </div>

              <div className="h-full flex-1 overflow-hidden">
                {renderQuadrant('q4')}
              </div>
            </div>
          </div>
        )}

        {/* LAYOUT D: 'merge-left' (Fusionar Izquierda Q1 a lo alto + 2 Derecha Q2 & Q4) */}
        {layoutMode === 'merge-left' && (
          <div className="w-full h-full flex overflow-hidden">
            {/* Left Column: Merged Q1 spanning 100% full height */}
            <div className="h-full overflow-hidden" style={{ width: `${splitX}%` }}>
              {renderQuadrant('q1')}
            </div>

            {/* Vertical Divider X */}
            <div
              onMouseDown={handleXResizeStart}
              className="w-2 hover:w-2.5 cursor-col-resize z-30 flex items-center justify-center group bg-transparent hover:bg-indigo-500/20 rounded transition-all select-none"
              title="Arrastra para cambiar el ancho de la columna izquierda"
            >
              <div className="h-12 w-0.5 rounded-full bg-slate-600/40 group-hover:bg-indigo-400 transition-colors" />
            </div>

            {/* Right Column: Q2 (Top) and Q4 (Bottom) */}
            <div className="flex-1 h-full flex flex-col overflow-hidden">
              <div className="w-full overflow-hidden" style={{ height: `${splitY}%` }}>
                {renderQuadrant('q2')}
              </div>

              <div
                onMouseDown={handleYResizeStart}
                className="h-2 hover:h-2.5 cursor-row-resize z-30 flex items-center justify-center group bg-transparent hover:bg-indigo-500/20 rounded transition-all select-none"
              >
                <div className="w-12 h-0.5 rounded-full bg-slate-600/40 group-hover:bg-indigo-400 transition-colors" />
              </div>

              <div className="flex-1 w-full overflow-hidden">
                {renderQuadrant('q4')}
              </div>
            </div>
          </div>
        )}

        {/* LAYOUT E: 'merge-right' (2 Izquierda Q1 & Q3 + Fusionar Derecha Q2 a lo alto) */}
        {layoutMode === 'merge-right' && (
          <div className="w-full h-full flex overflow-hidden">
            {/* Left Column: Q1 (Top) and Q3 (Bottom) */}
            <div className="h-full flex flex-col overflow-hidden" style={{ width: `${splitX}%` }}>
              <div className="w-full overflow-hidden" style={{ height: `${splitY}%` }}>
                {renderQuadrant('q1')}
              </div>

              <div
                onMouseDown={handleYResizeStart}
                className="h-2 hover:h-2.5 cursor-row-resize z-30 flex items-center justify-center group bg-transparent hover:bg-indigo-500/20 rounded transition-all select-none"
              >
                <div className="w-12 h-0.5 rounded-full bg-slate-600/40 group-hover:bg-indigo-400 transition-colors" />
              </div>

              <div className="flex-1 w-full overflow-hidden">
                {renderQuadrant('q3')}
              </div>
            </div>

            {/* Vertical Divider X */}
            <div
              onMouseDown={handleXResizeStart}
              className="w-2 hover:w-2.5 cursor-col-resize z-30 flex items-center justify-center group bg-transparent hover:bg-indigo-500/20 rounded transition-all select-none"
            >
              <div className="h-12 w-0.5 rounded-full bg-slate-600/40 group-hover:bg-indigo-400 transition-colors" />
            </div>

            {/* Right Column: Merged Q2 spanning 100% full height */}
            <div className="flex-1 h-full overflow-hidden">
              {renderQuadrant('q2')}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
