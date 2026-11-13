import React from 'react';
import { useCosmosStore } from '../../store/useCosmosStore';

export const SubSceneInfoPanel: React.FC = () => {
    const activeTarget = useCosmosStore((state) => state.activeTarget);
    const viewStage = useCosmosStore((state) => state.viewStage);
    const enterSurfaceLanding = useCosmosStore((state) => state.enterSurfaceLanding);
    const returnToOrbit = useCosmosStore((state) => state.returnToOrbit);

    if (
        !activeTarget ||
        viewStage === 'PRELOADING' ||
        viewStage === 'SURFACE_VIEW' ||
        viewStage === 'SURFACE_CESIUM'
    ) {
        return null;
    }

    const { telemetry, coordinates, isSurfaceLanding } = activeTarget;

    return (
        <aside className="hud-right-panel glass-panel" aria-labelledby="target-panel-title">
            <div className="info-panel-header">
                <span className="telemetry-tag">
                    {viewStage === 'WARPING' ? 'APPROACHING TARGET...' : telemetry.classification}
                </span>
                <h2 id="target-panel-title" className="info-panel-title">
                    {activeTarget.name}
                </h2>
                <p className="info-panel-subtitle">{activeTarget.subtitle}</p>
            </div>

            <div className="telemetry-grid">
                <div className="telemetry-box">
                    <span className="box-label">SURFACE / AMBIENT TEMP</span>
                    <strong className="box-value">{telemetry.meanTemperatureC}</strong>
                </div>
                <div className="telemetry-box">
                    <span className="box-label">ATMOSPHERIC PRESSURE</span>
                    <strong className="box-value">{telemetry.atmosphericPressurePa}</strong>
                </div>
                <div className="telemetry-box">
                    <span className="box-label">SURFACE GRAVITY</span>
                    <strong className="box-value">{telemetry.surfaceGravityMs2}</strong>
                </div>
                <div className="telemetry-box">
                    <span className="box-label">ORBITAL / ROTATIONAL VELOCITY</span>
                    <strong className="box-value">{telemetry.orbitalVelocityKms}</strong>
                </div>
            </div>

            {coordinates && (
                <div className="coordinates-strip">
                    <span>Lat: {coordinates.lat.toFixed(2)}°</span>
                    <span>Lon: {coordinates.lon.toFixed(2)}°</span>
                    <span>
                        MOLA Elevation: {coordinates.elevationKm > 0 ? `+${coordinates.elevationKm}` : coordinates.elevationKm} km
                    </span>
                </div>
            )}

            <div className="info-summary-block">
                <h3>Scientific &amp; Geological Profile ({telemetry.geologicalAge})</h3>
                <p>{telemetry.missionSummary}</p>
                <ul className="highlights-list">
                    {telemetry.keyHighlights.map((item) => (
                        <li key={item}>{item}</li>
                    ))}
                </ul>
            </div>

            <div className="info-panel-actions">
                {isSurfaceLanding && (
                    <button
                        type="button"
                        onClick={() => enterSurfaceLanding(activeTarget)}
                        className="hud-action-btn primary-landing-btn"
                    >
                        🛬 Descend to Surface (3D Terrain View)
                    </button>
                )}

                <button
                    type="button"
                    onClick={returnToOrbit}
                    className="hud-action-btn secondary-btn"
                >
                    ← Return to Orbital Overview
                </button>
            </div>
        </aside>
    );
};
