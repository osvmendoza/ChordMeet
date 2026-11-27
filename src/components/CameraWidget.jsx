import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Video, 
  VideoOff, 
  FlipHorizontal, 
  RotateCw,
  Maximize2, 
  Minimize2, 
  RefreshCw, 
  AlertCircle,
  Camera
} from 'lucide-react';

export default function CameraWidget({
  instanceId = 'cam1',
  title = 'Cámara',
  defaultMirrored = false,
  defaultDeviceIndex = 0,
  defaultFit = 'cover',
  accentColor = '#00fff2',
  theme = null
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

  // Load preferences from localStorage if previously configured
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(() => {
    return localStorage.getItem(`chordmeet_camera_${instanceId}_device`) || '';
  });
  const [isMirrored, setIsMirrored] = useState(() => {
    const saved = localStorage.getItem(`chordmeet_camera_${instanceId}_mirrored`);
    return saved !== null ? saved === 'true' : defaultMirrored;
  });
  const [rotation, setRotation] = useState(() => {
    const saved = localStorage.getItem(`chordmeet_camera_${instanceId}_rotation`);
    return saved !== null ? parseInt(saved, 10) : 0;
  });
  const [fitMode, setFitMode] = useState(() => {
    return localStorage.getItem(`chordmeet_camera_${instanceId}_fit`) || defaultFit;
  });
  const [isEnabled, setIsEnabled] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [isHovered, setIsHovered] = useState(false);

  const isLight = theme?.mode === 'light';
  const badgeBg = theme?.badgeBg || (isLight ? 'bg-white/90 text-slate-800 border-slate-300' : 'bg-slate-900/90 text-slate-100 border-slate-700/80');

  // Track container dimensions to scale properly during 90/270 deg vertical rotation
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          w: containerRef.current.clientWidth,
          h: containerRef.current.clientHeight
        });
      }
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Enumerate video devices
  const updateDeviceList = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = allDevices.filter((d) => d.kind === 'videoinput');
      setDevices(videoInputs);

      // Auto-assign default device if current selection is empty or not in list
      if (videoInputs.length > 0) {
        setSelectedDeviceId((prev) => {
          const exists = videoInputs.some((d) => d.deviceId === prev);
          if (!exists) {
            const fallbackIndex = Math.min(defaultDeviceIndex, videoInputs.length - 1);
            const chosen = videoInputs[fallbackIndex].deviceId;
            localStorage.setItem(`chordmeet_camera_${instanceId}_device`, chosen);
            return chosen;
          }
          return prev;
        });
      }
    } catch (err) {
      console.warn('Error al enumerar dispositivos de video:', err);
    }
  }, [defaultDeviceIndex, instanceId]);

  // Start video stream
  const startStream = useCallback(async () => {
    if (!isEnabled) return;
    setError(null);

    // Stop prior stream if active
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Tu navegador no soporta captura de video (getUserMedia).');
      return;
    }

    try {
      const constraints = {
        video: selectedDeviceId 
          ? { deviceId: { exact: selectedDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch((e) => console.warn('Error auto-playing video:', e));
          setIsStreaming(true);
        };
      }

      // Re-populate device list with real names (browser exposes labels after permission is granted)
      updateDeviceList();
    } catch (err) {
      console.error('Error al iniciar stream de video:', err);
      setIsStreaming(false);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Acceso denegado a la cámara. Permite el permiso de video en tu navegador.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Cámara en uso por otra aplicación (ej. Zoom o OBS) o bloqueada por Windows.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No se encontró ninguna cámara de video disponible.');
      } else {
        setError(`Error al conectar con la cámara: ${err.message || 'desconocido'}`);
      }
    }
  }, [isEnabled, selectedDeviceId, updateDeviceList]);

  // Handle device change
  const handleSelectDevice = (deviceId) => {
    setSelectedDeviceId(deviceId);
    localStorage.setItem(`chordmeet_camera_${instanceId}_device`, deviceId);
  };

  // Toggle mirror flip
  const handleToggleMirror = () => {
    setIsMirrored((prev) => {
      const next = !prev;
      localStorage.setItem(`chordmeet_camera_${instanceId}_mirrored`, String(next));
      return next;
    });
  };

  // Rotate 90 degrees clockwise (0 -> 90 -> 180 -> 270 -> 0)
  const handleRotate = () => {
    setRotation((prev) => {
      const next = (prev + 90) % 360;
      localStorage.setItem(`chordmeet_camera_${instanceId}_rotation`, String(next));
      return next;
    });
  };

  // Toggle fit mode (cover vs contain)
  const handleToggleFit = () => {
    setFitMode((prev) => {
      const next = prev === 'cover' ? 'contain' : 'cover';
      localStorage.setItem(`chordmeet_camera_${instanceId}_fit`, next);
      return next;
    });
  };

  // Calculate 2D transform scale and rotation
  const getTransform = () => {
    const isVertical = rotation === 90 || rotation === 270;
    let scale = 1;
    const { w, h } = containerSize;
    if (isVertical && w > 0 && h > 0) {
      scale = fitMode === 'contain' ? Math.min(w / h, h / w) : Math.max(w / h, h / w);
    }
    return `scale(${scale.toFixed(4)}) rotate(${rotation}deg) scaleX(${isMirrored ? -1 : 1})`;
  };

  // Toggle enabled/disabled
  const handleTogglePower = () => {
    if (isEnabled) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setIsStreaming(false);
      setIsEnabled(false);
    } else {
      setIsEnabled(true);
    }
  };

  // Watch for start / restart triggers
  useEffect(() => {
    if (isEnabled) {
      startStream();
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setIsStreaming(false);
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [isEnabled, selectedDeviceId, startStream]);

  // Initial device query
  useEffect(() => {
    updateDeviceList();

    const handleDeviceChange = () => {
      updateDeviceList();
    };

    if (navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      };
    }
  }, [updateDeviceList]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-slate-950 overflow-hidden select-none flex items-center justify-center group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Active Video Player */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full transition-transform duration-150 ${
          isStreaming ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          transform: getTransform(),
          objectFit: fitMode
        }}
      />

      {/* Disabled / Powered Off State */}
      {!isEnabled && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2 p-4 text-center bg-slate-950/90 z-10">
          <VideoOff className="w-10 h-10 opacity-40 mb-1" />
          <p className="text-xs font-semibold">{title} pausada</p>
          <button
            onClick={handleTogglePower}
            className="mt-1 px-3 py-1 rounded-lg text-xs font-semibold text-white shadow-md transition-transform active:scale-95"
            style={{ backgroundColor: accentColor }}
          >
            Activar Cámara
          </button>
        </div>
      )}

      {/* Error State */}
      {isEnabled && error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-rose-300 gap-2 p-4 text-center bg-slate-950/95 z-10">
          <AlertCircle className="w-9 h-9 text-rose-500 mb-1" />
          <p className="text-xs font-semibold max-w-xs">{error}</p>
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={startStream}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Reintentar
            </button>
          </div>
        </div>
      )}

      {/* Loading / Connecting Placeholder */}
      {isEnabled && !isStreaming && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2 p-4 text-center bg-slate-950 z-0">
          <Camera className="w-8 h-8 opacity-40 animate-pulse mb-1" style={{ color: accentColor }} />
          <p className="text-xs font-semibold opacity-70">Iniciando {title}...</p>
        </div>
      )}

      {/* Top Floating Controls Bar - Displayed strictly on cursor hover */}
      <div 
        className={`absolute top-2 left-2 right-2 flex items-center justify-between gap-1.5 z-20 transition-all duration-200 ${
          isHovered
            ? 'opacity-100 translate-y-0 pointer-events-auto' 
            : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        {/* Device Selector Pill */}
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg border shadow-lg backdrop-blur-md max-w-[200px] sm:max-w-[260px] ${badgeBg}`}>
          <Camera className="w-3 h-3 shrink-0" style={{ color: accentColor }} />
          <select
            value={selectedDeviceId}
            onChange={(e) => handleSelectDevice(e.target.value)}
            className="bg-transparent text-[11px] font-mono font-medium focus:outline-none cursor-pointer truncate w-full"
            title="Seleccionar dispositivo de video para este cuadrante"
          >
            {devices.length === 0 ? (
              <option value="" className="bg-slate-900 text-slate-200">
                Detectando cámaras...
              </option>
            ) : (
              devices.map((d, idx) => (
                <option key={d.deviceId || idx} value={d.deviceId} className="bg-slate-900 text-slate-200">
                  {d.label || `Cámara ${idx + 1}`}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Action Buttons: Mirror, Fit, Power */}
        <div className="flex items-center gap-1">
          {/* Mirror Toggle Button */}
          <button
            onClick={handleToggleMirror}
            className={`p-1.5 rounded-lg border shadow-lg backdrop-blur-md transition-all ${
              isMirrored
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                : 'bg-slate-900/80 text-slate-400 border-slate-700/80 hover:text-slate-200'
            }`}
            title={isMirrored ? 'Modo Espejo: Activado (Recomendado para Rostro)' : 'Modo Espejo: Desactivado (Recomendado para Manos/Piano)'}
          >
            <FlipHorizontal className="w-3.5 h-3.5" />
          </button>

          {/* Rotate Toggle Button */}
          <button
            onClick={handleRotate}
            className={`p-1.5 rounded-lg border shadow-lg backdrop-blur-md transition-all ${
              rotation !== 0
                ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50'
                : 'bg-slate-900/80 text-slate-400 border-slate-700/80 hover:text-slate-200'
            }`}
            title={`Rotar orientación: ${rotation}° (clic para girar 90°)`}
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          {/* Fit Mode Toggle Button */}
          <button
            onClick={handleToggleFit}
            className={`p-1.5 rounded-lg border shadow-lg backdrop-blur-md transition-all ${
              fitMode === 'contain'
                ? 'bg-sky-500/20 text-sky-400 border-sky-500/50'
                : 'bg-slate-900/80 text-slate-400 border-slate-700/80 hover:text-slate-200'
            }`}
            title={fitMode === 'contain' ? 'Encuadre: Completo (16:9 sin recortar bordes)' : 'Encuadre: Llenar cuadrante (Cover)'}
          >
            {fitMode === 'contain' ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Power On/Off Toggle Button */}
          <button
            onClick={handleTogglePower}
            className={`p-1.5 rounded-lg border shadow-lg backdrop-blur-md transition-all ${
              isEnabled
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                : 'bg-rose-500/20 text-rose-400 border-rose-500/50'
            }`}
            title={isEnabled ? 'Pausar transmisión de esta cámara' : 'Activar transmisión de esta cámara'}
          >
            {isEnabled ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Bottom Subtle Status Pill - Displayed strictly on cursor hover */}
      {isStreaming && (
        <div 
          className={`absolute bottom-2 right-2 pointer-events-none transition-all duration-200 ${
            isHovered
              ? 'opacity-70 translate-y-0' 
              : 'opacity-0 translate-y-2'
          }`}
        >
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-black/60 text-slate-300 border border-white/10 backdrop-blur-sm">
            {rotation !== 0 ? `${rotation}° • ` : ''}{isMirrored ? 'Espejo' : 'Real'} • {fitMode === 'cover' ? 'Llenar' : '16:9'}
          </span>
        </div>
      )}
    </div>
  );
}
