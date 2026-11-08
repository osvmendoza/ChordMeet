import React, { useMemo } from 'react';
import { Chord, Midi, Note } from '@tonaljs/tonal';
import { Music2, Layers, Sparkles } from 'lucide-react';

export default function ChordDisplay({ activeNotes = [], accentColor = '#38bdf8' }) {
  // Analyze notes using Tonal.js
  const analysis = useMemo(() => {
    if (!activeNotes || activeNotes.length === 0) {
      return {
        type: 'empty',
        chordName: null,
        notes: [],
        bassNote: null,
        intervals: [],
        alternatives: []
      };
    }

    // Convert MIDI numbers to note names with octave (e.g. ["C4", "E4", "G4"])
    const noteNamesWithOctave = activeNotes.map((midi) =>
      Midi.midiToNoteName(midi, { pitchClass: true })
    );

    // Note pitch classes without octave (e.g. ["C", "E", "G"])
    const pitchClasses = noteNamesWithOctave.map((name) =>
      Note.pitchClass(name)
    );

    // Unique pitch classes
    const uniquePitchClasses = Array.from(new Set(pitchClasses));

    // Bass note is the lowest played note
    const lowestMidi = activeNotes[0];
    const bassNoteName = Midi.midiToNoteName(lowestMidi, { pitchClass: true });
    const bassPitchClass = Note.pitchClass(bassNoteName);

    // Single note played
    if (activeNotes.length === 1) {
      const noteName = noteNamesWithOctave[0];
      const parsed = Note.get(noteName);
      return {
        type: 'single-note',
        chordName: noteName,
        noteDetail: `${parsed.letter}${parsed.acc || ''} en octava ${parsed.oct}`,
        notes: noteNamesWithOctave,
        bassNote: bassNoteName,
        intervals: ['Tónica'],
        alternatives: []
      };
    }

    // Detect chords with Tonal
    const detectedChords = Chord.detect(uniquePitchClasses);

    // Check if lowest note is different from chord root (slash chord)
    let primaryChord = detectedChords[0] || null;
    let alternatives = detectedChords.slice(1);

    if (primaryChord) {
      const chordInfo = Chord.get(primaryChord);
      // If bass note is not the root of the detected chord, format as slash chord
      if (chordInfo.tonic && chordInfo.tonic !== bassPitchClass) {
        primaryChord = `${primaryChord} / ${bassPitchClass}`;
      }

      return {
        type: 'chord',
        chordName: primaryChord,
        rawChord: detectedChords[0],
        notes: noteNamesWithOctave,
        bassNote: bassPitchClass,
        intervals: chordInfo.intervals || [],
        alternatives: alternatives.slice(0, 3)
      };
    }

    // Interval or cluster (2 notes that don't form a known triad yet, e.g. 5th, octaves)
    if (activeNotes.length === 2) {
      const semitones = Math.abs(activeNotes[1] - activeNotes[0]);
      const intervalNames = {
        0: 'Unísono',
        1: 'Segunda Menor',
        2: 'Segunda Mayor',
        3: 'Tercera Menor',
        4: 'Tercera Mayor',
        5: 'Cuarta Justa',
        6: 'Tritono',
        7: 'Quinta Justa',
        8: 'Sexta Menor',
        9: 'Sexta Mayor',
        10: 'Séptima Menor',
        11: 'Séptima Mayor',
        12: 'Octava'
      };
      const intervalName = intervalNames[semitones % 12] || 'Intervalo';
      return {
        type: 'interval',
        chordName: `${pitchClasses[0]} - ${pitchClasses[1]}`,
        subtitle: intervalName,
        notes: noteNamesWithOctave,
        bassNote: bassPitchClass,
        intervals: [],
        alternatives: []
      };
    }

    // Unidentified cluster
    return {
      type: 'unknown',
      chordName: pitchClasses.join(' - '),
      subtitle: 'Acorde / Grupo de notas',
      notes: noteNamesWithOctave,
      bassNote: bassPitchClass,
      intervals: [],
      alternatives: []
    };
  }, [activeNotes]);

  return (
    <div className="flex flex-col h-full bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800/80 p-5 shadow-xl transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div 
            className="w-2.5 h-2.5 rounded-full animate-pulse"
            style={{ backgroundColor: accentColor }}
          />
          <h2 className="text-xs uppercase tracking-wider font-semibold text-slate-400">
            Detector Armónico
          </h2>
        </div>
        <span className="text-xs font-mono text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-md">
          {activeNotes.length} {activeNotes.length === 1 ? 'nota activa' : 'notas activas'}
        </span>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center items-center py-6 text-center">
        {analysis.type === 'empty' ? (
          <div className="flex flex-col items-center justify-center text-slate-500 py-4">
            <Music2 className="w-12 h-12 mb-3 stroke-[1.5] opacity-40 animate-pulse" />
            <p className="text-sm font-medium text-slate-400">Esperando notas MIDI...</p>
            <p className="text-xs text-slate-600 mt-1 max-w-xs">
              Toca notas en tu teclado o haz clic en las teclas del piano para ver el acorde
            </p>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center">
            {/* Chord Name / Main Title */}
            <div className="relative inline-block mb-2">
              <h1 
                className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight font-mono transition-all duration-150 drop-shadow-md"
                style={{ 
                  color: '#ffffff',
                  textShadow: `0 0 20px ${accentColor}88, 0 0 40px ${accentColor}44`
                }}
              >
                {analysis.chordName}
              </h1>
            </div>

            {/* Subtitle / Interval description */}
            {analysis.subtitle && (
              <span className="text-sm font-medium text-slate-400 mt-1">
                {analysis.subtitle}
              </span>
            )}
            {analysis.noteDetail && (
              <span className="text-sm font-medium text-slate-400 mt-1">
                {analysis.noteDetail}
              </span>
            )}

            {/* Active Notes Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4 max-w-md">
              {analysis.notes.map((n, idx) => {
                const isBass = idx === 0 && analysis.notes.length > 1;
                return (
                  <span
                    key={`${n}-${idx}`}
                    className={`px-3 py-1 text-xs font-mono font-bold rounded-lg border transition-all duration-150 ${
                      isBass
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                        : 'bg-slate-800 text-slate-200 border-slate-700'
                    }`}
                  >
                    {n}
                    {isBass && <span className="text-[10px] ml-1 opacity-75 font-normal">(Bajo)</span>}
                  </span>
                );
              })}
            </div>

            {/* Alternative interpretations if any */}
            {analysis.alternatives.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-800/60 w-full flex items-center justify-center gap-2 text-xs text-slate-400">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                <span>Otras lecturas:</span>
                <div className="flex gap-1.5 flex-wrap">
                  {analysis.alternatives.map((alt, i) => (
                    <span 
                      key={i} 
                      className="bg-slate-800/80 hover:bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono border border-slate-700/50"
                    >
                      {alt}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          Motor armónico: Tonal.js
        </span>
        {analysis.bassNote && (
          <span className="font-mono text-slate-400">
            Bajo fundamental: <strong className="text-slate-200">{analysis.bassNote}</strong>
          </span>
        )}
      </div>
    </div>
  );
}
