import { Midi, Note } from '@tonaljs/tonal';

// Key presets configuration
export const KEYBOARD_CONFIGS = {
  25: {
    name: '25 teclas',
    startMidi: 48, // C3
    endMidi: 72,   // C5
    whiteKeysCount: 15
  },
  49: {
    name: '49 teclas',
    startMidi: 36, // C2
    endMidi: 84,   // C6
    whiteKeysCount: 29
  },
  61: {
    name: '61 teclas',
    startMidi: 36, // C2
    endMidi: 96,   // C7
    whiteKeysCount: 36
  },
  76: {
    name: '76 teclas',
    startMidi: 28, // E1
    endMidi: 103,  // G7
    whiteKeysCount: 45
  },
  88: {
    name: '88 teclas',
    startMidi: 21, // A0
    endMidi: 108,  // C8
    whiteKeysCount: 52
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
  const noteInOctave = midiNumber % 12;
  // 1=C#, 3=D#, 6=F#, 8=G#, 10=A#
  return [1, 3, 6, 8, 10].includes(noteInOctave);
};

// Generate list of all keys in a range
export const generateKeysInRange = (startMidi, endMidi) => {
  const keys = [];
  let whiteKeyIndex = 0;

  for (let midi = startMidi; midi <= endMidi; midi++) {
    const isBlack = isBlackKey(midi);
    // Midi.midiToNoteName(midi) gives "C1", "C2", "C3", "C4", "D#4", etc.
    const noteNameWithOctave = Midi.midiToNoteName(midi);
    const octave = Math.floor(midi / 12) - 1;
    const noteNameOnly = noteNameWithOctave.replace(/\d+/, '');
    const isC = noteNameOnly === 'C';
    // Display C with its octave, e.g. "C1", "C2", "C3", "C4", "C5"...
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

// Convert MIDI number to VexFlow note spec
export const midiToVexFlowSpec = (midiNumber, keySignature = 'C') => {
  const noteName = Midi.midiToNoteName(midiNumber);
  const parsed = Note.get(noteName);
  const letter = (parsed.letter || 'C').toLowerCase();
  const acc = parsed.acc || '';
  const oct = parsed.oct !== undefined ? parsed.oct : Math.floor(midiNumber / 12) - 1;

  // Key in VexFlow format: "c#/4" or "b/3"
  const vexKey = `${letter}${acc}/${oct}`;
  return {
    midi: midiNumber,
    vexKey,
    letter,
    acc,
    oct,
    clef: midiNumber >= 60 ? 'treble' : 'bass' // C4 (60) and above on treble, below on bass
  };
};
