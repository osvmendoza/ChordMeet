import React, { useMemo, useState } from 'react';
import { generateKeysInRange, KEYBOARD_CONFIGS } from '../utils/musicHelpers';

export default function Keyboard({
  activeNotes = [],           // Physically pressed MIDI notes
  sustainedNotes = [],        // Notes sustained by pedal
  keyCount = 61,              // 25, 49, 61, 76, 88
  labelMode = 'c-only',       // 'c-only', 'all', 'none'
  accentColor = '#38bdf8',    // Custom user color
  onNoteOn,                   // Callback (midi)
  onNoteOff                   // Callback (midi)
}) {
  const [isMouseDown, setIsMouseDown] = useState(false);

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
      className="w-full select-none"
      onMouseUp={handleMouseUpGlobal}
      onMouseLeave={handleMouseUpGlobal}
    >
      {/* Keyboard Case Frame */}
      <div className="relative w-full bg-gradient-to-b from-slate-900 via-slate-950 to-black p-2.5 sm:p-3.5 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
        
        {/* Felt Red Rail strip above keys */}
        <div className="h-2 w-full bg-gradient-to-r from-red-950 via-red-800 to-red-950 rounded-t-sm shadow-inner mb-0.5" />

        {/* Keyboard Bed Container */}
        <div className="relative w-full h-44 sm:h-52 md:h-60 overflow-x-auto overflow-y-hidden rounded-b-md shadow-2xl flex">
          <div 
            className="relative h-full flex min-w-full"
            style={{ minWidth: keyCount >= 76 ? '950px' : keyCount === 61 ? '750px' : 'auto' }}
          >
            {/* 1. White Keys */}
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
                    className="flex-1 h-full border-r border-slate-300/80 rounded-b-md flex flex-col justify-end items-center pb-2 cursor-pointer transition-colors duration-75 relative white-key"
                    style={{
                      backgroundColor: isPressed 
                        ? accentColor 
                        : isSustained 
                          ? hexToRgba(accentColor, 0.3) 
                          : '#ffffff',
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
                            ? 'text-slate-950 font-black'
                            : k.isC
                              ? 'text-indigo-600 font-extrabold'
                              : 'text-slate-500'
                        }`}
                      >
                        {k.name}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 2. Black Keys */}
            {blackKeys.map((k) => {
              const isPressed = activeNotes.includes(k.midi);
              const isSustained = !isPressed && sustainedNotes.includes(k.midi);

              // Calculate exact horizontal position relative to white keys
              // Find the white key immediately preceding this black key
              const precedingWhiteKey = whiteKeys.filter((w) => w.midi < k.midi).pop();
              const precedingIndex = precedingWhiteKey ? whiteKeys.indexOf(precedingWhiteKey) : 0;
              
              const whiteKeyPct = 100 / totalWhiteKeys;
              const blackWidthPct = whiteKeyPct * 0.65; // ~65% width of a white key
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
                    backgroundColor: isPressed 
                      ? accentColor 
                      : isSustained 
                        ? hexToRgba(accentColor, 0.45) 
                        : undefined,
                    boxShadow: isPressed 
                      ? `${glowShadow}, inset 0 -3px 6px rgba(0,0,0,0.4)` 
                      : isSustained 
                        ? sustainedGlowShadow 
                        : undefined
                  }}
                >
                  {/* Subtle note name on active black key */}
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

        {/* Realistic Wood / Metallic Bottom Edge */}
        <div className="h-2 w-full bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 rounded-b-lg mt-1 border-t border-slate-700/50" />
      </div>
    </div>
  );
}
