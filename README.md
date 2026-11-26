# 🎹 ChordMeet — Estación Visual y Teórica de Piano en Tiempo Real

> **Suite interactiva de análisis armónico, notación en pentagrama (Grand Staff), visualización de teclado y monitoreo multicámara en tiempo real vía Web MIDI y WebRTC.** Diseñada para pianistas, estudiantes de armonía moderna, docentes musicales, productores y creadores de contenido.

---

## 📑 Tabla de Contenidos
1. [Visión General y Misión](#-visión-general-y-misión)
2. [Arquitectura del Sistema](#-arquitectura-del-sistema)
3. [Alcance y Características Principales](#-alcance-y-características-principales)
   - [1. Diseño Modular en 4 Cuadrantes y Fusión de Paneles](#1-diseño-modular-en-4-cuadrantes-y-fusión-de-paneles)
   - [2. Motor Armónico y Detección de Acordes Inteligente](#2-motor-armónico-y-detección-de-acordes-inteligente)
   - [3. Pentagrama en Tiempo Real (Grand Staff con VexFlow 4)](#3-pentagrama-en-tiempo-real-grand-staff-con-vexflow-4)
   - [4. Teclado Interactivo de 61 Teclas (C1 a C6)](#4-teclado-interactivo-de-61-teclas-c1-a-c6)
   - [5. Módulo de Cámara de Video (Cámaras Web en Tiempo Real)](#5-módulo-de-cámara-de-video-cámaras-web-en-tiempo-real)
   - [6. Simulación Física Acústica del Pedal de Sustain (CC 64)](#6-simulación-física-acústica-del-pedal-de-sustain-cc-64)
   - [7. Herramientas Integradas de Práctica y Producción](#7-herramientas-integradas-de-práctica-y-producción)
   - [8. Sintetizador Web Audio Polifónico Incorporado](#8-sintetizador-web-audio-polifónico-incorporado)
4. [Temas Visuales Calibrados y Modo Minimalista](#-temas-visuales-calibrados-y-modo-minimalista)
5. [Tecnologías Utilizadas](#-tecnologías-utilizadas)
6. [Estructura del Proyecto](#-estructura-del-proyecto)
7. [Guía de Uso y Atajos de Teclado](#-guía-de-uso-y-atajos-de-teclado)
8. [Límites Actuales del Proyecto](#-límites-actuales-del-proyecto)
9. [Escalabilidad y Roadmap Futuro](#-escalabilidad-y-roadmap-futuro)
10. [Instalación y Despliegue](#-instalación-y-despliegue)
11. [Licencia](#-licencia)

---

## 🎯 Visión General y Misión

### ¿Qué es ChordMeet?
**ChordMeet** es una aplicación web de alto rendimiento que conecta un teclado MIDI físico (o virtual) y dispositivos de video en una sola interfaz sincronizada y sin latencia perceptible. Integra en una misma pantalla modular:
- Identificación de acordes en tiempo real con armonización enarmónica y estándar contemporáneo.
- Grabado de partitura profesional en doble pentagrama (Clave de Sol y Fa con VexFlow 4).
- Representación visual del teclado de 5 octavas (61 teclas) con iluminación orgánica diferenciada.
- Módulo de cámara WebRTC con rotación en 90°, modo espejo y controles discretos por cursor (*hover-only*).
- Simulación acústica del comportamiento físico de apagadores y resonancia del pedal de sustain.
- Suite de metrónomo digital, grabador/looper MIDI e historial de progresiones.

### Misión
Democratizar y clarificar el aprendizaje y la enseñanza de la armonía contemporánea y el piano clásico/jazz. ChordMeet busca eliminar la fricción entre la ejecución táctil en el instrumento y su comprensión conceptual abstracta (notación musical, inversiones, extensiones armónicas y funciones tonales), ofreciendo un entorno visual minimalista, libre de distracciones y personalizable para clases presenciales, transmisiones educativas (OBS Studio, Google Meet) o sesiones de estudio personal.

---

## 🏛 Arquitectura del Sistema

ChordMeet opera bajo un flujo de datos unidireccional y reactivo impulsado por APIs nativas W3C: **Web MIDI**, **WebRTC MediaDevices** y **Web Audio API**:

```mermaid
flowchart TD
    subgraph Hardware_O_Virtual ["Entradas de Hardware & Dispositivos"]
        MIDI["Controlador MIDI USB / Bluetooth\n(ej. Yamaha PSR-E383)"]
        WEBCAM["Cámaras Web USB / Integradas\n(Rostro del profesor / Vista cenital de manos)"]
        QWERTY["Teclado de Computadora (QWERTY Virtual)"]
        TOUCH["Pantalla Táctil / Clics de Mouse"]
    end

    subgraph Core_Engine ["Capa de Control & Motores"]
        UWM["useWebMidi Hook"]
        FILTER["Filtro de Canal MIDI (Canal 1 / Omni)"]
        SUSTAIN_ENGINE["Motor Acústico de Sustain (Decaimiento Gradual)"]
        SYNTH["AudioSynth (Osciladores Triangle/Sine)"]
        MEDIA_STREAM["WebRTC MediaDevices API (getUserMedia / enumerateDevices)"]
    end

    subgraph State_Management ["Estado Reactivo Central (App.jsx)"]
        ACTIVE_NOTES["activeNotes / allAudibleNotes"]
        KEY_SIG["Tonalidad Activa (Key Signature)"]
        QUADRANTS["Sistema de 4 Cuadrantes & Divisores Cartesianos"]
        THEME_STATE["Temas Visuales Calibrados & Acentos"]
    end

    subgraph UI_Panels ["Módulos Visuales (Widgets Independientes)"]
        CHORD_DISP["ChordDisplay\n(Tonal.js + Priorización Inversiones)"]
        STAFF_DISP["Staff Grand Staff\n(VexFlow 4 SVG Renderer)"]
        KEYBOARD_DISP["Keyboard 61 Teclas\n(C1-C6 con Iluminación Orgánica)"]
        CAMERA_WIDGET["CameraWidget\n(Video HD, Rotación 90°, Espejo, Hover UI)"]
        PEDAL_WIDGET["SustainPedal 3D Graphic\n(CC 64 + Polaridad)"]
        METRONOME_WIDGET["Metronome\n(Audio Clicks + Tap Tempo)"]
        RECORDER_WIDGET["MidiRecorder & Looper\n(Captura con Timestamps)"]
        HISTORY_WIDGET["ChordHistory\n(Secuencia de Progresión)"]
    end

    MIDI -->|MIDI Event bytes| FILTER
    FILTER --> UWM
    QWERTY --> UWM
    TOUCH --> UWM
    WEBCAM --> MEDIA_STREAM

    UWM --> SUSTAIN_ENGINE
    UWM --> SYNTH
    UWM --> ACTIVE_NOTES

    ACTIVE_NOTES --> CHORD_DISP
    ACTIVE_NOTES --> STAFF_DISP
    ACTIVE_NOTES --> KEYBOARD_DISP
    ACTIVE_NOTES --> RECORDER_WIDGET
    ACTIVE_NOTES --> HISTORY_WIDGET
    MEDIA_STREAM --> CAMERA_WIDGET

    KEY_SIG --> CHORD_DISP
    KEY_SIG --> STAFF_DISP
    KEY_SIG --> KEYBOARD_DISP
    THEME_STATE --> UI_Panels
```

---

## 🚀 Alcance y Características Principales

### 1. Diseño Modular en 4 Cuadrantes y Fusión de Paneles
La interfaz rompe con las estructuras rígidas de los softwares de audio tradicionales mediante un lienzo matricial dinámico:
- **División Cartesiana de 2 Ejes (X / Y):** El usuario ajusta libremente el porcentaje de ancho y alto de los paneles arrastrando los divisores centrales (rango del 15% al 85%).
- **Modos de Fusión Inteligente (`Layout Modes`):**
  - **`grid` (2x2):** 4 cuadrantes independientes.
  - **`merge-bottom` (Recomendado para Piano):** 2 cuadrantes superiores (ej. Acordes + Pentagrama o Acordes + Cámara de Manos) y 1 cuadrante inferior fusionado al 100% de ancho para el teclado interactivo.
  - **`merge-top`:** Panel superior combinado al ancho completo con 2 cuadrantes inferiores.
  - **`merge-left` / `merge-right`:** Paneles verticales combinados a pantalla completa.
- **Drag & Drop Interactivo:** Las pestañas de cada cuadrante pueden arrastrarse entre sí para intercambiar sus posiciones de manera intuitiva.
- **Selector de Widgets por Zona:** Cada cuadrante cuenta con un selector desplegable para montar cualquiera de los **8 módulos disponibles** o dejar el cuadrante en modo vacío (`empty`).

---

### 2. Motor Armónico y Detección de Acordes Inteligente
A diferencia de detectores de acordes genéricos que arrojan nombres descontextualizados, ChordMeet incorpora un motor de análisis musical refinado:
- **Alineación con la Tonalidad (`Harmonic Key Alignment`):** Adapta enarmónicamente las notas y fundamentales según la tonalidad activa (ej. en tonalidad de La Mayor con 3 sostenidos, un acorde `C# - F - G# - B` se analiza como **`C#7`** con bajo en Do sostenido, en lugar de `Db7`).
- **Priorización de Inversiones sobre Acordes Aumentados (`#5`):** Resuelve el problema común de motores algorítmicos (como Tonal.js) que priorizan `Em#5` al detectar `E - G - C`. ChordMeet reconoce la jerarquía musical promoviendo inmediatamente la inversión de tríada:
  - Disposición `E - G - C` $\rightarrow$ Acorde Principal: **`C / E`** (con `E-#5` conservado en alternativas).
  - Disposición `G - C - E` $\rightarrow$ Acorde Principal: **`C / G`** (segunda inversión).
  - Disposición `E - G - C - D` $\rightarrow$ Acorde Principal: **`Cadd9 / E`**.
- **Limpieza de Nomenclatura Mayor:** Se eliminan caracteres redundantes en tríadas y acordes con bajo alterno (ej. `CMadd9` $\rightarrow$ **`Cadd9`**; `CM / G` $\rightarrow$ **`C / G`**).
- **Notación Jazzística para Acordes Menores (`-`):** Se sustituye la letra `m` por el estándar internacional de jazz (signo menos):
  - Do menor: **`C-`**
  - Mi menor 9: **`E-9`**
  - Do menor 7 semidisminuido: **`C-7b5`**
  - La menor 7 con bajo en Do: **`A-7 / C`**
- **Soporte de Intervalos y Notas Aisladas:** Al tocar una nota, indica su nombre, alteraciones y octava exacta (`Nota C • Octava 1`); con 2 notas nombra el intervalo específico (Segunda menor, Tritono, Quinta justa, etc.).
- **Escalado Fluido Responsivo (`clamp`):** El tamaño tipográfico del acorde se calcula dinámicamente con `clamp(2.5rem, min(8vw, 13vh), 5.5rem)`, adaptándose perfectamente a cualquier proporción de panel y nivel de zoom del navegador.

---

### 3. Pentagrama en Tiempo Real (Grand Staff con VexFlow 4)
Renderizado vectorial SVG de partitura en tiempo real:
- **Gran Pentagrama Acoplado:** Clave de Sol superior (notas $\ge C4$) y Clave de Fa inferior (notas $< C4$) unificadas por llave clásica (*Brace*).
- **Armadura de Clave Dinámica:** Representa fielmente las 12 tonalidades principales con sus alteraciones en la cabecera (de 0 a 6 sostenidos/bemoles).
- **Asignación Enarmónica Automática:** Las alteraciones accidentales en el pentagrama coinciden armónicamente con la tonalidad seleccionada para evitar incongruencias de lectura.
- **Silencios Automáticos:** En ausencia de notas en alguna de las claves, dibuja silencios de redonda estilizados según el tema visual activo.

---

### 4. Teclado Interactivo de 61 Teclas (C1 a C6)
Optimizado como el estándar más utilizado en pianos digitales portátiles de 5 octavas:
- **Aprovechamiento Total del Ancho (100% Responsive):** El ancho de las teclas blancas y negras se recalcula proporcionalmente para llenar todo el ancho del cuadrante, eliminando márgenes muertos laterales.
- **Rango Canónico y Rotulado de Do:** 
  - La primera tecla física del teclado (MIDI 36) se rotula y procesa como **`C1`**.
  - Octavas completas: **`C1`**, **`C2`**, **`C3`** (Do central con indicador visual de referencia), **`C4`**, **`C5`** y **`C6`** (MIDI 96).
- **Iluminación Orgánica Diferenciada:** Teclas blancas activas con iluminación cálida de fondo visible y teclas negras con brillo neón intenso, evitando la ambigüedad visual de si una tecla blanca está siendo presionada.
- **Interacción Táctil y QWERTY:** Puede tocarse con mouse, pantalla táctil multitáctil o mediante el teclado de la computadora sin hardware adicional.

---

### 5. Módulo de Cámara de Video (Cámaras Web en Tiempo Real)
Diseñado específicamente para docencia en línea y streaming musical pedagógico:
- **Integración WebRTC Nativa:** Permite capturar cualquier cámara web conectada al sistema operativo mediante `MediaDevices.getUserMedia` y `MediaDevices.enumerateDevices`.
- **Soporte Multicámara Simultánea:** El usuario puede instanciar el widget de cámara en múltiples cuadrantes al mismo tiempo con fuentes de video independientes (por ejemplo: la cámara integrada de la laptop apuntando al rostro del instructor en el cuadrante 1, y una cámara USB cenital enfocada a las manos sobre el piano en el cuadrante 2).
- **Interfaz Inteligente Activada por Cursor (*Hover-Only Controls*):**
  - Para no estorbar la visión de la clase ni ensuciar la transmisión en OBS o Google Meet, la botonera de configuración permanece completamente invisible.
  - Al posar el cursor sobre el cuadrante, los controles se revelan suavemente mediante transiciones CSS, y vuelven a ocultarse al retirar el mouse.
- **Herramientas de Video Avanzadas:**
  - **Rotación en 90° (0°, 90°, 180°, 270°):** Corrige al instante cámaras cenitales o laterales montadas en trípodes o brazos articulados. Aplica un auto-escalado geométrico inteligente para prevenir el recorte de esquinas al girar entre modos horizontal y vertical.
  - **Efecto Espejo (Flip Horizontal):** Invierte horizontalmente la imagen para que los movimientos del pianista correspondan a la vista natural del alumno (mano izquierda a la izquierda y derecha a la derecha).
  - **Modo de Ajuste (Cover vs. Contain):** Permite elegir entre rellenar la totalidad del cuadrante sin bordes negros (*Cover*) o preservar la relación de aspecto completa 16:9 (*Contain*).
  - **Conmutador de Energía (Pausa / Encendido):** Desactiva las pistas de video para liberar consumo de CPU y GPU cuando la cámara no está en uso.
- **Persistencia por Cuadrante:** Los ajustes de dispositivo seleccionado, rotación, modo espejo y encuadre se guardan automáticamente en `localStorage` por ID de cuadrante.

---

### 6. Simulación Física Acústica del Pedal de Sustain (CC 64)
El soporte de pedal en ChordMeet reproduce la mecánica acústica del instrumento:
- **Decaimiento Acústico Gradual con Pedal Presionado:**
  Simula la vibración libre y extinción natural de las cuerdas en un piano acústico real. Al mantener presionado el pedal y tocar notas sucesivas, cada tecla va perdiendo intensidad lumínica y sonora en el orden cronológico en que fue tocada, según el tiempo de decaimiento seleccionado:
  - `2.0s` (Rápido / Estudio seco)
  - `3.5s` (Piano vertical)
  - `4.0s` (Estándar equilibrado)
  - `5.0s` (Piano de cola acústico)
  - `8.0s` (Gran cola de concierto)
  - `12.0s` (Catedral / Ambiente expansivo)
  - `Infinito` (Comportamiento clásico de sintetizador digital: hasta soltar el pedal)
- **Apagado Instantáneo al Soltar el Pedal:** Al soltar el pedal, los apagadores virtuales caen inmediatamente sobre las cuerdas, silenciando y limpiando del pentagrama y teclado todas las notas que ya no están físicamente retenidas por los dedos.
- **Filtro de Canal MIDI Dedicado (Canal 1 / Omni):** Resuelve el problema común de controladores que envían señales CC duplicadas o en canales secundarios que colapsan el pedal en DAWs o navegadores web.
- **Inversión de Polaridad:** Compatible con pedales de contacto normalmente abierto o normalmente cerrado (Polaridad Normal / Invertida con un solo clic).

---

### 7. Herramientas Integradas de Práctica y Producción
- **Progresión Armónica (`ChordHistory`):** Registra cronológicamente la secuencia de acordes tocados, destacando con animación el acorde más reciente. Incluye botón para copiar la progresión en texto al portapapeles (`C  ➔  Fmaj7  ➔  G7  ➔  A-`).
- **Metrónomo Digital:**
  - Control de BPM ajustable (30 a 280 BPM) con botones de incremento fino ($\pm 1$) y saltos rápidos ($\pm 5$).
  - Métrica de compás configurable (2/4, 3/4, 4/4, 6/8).
  - Clic sintetizado con frecuencia aguda distintiva en el primer pulso (*Downbeat*) y más grave en pulsos débiles.
  - Botón de **Tap Tempo** con cálculo algorítmico de cadencia promedio.
- **Grabadora y Looper MIDI (`MidiRecorder`):**
  - Grabación de interpretaciones con marcas de tiempo en milisegundos.
  - Reproducción exacta de eventos *Note On* y *Note Off*.
  - Función de repetición en bucle (*Looper*) para improvisar sobre bases de acordes.
  - Indicador de progreso visual en barra de tiempo.

---

### 8. Sintetizador Web Audio Polifónico Incorporado
No requiere plugins externos ni software adicional para sonar:
- Síntesis de modelado sustractivo con oscilador doble: **Onda Triangular** (cuerpo armónico cálido del piano) y **Onda Sinusoidal** (claridad en la frecuencia fundamental).
- Curvas de ganancia con ataque instantáneo de macillo (8 ms) y caída exponencial de resonancia.
- Filtro paso bajo (`BiquadFilter`) adaptativo que suaviza los agudos según la octava.
- Control de volumen maestro y conmutador rápido de silencio (*Mute*).

---

## 🎨 Temas Visuales Calibrados y Modo Minimalista

ChordMeet cuenta con 4 temas cromáticos profundamente calibrados no solo a nivel de colores generales, sino en los materiales de cada widget (chasis de piano, fieltros, pergamino de partituras e insignias):

| Tema | Chasis & Fondo | Pentagrama (Grand Staff) | Teclado & Fieltro | Acentos & Badges | Entorno Ideal |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Estudio Neón** | Cyber Navy `#070b14` con tarjetas `#0d1527` y bordes cian neón | Fondo oscuro con notas y líneas en cian luminoso | Fieltro azul eléctrico, teclas blancas puras y brillo cian intenso | Badges cian luminiscentes y texto de alto contraste | Producción en estudio oscuro y streaming de música moderna |
| **Concierto Clásico** | Madera noble de caoba `#120a05` con tarjetas `#1c120c` y bordes cálidos | **Papel pergamino marfil auténtico (`#fcf8ee`)** con grabado en tinta sepia/carbón tradicional | Fieltro carmesí borgoña tradicional, teclas marfil cálido `#fffbf0` con reflejos dorados | Badges en ámbar cálido y oro antiguo | Pianistas clásicos, recitales y música acústica tradicional |
| **Jazz Lounge** | Terciopelo medianoche `#0d0718` con tarjetas `#160c26` | Fondo nocturno con notas y pentagrama en neón violeta brillante | Fieltro púrpura oscuro aterciopelado, teclas marfil con iluminación lavanda | Badges en púrpura eléctrico y acentos de latón dorado | Clases de armonía moderna, bebop y clubes de jazz |
| **Conservatorio Claro** | Modo diurno de alto contraste, chasis de aluminio cepillado `#e2e8f0` y tarjetas blanco puro `#ffffff` | **Lectura editorial clásica (Henle / Bärenreiter)** con pentagrama blanco inmaculado y tinta negra carbón | Fieltro rojo escarlata de piano vertical y teclas nítidas | Badges en pizarra neutra `#475569` con bordes ultra nítidos | Aulas de clase fuertemente iluminadas y proyectores de video |

> [!TIP]
> **Modo Presentación / Pantalla Limpia:** Presiona la tecla **`H`** en cualquier momento para ocultar la barra superior de controles al 100%, dejando únicamente los paneles de música y video en pantalla completa. Presiona **`H`** nuevamente para restaurarla.

---

## 💻 Tecnologías Utilizadas

| Categoría | Tecnología | Versión | Propósito en ChordMeet |
| :--- | :--- | :--- | :--- |
| **Core Framework** | React | `^18.3.1` | Gestión del ciclo de vida, estado reactivo, hooks y modularidad |
| **Bundler & Tooling** | Vite | `^6.0.7` | Entorno de desarrollo ultrarrápido y empaquetado optimizado con Rollup |
| **Music Engraving** | VexFlow | `^4.2.4` | Renderizado SVG vectorial del Gran Pentagrama y notas musicales |
| **Music Theory** | @tonaljs/tonal | `^4.10.0` | Identificación armónica, claves, intervalos y cálculo de escalas |
| **Estilos & UI** | Tailwind CSS | `^3.4.17` | Utilidades de diseño responsivo, cuadrículas fluidas y animaciones |
| **Iconografía** | Lucide React | `^0.469.0` | Iconografía vectorial SVG coherente y ligera |
| **Hardware Audio/MIDI** | Web MIDI API | Nativa W3C | Comunicación directa con pianos y controladores USB/Bluetooth |
| **Captura de Video** | WebRTC MediaDevices | Nativa W3C | Acceso a cámaras web y transmisión en vivo sin latencia |
| **Generación Sonora** | Web Audio API | Nativa W3C | Síntesis acústica polifónica y clics de metrónomo con precisión de sample |

---

## 📁 Estructura del Proyecto

```text
ChordMeet/
├── index.html                   # Punto de entrada HTML5 y viewport
├── package.json                 # Dependencias y scripts de construcción
├── tailwind.config.js           # Configuración de Tailwind CSS
├── vite.config.js               # Configuración de Vite y plugins de React
│
└── src/
    ├── main.jsx                 # Bootstrap de la aplicación React
    ├── App.jsx                  # Coordinador central de estado, cuadrantes y eventos
    ├── index.css                # Estilos globales y capas personalizadas de Tailwind
    │
    ├── hooks/
    │   └── useWebMidi.js        # Hook de conexión MIDI, filtro de canales y motor de sustain
    │
    ├── components/
    │   ├── HeaderControls.jsx   # Barra superior de configuración rápida y dispositivos
    │   ├── QuadrantContainer.jsx# Contenedor modular con pestañas arrastrables y selector de widgets
    │   ├── ChordDisplay.jsx     # Detector armónico, formateo de acordes y priorización de inversiones
    │   ├── Staff.jsx            # Renderizador de Gran Pentagrama con VexFlow 4
    │   ├── Keyboard.jsx         # Teclado interactivo de 61 teclas responsive (C1-C6)
    │   ├── CameraWidget.jsx     # Captura de video WebRTC (cámaras de rostro/manos con rotación, espejo y controles hover)
    │   ├── SustainPedal.jsx     # Pedal 3D con indicador de CC 64, decaimiento y polaridad
    │   ├── Metronome.jsx        # Metrónomo digital con control de compás y tap tempo
    │   ├── MidiRecorder.jsx     # Grabadora, reproductor y looper de eventos MIDI
    │   ├── ChordHistory.jsx     # Historial cronológico de acordes con exportación
    │   └── LayoutPresetsModal.jsx # Selector de presets de distribución de cuadrantes
    │
    └── utils/
        ├── audioSynth.js        # Sintetizador polifónico y generador de audio clicks
        ├── musicHelpers.js      # Helpers teóricos, mapeo enarmónico y cálculo de teclas
        └── themeConfig.js       # Paletas cromáticas de temas (Studio, Classic, Jazz, Light)
```

---

## ⌨️ Guía de Uso y Atajos de Teclado

### Conexión de tu Piano o Controlador MIDI
1. Conecta tu teclado MIDI por cable USB o interfaz MIDI-USB a tu computadora antes de abrir la aplicación.
2. Abre ChordMeet en un navegador compatible (Chrome, Edge, Brave u Opera).
3. El navegador solicitará permisos de acceso MIDI y Cámara: haz clic en **Permitir**.
4. En la barra superior, verás el nombre de tu teclado detectado en el selector de dispositivos.

### Mapeo de Teclado de Computadora (Modo Virtual QWERTY)
Si no tienes un teclado MIDI a mano, puedes tocar notas en ChordMeet directamente con tu teclado físico:

| Tecla QWERTY | Nota Musical | Octava | Tecla QWERTY | Nota Musical | Octava |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **`A`** | Do ($C$) | $C4$ (Do Central) | **`W`** | Do# ($C\#$) | $C\#4$ |
| **`S`** | Re ($D$) | $D4$ | **`E`** | Re# ($D\#$) | $D\#4$ |
| **`D`** | Mi ($E$) | $E4$ | — | — | — |
| **`F`** | Fa ($F$) | $F4$ | **`T`** | Fa# ($F\#$) | $F\#4$ |
| **`G`** | Sol ($G$) | $G4$ | **`Y`** | Sol# ($G\#$) | $G\#4$ |
| **`H`** | La ($A$) | $A4$ | **`U`** | La# ($A\#$) | $A\#4$ |
| **`J`** | Si ($B$) | $B4$ | — | — | — |
| **`K`** | Do ($C$) | $C5$ | **`O`** | Do# ($C\#$) | $C\#5$ |
| **`L`** | Re ($D$) | $D5$ | **`P`** | Re# ($D\#$) | $D\#5$ |
| **`;`** | Mi ($E$) | $E5$ | — | — | — |
| **`Espacio`** | **Pedal Sustain** | Conmuta pedal | **`H`** | **Ocultar Barra** | Muestra/Oculta navbar |

---

## ⚠️ Límites Actuales del Proyecto

Para mantener un criterio de ingeniería claro y transparente, se documentan las limitaciones técnicas actuales:

1. **Compatibilidad de Navegadores con Web MIDI API:**
   - Funciona de forma óptima y nativa en navegadores basados en **Chromium** (Google Chrome, Microsoft Edge, Brave, Opera).
   - En **Firefox** y **Safari**, la Web MIDI API requiere configuraciones experimentales avanzadas o flags del sistema, ya que sus motores restringen de forma predeterminada el acceso directo a hardware MIDI por políticas de privacidad.
2. **Generación de Audio por Síntesis vs. Samples Reales:**
   - El sintetizador interno utiliza osciladores de Web Audio API para asegurar carga instantánea y cero latencia sin descargas pesadas. No sustituye librerías multisampleadas de gigabytes (como Kontakt o SoundFonts SFZ de alta resolución acústica).
3. **Análisis Armónico Basado en Reglas Teóricas:**
   - La detección armónica se basa en teoría musical clásica y de jazz estática mediante distancias interválicas y tonalidad predefinida. No utiliza redes neuronales predictivas para deducir intenciones armónicas en pasajes politonales de vanguardia o atonalidad extendida.
4. **Rango de Teclado Fijo a 61 Teclas:**
   - Para maximizar el espacio útil en pantalla sin obligar a deslizar horizontalmente, el teclado visual está calibrado a 61 teclas ($C1$ a $C6$). Las notas MIDI físicas fuera de este rango son recibidas y procesadas por el detector de acordes y el pentagrama, pero no tienen una tecla visual renderizada en el teclado inferior.
5. **Permisos de Cámara en Conexiones Seguras:**
   - El módulo WebRTC de cámara requiere que la aplicación se sirva a través de un contexto seguro (`HTTPS` o `localhost`), según las especificaciones de seguridad de los navegadores modernos.

---

## 📈 Escalabilidad y Roadmap Futuro

ChordMeet está concebido arquitectónicamente para expandirse en módulos de nivel profesional:

```mermaid
flowchart LR
    A["ChordMeet v1.1 (Actual)\n• Web MIDI 61 teclas\n• VexFlow Grand Staff\n• Acordes Tonal.js + Inversiones\n• Sustain Acústico\n• Cámara WebRTC con Rotación"] 
    --> B["Fase 2: Audio de Alta Fidelidad\n• Motor SoundFonts SF2\n• AudioWorklet dedicado\n• Ecualizador paramétrico"]
    --> C["Fase 3: Entrenador Interactivo\n• Reconocimiento de micrófono\n• Lectura a primera vista\n• Dictado de intervalos"]
    --> D["Fase 4: Colaboración & Exportación\n• Sesiones remotas WebRTC\n• Exportación MIDI y MusicXML\n• Compatibilidad DAW VST/AU"]
```

---

## 🛠 Instalación y Despliegue

### Requisitos Previos
- **Node.js:** Versión 18.0.0 o superior instalada.
- **NPM** o **Yarn / PNPM**.
- Navegador recomendado: Google Chrome o Microsoft Edge.

### Pasos de Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/osvmendoza/ChordMeet
   cd ChordMeet
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar el servidor de desarrollo local:**
   ```bash
   npm run dev
   ```
   La aplicación se abrirá en `http://localhost:5173`.

4. **Compilar para producción:**
   ```bash
   npm run build
   ```
   Los archivos estáticos ultraoptimizados y minificados se generarán en la carpeta `dist/`.

5. **Previsualizar la compilación de producción:**
   ```bash
   npm run preview
   ```

---

## 📄 Licencia

Este proyecto está disponible bajo la licencia **MIT**. Eres libre de usarlo, modificarlo y adaptarlo para propósitos personales, educativos o comerciales respetando los términos de autoría.