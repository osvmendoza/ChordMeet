import React, { useMemo } from 'react';
import { Chord, Note } from '@tonaljs/tonal';
import { Music2, Layers } from 'lucide-react';
import { midiToHarmonicNoteName, harmonizeChordSymbol } from '../utils/musicHelpers';

// Format chord symbols: Eliminate "M" for major triads (e.g. "EM" -> "E", "CM" -> "C", "F#M" -> "F#")
export const formatChordSymbol = (chordStr) => {
  if (!chordStr) return '';
  const parts = chordStr.split(' / ');
  const cleanMain = parts[0].replace(/^([A-G][b#]?)M$/, '$1');
  return parts.length > 1 ? `${cleanMain} / ${parts[1]}` : cleanMain;
};

export default function ChordDisplay({ 
  activeNotes = [], 
  keySignature = 'C',
  accentColor = '#38bdf8',
  theme = null
}) {
  const badgeBg = theme?.badgeBg || 'bg-slate-800 text-slate-200 border-slate-700';
  const subText = theme?.subText || 'text-slate-400';
  const isLight = theme?.mode === 'light';

  // Analyze notes using Tonal.js with harmonic context of keySignature
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

    // Convert MIDI numbers to note names with full octave using keySignature enharmonics
    const noteNamesWithOctave = activeNotes.map((midi) =>
      midiToHarmonicNoteName(midi, keySignature)
    );

    // Note pitch classes without octave (e.g. ["C#", "F", "G#", "B"])
    const pitchClasses = noteNamesWithOctave.map((name) =>
      name.replace(/\d+/, '')
    );

    const uniquePitchClasses = Array.from(new Set(pitchClasses));
    const lowestMidi = activeNotes[0];
    const bassNoteName = midiToHarmonicNoteName(lowestMidi, keySignature);
    const bassPitchClass = bassNoteName.replace(/\d+/, '');

    // Single note played
    if (activeNotes.length === 1) {
      const noteName = noteNamesWithOctave[0]; // e.g. "C#3"
      const parsed = Note.get(noteName);
      const oct = parsed.oct !== undefined ? parsed.oct : (Math.floor(activeNotes[0] / 12) - 1);
      return {
        type: 'single-note',
        chordName: noteName,
        noteDetail: `Nota ${parsed.letter}${parsed.acc || ''} • Octava ${oct}`,
        notes: [noteName],
        bassNote: noteName,
        intervals: ['Tónica'],
        alternatives: []
      };
    }

    // Detect chords with Tonal
    const detectedChords = Chord.detect(uniquePitchClasses);
    let rawPrimaryChord = detectedChords[0] || null;
    let alternatives = detectedChords.slice(1);

    if (rawPrimaryChord) {
      const chordInfo = Chord.get(rawPrimaryChord);
      let formattedPrimary = formatChordSymbol(rawPrimaryChord);
      formattedPrimary = harmonizeChordSymbol(formattedPrimary, keySignature);

      // Check if bass note is not the root of the detected chord
      const harmonizedTonic = chordInfo.tonic ? harmonizeChordSymbol(chordInfo.tonic, keySignature) : null;
      if (harmonizedTonic && harmonizedTonic !== bassPitchClass) {
        formattedPrimary = `${formattedPrimary} / ${bassPitchClass}`;
      }

      return {
        type: 'chord',
        chordName: formattedPrimary,
        rawChord: rawPrimaryChord,
        notes: noteNamesWithOctave,
        bassNote: bassPitchClass,
        intervals: chordInfo.intervals || [],
        alternatives: alternatives.slice(0, 3).map((a) => harmonizeChordSymbol(formatChordSymbol(a), keySignature))
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
  }, [activeNotes, keySignature]);

  return (
    <div className="w-full h-full flex flex-col justify-center items-center p-3 select-none overflow-hidden relative">
      {analysis.type === 'empty' ? (
        <div className="flex flex-col items-center justify-center py-2 text-center animate-fade-in">
          <Music2 className={`w-10 h-10 sm:w-12 sm:h-12 mb-2 stroke-[1.5] opacity-30 animate-pulse ${subText}`} />
          <p className="text-sm sm:text-base font-semibold opacity-70">Esperando notas MIDI...</p>
          <p className={`text-xs mt-1 max-w-xs ${subText} opacity-50`}>
            Toca notas en tu teclado para analizar acordes
          </p>
        </div>
      ) : (
        <div className="w-full h-full flex flex-col justify-center items-center text-center gap-1.5 sm:gap-2.5 py-1">
          {/* Main Chord Name - Fluid scaling to fit any zoom or container size */}
          <div className="relative inline-block max-w-full">
            <h1 
              className="font-black tracking-tight font-mono transition-all duration-150 drop-shadow-md select-none truncate"
              style={{ 
                color: isLight ? '#0f172a' : '#ffffff',
                textShadow: `0 0 20px ${accentColor}88, 0 0 40px ${accentColor}44`,
                fontSize: 'clamp(2.5rem, min(8vw, 13vh), 5.5rem)',
                lineHeight: 1.1
              }}
            >
              {analysis.chordName}
            </h1>
          </div>

          {/* Subtitle / Interval description */}
          {(analysis.subtitle || analysis.noteDetail) && (
            <span className={`text-xs sm:text-sm font-medium tracking-wide ${subText} opacity-80`}>
              {analysis.subtitle || analysis.noteDetail}
            </span>
          )}

          {/* Active Notes Badges */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 max-w-md mt-0.5">
            {analysis.notes.map((n, idx) => {
              const isBass = idx === 0 && analysis.notes.length > 1;
              return (
                <span
                  key={`${n}-${idx}`}
                  className={`px-2.5 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm font-mono font-bold rounded-lg border transition-all shadow-sm ${
                    isBass
                      ? 'bg-amber-500/20 text-amber-500 border-amber-500/50'
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
            <div className={`mt-1 flex items-center justify-center gap-1.5 text-xs ${subText} opacity-70 flex-wrap`}>
              <Layers className="w-3 h-3 opacity-60" />
              <span className="text-[11px]">Otras:</span>
              <div className="flex gap-1 flex-wrap">
                {analysis.alternatives.map((alt, i) => (
                  <span 
                    key={i} 
                    className={`px-2 py-0.5 rounded font-mono text-[11px] border ${badgeBg}`}
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
  );
}
