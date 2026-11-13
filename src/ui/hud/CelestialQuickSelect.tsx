import React from 'react';
import { CELESTIAL_BODIES_CATALOG } from '../../config/celestialCatalog';
import { POI_LANDMARKS_CATALOG } from '../../config/poiLandmarks';
import { useCosmosStore } from '../../store/useCosmosStore';

export const CelestialQuickSelect: React.FC = () => {
    const viewStage = useCosmosStore((state) => state.viewStage);
    const activeTarget = useCosmosStore((state) => state.activeTarget);
    const selectTarget = useCosmosStore((state) => state.selectTarget);
    const returnToOrbit = useCosmosStore((state) => state.returnToOrbit);
    const controlsLocked = useCosmosStore((state) => state.controlsLocked);

    if (
        viewStage === 'PRELOADING' ||
        viewStage === 'LAUNCHING' ||
        viewStage === 'SURFACE_VIEW' ||
        viewStage === 'SURFACE_CESIUM'
    ) {
        return null;
    }

    return (
        <aside className="hud-left-dock glass-panel" aria-label="Quick Celestial & Surface Navigation Dock">
            <div className="dock-section">
                <div className="dock-section-title">MARS SYSTEM NAVIGATION</div>
                <button
                    type="button"
                    disabled={controlsLocked}
                    onClick={returnToOrbit}
                    className={`dock-item-btn ${activeTarget === null ? 'is-active' : ''}`}
                >
                    <span className="dock-item-icon">◎</span>
                    <div className="dock-item-text">
                        <strong>Orbital Overview</strong>
                        <small>Free interplanetary survey</small>
                    </div>
                </button>
            </div>

            <div className="dock-section">
                <div className="dock-section-title">CELESTIAL BODIES &amp; ORBITERS</div>
                {CELESTIAL_BODIES_CATALOG.map((body) => (
                    <button
                        key={body.id}
                        type="button"
                        disabled={controlsLocked}
                        onClick={() => selectTarget(body)}
                        className={`dock-item-btn ${activeTarget?.id === body.id ? 'is-active' : ''}`}
                    >
                        <span className="dock-item-icon">
                            {body.category === 'PLANET' ? '●' : body.category === 'MOON' ? '◐' : '✦'}
                        </span>
                        <div className="dock-item-text">
                            <strong>{body.name}</strong>
                            <small>{body.subtitle}</small>
                        </div>
                    </button>
                ))}
            </div>

            <div className="dock-section">
                <div className="dock-section-title">SURFACE LANDMARKS (POI)</div>
                {POI_LANDMARKS_CATALOG.map((poi) => (
                    <button
                        key={poi.id}
                        type="button"
                        disabled={controlsLocked}
                        onClick={() => selectTarget(poi)}
                        className={`dock-item-btn ${activeTarget?.id === poi.id ? 'is-active' : ''}`}
                    >
                        <span className="dock-item-icon">▲</span>
                        <div className="dock-item-text">
                            <strong>{poi.name}</strong>
                            <small>{poi.subtitle}</small>
                        </div>
                    </button>
                ))}
            </div>
        </aside>
    );
};
