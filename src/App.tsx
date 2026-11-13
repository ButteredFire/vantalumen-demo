import { MarsCanvas } from './core/canvas/MarsCanvas';
import { MarsSurfaceTerrainView } from './scene/surface/MarsSurfaceTerrainView';
import { ImmersivePreloader } from './ui/preloader/ImmersivePreloader';
import { TopNavigationBar } from './ui/hud/TopNavigationBar';
import { CelestialQuickSelect } from './ui/hud/CelestialQuickSelect';
import { SubSceneInfoPanel } from './ui/hud/SubSceneInfoPanel';
import { TimeScrubberBar } from './ui/hud/TimeScrubberBar';

function App() {
    return (
        <div className="cosmos-app-root">
            {/* Layer 1: 3D Deep Space & Orbital Globe (Three.js + R3F + SelectiveBloom + 4-Tier LOD) */}
            <MarsCanvas />

            {/* Layer 2: 3D Martian Surface Terrain Environment (High-Tech Surface Experience) */}
            <MarsSurfaceTerrainView />

            {/* Layer 3: Cockpit Preloader, HUD Control Systems & Telemetry Navigation Panels */}
            <ImmersivePreloader />
            <TopNavigationBar />
            <CelestialQuickSelect />
            <SubSceneInfoPanel />
            <TimeScrubberBar />
        </div>
    );
}

export default App;
