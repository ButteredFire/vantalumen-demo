import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MapControls } from '@react-three/drei';
import type { MapControls as MapControlsImpl } from 'three-stdlib';
import * as THREE from 'three';

interface SurfaceMapControlsProps {
    focusTarget: [number, number, number] | null;
    cameraTargetRef?: React.MutableRefObject<THREE.Vector3>;
}

export const SurfaceMapControls: React.FC<SurfaceMapControlsProps> = ({
    focusTarget,
    cameraTargetRef,
}) => {
    const controlsRef = useRef<MapControlsImpl>(null!);
    const limitX = 1000 / 1.5;
    const limitZ = 500 / 1.5;

    useFrame((state) => {
        if (!controlsRef.current) return;
        const controls = controlsRef.current;
        const camera = state.camera;
        const target = controls.target;

        // Export current camera target to telemetry/gizmo reference
        if (cameraTargetRef) {
            cameraTargetRef.current.copy(target);
        }

        // Dynamic tilt mapping based on camera distance to ground plane
        const distance = camera.position.distanceTo(target);
        const targetAngle = THREE.MathUtils.mapLinear(
            distance,
            450,
            800,
            Math.PI / 3.2,
            Math.PI / 4.2,
        );
        controls.minPolarAngle = targetAngle;
        controls.maxPolarAngle = targetAngle;

        // Smooth cinematic pan when a pin / landmark is selected
        if (focusTarget) {
            target.x = THREE.MathUtils.lerp(target.x, focusTarget[0], 0.03);
            target.z = THREE.MathUtils.lerp(target.z, focusTarget[2], 0.03);

            // Gently pull camera in for closer inspection (zoom target ~500)
            const zoomTarget = 520;
            if (distance > zoomTarget) {
                camera.position.lerp(
                    new THREE.Vector3(camera.position.x, camera.position.y - 8, camera.position.z),
                    0.02,
                );
            }
        } else {
            // Free-roam boundary clamping
            const clampedX = THREE.MathUtils.clamp(target.x, -limitX, limitX);
            const clampedZ = THREE.MathUtils.clamp(target.z, -limitZ, limitZ);

            if (target.x !== clampedX || target.z !== clampedZ) {
                const diffX = clampedX - target.x;
                const diffZ = clampedZ - target.z;
                target.x = clampedX;
                target.z = clampedZ;
                camera.position.x += diffX;
                camera.position.z += diffZ;
            }
        }
    });

    return (
        <MapControls
            ref={controlsRef}
            makeDefault
            enableDamping={true}
            dampingFactor={0.015} // Sluggish, buttery inertia for planetary scale realism
            enableRotate={false}
            minDistance={450}
            maxDistance={1000}
            minAzimuthAngle={0}
            maxAzimuthAngle={0}
            zoomSpeed={0.22}
            panSpeed={0.34} // Calibrated so user cannot traverse entire map in a few swipes
            enabled={!focusTarget}
        />
    );
};
