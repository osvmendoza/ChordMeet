import React, { useEffect, useRef } from 'react';
import { Renderer, Stave, StaveNote, Formatter, StaveConnector, Accidental, Voice } from 'vexflow';
import { midiToVexFlowSpec, KEY_SIGNATURES } from '../utils/musicHelpers';
import { BookOpen } from 'lucide-react';

export default function Staff({
  activeNotes = [],
  keySignature = 'C',
  accentColor = '#38bdf8',
  theme = null
}) {
  const containerRef = useRef(null);

  // Colors based on theme
  const staffColor = theme?.staffColor || '#e2e8f0';
  const staffLineColor = theme?.staffLineColor || '#64748b';
  const staffRestColor = theme?.staffRestColor || '#475569';
  const cardBg = theme?.cardBg || 'bg-slate-900/90 border-slate-800/80 text-slate-100 shadow-xl';
  const cardHeaderBorder = theme?.cardHeaderBorder || 'border-slate-800';
  const subText = theme?.subText || 'text-slate-400';
  const staffCanvasBg = theme?.staffCanvasBg || 'bg-slate-950/40 rounded-xl';

  // Find human-readable label for key signature
  const currentKeyInfo = KEY_SIGNATURES.find((k) => k.id === keySignature) || {
    id: keySignature,
    label: `${keySignature} Maj`
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous SVG contents
    containerRef.current.innerHTML = '';

    const width = containerRef.current.clientWidth || 480;
    const height = 260;
    const staveWidth = Math.max(width - 40, 310);

    // Initialize VexFlow SVG Renderer
    const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
    renderer.resize(width, height);
    const context = renderer.getContext();

    // Set colors from theme
    context.setFillStyle(staffColor);
    context.setStrokeStyle(staffLineColor);
    context.setLineWidth(1.2);

    // 1. Create Treble Stave (Clave de Sol)
    const staveTreble = new Stave(30, 15, staveWidth);
    staveTreble.addClef('treble');
    if (keySignature && keySignature !== 'C') {
      staveTreble.addKeySignature(keySignature);
    }
    staveTreble.setContext(context).draw();

    // 2. Create Bass Stave (Clave de Fa)
    const staveBass = new Stave(30, 125, staveWidth);
    staveBass.addClef('bass');
    if (keySignature && keySignature !== 'C') {
      staveBass.addKeySignature(keySignature);
    }
    staveBass.setContext(context).draw();

    // 3. Connectors (Brace on left, single line on left & right)
    const connectorBrace = new StaveConnector(staveTreble, staveBass);
    connectorBrace.setType(StaveConnector.type.BRACE);
    connectorBrace.setContext(context).draw();

    const connectorLeft = new StaveConnector(staveTreble, staveBass);
    connectorLeft.setType(StaveConnector.type.SINGLE_LEFT);
    connectorLeft.setContext(context).draw();

    const connectorRight = new StaveConnector(staveTreble, staveBass);
    connectorRight.setType(StaveConnector.type.SINGLE_RIGHT);
    connectorRight.setContext(context).draw();

    // 4. Split active notes into Treble (>= 60) and Bass (< 60)
    const trebleSpecs = [];
    const bassSpecs = [];
    const sortedNotes = [...activeNotes].sort((a, b) => a - b);

    sortedNotes.forEach((midi) => {
      const spec = midiToVexFlowSpec(midi, keySignature);
      if (spec.clef === 'treble') {
        trebleSpecs.push(spec);
      } else {
        bassSpecs.push(spec);
      }
    });

    // Helper to build StaveNote
    const buildNote = (specs, clef, defaultRestKey) => {
      if (specs.length === 0) {
        const rest = new StaveNote({
          keys: [defaultRestKey],
          duration: 'wr',
          clef
        });
        rest.setStyle({ fillStyle: staffRestColor, strokeStyle: staffRestColor });
        return rest;
      }

      const keys = specs.map((s) => s.vexKey);
      const note = new StaveNote({
        keys,
        duration: 'w',
        clef
      });

      // Add accidentals if any
      specs.forEach((s, idx) => {
        if (s.acc) {
          note.addModifier(new Accidental(s.acc), idx);
        }
      });

      // Highlight active played notes
      note.setStyle({
        fillStyle: accentColor,
        strokeStyle: accentColor
      });

      return note;
    };

    try {
      // Treble voice
      const trebleNote = buildNote(trebleSpecs, 'treble', 'b/4');
      const voiceTreble = new Voice({ num_beats: 4, beat_value: 4 });
      voiceTreble.setStrict(false);
      voiceTreble.addTickables([trebleNote]);

      // Bass voice
      const bassNote = buildNote(bassSpecs, 'bass', 'd/3');
      const voiceBass = new Voice({ num_beats: 4, beat_value: 4 });
      voiceBass.setStrict(false);
      voiceBass.addTickables([bassNote]);

      // Format and align notes horizontally
      const startX = Math.max(staveTreble.getNoteStartX(), staveBass.getNoteStartX()) + 15;
      const availableWidth = staveWidth - (startX - 30) - 30;

      const formatter = new Formatter();
      formatter.joinVoices([voiceTreble]);
      formatter.joinVoices([voiceBass]);
      formatter.format([voiceTreble, voiceBass], availableWidth);

      // Render voices on their respective staves
      voiceTreble.draw(context, staveTreble);
      voiceBass.draw(context, staveBass);
    } catch (err) {
      console.warn('Error al formatear partitura VexFlow:', err);
    }
  }, [activeNotes, keySignature, accentColor, staffColor, staffLineColor, staffRestColor]);

  return (
    <div className={`flex flex-col h-full rounded-2xl border p-5 transition-all duration-300 ${cardBg}`}>
      {/* Header with Key Signature badge */}
      <div className={`flex items-center justify-between pb-3 border-b ${cardHeaderBorder}`}>
        <div className="flex items-center gap-2">
          <BookOpen className={`w-4 h-4 ${subText}`} />
          <h2 className={`text-xs uppercase tracking-wider font-semibold ${subText}`}>
            Pentagrama en Tiempo Real (Grand Staff)
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span 
            className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full border transition-colors"
            style={{ 
              borderColor: `${accentColor}60`,
              backgroundColor: `${accentColor}15`,
              color: accentColor 
            }}
          >
            Key: {currentKeyInfo.label || `${keySignature} Maj`}
          </span>
        </div>
      </div>

      {/* Notation SVG Canvas with themed background */}
      <div className="flex-1 flex items-center justify-center py-2 overflow-x-auto overflow-y-hidden">
        <div 
          className={`min-w-[320px] w-full flex justify-center items-center select-none py-1 transition-all ${staffCanvasBg}`}
        >
          <div ref={containerRef} className="staff-container w-full flex justify-center" />
        </div>
      </div>

      {/* Footer / Legend */}
      <div className={`pt-2 border-t ${cardHeaderBorder} flex items-center justify-between text-[11px] ${subText}`}>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }}></span>
            Clave de Sol (&ge; C4)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full opacity-60" style={{ backgroundColor: staffLineColor }}></span>
            Clave de Fa (&lt; C4)
          </span>
        </div>
        <span className="font-mono opacity-70">
          VexFlow 4 Engine
        </span>
      </div>
    </div>
  );
}
