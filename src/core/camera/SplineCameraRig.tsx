import React, { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import gsap from 'gsap';
import { useCosmosStore, type CelestialTarget, type ViewStage } from '../../store/useCosmosStore';
import { buildSafeWarpSpline } from './warpPaths';
import { spatialAudio } from '../audio/SpatialAudioEngine';
import { OPENING_CAMERA_POS, OPENING_LOOK_TARGET } from '../../scene/opening/OpeningShipScene';

const DEFAULT_OVERVIEW_POS = new THREE.Vector3(0, 8000, 22000);
const DEFAULT_OVERVIEW_ORIGIN = new THREE.Vector3(0, 0, 0);

export const SplineCameraRig: React.FC = () => {
    const { camera } = useThree();
    const controlsRef = useRef<OrbitControlsImpl>(null!);
    const lookAtProxy = useRef(new THREE.Vector3(0, 0, 0));
    const timelineRef = useRef<gsap.core.Timeline | null>(null);

    useEffect(() => {
        const perspCamera = camera as THREE.PerspectiveCamera;
        const initialStage = useCosmosStore.getState().viewStage;

        // Position camera in cockpit view at initial launch stage
        if (initialStage === 'PRELOADING' && controlsRef.current) {
            perspCamera.position.copy(OPENING_CAMERA_POS);
            controlsRef.current.target.copy(OPENING_LOOK_TARGET);
            controlsRef.current.enabled = false;
            perspCamera.lookAt(OPENING_LOOK_TARGET);
        }

        const prefersReducedMotion =
            typeof window !== 'undefined' &&
            window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

        const flyBackToOverview = () => {
            if (!controlsRef.current) return;
            timelineRef.current?.kill();
            controlsRef.current.enabled = false;

            const startPos = perspCamera.position.clone();
            const startLook = controlsRef.current.target.clone();
            const dist = startPos.distanceTo(DEFAULT_OVERVIEW_POS);

            // If camera is already near overview position, unlock controls immediately
            if (dist < 80 && startLook.distanceTo(DEFAULT_OVERVIEW_ORIGIN) < 80) {
                controlsRef.current.target.copy(DEFAULT_OVERVIEW_ORIGIN);
                controlsRef.current.update();
                controlsRef.current.enabled = true;
                useCosmosStore.getState().setViewStage('ORBITAL_OVERVIEW');
                return;
            }

            const proxy = { t: 0 };
            const duration = prefersReducedMotion ? 1.2 : 2.2;
            spatialAudio.playWarpTransition(duration);

            timelineRef.current = gsap.timeline({
                onComplete: () => {
                    if (!controlsRef.current) return;
                    controlsRef.current.target.copy(DEFAULT_OVERVIEW_ORIGIN);
                    controlsRef.current.update();
                    controlsRef.current.enabled = true;
                    useCosmosStore.getState().setViewStage('ORBITAL_OVERVIEW');
                },
            });

            timelineRef.current.to(proxy, {
                t: 1,
                duration,
                ease: 'power3.inOut',
                onUpdate: () => {
                    perspCamera.position.lerpVectors(startPos, DEFAULT_OVERVIEW_POS, proxy.t);
                    lookAtProxy.current.lerpVectors(startLook, DEFAULT_OVERVIEW_ORIGIN, proxy.t);
                    controlsRef.current.target.copy(lookAtProxy.current);
                    perspCamera.lookAt(lookAtProxy.current);
                },
            });
        };

        // 1. Listen for LAUNCHING event to perform Alpha Jump from foreground spacecraft to Mars orbit
        const unsubStage = useCosmosStore.subscribe(
            (state) => state.viewStage,
            (stage: ViewStage, prevStage: ViewStage) => {
                if (stage !== 'LAUNCHING' || prevStage === 'LAUNCHING' || !controlsRef.current) return;

                timelineRef.current?.kill();
                controlsRef.current.enabled = false;

                const durationTotal = prefersReducedMotion ? 1.8 : 3.4;
                spatialAudio.playWarpTransition(durationTotal);

                const jumpCurve = new THREE.CatmullRomCurve3(
                    [
                        OPENING_CAMERA_POS.clone(),
                        new THREE.Vector3(0, 8150, 56000),
                        DEFAULT_OVERVIEW_POS.clone(),
                    ],
                    false,
                    'centripetal',
                    0.5,
                );

                const progressProxy = { t: 0 };
                const peakFov = prefersReducedMotion ? 52 : 76;

                timelineRef.current = gsap
                    .timeline({
                        onComplete: () => {
                            if (!controlsRef.current) return;
                            perspCamera.position.copy(DEFAULT_OVERVIEW_POS);
                            controlsRef.current.target.copy(DEFAULT_OVERVIEW_ORIGIN);
                            controlsRef.current.update();
                            controlsRef.current.enabled = true;
                            useCosmosStore.getState().completeLaunchSequence();
                        },
                    })
                    .to(
                        progressProxy,
                        {
                            t: 1,
                            duration: durationTotal,
                            ease: 'power3.inOut',
                            onUpdate: () => {
                                const pt = jumpCurve.getPointAt(progressProxy.t);
                                perspCamera.position.copy(pt);
                                controlsRef.current.target.copy(DEFAULT_OVERVIEW_ORIGIN);
                                perspCamera.lookAt(DEFAULT_OVERVIEW_ORIGIN);
                            },
                        },
                        0,
                    )
                    .to(
                        perspCamera,
                        {
                            fov: peakFov,
                            duration: durationTotal * 0.36,
                            ease: 'power2.in',
                            onUpdate: () => perspCamera.updateProjectionMatrix(),
                        },
                        0,
                    )
                    .to(
                        perspCamera,
                        {
                            fov: 45,
                            duration: durationTotal * 0.64,
                            ease: 'power3.out',
                            onUpdate: () => perspCamera.updateProjectionMatrix(),
                        },
                        durationTotal * 0.36,
                    );
            },
        );

        // 2. Listen for reset tick to fly camera back to overview
        const unsubReset = useCosmosStore.subscribe(
            (state) => state.cameraResetTick,
            () => {
                const currentStage = useCosmosStore.getState().viewStage;
                if (
                    currentStage === 'PRELOADING' ||
                    currentStage === 'LAUNCHING' ||
                    currentStage === 'SURFACE_VIEW' ||
                    currentStage === 'SURFACE_CESIUM'
                ) {
                    return;
                }
                flyBackToOverview();
            },
        );

        // 3. Listen for orbital target selection from Zustand
        const unsubTarget = useCosmosStore.subscribe(
            (state) => state.activeTarget,
            (target: CelestialTarget | null) => {
                const currentStage = useCosmosStore.getState().viewStage;
                if (
                    currentStage === 'PRELOADING' ||
                    currentStage === 'LAUNCHING' ||
                    currentStage === 'SURFACE_VIEW' ||
                    currentStage === 'SURFACE_CESIUM'
                ) {
                    return;
                }
                if (!controlsRef.current) return;

                if (!target) {
                    flyBackToOverview();
                    return;
                }

                timelineRef.current?.kill();

                // Temporarily lock user controls and play warp transit audio
                controlsRef.current.enabled = false;
                const duration = prefersReducedMotion ? 1.8 : 3.1;
                spatialAudio.playWarpTransition(duration);

                const startPos = perspCamera.position.clone();
                const startLookAt = controlsRef.current.target.clone();
                const { curve: splineCurve } = buildSafeWarpSpline(startPos, target);

                const progressProxy = { t: 0 };

                // Interpolate along spline curve with FOV warp stretching
                timelineRef.current = gsap
                    .timeline({
                        onComplete: () => {
                            if (!controlsRef.current) return;
                            controlsRef.current.target.copy(target.position);
                            controlsRef.current.update();
                            controlsRef.current.enabled = true;
                            useCosmosStore.getState().setViewStage('SUB_SCENE');
                        },
                    })
                    .to(
                        progressProxy,
                        {
                            t: 1,
                            duration,
                            ease: 'power3.inOut',
                            onUpdate: () => {
                                const currentPoint = splineCurve.getPointAt(progressProxy.t);
                                perspCamera.position.copy(currentPoint);

                                lookAtProxy.current.lerpVectors(startLookAt, target.position, progressProxy.t);
                                controlsRef.current.target.copy(lookAtProxy.current);
                                perspCamera.lookAt(lookAtProxy.current);
                            },
                        },
                        0,
                    )
                    .to(
                        perspCamera,
                        {
                            fov: prefersReducedMotion ? 50 : 66,
                            duration: duration * 0.36,
                            ease: 'power2.in',
                            onUpdate: () => perspCamera.updateProjectionMatrix(),
                        },
                        0,
                    )
                    .to(
                        perspCamera,
                        {
                            fov: 45,
                            duration: duration * 0.64,
                            ease: 'power3.out',
                            onUpdate: () => perspCamera.updateProjectionMatrix(),
                        },
                        duration * 0.36,
                    );
            },
        );

        return () => {
            unsubStage();
            unsubReset();
            unsubTarget();
            timelineRef.current?.kill();
        };
    }, [camera]);

    useFrame((_, delta) => {
        const state = useCosmosStore.getState();
        // Pause simulation rotation during warp transitions and inspection to avoid target drift
        if (state.viewStage === 'ORBITAL_OVERVIEW') {
            state.advanceSimulationTime(Math.min(delta, 0.1));
        }
    });

    return (
        <OrbitControls
            ref={controlsRef}
            enableDamping
            dampingFactor={0.06}
            rotateSpeed={0.6}
            zoomSpeed={0.9}
            minDistance={120}
            maxDistance={500000}
        />
    );
};
