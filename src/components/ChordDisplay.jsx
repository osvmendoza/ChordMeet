import React, { useMemo } from 'react';
import { Chord, Midi, Note } from '@tonaljs/tonal';
import { Music2, Layers, Sparkles } from 'lucide-react';

export default function ChordDisplay({ 
  activeNotes = [], 
  accentColor = '#38bdf8',
  theme = null
}) {
  const cardBg = theme?.cardBg || 'bg-slate-900/90 border-slate-800/80 text-slate-100 shadow-xl';
  const cardHeaderBorder = theme?.cardHeaderBorder || 'border-slate-800';
  const subText = theme?.subText || 'text-slate-400';
  const badgeBg = theme?.badgeBg || 'bg-slate-800 text-slate-200 border-slate-700';
  const isLight = theme?.mode === 'light';

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

    const uniquePitchClasses = Array.from(new Set(pitchClasses));
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

    // Interval (2 notes)
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
      subtitle: 'Grupo de notas simultáneas',
      notes: noteNamesWithOctave,
      bassNote: bassPitchClass,
      intervals: [],
      alternatives: []
    };
  }, [activeNotes]);

  return (
    <div className={`flex flex-col h-full rounded-2xl border p-5 transition-all duration-300 ${cardBg}`}>
      {/* Header */}
      <div className={`flex items-center justify-between pb-3 border-b ${cardHeaderBorder}`}>
        <div className="flex items-center gap-2">
          <div 
            className="w-2.5 h-2.5 rounded-full animate-pulse"
            style={{ backgroundColor: accentColor }}
          />
          <h2 className={`text-xs uppercase tracking-wider font-semibold ${subText}`}>
            Detector Armónico
          </h2>
        </div>
        <span 
          className="text-xs font-mono px-2 py-0.5 rounded-md border"
          style={{ borderColor: `${accentColor}40`, color: accentColor }}
        >
          {activeNotes.length} {activeNotes.length === 1 ? 'nota activa' : 'notas activas'}
        </span>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center items-center py-6 text-center">
        {analysis.type === 'empty' ? (
          <div className="flex flex-col items-center justify-center py-4">
            <Music2 className={`w-12 h-12 mb-3 stroke-[1.5] opacity-40 animate-pulse ${subText}`} />
            <p className="text-sm font-medium opacity-80">Esperando notas MIDI...</p>
            <p className={`text-xs mt-1 max-w-xs ${subText}`}>
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
                  color: isLight ? '#0f172a' : '#ffffff',
                  textShadow: `0 0 20px ${accentColor}88, 0 0 35px ${accentColor}44`
                }}
              >
                {analysis.chordName}
              </h1>
            </div>

            {/* Subtitle / Interval description */}
            {analysis.subtitle && (
              <span className={`text-sm font-medium mt-1 ${subText}`}>
                {analysis.subtitle}
              </span>
            )}
            {analysis.noteDetail && (
              <span className={`text-sm font-medium mt-1 ${subText}`}>
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
                        ? 'bg-amber-500/20 text-amber-500 border-amber-500/50 shadow-sm'
                        : badgeBg
                    }`}
                  >
                    {n}
                    {isBass && <span className="text-[10px] ml-1 opacity-80 font-normal">(Bajo)</span>}
                  </span>
                );
              })}
            </div>

            {/* Alternative interpretations if any */}
            {analysis.alternatives.length > 0 && (
              <div className={`mt-4 pt-3 border-t ${cardHeaderBorder} w-full flex items-center justify-center gap-2 text-xs ${subText}`}>
                <Layers className="w-3.5 h-3.5 opacity-60" />
                <span>Otras lecturas:</span>
                <div className="flex gap-1.5 flex-wrap">
                  {analysis.alternatives.map((alt, i) => (
                    <span 
                      key={i} 
                      className={`px-2 py-0.5 rounded font-mono border ${badgeBg}`}
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
      <div className={`pt-3 border-t ${cardHeaderBorder} flex items-center justify-between text-[11px] ${subText}`}>
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" style={{ color: accentColor }} />
          Motor armónico: Tonal.js
        </span>
        {analysis.bassNote && (
          <span className="font-mono">
            Bajo fundamental: <strong className="opacity-100 font-bold">{analysis.bassNote}</strong>
          </span>
        )}
      </div>
    </div>
  );
}
