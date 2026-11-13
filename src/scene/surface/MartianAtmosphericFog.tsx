import React, { useRef } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';

const FogPlaneMaterial = shaderMaterial(
    {
        uTime: 0,
        uColor: new THREE.Color('#ffd6b0'),
    },
    /* glsl vertex */ `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    /* glsl fragment */ `
        varying vec2 vUv;
        uniform vec3 uColor;
        uniform float uTime;

        float random(vec2 st) {
            return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
        }

        float noise(vec2 st) {
            vec2 i = floor(st);
            vec2 f = fract(st);
            float a = random(i);
            float b = random(i + vec2(1.0, 0.0));
            float c = random(i + vec2(0.0, 1.0));
            float d = random(i + vec2(1.0, 1.0));
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }

        void main() {
            // Radial edge fade so fog edges are seamlessly soft
            vec2 center = vUv - 0.5;
            float dist = length(center) * 2.0;
            float edgeFade = smoothstep(1.0, 0.25, dist);

            // Gentle drifting noise coordinates over time
            vec2 scrolledUv = vUv * 2.5 + vec2(uTime * 0.02, uTime * 0.01);
            float n = noise(scrolledUv);

            // Light, transparent ground fog layer (does not obscure surface details)
            float alpha = 0.035 * edgeFade * (0.35 + 0.65 * n);
            gl_FragColor = vec4(uColor, alpha);
        }
    `
);

extend({ FogPlaneMaterial });

declare global {
    namespace JSX {
        interface IntrinsicElements {
            fogPlaneMaterial: any;
        }
    }
}

declare module '@react-three/fiber' {
    interface ThreeElements {
        fogPlaneMaterial: any;
    }
}

export const MartianAtmosphericFog: React.FC = () => {
    const matRef = useRef<{ uTime: number }>(null);

    useFrame((state) => {
        if (matRef.current) {
            matRef.current.uTime = state.clock.elapsedTime;
        }
    });

    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 200, 0]}>
            <planeGeometry args={[3200, 3200, 16, 16]} />
            <fogPlaneMaterial
                ref={matRef}
                transparent={true}
                depthWrite={false}
                blending={THREE.NormalBlending}
                renderOrder={999}
            />
        </mesh>
    );
};
