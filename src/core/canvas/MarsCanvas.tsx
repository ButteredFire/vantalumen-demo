import React, { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { Selection } from '@react-three/postprocessing';
import { CosmosSceneRoot } from '../../scene/CosmosSceneRoot';
import { PostProcessingRig } from '../postprocessing/PostProcessingRig';
import { SplineCameraRig } from '../camera/SplineCameraRig';
import { FloatingOriginManager } from './FloatingOriginManager';
import { useCosmosStore } from '../../store/useCosmosStore';

export const MarsCanvas: React.FC = () => {
    const directionalLightRef = useRef<THREE.DirectionalLight | null>(null);
    const viewStage = useCosmosStore((state) => state.viewStage);

    const isSurface = viewStage === 'SURFACE_VIEW' || viewStage === 'SURFACE_CESIUM';

    return (
        <div
            className={`mars-canvas-wrapper ${isSurface ? 'is-surface-mode' : ''}`}
            style={{
                display: isSurface ? 'none' : 'block',
            }}
        >
            <Canvas
                gl={{
                    powerPreference: 'high-performance',
                    antialias: false, // Disabled default MSAA in favor of Postprocessing SMAA
                    stencil: false,
                    depth: true,
                    logarithmicDepthBuffer: true, // Eliminates Z-fighting across astronomical scales
                    toneMapping: THREE.ACESFilmicToneMapping,
                    toneMappingExposure: 1.15,
                }}
                camera={{
                    fov: 45,
                    near: 0.1,        // Logarithmic depth buffer allows near plane at 0.1m
                    far: 1e10,        // and far plane out to 10 million km without surface z-fighting
                    position: [0, 8000, 88000],
                }}
                dpr={[1, 2]}
            >
                <color attach="background" args={['#020205']} />
                <Suspense fallback={null}>
                    <Selection>
                        <FloatingOriginManager>
                            <CosmosSceneRoot sunLightRef={directionalLightRef} />
                        </FloatingOriginManager>
                        <SplineCameraRig />
                        <PostProcessingRig sunLightRef={directionalLightRef} />
                    </Selection>
                </Suspense>
            </Canvas>
        </div>
    );
};
