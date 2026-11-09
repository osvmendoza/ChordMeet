import { Midi, Note, Key } from '@tonaljs/tonal';

// Key presets configuration: Exclusively 61 keys (C1 to C6)
export const KEYBOARD_CONFIGS = {
  61: {
    name: '61 teclas',
    startMidi: 36, // C1 (lowest C on 61-key piano)
    endMidi: 96,   // C6
    whiteKeysCount: 36
  }
};

// Available key signatures for notation
export const KEY_SIGNATURES = [
  { id: 'C', name: 'C Maj / A min', label: 'C (Natural)' },
  { id: 'G', name: 'G Maj / E min', label: 'G (1#)' },
  { id: 'D', name: 'D Maj / B min', label: 'D (2#)' },
  { id: 'A', name: 'A Maj / F# min', label: 'A (3#)' },
  { id: 'E', name: 'E Maj / C# min', label: 'E (4#)' },
  { id: 'B', name: 'B Maj / G# min', label: 'B (5#)' },
  { id: 'F#', name: 'F# Maj / D# min', label: 'F# (6#)' },
  { id: 'F', name: 'F Maj / D min', label: 'F (1b)' },
  { id: 'Bb', name: 'Bb Maj / G min', label: 'Bb (2b)' },
  { id: 'Eb', name: 'Eb Maj / C min', label: 'Eb (3b)' },
  { id: 'Ab', name: 'Ab Maj / F min', label: 'Ab (4b)' },
  { id: 'Db', name: 'Db Maj / Bb min', label: 'Db (5b)' }
];

// Key classifications
export const SHARP_KEYS = ['G', 'D', 'A', 'E', 'B', 'F#'];
export const FLAT_KEYS = ['C', 'F', 'Bb', 'Eb', 'Ab', 'Db'];

export const isSharpKey = (keySignature = 'C') => {
  return SHARP_KEYS.includes(keySignature);
};

// Pitch class sets
const SHARP_NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NOTE_NAMES  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Map MIDI number to harmonic note name adhering to active key signature
// Configured so that MIDI 36 (lowest key of 61-key keyboard) is C1
export const midiToHarmonicNoteName = (midiNumber, keySignature = 'C') => {
  const noteInOctave = ((midiNumber % 12) + 12) % 12;
  const octave = Math.floor(midiNumber / 12) - 2; // MIDI 36 = C1, MIDI 48 = C2, MIDI 60 = C3
  const isSharp = isSharpKey(keySignature);
  const pitchMap = isSharp ? SHARP_NOTE_NAMES : FLAT_NOTE_NAMES;
  let pitchClass = pitchMap[noteInOctave];
  if (keySignature === 'F#' && noteInOctave === 5) {
    pitchClass = 'E#';
  }
  return `${pitchClass}${octave}`;
};

// Enharmonic mapping tables for chord symbols
const ENHARMONIC_FLAT_TO_SHARP = {
  'Db': 'C#',
  'Eb': 'D#',
  'Gb': 'F#',
  'Ab': 'G#',
  'Bb': 'A#'
};

const ENHARMONIC_SHARP_TO_FLAT = {
  'C#': 'Db',
  'D#': 'Eb',
  'F#': 'Gb',
  'G#': 'Ab',
  'A#': 'Bb'
};

// Harmonize chord symbol roots and slash bass notes to match key signature
export const harmonizeChordSymbol = (chordStr, keySignature = 'C') => {
  if (!chordStr) return '';
  const isSharp = isSharpKey(keySignature);
  const map = isSharp ? ENHARMONIC_FLAT_TO_SHARP : ENHARMONIC_SHARP_TO_FLAT;

  return chordStr.replace(/^([A-G][b#]?)(.*?)(\s*\/\s*([A-G][b#]?))?$/, (match, root, quality, slashPart, bass) => {
    const harmonizedRoot = map[root] || root;
    const harmonizedBass = bass ? (map[bass] || bass) : '';
    return slashPart ? `${harmonizedRoot}${quality} / ${harmonizedBass}` : `${harmonizedRoot}${quality}`;
  });
};

// Get array of pitch classes in the scale of the active key signature
export const getScaleNotes = (keySignature = 'C') => {
  try {
    const major = Key.majorKey(keySignature);
    if (major && major.scale && major.scale.length > 0) {
      return major.scale;
    }
  } catch (e) {
    // fallback
  }
  return ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
};

// Color presets for active keys
export const COLOR_PRESETS = [
  { name: 'Azul Neón', value: '#38bdf8', glow: 'rgba(56, 189, 248, 0.6)' },
  { name: 'Esmeralda', value: '#10b981', glow: 'rgba(16, 185, 129, 0.6)' },
  { name: 'Púrpura Eléctrico', value: '#a855f7', glow: 'rgba(168, 85, 247, 0.6)' },
  { name: 'Rosa Neón', value: '#f43f5e', glow: 'rgba(244, 63, 94, 0.6)' },
  { name: 'Ámbar Cálido', value: '#f59e0b', glow: 'rgba(245, 158, 11, 0.6)' },
  { name: 'Cian', value: '#06b6d4', glow: 'rgba(6, 182, 212, 0.6)' }
];

// Determine if a MIDI note is black or white
export const isBlackKey = (midiNumber) => {
  const noteInOctave = ((midiNumber % 12) + 12) % 12;
  // 1=C#/Db, 3=D#/Eb, 6=F#/Gb, 8=G#/Ab, 10=A#/Bb
  return [1, 3, 6, 8, 10].includes(noteInOctave);
};

// Generate list of all keys in a range adapted to 61 keys (C1 to C6) and active key signature
export const generateKeysInRange = (startMidi = 36, endMidi = 96, keySignature = 'C') => {
  const keys = [];
  let whiteKeyIndex = 0;

  for (let midi = startMidi; midi <= endMidi; midi++) {
    const isBlack = isBlackKey(midi);
    const noteNameWithOctave = midiToHarmonicNoteName(midi, keySignature);
    const octave = Math.floor(midi / 12) - 2;
    const noteNameOnly = noteNameWithOctave.replace(/^-?\d+$/, '').replace(/-?\d+$/, '');
    const isC = ((midi % 12) + 12) % 12 === 0;
    const displayName = isC ? `C${octave}` : noteNameWithOctave;

    keys.push({
      midi,
      name: displayName,
      pitchClass: noteNameOnly,
      octave,
      isBlack,
      isC,
      whiteIndex: isBlack ? -1 : whiteKeyIndex
    });

    if (!isBlack) {
      whiteKeyIndex++;
    }
  }

  return { keys, totalWhiteKeys: whiteKeyIndex };
};

// Convert MIDI number to VexFlow note spec adhering to key signature
// Middle C (MIDI 60) is c/4 in VexFlow stave notation
export const midiToVexFlowSpec = (midiNumber, keySignature = 'C') => {
  const noteName = midiToHarmonicNoteName(midiNumber, keySignature);
  const parsed = Note.get(noteName);
  const letter = (parsed.letter || 'C').toLowerCase();
  const acc = parsed.acc || '';
  const vexOctave = Math.floor(midiNumber / 12) - 1;

  // Key in VexFlow format: "c#/4" or "b/3"
  const vexKey = `${letter}${acc}/${vexOctave}`;
  return {
    midi: midiNumber,
    vexKey,
    letter,
    acc,
    oct: vexOctave,
    clef: midiNumber >= 60 ? 'treble' : 'bass' // C4 (60) and above on treble, below on bass
  };
};
