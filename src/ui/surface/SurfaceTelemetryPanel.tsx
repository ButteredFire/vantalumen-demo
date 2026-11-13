import React from 'react';
import { surfaceAudio } from '../../core/audio/SurfaceAudioController';
import type { SurfaceEquipmentItem } from '../../types/cosmos.types';

interface SurfaceTelemetryPanelProps {
    equipment: SurfaceEquipmentItem;
    onClose: () => void;
    onInspect: () => void;
    onRecenter: () => void;
}

export const SurfaceTelemetryPanel: React.FC<SurfaceTelemetryPanelProps> = ({
    equipment,
    onClose,
    onInspect,
    onRecenter,
}) => {
    const handleClose = () => {
        surfaceAudio.playCollapse();
        onClose();
    };

    const handleInspect = () => {
        surfaceAudio.playSelect();
        onInspect();
    };

    const handleRecenter = () => {
        surfaceAudio.playSelect();
        onRecenter();
    };

    const isRoverActive = equipment.status.toLowerCase().includes('active');

    return (
        <aside className="surface-info-panel glass-panel" aria-labelledby="surface-equipment-title">
            <div className="surface-panel-top-notch">
                <span className="telemetry-tag">SURFACE RECONNAISSANCE • ASSET TELEMETRY</span>
                <button
                    type="button"
                    onClick={handleClose}
                    className="surface-close-btn"
                    title="Close Telemetry Panel"
                    aria-label="Close"
                >
                    ✕
                </button>
            </div>

            <div className="surface-panel-header">
                <div className="surface-status-indicator">
                    <span
                        className={`surface-pulse-dot ${
                            isRoverActive ? 'status-active' : 'status-dormant'
                        }`}
                    />
                    <span className="surface-status-text">{equipment.status}</span>
                </div>
                <h2 id="surface-equipment-title" className="surface-equipment-title">
                    {equipment.name}
                </h2>
                <div className="surface-coords-badge">
                    <span>{equipment.realCoords.lat.toFixed(3)}°N</span>
                    <span className="badge-divider">•</span>
                    <span>{equipment.realCoords.lon.toFixed(3)}°E</span>
                    {equipment.elevationM !== undefined && (
                        <>
                            <span className="badge-divider">•</span>
                            <span>
                                Elev: {equipment.elevationM > 0 ? `+${equipment.elevationM}` : equipment.elevationM} m
                            </span>
                        </>
                    )}
                </div>
            </div>

            <div className="surface-telemetry-grid">
                <div className="surface-stat-box">
                    <span className="stat-label">PRIMARY MISSION</span>
                    <strong className="stat-value">{equipment.mission}</strong>
                </div>
                <div className="surface-stat-box">
                    <span className="stat-label">OPERATING SYSTEM</span>
                    <strong className="stat-value">Ares Autonomous OS v4.2</strong>
                </div>
                <div className="surface-stat-box">
                    <span className="stat-label">COMM LINK</span>
                    <strong className="stat-value">HiRISE UHF / DSN X-Band</strong>
                </div>
                <div className="surface-stat-box">
                    <span className="stat-label">SURFACE ENVIRONMENT</span>
                    <strong className="stat-value">-60 °C • 95% CO₂</strong>
                </div>
            </div>

            <div className="surface-narrative-box">
                <h3 className="narrative-heading">MISSION LOG &amp; SCIENTIFIC PROFILE</h3>
                <p className="narrative-body">{equipment.description}</p>
            </div>

            <div className="surface-panel-actions">
                <button
                    type="button"
                    onClick={handleRecenter}
                    className="hud-action-btn secondary-btn"
                    onMouseEnter={() => surfaceAudio.playHover()}
                >
                    <span>⊙ Center Camera</span>
                </button>
                <button
                    type="button"
                    onClick={handleInspect}
                    className="hud-action-btn primary-landing-btn"
                    onMouseEnter={() => surfaceAudio.playHover()}
                >
                    <span>🔍 Run Diagnostics</span>
                </button>
            </div>
        </aside>
    );
};
