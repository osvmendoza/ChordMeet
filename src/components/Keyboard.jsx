import React, { useMemo, useState } from 'react';
import { generateKeysInRange, KEYBOARD_CONFIGS } from '../utils/musicHelpers';

export default function Keyboard({
  activeNotes = [],           // Physically pressed MIDI notes
  sustainedNotes = [],        // Notes sustained by pedal
  sustainedNoteDurations = {},// Individual remaining seconds for each sustained note
  sustainDecayTime = 4.0,     // Configured decay time
  keySignature = 'C',         // Active key signature
  keyCount = 61,              // 25, 49, 61, 76, 88
  keyHeight = null,           // Height in px or null for auto full-height
  labelMode = 'c-only',       // 'c-only', 'all', 'none'
  scaleNotes = [],            // Array of pitch classes in active scale
  accentColor = '#00fff2',    // Custom user color
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

  // Generate key list and layout calculations based on keyCount and keySignature
  const { whiteKeys, blackKeys, totalWhiteKeys } = useMemo(() => {
    const config = KEYBOARD_CONFIGS[keyCount] || KEYBOARD_CONFIGS[61];
    const { keys, totalWhiteKeys } = generateKeysInRange(config.startMidi, config.endMidi, keySignature);

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
  }, [keyCount, keySignature]);

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

  // Compute readable label text color on pressed keys (dark text on bright cyan/white, white text on blue/magenta)
  const isAccentLight = useMemo(() => {
    const clean = (accentColor || '#00fff2').replace('#', '');
    if (clean.length !== 6) return true;
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) > 155;
  }, [accentColor]);
  const pressedLabelClass = isAccentLight ? 'text-[#040710] font-black' : 'text-white font-black';

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
                const inScale = scaleNotes.length > 0 && scaleNotes.includes(k.pitchClass);
                const noteDuration = sustainedNoteDurations[k.midi] || sustainDecayTime || 4.0;

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
                    className={`flex-1 h-full border-r ${whiteKeyBorder} rounded-b-md flex flex-col justify-end items-center pb-2 cursor-pointer transition-all duration-75 relative white-key overflow-hidden select-none`}
                    style={{
                      width: `${100 / totalWhiteKeys}%`,
                      background: `linear-gradient(to bottom, #ffffff 0%, ${whiteKeyNormal} 80%, #e2e8f0 100%)`
                    }}
                  >
                    {/* Active / Sustained Natural Acoustic Decay Overlay */}
                    {(isPressed || isSustained) && (
                      <div
                        key={`overlay-${k.midi}-${isPressed ? 'pressed' : 'sustained'}`}
                        className="absolute inset-0 pointer-events-none rounded-b-md z-0"
                        style={{
                          background: isPressed 
                            ? `linear-gradient(to bottom, ${hexToRgba(accentColor, 0.45)} 0%, ${hexToRgba(accentColor, 0.8)} 60%, ${accentColor} 100%)` 
                            : `linear-gradient(to bottom, ${hexToRgba(accentColor, 0.15)} 0%, ${hexToRgba(accentColor, 0.45)} 65%, ${accentColor} 100%)`,
                          boxShadow: isPressed 
                            ? `0 0 16px ${hexToRgba(accentColor, 0.85)}, inset 0 0 12px ${hexToRgba(accentColor, 0.5)}, 0 4px 8px rgba(0,0,0,0.3)` 
                            : `0 0 12px ${hexToRgba(accentColor, 0.4)}`,
                          animation: isSustained && sustainDecayTime < 999 
                            ? `sustainFadeOut ${noteDuration}s cubic-bezier(0.25, 1, 0.5, 1) forwards` 
                            : undefined
                        }}
                      />
                    )}

                    {/* Glowing Top Activation Strip on Pressed White Key */}
                    {isPressed && (
                      <div 
                        className="absolute top-0 left-0 right-0 h-1.5 z-10 animate-pulse pointer-events-none"
                        style={{ backgroundColor: accentColor, boxShadow: `0 0 8px ${accentColor}` }}
                      />
                    )}

                    {/* Scale Guide Marker Dot */}
                    {inScale && !isPressed && !isSustained && (
                      <div 
                        className="w-1.5 h-1.5 rounded-full mb-1 opacity-60 z-10"
                        style={{ backgroundColor: accentColor }}
                        title={`Nota de escala: ${k.pitchClass}`}
                      />
                    )}

                    {/* Middle C Dot Indicator */}
                    {isMiddleC && !inScale && (
                      <div 
                        className="w-1.5 h-1.5 rounded-full mb-1 z-10"
                        style={{ backgroundColor: isPressed ? '#ffffff' : (theme?.middleCDot || '#64748b') }}
                        title="Do Central (C4)"
                      />
                    )}

                    {/* Note Label */}
                    {showLabel && (
                      <span 
                        className={`text-[10px] sm:text-xs font-mono font-bold tracking-tight select-none z-10 transition-colors ${
                          isPressed
                            ? `${pressedLabelClass} scale-110 drop-shadow-sm`
                            : isSustained
                              ? (isAccentLight ? 'text-[#040710] font-bold' : 'text-white font-bold')
                              : k.isC
                                ? (theme?.cKeyColor || 'text-[#0068ff] font-extrabold')
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

              const inScale = scaleNotes.length > 0 && scaleNotes.includes(k.pitchClass);
              const noteDuration = sustainedNoteDurations[k.midi] || sustainDecayTime || 4.0;

              return (
                <div
                  key={k.midi}
                  onPointerDown={(e) => handleKeyPointerDown(k.midi, e)}
                  onPointerEnter={() => handleKeyPointerEnter(k.midi)}
                  onPointerUp={() => handleKeyPointerUpOrLeave(k.midi)}
                  onPointerLeave={() => handleKeyPointerUpOrLeave(k.midi)}
                  className="absolute top-0 h-[62%] rounded-b-md z-10 cursor-pointer transition-all duration-75 flex flex-col justify-end items-center pb-2 select-none black-key overflow-hidden"
                  style={{
                    left: `${leftPct}%`,
                    width: `${blackWidthPct}%`,
                    background: theme?.blackKeyNormal || 'linear-gradient(to bottom, #1e293b 0%, #0f172a 60%, #020617 100%)',
                    boxShadow: isPressed 
                      ? `${glowShadow}, inset 0 -3px 6px rgba(0,0,0,0.4)` 
                      : isSustained 
                        ? sustainedGlowShadow 
                        : undefined
                  }}
                >
                  {/* Active / Sustained Natural Acoustic Decay Overlay for Black Keys */}
                  {(isPressed || isSustained) && (
                    <div
                      key={`overlay-black-${k.midi}-${isPressed ? 'pressed' : 'sustained'}`}
                      className="absolute inset-0 pointer-events-none rounded-b-md z-0"
                      style={{
                        background: isPressed 
                          ? accentColor 
                          : hexToRgba(accentColor, 0.75),
                        boxShadow: isPressed 
                          ? glowShadow 
                          : sustainedGlowShadow,
                        animation: isSustained && sustainDecayTime < 999 
                          ? `sustainFadeOut ${noteDuration}s cubic-bezier(0.25, 1, 0.5, 1) forwards` 
                          : undefined
                      }}
                    />
                  )}

                  {/* Scale Guide Marker Dot for Black Keys */}
                  {inScale && !isPressed && !isSustained && (
                    <div 
                      className="w-1.5 h-1.5 rounded-full mb-1 opacity-70 z-10"
                      style={{ backgroundColor: accentColor }}
                      title={`Nota de escala: ${k.pitchClass}`}
                    />
                  )}

                  {(isPressed || isSustained) && (
                    <span className={`text-[9px] font-mono pb-0.5 z-10 select-none ${pressedLabelClass}`}>
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
