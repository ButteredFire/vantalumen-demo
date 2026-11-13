import React, { useEffect, useState } from 'react';
import { MARS_SIDEREAL_ROTATION_SECONDS } from '../../config/celestialCatalog';
import { useCosmosStore } from '../../store/useCosmosStore';

const TIME_PRESETS = [
    { label: '0x (Paused)', value: 0 },
    { label: '1x (Real)', value: 1 },
    { label: '100x', value: 100 },
    { label: '1,000x', value: 1000 },
    { label: '10,000x', value: 10000 },
];

export const TimeScrubberBar: React.FC = () => {
    const viewStage = useCosmosStore((state) => state.viewStage);
    const timeScale = useCosmosStore((state) => state.timeScale);
    const setTimeScale = useCosmosStore((state) => state.setTimeScale);
    const [marsSol, setMarsSol] = useState(1.0);

    useEffect(() => {
        const id = window.setInterval(() => {
            const simSeconds = useCosmosStore.getState().simulationTime;
            const nextSol = 1 + simSeconds / MARS_SIDEREAL_ROTATION_SECONDS;
            setMarsSol((prev) => (Math.abs(nextSol - prev) >= 0.0005 ? nextSol : prev));
        }, 150);
        return () => window.clearInterval(id);
    }, []);

    if (
        viewStage === 'PRELOADING' ||
        viewStage === 'LAUNCHING' ||
        viewStage === 'SURFACE_VIEW' ||
        viewStage === 'SURFACE_CESIUM'
    ) {
        return null;
    }

    return (
        <footer className="hud-bottom-bar glass-panel">
            <div className="sol-clock-block">
                <span className="metric-label">ORBITAL CLOCK (MARS SOL)</span>
                <span className="sol-value">SOL {marsSol.toFixed(3)}</span>
            </div>

            <div className="time-preset-buttons" role="group" aria-label="Orbital simulation time scale presets">
                {TIME_PRESETS.map((preset) => (
                    <button
                        key={preset.value}
                        type="button"
                        onClick={() => setTimeScale(preset.value)}
                        className={`time-preset-btn ${timeScale === preset.value ? 'is-active' : ''}`}
                    >
                        {preset.label}
                    </button>
                ))}
            </div>

            <div className="time-slider-wrap">
                <label htmlFor="time-scale-range" className="metric-label">
                    TIME WARP: <strong>{timeScale.toLocaleString('en-US')}x</strong>
                </label>
                <input
                    id="time-scale-range"
                    type="range"
                    min={0}
                    max={10000}
                    step={10}
                    value={timeScale}
                    onChange={(e) => setTimeScale(Number(e.target.value))}
                    className="time-range-input"
                />
            </div>
        </footer>
    );
};
