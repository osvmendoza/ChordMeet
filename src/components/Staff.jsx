import React, { useEffect, useRef } from 'react';
import { Renderer, Stave, StaveNote, Formatter, StaveConnector, Accidental, Voice } from 'vexflow';
import { midiToVexFlowSpec } from '../utils/musicHelpers';

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
  const staffCanvasBg = theme?.staffCanvasBg || 'bg-slate-950/40 rounded-xl';

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous SVG contents
    containerRef.current.innerHTML = '';

    const width = containerRef.current.clientWidth || 460;
    const containerHeight = containerRef.current.clientHeight || 230;
    const height = Math.max(containerHeight, 220);
    const staveWidth = Math.max(width - 40, 280);

    // Initialize VexFlow SVG Renderer
    const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
    renderer.resize(width, height);
    const context = renderer.getContext();

    // Set colors from theme
    context.setFillStyle(staffColor);
    context.setStrokeStyle(staffLineColor);
    context.setLineWidth(1.2);

    // Vertical alignment calculation
    const trebleY = Math.max(10, Math.floor((height - 200) / 2));
    const bassY = trebleY + 105;

    // 1. Create Treble Stave (Clave de Sol)
    const staveTreble = new Stave(25, trebleY, staveWidth);
    staveTreble.addClef('treble');
    if (keySignature && keySignature !== 'C') {
      staveTreble.addKeySignature(keySignature);
    }
    staveTreble.setContext(context).draw();

    // 2. Create Bass Stave (Clave de Fa)
    const staveBass = new Stave(25, bassY, staveWidth);
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

      // Standard VexFlow harmonic accidental application adhering to key signature
      Accidental.applyAccidentals([voiceTreble], keySignature);
      Accidental.applyAccidentals([voiceBass], keySignature);

      // Format and align notes horizontally
      const startX = Math.max(staveTreble.getNoteStartX(), staveBass.getNoteStartX()) + 15;
      const availableWidth = staveWidth - (startX - 25) - 25;

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
    <div className="w-full h-full flex items-center justify-center p-2 select-none overflow-hidden relative">
      <div 
        className={`w-full h-full flex justify-center items-center select-none p-1 sm:p-2 rounded-xl transition-all overflow-hidden ${staffCanvasBg}`}
      >
        <div ref={containerRef} className="staff-container w-full h-full flex justify-center items-center overflow-hidden" />
      </div>
    </div>
  );
}
