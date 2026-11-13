import React, { useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useCosmosStore, type CelestialTarget } from '../../store/useCosmosStore';
import { AssetCalloutBox, type CalloutVariant } from '../../ui/hud/AssetCalloutBox';

interface POIMarker3DProps {
    target: CelestialTarget;
    planetCenter: THREE.Vector3;
    variant?: CalloutVariant;
}

export const POIMarker3D: React.FC<POIMarker3DProps> = ({
    target,
    planetCenter,
    variant = 1,
}) => {
    const { camera } = useThree();
    const groupRef = useRef<THREE.Group>(null!);
    const [isVisible, setIsVisible] = useState(true);
    const worldPos = useRef(new THREE.Vector3());
    const normalVec = useRef(new THREE.Vector3());
    const cameraDir = useRef(new THREE.Vector3());

    const selectTarget = useCosmosStore((state) => state.selectTarget);
    const activeTargetId = useCosmosStore((state) => state.activeTarget?.id);
    const viewStage = useCosmosStore((state) => state.viewStage);
    const controlsLocked = useCosmosStore((state) => state.controlsLocked);

    useFrame(() => {
        if (!groupRef.current) return;

        // Fetch runtime world coordinates as Mars rotates about its spin axis
        groupRef.current.getWorldPosition(worldPos.current);
        useCosmosStore.getState().updateDynamicPosition(target.id, worldPos.current);

        // Surface normal vector from planetary center to POI site
        normalVec.current.copy(worldPos.current).sub(planetCenter).normalize();
        // Camera sightline vector from POI site to camera
        cameraDir.current.copy(camera.position).sub(worldPos.current).normalize();

        // If dot product < 0.15, the POI has crossed into the planetary limb or occluded back face
        const dot = normalVec.current.dot(cameraDir.current);
        const shouldShow = dot > 0.15;
        if (shouldShow !== isVisible) {
            setIsVisible(shouldShow);
        }
    });

    const isSelected = activeTargetId === target.id;
    const hideForCloseInspection = isSelected && (viewStage === 'SUB_SCENE' || viewStage === 'SURFACE_VIEW');
    const showCallout = isVisible && !controlsLocked && !hideForCloseInspection;
    const elevationLabel = target.coordinates
        ? `MOLA ${target.coordinates.elevationKm > 0 ? `+${target.coordinates.elevationKm}` : target.coordinates.elevationKm} km`
        : 'SURFACE POI';

    return (
        <group ref={groupRef} position={target.position}>
            {/* 3D ground beacon sphere */}
            <mesh>
                <sphereGeometry args={[5.5, 12, 12]} />
                <meshBasicMaterial color={isSelected ? '#7cdaa1' : '#ff7b47'} />
            </mesh>

            <Html
                zIndexRange={[15, 0]}
                style={{
                    opacity: showCallout ? 1 : 0,
                    pointerEvents: showCallout ? 'auto' : 'none',
                    transition: 'opacity 0.25s ease-out',
                }}
            >
                <AssetCalloutBox
                    title={target.name}
                    meta={elevationLabel}
                    category={target.category}
                    variant={variant}
                    isSelected={isSelected}
                    isVisible={showCallout}
                    onClick={() => selectTarget(target)}
                />
            </Html>
        </group>
    );
};
