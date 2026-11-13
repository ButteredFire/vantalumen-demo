import React from 'react';
import { useCosmosStore, type SpectralMode } from '../../store/useCosmosStore';
import { spatialAudio } from '../../core/audio/SpatialAudioEngine';

const SPECTRAL_MODES: { id: SpectralMode; label: string; badge: string }[] = [
    { id: 'VISUAL_RGB', label: 'Optical (Visual RGB)', badge: 'RGB' },
    { id: 'THERMAL_IR', label: 'Thermal IR (THEMIS)', badge: 'THEMIS IR' },
    { id: 'MOLA_ELEVATION', label: 'Elevation (MOLA Topo)', badge: 'MOLA TOPO' },
];

const STAGE_LABELS: Record<string, string> = {
    PRELOADING: 'INITIALIZING FLIGHT DECK',
    LAUNCHING: 'ORBITAL INSERTION IN PROGRESS',
    ORBITAL_OVERVIEW: 'FREE ORBITAL SURVEY',
    WARPING: 'WARP TRANSIT IN PROGRESS',
    SUB_SCENE: 'CLOSE-RANGE TARGET OBSERVATION',
    SURFACE_VIEW: '3D MARTIAN SURFACE TERRAIN',
    SURFACE_CESIUM: '3D MARTIAN SURFACE TERRAIN',
};

export const TopNavigationBar: React.FC = () => {
    const viewStage = useCosmosStore((state) => state.viewStage);
    const spectralMode = useCosmosStore((state) => state.spectralMode);
    const setSpectralMode = useCosmosStore((state) => state.setSpectralMode);
    const audioMuted = useCosmosStore((state) => state.audioMuted);
    const toggleAudio = useCosmosStore((state) => state.toggleAudio);
    const cameraAltitudeKm = useCosmosStore((state) => state.cameraAltitudeKm);

    if (
        viewStage === 'PRELOADING' ||
        viewStage === 'LAUNCHING' ||
        viewStage === 'SURFACE_VIEW' ||
        viewStage === 'SURFACE_CESIUM'
    ) {
        return null;
    }

    const handleToggleAudio = () => {
        const nextMuted = !audioMuted;
        spatialAudio.initAndStart();
        spatialAudio.setMuted(nextMuted);
        toggleAudio();
    };

    return (
        <header className="hud-top-bar glass-panel">
            <div className="hud-brand-block">
                <div className="hud-brand-dot" />
                <div>
                    <div className="hud-brand-eyebrow">MARS ORBITAL ATLAS • DEEP SPACE TELEMETRY</div>
                    <div className="hud-brand-title">MARS ORBITAL &amp; SURFACE EXPLORATION SYSTEM</div>
                </div>
            </div>

            <div className="hud-telemetry-readout">
                <div className="telemetry-metric">
                    <span className="metric-label">STATUS</span>
                    <span className="metric-value status-accent">{STAGE_LABELS[viewStage] ?? viewStage}</span>
                </div>
                <div className="telemetry-metric">
                    <span className="metric-label">CAMERA ALTITUDE</span>
                    <span className="metric-value">{cameraAltitudeKm.toLocaleString('en-US')} km</span>
                </div>
            </div>

            <div className="hud-controls-group" role="group" aria-label="Spectral analysis modes and audio controls">
                <div className="spectral-Pill-group">
                    {SPECTRAL_MODES.map((mode) => (
                        <button
                            key={mode.id}
                            type="button"
                            onClick={() => setSpectralMode(mode.id)}
                            className={`spectral-btn ${spectralMode === mode.id ? 'is-active' : ''}`}
                            title={mode.label}
                        >
                            <span className="spectral-badge">{mode.badge}</span>
                            <span className="spectral-text">{mode.label}</span>
                        </button>
                    ))}
                </div>

                <button
                    type="button"
                    onClick={handleToggleAudio}
                    className={`audio-toggle-btn ${!audioMuted ? 'is-active' : ''}`}
                    title={audioMuted ? 'Unmute master audio' : 'Mute master audio'}
                >
                    {audioMuted ? '🔇 Audio: MUTED' : '🔊 Audio: ACTIVE'}
                </button>
            </div>
        </header>
    );
};
