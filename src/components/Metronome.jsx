import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Plus, Minus, Volume2, Timer } from 'lucide-react';
import { synth } from '../utils/audioSynth';

export default function Metronome({ accentColor = '#38bdf8', theme = null }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(100);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4); // 4/4, 3/4, etc.
  const [currentBeat, setCurrentBeat] = useState(0);

  const tapTimesRef = useRef([]);
  const timerRef = useRef(null);
  const currentBeatRef = useRef(0);
  const isPlayingRef = useRef(isPlaying);
  const bpmRef = useRef(bpm);
  const beatsPerMeasureRef = useRef(beatsPerMeasure);

  isPlayingRef.current = isPlaying;
  bpmRef.current = bpm;
  beatsPerMeasureRef.current = beatsPerMeasure;

  // Step function for metronome tick
  const tick = useCallback(() => {
    const isDownbeat = currentBeatRef.current === 0;
    synth.playMetronomeClick(isDownbeat);

    setCurrentBeat(currentBeatRef.current);
    currentBeatRef.current = (currentBeatRef.current + 1) % beatsPerMeasureRef.current;
  }, []);

  // Interval loop
  useEffect(() => {
    if (isPlaying) {
      currentBeatRef.current = 0;
      tick(); // Immediate first beat
      const intervalMs = (60 / bpm) * 1000;
      timerRef.current = setInterval(tick, intervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setCurrentBeat(0);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, bpm, tick]);

  // Tap tempo algorithm
  const handleTap = () => {
    const now = performance.now();
    const times = tapTimesRef.current;

    // Reset if last tap was more than 2 seconds ago
    if (times.length > 0 && now - times[times.length - 1] > 2000) {
      tapTimesRef.current = [now];
      return;
    }

    times.push(now);
    if (times.length > 4) times.shift();

    if (times.length >= 2) {
      let intervals = [];
      for (let i = 1; i < times.length; i++) {
        intervals.push(times[i] - times[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);
      if (calculatedBpm >= 40 && calculatedBpm <= 240) {
        setBpm(calculatedBpm);
      }
    }
  };

  const cardBg = theme?.cardBg || 'bg-slate-900/90 border-slate-800 text-slate-100';

  return (
    <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border text-xs shadow-md ${cardBg}`}>
      {/* Play / Stop Button */}
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className={`p-1.5 rounded-lg font-bold flex items-center justify-center transition-all ${
          isPlaying 
            ? 'bg-rose-500 text-white shadow-md' 
            : 'hover:bg-white/10 text-slate-300'
        }`}
        style={{
          backgroundColor: isPlaying ? undefined : `${accentColor}25`,
          color: isPlaying ? undefined : accentColor
        }}
        title={isPlaying ? 'Detener metrónomo' : 'Iniciar metrónomo'}
      >
        {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
      </button>

      {/* BPM display & Quick adjust */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setBpm((prev) => Math.max(40, prev - 1))}
          className="p-1 rounded hover:bg-white/10 opacity-70 hover:opacity-100"
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="font-mono font-bold text-xs min-w-[50px] text-center">
          {bpm} <span className="text-[10px] font-normal opacity-70">BPM</span>
        </span>
        <button
          onClick={() => setBpm((prev) => Math.min(240, prev + 1))}
          className="p-1 rounded hover:bg-white/10 opacity-70 hover:opacity-100"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {/* Beats dots indicator */}
      <div className="flex items-center gap-1 px-1">
        {Array.from({ length: beatsPerMeasure }).map((_, i) => (
          <span
            key={i}
            className={`w-2 h-2 rounded-full transition-all duration-75 ${
              isPlaying && currentBeat === i
                ? 'scale-125'
                : 'opacity-25'
            }`}
            style={{
              backgroundColor: isPlaying && currentBeat === i
                ? (i === 0 ? '#ef4444' : accentColor)
                : 'currentColor'
            }}
          />
        ))}
      </div>

      {/* Time Signature selector */}
      <select
        value={beatsPerMeasure}
        onChange={(e) => setBeatsPerMeasure(Number(e.target.value))}
        className="bg-transparent font-mono text-[11px] font-semibold opacity-80 cursor-pointer focus:outline-none"
      >
        <option value="4" className="bg-slate-900 text-slate-100">4/4</option>
        <option value="3" className="bg-slate-900 text-slate-100">3/4</option>
        <option value="2" className="bg-slate-900 text-slate-100">2/4</option>
        <option value="6" className="bg-slate-900 text-slate-100">6/8</option>
      </select>

      {/* Tap Tempo Button */}
      <button
        onClick={handleTap}
        className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] font-mono font-bold uppercase tracking-wider transition-all"
        title="Haz clic rítmicamente para calcular el tempo"
      >
        Tap
      </button>
    </div>
  );
}
