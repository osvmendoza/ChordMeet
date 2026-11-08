import { useState, useEffect, useRef, useCallback } from 'react';
import { synth } from '../utils/audioSynth';

export function useWebMidi({ 
  playAudio = true, 
  holdNotesWithSustain = true,
  defaultChannel = '1', // '1', 'all', '2'..'16'
  defaultDecayTime = 4.0 // Natural acoustic piano decay time in seconds while pedal is held
} = {}) {
  const [activeNotes, setActiveNotes] = useState([]); // MIDI numbers currently held down physically by fingers
  const [sustainedNotes, setSustainedNotes] = useState([]); // Notes resonating via sustain pedal after key release
  const [sustainPedal, setSustainPedal] = useState(false);
  const [sustainValue, setSustainValue] = useState(0);
  const [inputs, setInputs] = useState([]);
  const [selectedInputId, setSelectedInputId] = useState('all');
  const [selectedChannel, setSelectedChannel] = useState(defaultChannel); // Filter by channel
  const [sustainDecayTime, setSustainDecayTime] = useState(defaultDecayTime); // User configurable natural resonance duration
  const [sustainedNoteDurations, setSustainedNoteDurations] = useState({}); // Remaining seconds per sustained note
  const [invertPedalPolarity, setInvertPedalPolarity] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState(null);

  // References to keep latest states in MIDI callback closures
  const activeNotesRef = useRef(new Set());
  const sustainedNotesRef = useRef(new Set());
  const sustainPedalRef = useRef(false);
  const playAudioRef = useRef(playAudio);
  const holdNotesWithSustainRef = useRef(holdNotesWithSustain);
  const selectedChannelRef = useRef(selectedChannel);
  const sustainDecayTimeRef = useRef(sustainDecayTime);
  const sustainedNoteDurationsRef = useRef(new Map());
  const invertPedalPolarityRef = useRef(invertPedalPolarity);
  const midiAccessRef = useRef(null);

  // Chronological tracking of note onsets and individual decay timeouts
  const noteOnTimestampsRef = useRef(new Map());
  const noteDecayTimeoutsRef = useRef(new Map());

  useEffect(() => {
    playAudioRef.current = playAudio;
    synth.setEnabled(playAudio);
  }, [playAudio]);

  useEffect(() => {
    holdNotesWithSustainRef.current = holdNotesWithSustain;
  }, [holdNotesWithSustain]);

  useEffect(() => {
    selectedChannelRef.current = selectedChannel;
  }, [selectedChannel]);

  useEffect(() => {
    sustainDecayTimeRef.current = sustainDecayTime;
  }, [sustainDecayTime]);

  useEffect(() => {
    invertPedalPolarityRef.current = invertPedalPolarity;
  }, [invertPedalPolarity]);

  // Cleanup all pending decay timeouts on unmount
  useEffect(() => {
    return () => {
      noteDecayTimeoutsRef.current.forEach((t) => clearTimeout(t));
      noteDecayTimeoutsRef.current.clear();
    };
  }, []);

  // Synchronize state from sets
  const syncActiveNotesState = useCallback(() => {
    setActiveNotes(Array.from(activeNotesRef.current).sort((a, b) => a - b));
    setSustainedNotes(Array.from(sustainedNotesRef.current).sort((a, b) => a - b));
  }, []);

  // Direct programmatic Note On (for mouse, touch or MIDI key press)
  const triggerNoteOn = useCallback((midi, velocity = 0.8) => {
    // If this note already had a scheduled natural decay timeout, cancel it
    if (noteDecayTimeoutsRef.current.has(midi)) {
      clearTimeout(noteDecayTimeoutsRef.current.get(midi));
      noteDecayTimeoutsRef.current.delete(midi);
    }
    if (sustainedNoteDurationsRef.current.has(midi)) {
      sustainedNoteDurationsRef.current.delete(midi);
      setSustainedNoteDurations(Object.fromEntries(sustainedNoteDurationsRef.current));
    }

    activeNotesRef.current.add(midi);
    sustainedNotesRef.current.delete(midi);
    // Record exact chronological onset time of hammer strike
    noteOnTimestampsRef.current.set(midi, performance.now());
    syncActiveNotesState();

    if (playAudioRef.current) {
      synth.noteOn(midi, velocity, sustainDecayTimeRef.current);
    }
  }, [syncActiveNotesState]);

  // Direct programmatic Note Off (finger lifted from key)
  const triggerNoteOff = useCallback((midi) => {
    activeNotesRef.current.delete(midi);

    // If sustain pedal is currently pressed down:
    if (sustainPedalRef.current && holdNotesWithSustainRef.current) {
      sustainedNotesRef.current.add(midi);

      const decaySetting = sustainDecayTimeRef.current;

      // If user selected finite decay (e.g. 2s, 3.5s, 5s, 8s):
      if (decaySetting > 0 && decaySetting < 999) {
        const totalDecayMs = decaySetting * 1000;
        const strikeTime = noteOnTimestampsRef.current.get(midi) || performance.now();
        const elapsedSinceStrike = performance.now() - strikeTime;
        // Remaining time before this vibrating string naturally extinguishes
        const remainingRingMs = Math.max(300, Math.round(totalDecayMs - elapsedSinceStrike));
        const remainingSec = Math.max(0.3, Number((remainingRingMs / 1000).toFixed(2)));

        sustainedNoteDurationsRef.current.set(midi, remainingSec);
        setSustainedNoteDurations(Object.fromEntries(sustainedNoteDurationsRef.current));

        // Cancel any prior timeout for this note
        if (noteDecayTimeoutsRef.current.has(midi)) {
          clearTimeout(noteDecayTimeoutsRef.current.get(midi));
        }

        // Schedule individual natural extinction for this note while pedal remains pressed
        const timeoutId = setTimeout(() => {
          // If note is still not being pressed physically by a finger:
          if (!activeNotesRef.current.has(midi)) {
            sustainedNotesRef.current.delete(midi);
            noteDecayTimeoutsRef.current.delete(midi);
            noteOnTimestampsRef.current.delete(midi);
            sustainedNoteDurationsRef.current.delete(midi);
            setSustainedNoteDurations(Object.fromEntries(sustainedNoteDurationsRef.current));

            if (playAudioRef.current) {
              synth.noteOff(midi);
            }
            syncActiveNotesState();
          }
        }, remainingRingMs);

        noteDecayTimeoutsRef.current.set(midi, timeoutId);
      }
      // If decaySetting >= 999 (Infinite): note rings until pedal is explicitly released
    } else {
      // Pedal is NOT pressed: note cuts off immediately
      if (noteDecayTimeoutsRef.current.has(midi)) {
        clearTimeout(noteDecayTimeoutsRef.current.get(midi));
        noteDecayTimeoutsRef.current.delete(midi);
      }
      sustainedNoteDurationsRef.current.delete(midi);
      setSustainedNoteDurations(Object.fromEntries(sustainedNoteDurationsRef.current));
      noteOnTimestampsRef.current.delete(midi);

      if (playAudioRef.current) {
        synth.noteOff(midi);
      }
    }

    syncActiveNotesState();
  }, [syncActiveNotesState]);

  // Handle sustain pedal state changes
  const handleSustainChange = useCallback((value) => {
    const isInverted = invertPedalPolarityRef.current;
    const isEngaged = isInverted ? value < 64 : value >= 64;
    setSustainValue(value);
    setSustainPedal(isEngaged);
    sustainPedalRef.current = isEngaged;

    if (!isEngaged) {
      // PEDAL RELEASED: Dampers drop immediately!
      // Cancel all pending decay timeouts
      noteDecayTimeoutsRef.current.forEach((t) => clearTimeout(t));
      noteDecayTimeoutsRef.current.clear();
      sustainedNoteDurationsRef.current.clear();
      setSustainedNoteDurations({});

      // Extinguish all sustained notes that are not physically held down by fingers
      sustainedNotesRef.current.forEach((midi) => {
        if (!activeNotesRef.current.has(midi)) {
          noteOnTimestampsRef.current.delete(midi);
          if (playAudioRef.current) {
            synth.noteOff(midi);
          }
        }
      });

      sustainedNotesRef.current.clear();
      syncActiveNotesState();
    }
  }, [syncActiveNotesState]);

  // Process incoming raw Web MIDI message
  const handleMidiMessage = useCallback((event) => {
    const [statusByte, data1, data2] = event.data;
    const command = statusByte >> 4;
    const messageChannel = (statusByte & 0x0f) + 1; // MIDI channel (1 to 16)

    // Filter by MIDI Channel if not 'all'
    if (selectedChannelRef.current !== 'all' && messageChannel !== Number(selectedChannelRef.current)) {
      return; // Ignore messages from other channels
    }

    // 0x9 = Note On
    if (command === 0x9) {
      const midiNote = data1;
      const velocity = data2;

      if (velocity > 0) {
        triggerNoteOn(midiNote, velocity / 127);
      } else {
        // Velocity 0 is Note Off
        triggerNoteOff(midiNote);
      }
    }
    // 0x8 = Note Off
    else if (command === 0x8) {
      const midiNote = data1;
      triggerNoteOff(midiNote);
    }
    // 0xB = Control Change (CC)
    else if (command === 0xb) {
      const controller = data1;
      const value = data2;

      // CC 64 = Damper / Sustain pedal
      if (controller === 64) {
        handleSustainChange(value);
      }
    }
  }, [triggerNoteOn, triggerNoteOff, handleSustainChange]);

  // Update MIDI inputs list
  const updateInputsList = useCallback((midiAccess) => {
    const availableInputs = [];
    midiAccess.inputs.forEach((input) => {
      availableInputs.push({
        id: input.id,
        name: input.name || `Dispositivo MIDI (${input.id})`,
        manufacturer: input.manufacturer || 'Desconocido',
        state: input.state
      });
    });
    setInputs(availableInputs);
  }, []);

  // Attach message listeners to inputs
  const bindInputListeners = useCallback((midiAccess, selectedId) => {
    midiAccess.inputs.forEach((input) => {
      if (selectedId === 'all' || input.id === selectedId) {
        input.onmidimessage = handleMidiMessage;
      } else {
        input.onmidimessage = null;
      }
    });
  }, [handleMidiMessage]);

  // Initialize Web MIDI API
  useEffect(() => {
    if (!navigator.requestMIDIAccess) {
      setIsSupported(false);
      setError('Web MIDI API no soportada en este navegador. Te recomendamos Google Chrome, Edge, Brave u Opera.');
      return;
    }

    navigator.requestMIDIAccess({ sysex: false })
      .then((midiAccess) => {
        midiAccessRef.current = midiAccess;
        setIsSupported(true);
        setError(null);
        updateInputsList(midiAccess);
        bindInputListeners(midiAccess, selectedInputId);

        // Listen for device connects / disconnects
        midiAccess.onstatechange = () => {
          updateInputsList(midiAccess);
          bindInputListeners(midiAccess, selectedInputId);
        };
      })
      .catch((err) => {
        console.error('Error al solicitar acceso MIDI:', err);
        setError('No se pudo acceder a los dispositivos MIDI.');
      });

    return () => {
      if (midiAccessRef.current) {
        midiAccessRef.current.inputs.forEach((input) => {
          input.onmidimessage = null;
        });
        midiAccessRef.current.onstatechange = null;
      }
    };
  }, [updateInputsList, bindInputListeners, selectedInputId]);

  // Rebind when selectedInputId changes
  useEffect(() => {
    if (midiAccessRef.current) {
      bindInputListeners(midiAccessRef.current, selectedInputId);
    }
  }, [selectedInputId, bindInputListeners]);

  // Clear all pressed notes helper
  const clearAllNotes = useCallback(() => {
    noteDecayTimeoutsRef.current.forEach((t) => clearTimeout(t));
    noteDecayTimeoutsRef.current.clear();
    sustainedNoteDurationsRef.current.clear();
    setSustainedNoteDurations({});
    activeNotesRef.current.clear();
    sustainedNotesRef.current.clear();
    noteOnTimestampsRef.current.clear();
    syncActiveNotesState();
    synth.stopAll();
  }, [syncActiveNotesState]);

  // Combined notes for visual display: physically pressed + sustained
  const allAudibleNotes = Array.from(
    new Set([...activeNotes, ...sustainedNotes])
  ).sort((a, b) => a - b);

  return {
    activeNotes,
    sustainedNotes,
    sustainedNoteDurations, // { [midi]: remainingSeconds }
    allAudibleNotes,
    sustainPedal,
    sustainValue,
    inputs,
    selectedInputId,
    setSelectedInputId,
    selectedChannel,        // Current channel: '1', 'all', '2'..'16'
    setSelectedChannel,     // Function to switch channel
    sustainDecayTime,       // Natural acoustic decay time in seconds while pedal is held
    setSustainDecayTime,    // Function to set decay time
    invertPedalPolarity,
    setInvertPedalPolarity, // Function to invert pedal polarity
    isSupported,
    error,
    triggerNoteOn,
    triggerNoteOff,
    handleSustainChange,
    clearAllNotes
  };
}
