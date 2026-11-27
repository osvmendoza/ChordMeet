import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Square, Circle, Repeat, Trash2, Clock, Volume2 } from 'lucide-react';

export default function MidiRecorder({
  activeNotes = [],
  onTriggerNoteOn,
  onTriggerNoteOff,
  accentColor = '#00fff2',
  theme = null
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [recordedEvents, setRecordedEvents] = useState([]);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [playbackProgress, setPlaybackProgress] = useState(0);

  const startTimeRef = useRef(null);
  const eventsRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const playbackTimeoutsRef = useRef([]);
  const loopTimeoutRef = useRef(null);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (!isRecording) return;
    setIsRecording(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    const totalDuration = Math.max(500, Date.now() - startTimeRef.current);
    setRecordingDuration(totalDuration);
    setRecordedEvents([...eventsRef.current]);
  }, [isRecording]);

  // Start recording
  const startRecording = () => {
    stopPlayback();
    eventsRef.current = [];
    setRecordedEvents([]);
    setIsRecording(true);
    setRecordingDuration(0);
    setPlaybackProgress(0);
    startTimeRef.current = Date.now();

    timerIntervalRef.current = setInterval(() => {
      setRecordingDuration(Date.now() - startTimeRef.current);
    }, 100);
  };

  // Record active notes while recording
  const prevNotesRef = useRef(new Set());
  useEffect(() => {
    if (!isRecording || !startTimeRef.current) return;

    const currentNotes = new Set(activeNotes);
    const timeOffset = Date.now() - startTimeRef.current;

    // Detect Note Ons
    for (const midi of currentNotes) {
      if (!prevNotesRef.current.has(midi)) {
        eventsRef.current.push({
          type: 'on',
          midi,
          velocity: 0.85,
          time: timeOffset
        });
      }
    }

    // Detect Note Offs
    for (const midi of prevNotesRef.current) {
      if (!currentNotes.has(midi)) {
        eventsRef.current.push({
          type: 'off',
          midi,
          time: timeOffset
        });
      }
    }

    prevNotesRef.current = currentNotes;
  }, [activeNotes, isRecording]);

  // Stop Playback
  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    setPlaybackProgress(0);
    playbackTimeoutsRef.current.forEach((t) => clearTimeout(t));
    playbackTimeoutsRef.current = [];
    if (loopTimeoutRef.current) clearTimeout(loopTimeoutRef.current);

    // Release any lingering notes
    if (recordedEvents.length > 0) {
      recordedEvents.forEach((ev) => {
        if (ev.type === 'on') onTriggerNoteOff(ev.midi);
      });
    }
  }, [onTriggerNoteOff, recordedEvents]);

  // Playback recorded events
  const startPlayback = useCallback(() => {
    if (recordedEvents.length === 0 || isRecording) return;

    stopPlayback();
    setIsPlaying(true);
    const playbackStart = performance.now();
    const duration = recordingDuration || 1000;

    // Schedule note on/offs
    recordedEvents.forEach((ev) => {
      const timeout = setTimeout(() => {
        if (ev.type === 'on') {
          onTriggerNoteOn(ev.midi, ev.velocity || 0.85);
        } else {
          onTriggerNoteOff(ev.midi);
        }
      }, ev.time);
      playbackTimeoutsRef.current.push(timeout);
    });

    // Animate progress bar
    const progressInterval = setInterval(() => {
      const elapsed = performance.now() - playbackStart;
      const progress = Math.min(100, (elapsed / duration) * 100);
      setPlaybackProgress(progress);

      if (elapsed >= duration) {
        clearInterval(progressInterval);
      }
    }, 50);
    playbackTimeoutsRef.current.push(progressInterval);

    // Handle end of playback / loop
    const finishTimeout = setTimeout(() => {
      clearInterval(progressInterval);
      if (isLooping) {
        startPlayback();
      } else {
        stopPlayback();
      }
    }, duration + 100);
    loopTimeoutRef.current = finishTimeout;
  }, [recordedEvents, isRecording, recordingDuration, isLooping, onTriggerNoteOn, onTriggerNoteOff, stopPlayback]);

  // Clear recording
  const clearRecording = () => {
    stopPlayback();
    setRecordedEvents([]);
    eventsRef.current = [];
    setRecordingDuration(0);
    setPlaybackProgress(0);
  };

  const cardBg = theme?.cardBg || 'bg-slate-900/90 border-slate-800 text-slate-100 shadow-xl';
  const subText = theme?.subText || 'text-slate-400';

  const formatTime = (ms) => {
    const totalSec = Math.floor(ms / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const tenths = Math.floor((ms % 1000) / 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${tenths}`;
  };

  return (
    <div className={`flex flex-col h-full rounded-2xl border p-4 shadow-xl transition-all ${cardBg}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div 
            className={`w-3 h-3 rounded-full ${isRecording ? 'bg-rose-500 animate-ping' : 'bg-slate-500'}`}
          />
          <h2 className={`text-xs uppercase tracking-wider font-semibold ${subText}`}>
            Grabadora y Reproductor MIDI
          </h2>
        </div>
        <span className="text-xs font-mono font-bold">
          {formatTime(isRecording ? recordingDuration : recordingDuration)}
        </span>
      </div>

      {/* Main Body */}
      <div className="flex-1 flex flex-col justify-center items-center py-6 text-center gap-4">
        {/* Visual Progress Bar */}
        <div className="w-full bg-black/30 rounded-full h-2 overflow-hidden border border-white/5 relative">
          <div 
            className="h-full rounded-full transition-all duration-75"
            style={{
              width: `${isPlaying ? playbackProgress : isRecording ? 100 : 0}%`,
              backgroundColor: isRecording ? '#ff007a' : accentColor
            }}
          />
        </div>

        {/* Status Message */}
        <div className="flex flex-col items-center">
          <p className="text-sm font-bold">
            {isRecording 
              ? 'Grabando interpretación MIDI...' 
              : isPlaying 
                ? 'Reproduciendo frase grabada...' 
                : recordedEvents.length > 0 
                  ? `${recordedEvents.filter(e => e.type === 'on').length} notas registradas` 
                  : 'Listo para grabar un ejercicio o frase musical'}
          </p>
          <p className={`text-xs mt-1 max-w-sm ${subText}`}>
            {recordedEvents.length > 0 
              ? 'Puedes reproducirla en bucle para que tus alumnos la analicen en el pentagrama'
              : 'Pulsa el botón rojo para comenzar a grabar desde tu teclado MIDI'}
          </p>
        </div>

        {/* Transport Controls */}
        <div className="flex items-center gap-3">
          {/* Record button */}
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="p-3 rounded-full bg-[#ff007a]/20 hover:bg-[#ff007a]/30 text-[#ff007a] border border-[#ff007a]/45 shadow-lg hover:scale-105 transition-all"
              title="Comenzar a grabar"
            >
              <Circle className="w-5 h-5 fill-current" />
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="p-3 rounded-full bg-[#ff007a] text-white shadow-lg shadow-[#ff007a]/40 animate-pulse hover:scale-105 transition-all"
              title="Detener grabación"
            >
              <Square className="w-5 h-5 fill-current" />
            </button>
          )}

          {/* Play / Stop button */}
          {!isPlaying ? (
            <button
              onClick={startPlayback}
              disabled={recordedEvents.length === 0 || isRecording}
              className="p-3 rounded-full bg-[#00fff2]/15 hover:bg-[#00fff2]/25 text-[#00fff2] border border-[#00fff2]/45 shadow-lg disabled:opacity-30 disabled:pointer-events-none hover:scale-105 transition-all"
              title="Reproducir frase"
            >
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </button>
          ) : (
            <button
              onClick={stopPlayback}
              className="p-3 rounded-full bg-[#0068ff] text-white shadow-lg hover:scale-105 transition-all"
              title="Detener reproducción"
            >
              <Square className="w-5 h-5 fill-current" />
            </button>
          )}

          {/* Loop toggle */}
          <button
            onClick={() => setIsLooping(!isLooping)}
            className={`p-2.5 rounded-xl border transition-all ${
              isLooping 
                ? 'bg-[#0068ff]/25 border-[#0068ff] text-[#00fff2] font-bold' 
                : 'bg-white/5 border-white/10 opacity-70 hover:opacity-100 text-slate-300'
            }`}
            title={isLooping ? 'Bucle activado' : 'Bucle desactivado'}
          >
            <Repeat className="w-4 h-4" />
          </button>

          {/* Clear button */}
          {recordedEvents.length > 0 && !isRecording && (
            <button
              onClick={clearRecording}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 border border-white/10 transition-colors"
              title="Borrar grabación"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className={`pt-2 border-t border-white/10 flex items-center justify-between text-[11px] ${subText}`}>
        <span>Reproduce notas, acordes y partitura sincrónicos</span>
        <span className="font-mono">MIDI Looper</span>
      </div>
    </div>
  );
}
