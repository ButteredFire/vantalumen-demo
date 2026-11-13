import React, { useEffect, useState } from 'react';
import type * as THREE from 'three';
import type { SurfaceEquipmentItem } from '../../types/cosmos.types';

interface SurfaceRadarGizmoProps {
    equipmentList: SurfaceEquipmentItem[];
    selectedEquipment: SurfaceEquipmentItem | null;
    cameraTargetRef: React.MutableRefObject<THREE.Vector3>;
    onSelectEquipment: (equipment: SurfaceEquipmentItem) => void;
}

export const SurfaceRadarGizmo: React.FC<SurfaceRadarGizmoProps> = ({
    equipmentList,
    selectedEquipment,
    cameraTargetRef,
    onSelectEquipment,
}) => {
    const [telemetryTarget, setTelemetryTarget] = useState({ x: 0, z: 0 });

    useEffect(() => {
        let animationFrameId: number;
        const gizmoRadius = 72; // Half of 144px diameter
        const mapRange = 650;   // 3D units represented by the radar radius

        const updateGizmo = () => {
            if (!cameraTargetRef.current) return;
            const target = cameraTargetRef.current;

            setTelemetryTarget({
                x: Math.round(target.x),
                z: Math.round(target.z),
            });

            equipmentList.forEach((eq, idx) => {
                const el = document.getElementById(`surface-radar-pin-${idx}`);
                if (!el || !eq.coords) return;

                const dx = eq.coords[0] - target.x;
                const dz = eq.coords[2] - target.z;
                const dist = Math.sqrt(dx * dx + dz * dz);

                let drawDist = (dist / mapRange) * gizmoRadius;
                if (drawDist > gizmoRadius - 6) {
                    drawDist = gizmoRadius - 6;
                }

                const angle = Math.atan2(dz, dx);
                const x = Math.cos(angle) * drawDist;
                const y = Math.sin(angle) * drawDist;

                el.style.transform = `translate(calc(-50% + ${x.toFixed(1)}px), calc(-50% + ${y.toFixed(1)}px))`;
            });

            animationFrameId = requestAnimationFrame(updateGizmo);
        };

        updateGizmo();
        return () => cancelAnimationFrame(animationFrameId);
    }, [equipmentList, cameraTargetRef]);

    return (
        <aside className="surface-radar-wrapper glass-panel" aria-label="Surface Navigation Radar">
            <div className="surface-radar-header">
                <span className="telemetry-tag">SURFACE RADAR • 650 KM</span>
                <span className="radar-coords-readout">
                    X:{telemetryTarget.x} Z:{telemetryTarget.z}
                </span>
            </div>

            <div className="surface-radar-display">
                {/* Concentric range rings */}
                <div className="radar-ring ring-outer" />
                <div className="radar-ring ring-mid" />
                <div className="radar-ring ring-inner" />

                {/* Compass axis crosshair */}
                <div className="radar-axis-h" />
                <div className="radar-axis-v" />

                <span className="radar-cardinal cardinal-n">N</span>
                <span className="radar-cardinal cardinal-s">S</span>
                <span className="radar-cardinal cardinal-e">E</span>
                <span className="radar-cardinal cardinal-w">W</span>

                {/* Sweeping radar scanline */}
                <div className="radar-sweep-beam" />

                {/* Center camera target reticle */}
                <div className="radar-center-reticle" />

                {/* Equipment blips */}
                {equipmentList.map((eq, idx) => {
                    const isActive = selectedEquipment?.id === eq.id;
                    return (
                        <button
                            key={eq.id}
                            id={`surface-radar-pin-${idx}`}
                            type="button"
                            className={`surface-radar-blip ${isActive ? 'is-active' : ''}`}
                            title={`${eq.name} (${eq.realCoords.lat}°N, ${eq.realCoords.lon}°E)`}
                            onClick={() => onSelectEquipment(eq)}
                        />
                    );
                })}
            </div>
        </aside>
    );
};
