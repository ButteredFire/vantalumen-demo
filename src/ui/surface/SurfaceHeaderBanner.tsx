import React from 'react';
import { surfaceAudio } from '../../core/audio/SurfaceAudioController';
import type { SurfaceEquipmentItem } from '../../types/cosmos.types';

interface SurfaceHeaderBannerProps {
    selectedEquipment: SurfaceEquipmentItem | null;
    onReturnToOrbit: () => void;
}

export const SurfaceHeaderBanner: React.FC<SurfaceHeaderBannerProps> = ({
    selectedEquipment,
    onReturnToOrbit,
}) => {
    const handleReturn = () => {
        surfaceAudio.playCollapse();
        onReturnToOrbit();
    };

    return (
        <header className="surface-header-bar glass-panel" aria-label="Martian Surface Mission Header">
            <div className="surface-brand-group">
                <img
                    src="/vantalumen.png"
                    alt="Project VantaLumen"
                    className="surface-brand-avatar"
                    onError={(e) => {
                        // Fallback hide if missing
                        (e.target as HTMLElement).style.display = 'none';
                    }}
                />
                <div className="surface-brand-info">
                    <span className="telemetry-tag">PROJECT VANTALUMEN • MARTIAN SURFACE ATLAS</span>
                    <h1 className="surface-site-heading">ISIDIS PLANITIA &amp; EXPEDITION BASIN</h1>
                </div>
            </div>

            <div className="surface-environmental-telemetry">
                <div className="surface-telemetry-item">
                    <span className="telemetry-label">ATMOSPHERE</span>
                    <strong className="telemetry-val">95.3% CO₂ • 740 Pa</strong>
                </div>
                <div className="surface-telemetry-item">
                    <span className="telemetry-label">SURFACE TEMP</span>
                    <strong className="telemetry-val">-60 °C (-76 °F)</strong>
                </div>
                <div className="surface-telemetry-item">
                    <span className="telemetry-label">TARGET ACQUISITION</span>
                    <strong className={`telemetry-val ${selectedEquipment ? 'is-locked' : 'is-standby'}`}>
                        {selectedEquipment ? selectedEquipment.name.toUpperCase() : 'AWAITING SELECTION...'}
                    </strong>
                </div>
            </div>

            <div className="surface-actions-group">
                <button
                    type="button"
                    onClick={handleReturn}
                    className="hud-action-btn return-orbit-btn"
                    onMouseEnter={() => surfaceAudio.playHover()}
                >
                    <span className="btn-icon">↑</span>
                    <span>Return to Orbit</span>
                </button>
            </div>
        </header>
    );
};
