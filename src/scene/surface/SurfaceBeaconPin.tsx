import React from 'react';
import { Html } from '@react-three/drei';
import { surfaceAudio } from '../../core/audio/SurfaceAudioController';
import type { SurfaceEquipmentItem } from '../../types/cosmos.types';

interface SurfaceBeaconPinProps {
    equipment: SurfaceEquipmentItem;
    isSelected: boolean;
    onClick: () => void;
}

export const SurfaceBeaconPin: React.FC<SurfaceBeaconPinProps> = ({
    equipment,
    isSelected,
    onClick,
}) => {
    const position = equipment.coords ?? [0, 0, 0];

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        surfaceAudio.playPopup(isSelected);
        onClick();
    };

    const handleMouseEnter = () => {
        surfaceAudio.playHover();
    };

    const isRoverActive = equipment.status.toLowerCase().includes('active');

    return (
        <group position={position}>
            {/* 3D ground beacon sphere */}
            <mesh position={[0, 1.2, 0]}>
                <sphereGeometry args={[2.2, 16, 16]} />
                <meshBasicMaterial
                    color={isSelected ? '#7cdaa1' : isRoverActive ? '#64d2ff' : '#f18b62'}
                />
            </mesh>

            {/* Pulsing ring beacon on ground */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.3, 0]}>
                <ringGeometry args={[2.8, 4.2, 24]} />
                <meshBasicMaterial
                    color={isSelected ? '#7cdaa1' : isRoverActive ? '#64d2ff' : '#f18b62'}
                    transparent
                    opacity={isSelected ? 0.9 : 0.45}
                />
            </mesh>

            {/* Fixed-size screen-space HTML tag (locked size, no distanceFactor) */}
            <Html
                position={[0, 4.5, 0]}
                center
                zIndexRange={[20, 0]}
                style={{ pointerEvents: 'auto' }}
            >
                <div
                    className={`surface-beacon-tag ${isSelected ? 'is-selected' : ''} ${
                        isRoverActive ? 'is-active-target' : ''
                    }`}
                    onClick={handleClick}
                    onMouseEnter={handleMouseEnter}
                    role="button"
                    tabIndex={0}
                    aria-label={`Select ${equipment.name}`}
                >
                    <div className="surface-beacon-status-dot" />
                    <div className="surface-beacon-text-block">
                        <span className="surface-beacon-name">{equipment.name}</span>
                        <span className="surface-beacon-coords">
                            {equipment.realCoords.lat.toFixed(1)}°N, {equipment.realCoords.lon.toFixed(1)}°E
                        </span>
                    </div>
                </div>
            </Html>
        </group>
    );
};
