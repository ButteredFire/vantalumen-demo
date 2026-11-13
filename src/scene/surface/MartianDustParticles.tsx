import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const MartianDustParticles: React.FC = () => {
    const pointsRef = useRef<THREE.Points>(null!);
    const particleCount = 2800;
    const particleSpeed = 85;

    const [positions, offsets] = useMemo(() => {
        const pos = new Float32Array(particleCount * 3);
        const off = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 2000;     // X: -1000 to 1000
            // Height comfortably above terrain peaks (max terrain Y is ~66)
            pos[i * 3 + 1] = 38.0 + Math.random() * 85;   // Y: 38 to 123
            pos[i * 3 + 2] = (Math.random() - 0.5) * 1000; // Z: -500 to 500

            off[i] = Math.random() * 0.5 + 0.75;
        }
        return [pos, off];
    }, [particleCount]);

    useFrame((_, delta) => {
        if (!pointsRef.current) return;
        const geom = pointsRef.current.geometry;
        const posAttr = geom.attributes.position as THREE.BufferAttribute;
        const arr = posAttr.array as Float32Array;

        for (let i = 0; i < particleCount; i++) {
            const speed = particleSpeed * offsets[i];
            arr[i * 3] -= speed * delta;
            arr[i * 3 + 2] -= (speed / 3) * delta;

            // Boundary wrapping
            if (arr[i * 3] < -1000) {
                arr[i * 3] = 1000;
                arr[i * 3 + 2] = (Math.random() - 0.5) * 1000;
                arr[i * 3 + 1] = 38.0 + Math.random() * 85;
            }

            if (arr[i * 3 + 2] < -500) {
                arr[i * 3 + 2] = 500;
            }
        }
        posAttr.needsUpdate = true;
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[positions, 3]}
                />
            </bufferGeometry>
            <pointsMaterial
                size={4.2}
                color="#ff9364"
                transparent={true}
                opacity={0.82}
                sizeAttenuation={true}
                depthWrite={false}
            />
        </points>
    );
};
