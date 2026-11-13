# Technical Architecture & Project Structure: Abandoned but Not Forgotten - 3D Space Map

This document defines the architectural specifications adapted for the NASA Space Apps Challenge. 

**Coding Guideline:** All provided code implementations must strictly use an indentation of 4 spaces to ensure structural readability across complex nested components and 3D graphs.

## 1. NASA Space Apps Challenge Context

This project is designed as an engaging, story-driven educational tool targeted at school-age space enthusiasts. 

**Guiding Principles & End Goals:**
*   **Educational Storytelling:** Move beyond dense technical lists to translate historical and scientific data into a captivating narrative. 
*   **Connecting Engineering to Science:** Clearly demonstrate how specific hardware (probes, rovers, landers) paved the way for human knowledge, ensuring historical and scientific accuracy.
*   **Inspiring Connection:** Allow users to feel a personal connection to the silent, discarded monuments of human exploration scattered across the Moon and Mars.

## 2. Core Project Pillars

To achieve the hackathon's objectives, the application is built around three core interactive pillars:

### I. Navigation & Discovery
Users explore a 3D digital-twin map of Mars (or the Moon) to discover the resting places of NASA's discarded equipment. 
*   **Dual-View Mapping:** The map can be toggled between a 3D spherical Globe view and a Flat Map projection.
*   **Discovery Markers:** Abandoned hardware is marked with interactive pins that auto-hide when occluded by the planet's horizon.

### II. Equipment Interaction & Immersion
Upon clicking a discovery pin, the user is presented with two ways to interact with the historical artifact:
*   **Inspection Mode (Orbital/Object View):** The user can rotate, pan, and zoom around a high-fidelity 3D model of the equipment. A UI panel displays technical specifications, mission histories, and scientific accomplishments.
*   **First-Person Surface Mode:** To grasp the true scale of the hardware, users are transported to the planet's surface. They can walk around the equipment in first-person as an astronaut, increasing immersion and spatial awareness.

### III. Degradation Simulations
To highlight the harsh realities of space, users can trigger future wear-and-tear simulations on the equipment.
*   **Environmental Factors:** Simulate physical degeneration caused by Martian sandstorms, extreme solar radiation, and dust accumulation.
*   **Real-time Telemetry:** As the simulation runs, a live feed outputs the ongoing damage (e.g., "Solar panels covered by 40% dust", "Thermal shielding degrading").
*   **Visual Indicators:** Custom GLSL shaders dynamically alter the equipment's textures, adding sand layers, rust, and physical weathering.

## 3. 4-Layer System Architecture Matrix

| Architecture Layer | Core Technology | Main Technical Responsibilities | Representative Files |
| :--- | :--- | :--- | :--- |
| **1. Rendering & Scene Graph** | Three.js, React Three Fiber, React Postprocessing | Manages the frame loop, PBR lighting, atmospheric scattering, and **Degradation Shaders** (dynamically blending dust/wear maps based on simulation state). | `MarsCanvas.tsx`, `DegradationMaterial.tsx` |
| **2. Asset & Streaming Pipeline** | Blender glTF, Draco, KTX 2.0 / Basis Universal | Automates compression of discarded equipment models and planetary terrain. Loads assets into VRAM via Web Workers to prevent frame drops. | `compress-assets.mjs`, `AssetStreamManager.ts` |
| **3. State & Interaction Layer** | Zustand, GSAP, PointerLockControls | Manages global state (Map mode, First-Person mode, Degradation timeline). Interpolates camera transitions from orbital view down to astronaut surface view. | `useCosmosStore.ts`, `FirstPersonRig.tsx` |
| **4. Scale & Precision Layer** | WebGLRenderer.logarithmicDepthBuffer, CesiumJS | Eliminates Z-fighting across astronomical scales. Uses CesiumJS for high-fidelity terrain when transitioning into First-Person Surface Mode. | `CesiumMarsBridge.tsx`, `FirstPersonPhysics.ts` |

## 4. Production Directory Tree & File Structure

```text
abandoned-but-not-forgotten/
├── scripts/
│   └── compress-assets.mjs               # Compresses historical NASA equipment models and textures
├── public/
│   └── assets/
│       ├── models/
│       │   ├── discarded/                # opportunity_rover.glb, viking_lander.glb
│       │   └── environment/              # dust_storm_particles.glb
│       └── textures/
│           ├── wear_and_tear/            # dust_accumulation_mask.ktx2, radiation_burn.ktx2
│           └── mars_albedo_8k.ktx2
└── src/
    ├── store/
    │   └── useCosmosStore.ts             # Stores navigation mode, active equipment, degradation state
    ├── core/
    │   ├── canvas/
    │   │   └── MarsCanvas.tsx
    │   ├── camera/
    │   │   ├── SplineCameraRig.tsx       # Handles transitions from Globe -> Object Inspection
    │   │   └── FirstPersonRig.tsx        # PointerLockControls for astronaut surface walking
    │   └── simulation/
    │       └── DegradationEngine.ts      # Calculates wear-and-tear metrics over simulated time
    ├── shaders/
    │   └── degradation/
    │       ├── equipmentWear.vert.glsl
    │       └── equipmentWear.frag.glsl   # Blends base texture with dust/rust based on simulation progress
    ├── scene/
    │   ├── map/
    │   │   ├── DigitalTwinGlobe.tsx      # 3D Globe representation
    │   │   └── DigitalTwinFlat.tsx       # Flat map projection alternative
    │   ├── equipment/
    │   │   ├── HistoricArtifact.tsx      # Applies degradation shaders to the loaded equipment model
    │   │   └── POIMarker3D.tsx           # Map pins for discovery
    │   └── surface/
    │       ├── CesiumMarsBridge.tsx      # Terrain streaming for first-person mode
    │       └── SandstormEffect.tsx       # Particle system for degradation simulation
    └── ui/
        ├── hud/
        │   ├── NavigationToggle.tsx      # Switches between Globe and Flat map
        │   ├── EquipmentTelemetry.tsx    # Displays specs, history, and scientific achievements
        │   └── DegradationControl.tsx    # UI slider and real-time log for the wear-and-tear simulation
        └── styles/
            └── hud.css
```