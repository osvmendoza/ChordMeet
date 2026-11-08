import React, { useMemo, useState } from 'react';
import { generateKeysInRange, KEYBOARD_CONFIGS } from '../utils/musicHelpers';

export default function Keyboard({
  activeNotes = [],           // Physically pressed MIDI notes
  sustainedNotes = [],        // Notes sustained by pedal
  keyCount = 61,              // 25, 49, 61, 76, 88
  keyHeight = null,           // Height in px or null for auto full-height
  labelMode = 'c-only',       // 'c-only', 'all', 'none'
  accentColor = '#38bdf8',    // Custom user color
  theme = null,               // Active theme object
  onNoteOn,                   // Callback (midi)
  onNoteOff                   // Callback (midi)
}) {
  const [isMouseDown, setIsMouseDown] = useState(false);

  // Fallback styling if theme is not provided
  const pianoFrame = theme?.pianoFrame || 'bg-gradient-to-b from-slate-900 via-slate-950 to-black border-slate-800';
  const feltColor = theme?.feltColor || 'bg-gradient-to-r from-red-950 via-red-800 to-red-950';
  const pianoRim = theme?.pianoRim || 'bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 border-slate-700/50';
  const whiteKeyNormal = theme?.whiteKeyNormal || '#ffffff';
  const whiteKeyBorder = theme?.whiteKeyBorder || 'border-slate-300/80';
  const whiteKeyText = theme?.whiteKeyText || 'text-slate-500';
  const whiteKeyTextActive = theme?.whiteKeyTextActive || 'text-slate-950 font-black';

  // Generate key list and layout calculations based on keyCount
  const { whiteKeys, blackKeys, totalWhiteKeys } = useMemo(() => {
    const config = KEYBOARD_CONFIGS[keyCount] || KEYBOARD_CONFIGS[61];
    const { keys, totalWhiteKeys } = generateKeysInRange(config.startMidi, config.endMidi);

    const whites = [];
    const blacks = [];

    keys.forEach((k) => {
      if (k.isBlack) {
        blacks.push(k);
      } else {
        whites.push(k);
      }
    });

    return { whiteKeys: whites, blackKeys: blacks, totalWhiteKeys };
  }, [keyCount]);

  // Handle pointer interactions (mouse & touch drag)
  const handleKeyPointerDown = (midi, e) => {
    e.preventDefault();
    setIsMouseDown(true);
    if (onNoteOn) onNoteOn(midi);
  };

  const handleKeyPointerEnter = (midi) => {
    if (isMouseDown && onNoteOn) {
      onNoteOn(midi);
    }
  };

  const handleKeyPointerUpOrLeave = (midi) => {
    if (onNoteOff) onNoteOff(midi);
  };

  const handleMouseUpGlobal = () => {
    setIsMouseDown(false);
  };

  // Convert hex color to rgba for smooth glows
  const hexToRgba = (hex, alpha) => {
    const cleanHex = hex.replace('#', '');
    const num = parseInt(cleanHex, 16);
    if (cleanHex.length === 6) {
      const r = (num >> 16) & 255;
      const g = (num >> 8) & 255;
      const b = num & 255;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return hex;
  };

  const glowShadow = `0 0 16px ${hexToRgba(accentColor, 0.7)}, 0 0 30px ${hexToRgba(accentColor, 0.4)}`;
  const sustainedGlowShadow = `0 0 12px ${hexToRgba(accentColor, 0.35)}`;

  return (
    <div 
      className="w-full h-full flex flex-col select-none overflow-hidden"
      onMouseUp={handleMouseUpGlobal}
      onMouseLeave={handleMouseUpGlobal}
    >
      {/* Keyboard Case Frame - Stretches 100% width with zero horizontal waste */}
      <div className={`w-full flex-1 flex flex-col p-1.5 sm:p-2 rounded-xl border shadow-xl overflow-hidden transition-all duration-200 ${pianoFrame}`}>
        
        {/* Felt Red Rail strip above keys */}
        <div className={`h-2 w-full rounded-t-sm shadow-inner mb-0.5 shrink-0 ${feltColor}`} />

        {/* Keyboard Bed Container - Stretches 100% width without blank margins */}
        <div 
          className="relative w-full flex-1 min-h-[120px] rounded-b-md shadow-2xl flex overflow-hidden"
          style={{ height: keyHeight ? `${keyHeight}px` : '100%' }}
        >
          <div className="relative w-full h-full flex">
            {/* 1. White Keys: Exactly fills 100% width */}
            <div className="flex w-full h-full relative z-0">
              {whiteKeys.map((k) => {
                const isPressed = activeNotes.includes(k.midi);
                const isSustained = !isPressed && sustainedNotes.includes(k.midi);
                const isMiddleC = k.midi === 60; // C4

                // Should label be shown?
                const showLabel = 
                  labelMode === 'all' || 
                  (labelMode === 'c-only' && k.isC);

                return (
                  <div
                    key={k.midi}
                    onPointerDown={(e) => handleKeyPointerDown(k.midi, e)}
                    onPointerEnter={() => handleKeyPointerEnter(k.midi)}
                    onPointerUp={() => handleKeyPointerUpOrLeave(k.midi)}
                    onPointerLeave={() => handleKeyPointerUpOrLeave(k.midi)}
                    className={`flex-1 h-full border-r ${whiteKeyBorder} rounded-b-md flex flex-col justify-end items-center pb-2 cursor-pointer transition-colors duration-75 relative white-key`}
                    style={{
                      width: `${100 / totalWhiteKeys}%`,
                      backgroundColor: isPressed 
                        ? accentColor 
                        : isSustained 
                          ? hexToRgba(accentColor, 0.3) 
                          : whiteKeyNormal,
                      boxShadow: isPressed 
                        ? `${glowShadow}, inset 0 -4px 8px rgba(0,0,0,0.2)` 
                        : isSustained 
                          ? sustainedGlowShadow 
                          : undefined
                    }}
                  >
                    {/* Middle C Dot Indicator */}
                    {isMiddleC && (
                      <div 
                        className="w-1.5 h-1.5 rounded-full mb-1"
                        style={{ backgroundColor: isPressed ? '#ffffff' : '#64748b' }}
                        title="Do Central (C4)"
                      />
                    )}

                    {/* Note Label */}
                    {showLabel && (
                      <span 
                        className={`text-[10px] sm:text-xs font-mono font-bold tracking-tight select-none transition-colors ${
                          isPressed
                            ? whiteKeyTextActive
                            : k.isC
                              ? 'text-indigo-500 font-extrabold'
                              : whiteKeyText
                        }`}
                      >
                        {k.name}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 2. Black Keys: Proportional to white keys across 100% width */}
            {blackKeys.map((k) => {
              const isPressed = activeNotes.includes(k.midi);
              const isSustained = !isPressed && sustainedNotes.includes(k.midi);

              const precedingWhiteKey = whiteKeys.filter((w) => w.midi < k.midi).pop();
              const precedingIndex = precedingWhiteKey ? whiteKeys.indexOf(precedingWhiteKey) : 0;
              
              const whiteKeyPct = 100 / totalWhiteKeys;
              const blackWidthPct = whiteKeyPct * 0.65; // ~65% width of white key
              const leftPct = (precedingIndex + 1) * whiteKeyPct - (blackWidthPct / 2);

              return (
                <div
                  key={k.midi}
                  onPointerDown={(e) => handleKeyPointerDown(k.midi, e)}
                  onPointerEnter={() => handleKeyPointerEnter(k.midi)}
                  onPointerUp={() => handleKeyPointerUpOrLeave(k.midi)}
                  onPointerLeave={() => handleKeyPointerUpOrLeave(k.midi)}
                  className="absolute top-0 h-[62%] rounded-b-md z-10 cursor-pointer transition-all duration-75 flex flex-col justify-end items-center pb-2 select-none black-key"
                  style={{
                    left: `${leftPct}%`,
                    width: `${blackWidthPct}%`,
                    background: isPressed 
                      ? accentColor 
                      : isSustained 
                        ? hexToRgba(accentColor, 0.45) 
                        : (theme?.blackKeyNormal || undefined),
                    boxShadow: isPressed 
                      ? `${glowShadow}, inset 0 -3px 6px rgba(0,0,0,0.4)` 
                      : isSustained 
                        ? sustainedGlowShadow 
                        : undefined
                  }}
                >
                  {isPressed && (
                    <span className="text-[9px] font-mono font-bold text-slate-950 pb-0.5">
                      {k.name}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Realistic Piano Bottom Edge */}
        <div className={`h-2 w-full rounded-b-lg mt-1 border-t shrink-0 ${pianoRim}`} />
      </div>
    </div>
  );
}
