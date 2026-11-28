import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Play,
  Square,
  Plus,
  Minus,
  Volume2,
  VolumeX,
  Gauge,
  Timer,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { synth } from '../utils/audioSynth';

const STORAGE_KEY = 'chordmeet_metronome_cfg_v1';
const LOOKAHEAD_SEC = 0.1;

const clampInt = (val, min, max, fallback) => {
  const n = parseInt(val, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

const formatStopwatch = (totalSeconds) => {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const h = String(Math.floor(safe / 3600)).padStart(2, '0');
  const m = String(Math.floor((safe % 3600) / 60)).padStart(2, '0');
  const s = String(safe % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
};

const loadSavedConfig = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export default function Metronome({ accentColor = '#0068ff', theme = null }) {
  const saved = useMemo(() => loadSavedConfig(), []);

  // Mode: 'trainer' (Speed Trainer / MetróGODmo) or 'standard' (Fixed BPM + Tap Tempo)
  const [mode, setMode] = useState(saved?.mode === 'standard' ? 'standard' : 'trainer');

  // Shared audio volume (independent from virtual piano synth mute)
  const [volume, setVolume] = useState(typeof saved?.volume === 'number' ? saved.volume : 0.75);
  const [muted, setMuted] = useState(false);

  // Standard mode state
  const [stdBpm, setStdBpm] = useState(saved?.stdBpm ?? 100);
  const [stdBpmText, setStdBpmText] = useState(String(saved?.stdBpm ?? 100));
  const [stdBeats, setStdBeats] = useState(saved?.stdBeats ?? 4);

  // Speed Trainer mode inputs (X, Y, S, Z, W)
  const [startBpmInput, setStartBpmInput] = useState(String(saved?.startBpm ?? 60));
  const [finalBpmInput, setFinalBpmInput] = useState(String(saved?.finalBpm ?? 80));
  const [stepInput, setStepInput] = useState(String(saved?.step ?? 5));
  const [beatsZInput, setBeatsZInput] = useState(String(saved?.beatsZ ?? 4));
  const [barsWInput, setBarsWInput] = useState(String(saved?.barsW ?? 2));

  // Playback & live display state
  const [isPlaying, setIsPlaying] = useState(false);
  const [trainerStatus, setTrainerStatus] = useState('idle'); // 'idle' | 'running' | 'finished'
  const [elapsedSec, setElapsedSec] = useState(0);
  const [displayBpm, setDisplayBpm] = useState(null);
  const [displayBar, setDisplayBar] = useState(0);
  const [displayTotalBars, setDisplayTotalBars] = useState(saved?.barsW ?? 2);
  const [displayBeat, setDisplayBeat] = useState(-1);
  const [displayBeatsCount, setDisplayBeatsCount] = useState(saved?.beatsZ ?? 4);
  const [progressPct, setProgressPct] = useState(0);
  const [validationError, setValidationError] = useState(null);

  // Refs for sample-accurate Web Audio lookahead scheduler
  const isPlayingRef = useRef(false);
  const modeRef = useRef(mode);
  const stdBpmRef = useRef(stdBpm);
  const stdBeatsRef = useRef(stdBeats);
  const nextNoteTimeRef = useRef(0);
  const schedulerIdRef = useRef(null);
  const stopwatchIntervalRef = useRef(null);
  const startTimestampRef = useRef(0);
  const uiTimeoutsRef = useRef(new Set());
  const tapTimesRef = useRef([]);

  // Trainer live scheduler cursor
  const trainerRef = useRef({
    currentBpm: 60,
    startBpm: 60,
    finalBpm: 80,
    step: 5,
    beatsZ: 4,
    barsW: 2,
    currentBeat: 0,
    currentBar: 0,
    completedBeats: 0,
    totalBeats: 1
  });

  // Standard live scheduler cursor
  const stdBeatCursorRef = useRef(0);

  modeRef.current = mode;
  stdBpmRef.current = stdBpm;
  stdBeatsRef.current = stdBeats;

  // Sync dedicated metronome bus volume
  useEffect(() => {
    synth.setMetronomeVolume(muted ? 0 : volume);
  }, [volume, muted]);

  // Persist user preferences in localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          mode,
          volume,
          stdBpm,
          stdBeats,
          startBpm: clampInt(startBpmInput, 20, 300, 60),
          finalBpm: clampInt(finalBpmInput, 20, 300, 80),
          step: clampInt(stepInput, 1, 50, 5),
          beatsZ: clampInt(beatsZInput, 1, 16, 4),
          barsW: clampInt(barsWInput, 1, 64, 2)
        })
      );
    } catch {
      // ignore storage errors
    }
  }, [mode, volume, stdBpm, stdBeats, startBpmInput, finalBpmInput, stepInput, beatsZInput, barsWInput]);

  // Helper: clear all pending visual beat timeouts
  const clearAllUiTimeouts = useCallback(() => {
    uiTimeoutsRef.current.forEach((id) => clearTimeout(id));
    uiTimeoutsRef.current.clear();
  }, []);

  const scheduleUiCallback = useCallback((delayMs, fn) => {
    const id = setTimeout(() => {
      uiTimeoutsRef.current.delete(id);
      fn();
    }, Math.max(0, delayMs));
    uiTimeoutsRef.current.add(id);
  }, []);

  // Stop playback completely (keepElapsed = true preserves stopwatch on FINALIZADO)
  const stopMetronome = useCallback(
    (asFinished = false) => {
      isPlayingRef.current = false;
      if (schedulerIdRef.current) {
        cancelAnimationFrame(schedulerIdRef.current);
        schedulerIdRef.current = null;
      }
      if (stopwatchIntervalRef.current) {
        clearInterval(stopwatchIntervalRef.current);
        stopwatchIntervalRef.current = null;
      }
      clearAllUiTimeouts();
      setIsPlaying(false);
      setDisplayBeat(-1);

      if (asFinished) {
        if (startTimestampRef.current) {
          setElapsedSec(Math.floor((Date.now() - startTimestampRef.current) / 1000));
        }
        setProgressPct(100);
        setTrainerStatus('finished');
      } else {
        setTrainerStatus('idle');
      }
    },
    [clearAllUiTimeouts]
  );

  // Cleanup on unmount (e.g., quadrant swapped or closed)
  useEffect(() => {
    return () => {
      isPlayingRef.current = false;
      if (schedulerIdRef.current) cancelAnimationFrame(schedulerIdRef.current);
      if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
      uiTimeoutsRef.current.forEach((id) => clearTimeout(id));
      uiTimeoutsRef.current.clear();
    };
  }, []);

  // Sample-accurate Web Audio lookahead scheduler loop
  const runScheduler = useCallback(() => {
    if (!isPlayingRef.current) return;

    const now = synth.getCurrentTime();

    while (nextNoteTimeRef.current < now + LOOKAHEAD_SEC) {
      const scheduledTime = nextNoteTimeRef.current;
      const delayMs = (scheduledTime - now) * 1000;

      if (modeRef.current === 'standard') {
        const beats = Math.max(1, stdBeatsRef.current);
        const bpm = Math.min(300, Math.max(20, stdBpmRef.current));
        const beatIdx = stdBeatCursorRef.current % beats;
        const isDownbeat = beatIdx === 0;

        synth.scheduleMetronomeClick(scheduledTime, isDownbeat, 1.0);

        scheduleUiCallback(delayMs, () => {
          setDisplayBpm(bpm);
          setDisplayBeat(beatIdx);
          setDisplayBeatsCount(beats);
        });

        nextNoteTimeRef.current += 60.0 / bpm;
        stdBeatCursorRef.current = (beatIdx + 1) % beats;
      } else {
        // Speed Trainer mode
        const st = trainerRef.current;
        const beatIdx = st.currentBeat;
        const barNumber = st.currentBar + 1;
        const bpmSnapshot = st.currentBpm;
        const barsWSnapshot = st.barsW;
        const beatsZSnapshot = st.beatsZ;
        const isDownbeat = beatIdx === 0;

        synth.scheduleMetronomeClick(scheduledTime, isDownbeat, 1.0);

        st.completedBeats += 1;
        const pctSnapshot = Math.min(100, Math.round((st.completedBeats / st.totalBeats) * 100));

        scheduleUiCallback(delayMs, () => {
          setDisplayBpm(bpmSnapshot);
          setDisplayBar(barNumber);
          setDisplayTotalBars(barsWSnapshot);
          setDisplayBeat(beatIdx);
          setDisplayBeatsCount(beatsZSnapshot);
          setProgressPct(pctSnapshot);
        });

        // Advance to next beat timestamp
        const beatDurationSec = 60.0 / bpmSnapshot;
        nextNoteTimeRef.current += beatDurationSec;
        st.currentBeat += 1;

        if (st.currentBeat >= st.beatsZ) {
          st.currentBeat = 0;
          st.currentBar += 1;

          if (st.currentBar >= st.barsW) {
            st.currentBar = 0;

            let reachedEnd = false;
            if (st.startBpm === st.finalBpm) {
              reachedEnd = true;
            } else if (st.finalBpm > st.startBpm) {
              st.currentBpm += st.step;
              if (st.currentBpm > st.finalBpm) reachedEnd = true;
            } else {
              st.currentBpm -= st.step;
              if (st.currentBpm < st.finalBpm) reachedEnd = true;
            }

            if (reachedEnd) {
              // Stop scheduling new notes, let final measure finish cleanly, then show FINALIZADO
              isPlayingRef.current = false;
              const finishDelayMs = Math.max(0, (nextNoteTimeRef.current - synth.getCurrentTime()) * 1000);
              scheduleUiCallback(finishDelayMs, () => {
                stopMetronome(true);
              });
              return;
            }
          }
        }
      }
    }

    schedulerIdRef.current = requestAnimationFrame(runScheduler);
  }, [scheduleUiCallback, stopMetronome]);

  // Start playback (for current mode)
  const startMetronome = () => {
    setValidationError(null);
    synth.init();
    synth.setMetronomeVolume(muted ? 0 : volume);

    if (mode === 'trainer') {
      const x = parseInt(startBpmInput, 10);
      const y = parseInt(finalBpmInput, 10);
      const s = parseInt(stepInput, 10);
      const z = parseInt(beatsZInput, 10);
      const w = parseInt(barsWInput, 10);

      if ([x, y, s, z, w].some((n) => Number.isNaN(n))) {
        setValidationError('Revisa que todos los campos tengan números válidos.');
        return;
      }

      const startBpm = clampInt(x, 20, 300, 60);
      const finalBpm = clampInt(y, 20, 300, 80);
      const step = clampInt(s, 1, 50, 5);
      const beatsZ = clampInt(z, 1, 16, 4);
      const barsW = clampInt(w, 1, 64, 2);

      // Reflect clamped values back into inputs
      setStartBpmInput(String(startBpm));
      setFinalBpmInput(String(finalBpm));
      setStepInput(String(step));
      setBeatsZInput(String(beatsZ));
      setBarsWInput(String(barsW));

      const levels = startBpm === finalBpm ? 1 : Math.floor(Math.abs(finalBpm - startBpm) / step) + 1;
      const totalBeats = Math.max(1, levels * barsW * beatsZ);

      trainerRef.current = {
        currentBpm: startBpm,
        startBpm,
        finalBpm,
        step,
        beatsZ,
        barsW,
        currentBeat: 0,
        currentBar: 0,
        completedBeats: 0,
        totalBeats
      };

      setDisplayBpm(startBpm);
      setDisplayBar(1);
      setDisplayTotalBars(barsW);
      setDisplayBeatsCount(beatsZ);
      setDisplayBeat(-1);
      setProgressPct(0);
      setTrainerStatus('running');
    } else {
      stdBeatCursorRef.current = 0;
      setDisplayBpm(stdBpm);
      setDisplayBeatsCount(stdBeats);
      setDisplayBeat(-1);
      setTrainerStatus('running');
    }

    clearAllUiTimeouts();
    const now = synth.getCurrentTime();
    nextNoteTimeRef.current = now + 0.08;
    startTimestampRef.current = Date.now();
    setElapsedSec(0);

    isPlayingRef.current = true;
    setIsPlaying(true);

    if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
    stopwatchIntervalRef.current = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startTimestampRef.current) / 1000));
    }, 250);

    schedulerIdRef.current = requestAnimationFrame(runScheduler);
  };

  // Switch between Standard and Trainer modes safely
  const handleSwitchMode = (nextMode) => {
    if (nextMode === mode) return;
    if (isPlaying) stopMetronome(false);
    setValidationError(null);
    setTrainerStatus('idle');
    setDisplayBeat(-1);
    setElapsedSec(0);
    setProgressPct(0);
    setMode(nextMode);
  };

  // Tap tempo algorithm (Standard mode)
  const handleTap = () => {
    const now = performance.now();
    const times = tapTimesRef.current;

    if (times.length > 0 && now - times[times.length - 1] > 2000) {
      tapTimesRef.current = [now];
      return;
    }

    times.push(now);
    if (times.length > 4) times.shift();

    if (times.length >= 2) {
      let sum = 0;
      for (let i = 1; i < times.length; i++) {
        sum += times[i] - times[i - 1];
      }
      const avgInterval = sum / (times.length - 1);
      const calculatedBpm = Math.round(60000 / avgInterval);
      if (calculatedBpm >= 20 && calculatedBpm <= 300) {
        setStdBpm(calculatedBpm);
        setStdBpmText(String(calculatedBpm));
      }
    }
  };

  // Theme & contrast tokens
  const isLight = theme?.mode === 'light';
  const cardBg = theme?.cardBg || 'bg-[#0c0e14]/95 border-white/15 text-white';
  const pillBg = theme?.navbarPillBg || (isLight ? 'bg-[#eef3fc] border border-[#cddaf5] text-[#0f172a]' : 'bg-black/30 border border-white/15 text-slate-200');
  const subText = theme?.subText || 'text-slate-400';
  const stopColor = theme?.id === 'autumn' ? '#e63946' : '#ff007a';
  const timerColor = theme?.secondaryColor || accentColor;
  const optionClass = isLight ? 'bg-white text-slate-900' : 'bg-[#0c0e14] text-slate-100';

  const isAccentLight = useMemo(() => {
    const clean = (accentColor || '#0068ff').replace('#', '');
    if (clean.length !== 6) return false;
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return 0.299 * r + 0.587 * g + 0.114 * b > 155;
  }, [accentColor]);

  const accentBtnText = isAccentLight ? '#050608' : '#ffffff';

  const parsedStart = clampInt(startBpmInput, 20, 300, 60);
  const parsedFinal = clampInt(finalBpmInput, 20, 300, 80);
  const isDescending = parsedFinal < parsedStart;
  const beatDotsCount = Math.min(16, Math.max(1, mode === 'standard' ? stdBeats : displayBeatsCount));

  return (
    <div className={`w-full max-w-md my-auto rounded-2xl border p-3 sm:p-3.5 shadow-xl flex flex-col gap-2.5 transition-colors select-none ${cardBg}`}>
      {/* Header: Mode Switcher + Independent Metronome Volume */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className={`inline-flex items-center p-0.5 rounded-lg text-[11px] font-semibold ${pillBg}`}>
          <button
            type="button"
            onClick={() => handleSwitchMode('trainer')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md transition-all"
            style={
              mode === 'trainer'
                ? { backgroundColor: accentColor, color: accentBtnText }
                : { opacity: 0.7 }
            }
          >
            <Gauge className="w-3 h-3" />
            <span>Entrenador</span>
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMode('standard')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md transition-all"
            style={
              mode === 'standard'
                ? { backgroundColor: accentColor, color: accentBtnText }
                : { opacity: 0.7 }
            }
          >
            <Timer className="w-3 h-3" />
            <span>Estándar</span>
          </button>
        </div>

        {/* Dedicated Metronome Volume */}
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${pillBg}`}>
          <button
            type="button"
            onClick={() => setMuted((prev) => !prev)}
            className="transition-opacity hover:opacity-100 opacity-85"
            style={{ color: muted ? undefined : accentColor }}
            title={muted ? 'Activar sonido del metrónomo' : 'Silenciar metrónomo'}
          >
            {muted || volume === 0 ? <VolumeX className="w-3.5 h-3.5 opacity-50" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={muted ? 0 : volume}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setVolume(v);
              if (v > 0 && muted) setMuted(false);
            }}
            className="w-14 cursor-pointer"
            style={{ accentColor }}
            title="Volumen independiente del metrónomo"
          />
        </div>
      </div>

      {/* Live Display Panel */}
      <div
        className={`rounded-xl border px-3 py-2.5 flex flex-col items-center text-center gap-1.5 transition-colors ${
          isLight
            ? 'bg-[#f3f6fc] border-[#cddaf5]'
            : 'bg-black/35 border-white/10'
        }`}
      >
        {/* Top Row: Stopwatch + Direction / Status Badge */}
        <div className="w-full flex items-center justify-between text-[11px] font-mono">
          <span className="font-bold tracking-wider" style={{ color: timerColor }}>
            {formatStopwatch(elapsedSec)}
          </span>

          {mode === 'trainer' ? (
            trainerStatus === 'finished' ? (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider"
                style={{
                  backgroundColor: `${accentColor}22`,
                  color: accentColor,
                  border: `1px solid ${accentColor}66`
                }}
              >
                <CheckCircle2 className="w-3 h-3" />
                FINALIZADO
              </span>
            ) : (
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${subText}`}>
                {isDescending ? (
                  <ArrowDownRight className="w-3 h-3" style={{ color: stopColor }} />
                ) : (
                  <ArrowUpRight className="w-3 h-3" style={{ color: accentColor }} />
                )}
                <span>
                  {parsedStart} → {parsedFinal} BPM
                </span>
              </span>
            )
          ) : (
            <span className={`text-[10px] uppercase tracking-wider ${subText}`}>
              Compás {stdBeats}/4
            </span>
          )}
        </div>

        {/* Big BPM Readout */}
        <div className="flex items-baseline justify-center gap-1.5 leading-none my-0.5">
          <span
            className="text-3xl sm:text-4xl font-black font-mono tracking-tight transition-all"
            style={{
              color: isPlaying || trainerStatus === 'finished' ? accentColor : undefined,
              textShadow: isPlaying ? `0 0 18px ${accentColor}55` : undefined
            }}
          >
            {mode === 'standard'
              ? stdBpm
              : displayBpm !== null
                ? displayBpm
                : '--'}
          </span>
          <span className={`text-xs font-mono font-bold uppercase ${subText}`}>BPM</span>
        </div>

        {/* Measure Counter + Beat TIC/tac Indicator */}
        <div className="w-full flex items-center justify-between gap-2 text-xs font-mono">
          <span className={subText}>
            {mode === 'trainer'
              ? displayBar > 0
                ? `Compás ${displayBar} de ${displayTotalBars}`
                : `Compás: --`
              : isPlaying
                ? `Pulso ${displayBeat >= 0 ? displayBeat + 1 : '-'} / ${stdBeats}`
                : 'Listo'}
          </span>

          <span
            className="font-extrabold tracking-wide min-w-[72px] text-right"
            style={{
              color:
                trainerStatus === 'finished'
                  ? accentColor
                  : isPlaying && displayBeat === 0
                    ? stopColor
                    : isPlaying && displayBeat > 0
                      ? accentColor
                      : undefined
            }}
          >
            {trainerStatus === 'finished'
              ? 'FINALIZADO'
              : isPlaying && displayBeat >= 0
                ? displayBeat === 0
                  ? 'TIC (1)'
                  : `tac (${displayBeat + 1})`
                : '--'}
          </span>
        </div>

        {/* Visual Beat Dots */}
        <div className="flex items-center justify-center flex-wrap gap-1.5 pt-0.5">
          {Array.from({ length: beatDotsCount }).map((_, i) => {
            const active = isPlaying && displayBeat === i;
            const dotColor = active ? (i === 0 ? stopColor : accentColor) : 'currentColor';
            return (
              <span
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-75 ${
                  active ? 'scale-125' : 'opacity-20'
                }`}
                style={{
                  backgroundColor: dotColor,
                  boxShadow: active ? `0 0 8px ${dotColor}` : undefined
                }}
              />
            );
          })}
        </div>

        {/* Progress Bar (Trainer Mode) */}
        {mode === 'trainer' && (
          <div
            className={`w-full h-1.5 rounded-full overflow-hidden mt-1 ${
              isLight ? 'bg-slate-200' : 'bg-white/10'
            }`}
          >
            <div
              className="h-full rounded-full transition-all duration-150"
              style={{
                width: `${progressPct}%`,
                backgroundColor: trainerStatus === 'finished' ? accentColor : accentColor
              }}
            />
          </div>
        )}
      </div>

      {/* Mode Controls */}
      {mode === 'trainer' ? (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <label className="flex flex-col gap-0.5">
              <span className={`text-[10px] font-semibold uppercase tracking-wide ${subText}`}>
                Inicio (X)
              </span>
              <input
                type="number"
                min="20"
                max="300"
                disabled={isPlaying}
                value={startBpmInput}
                onChange={(e) => setStartBpmInput(e.target.value)}
                className={`w-full px-2 py-1.5 rounded-lg font-mono font-bold text-center text-sm focus:outline-none disabled:opacity-50 ${pillBg}`}
              />
            </label>

            <label className="flex flex-col gap-0.5">
              <span className={`text-[10px] font-semibold uppercase tracking-wide ${subText}`}>
                Final (Y)
              </span>
              <input
                type="number"
                min="20"
                max="300"
                disabled={isPlaying}
                value={finalBpmInput}
                onChange={(e) => setFinalBpmInput(e.target.value)}
                className={`w-full px-2 py-1.5 rounded-lg font-mono font-bold text-center text-sm focus:outline-none disabled:opacity-50 ${pillBg}`}
              />
            </label>

            <label className="flex flex-col gap-0.5">
              <span className={`text-[10px] font-semibold uppercase tracking-wide ${subText}`}>
                Salto (S)
              </span>
              <input
                type="number"
                min="1"
                max="50"
                disabled={isPlaying}
                value={stepInput}
                onChange={(e) => setStepInput(e.target.value)}
                className={`w-full px-2 py-1.5 rounded-lg font-mono font-bold text-center text-sm focus:outline-none disabled:opacity-50 ${pillBg}`}
              />
            </label>

            <label className="flex flex-col gap-0.5">
              <span className={`text-[10px] font-semibold uppercase tracking-wide ${subText}`}>
                Golpes (Z)
              </span>
              <input
                type="number"
                min="1"
                max="16"
                disabled={isPlaying}
                value={beatsZInput}
                onChange={(e) => {
                  setBeatsZInput(e.target.value);
                  const n = parseInt(e.target.value, 10);
                  if (!Number.isNaN(n) && n >= 1 && n <= 16) setDisplayBeatsCount(n);
                }}
                className={`w-full px-2 py-1.5 rounded-lg font-mono font-bold text-center text-sm focus:outline-none disabled:opacity-50 ${pillBg}`}
              />
            </label>

            <label className="flex flex-col gap-0.5 col-span-2 sm:col-span-2">
              <span className={`text-[10px] font-semibold uppercase tracking-wide ${subText}`}>
                Compases por nivel (W)
              </span>
              <input
                type="number"
                min="1"
                max="64"
                disabled={isPlaying}
                value={barsWInput}
                onChange={(e) => setBarsWInput(e.target.value)}
                className={`w-full px-2 py-1.5 rounded-lg font-mono font-bold text-center text-sm focus:outline-none disabled:opacity-50 ${pillBg}`}
              />
            </label>
          </div>

          {validationError && (
            <p className="text-[11px] font-medium text-center" style={{ color: stopColor }}>
              {validationError}
            </p>
          )}
        </div>
      ) : (
        /* Standard Mode Controls */
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className={`flex items-center gap-1 rounded-lg px-1.5 py-1 ${pillBg}`}>
            <button
              type="button"
              onClick={() => {
                const next = Math.max(20, stdBpm - 5);
                setStdBpm(next);
                setStdBpmText(String(next));
              }}
              className="px-1.5 py-0.5 rounded hover:bg-white/10 text-[10px] font-mono opacity-75 hover:opacity-100"
              title="-5 BPM"
            >
              -5
            </button>
            <button
              type="button"
              onClick={() => {
                const next = Math.max(20, stdBpm - 1);
                setStdBpm(next);
                setStdBpmText(String(next));
              }}
              className="p-1 rounded hover:bg-white/10 opacity-75 hover:opacity-100"
              title="-1 BPM"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <input
              type="number"
              min="20"
              max="300"
              value={stdBpmText}
              onChange={(e) => {
                setStdBpmText(e.target.value);
                const parsed = parseInt(e.target.value, 10);
                if (!Number.isNaN(parsed) && parsed >= 20 && parsed <= 300) {
                  setStdBpm(parsed);
                }
              }}
              onBlur={() => {
                const clamped = clampInt(stdBpmText, 20, 300, stdBpm);
                setStdBpm(clamped);
                setStdBpmText(String(clamped));
              }}
              className="w-12 bg-transparent text-center font-mono font-bold text-xs focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                const next = Math.min(300, stdBpm + 1);
                setStdBpm(next);
                setStdBpmText(String(next));
              }}
              className="p-1 rounded hover:bg-white/10 opacity-75 hover:opacity-100"
              title="+1 BPM"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                const next = Math.min(300, stdBpm + 5);
                setStdBpm(next);
                setStdBpmText(String(next));
              }}
              className="px-1.5 py-0.5 rounded hover:bg-white/10 text-[10px] font-mono opacity-75 hover:opacity-100"
              title="+5 BPM"
            >
              +5
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <select
              value={stdBeats}
              onChange={(e) => setStdBeats(Number(e.target.value))}
              className={`px-2 py-1.5 rounded-lg font-mono text-xs font-semibold cursor-pointer focus:outline-none ${pillBg}`}
              title="Compás"
            >
              <option value="2" className={optionClass}>2/4</option>
              <option value="3" className={optionClass}>3/4</option>
              <option value="4" className={optionClass}>4/4</option>
              <option value="6" className={optionClass}>6/8</option>
            </select>

            <button
              type="button"
              onClick={handleTap}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wider transition-all hover:opacity-100 opacity-85 ${pillBg}`}
              title="Haz clic rítmicamente para calcular el tempo"
            >
              Tap
            </button>
          </div>
        </div>
      )}

      {/* Primary Action Button: INICIAR / DETENER */}
      <button
        type="button"
        onClick={() => (isPlaying ? stopMetronome(false) : startMetronome())}
        className="w-full py-2 px-4 rounded-xl font-extrabold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-[0.98]"
        style={
          isPlaying
            ? {
                backgroundColor: stopColor,
                color: '#ffffff',
                boxShadow: `0 6px 18px ${stopColor}44`
              }
            : {
                backgroundColor: accentColor,
                color: accentBtnText,
                boxShadow: `0 6px 18px ${accentColor}40`
              }
        }
      >
        {isPlaying ? (
          <>
            <Square className="w-4 h-4 fill-current" />
            <span>Detener</span>
          </>
        ) : (
          <>
            <Play className="w-4 h-4 fill-current" />
            <span>{trainerStatus === 'finished' ? 'Reiniciar' : 'Iniciar'}</span>
          </>
        )}
      </button>
    </div>
  );
}
