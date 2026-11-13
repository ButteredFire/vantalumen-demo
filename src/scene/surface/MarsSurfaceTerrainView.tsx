import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, Loader } from '@react-three/drei';
import { EffectComposer, DepthOfField } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useCosmosStore } from '../../store/useCosmosStore';
import { surfaceAudio } from '../../core/audio/SurfaceAudioController';
import {
    SURFACE_EQUIPMENT_CATALOG,
    findSurfaceEquipmentByCoords,
    latLonToMapCoords,
} from '../../config/surfaceEquipment';
import type { SurfaceEquipmentItem } from '../../types/cosmos.types';
import { MarsTerrainMesh } from './MarsTerrainMesh';
import { MartianDustParticles } from './MartianDustParticles';
import { MartianAtmosphericFog } from './MartianAtmosphericFog';
import { SurfaceMapControls } from './SurfaceMapControls';
import { SurfaceBeaconPin } from './SurfaceBeaconPin';
import { SurfaceHeaderBanner } from '../../ui/surface/SurfaceHeaderBanner';
import { SurfaceTelemetryPanel } from '../../ui/surface/SurfaceTelemetryPanel';
import { SurfaceRadarGizmo } from '../../ui/surface/SurfaceRadarGizmo';
import { SurfaceToastSystem, type SurfaceToast } from '../../ui/surface/SurfaceToastSystem';

export const MarsSurfaceTerrainView: React.FC = () => {
    const viewStage = useCosmosStore((state) => state.viewStage);
    const activeTarget = useCosmosStore((state) => state.activeTarget);
    const returnToOrbit = useCosmosStore((state) => state.returnToOrbit);
    const audioMuted = useCosmosStore((state) => state.audioMuted);

    const isSurfaceStage = viewStage === 'SURFACE_VIEW' || viewStage === 'SURFACE_CESIUM';
    const [isMounted, setIsMounted] = useState(isSurfaceStage);
    const [isExiting, setIsExiting] = useState(false);

    const cameraTargetRef = useRef(new THREE.Vector3(0, 0, 0));
    const [selectedEquipment, setSelectedEquipment] = useState<SurfaceEquipmentItem | null>(null);
    const [toasts, setToasts] = useState<SurfaceToast[]>([]);

    // Handle smooth mounting & crossfade lifecycle
    useEffect(() => {
        if (isSurfaceStage) {
            setIsMounted(true);
            setIsExiting(false);
            surfaceAudio.startAmbience(0.24, 2500);
        } else if (isMounted && !isExiting) {
            setIsExiting(true);
            const timer = setTimeout(() => {
                setIsMounted(false);
                setIsExiting(false);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [isSurfaceStage, isMounted, isExiting]);

    // Initial sync with activeTarget coordinates from orbital globe selection
    useEffect(() => {
        if (activeTarget?.coordinates) {
            const { lat, lon } = activeTarget.coordinates;
            const matched = findSurfaceEquipmentByCoords(lat, lon);
            if (matched) {
                setSelectedEquipment(matched);
            } else {
                const customItem: SurfaceEquipmentItem = {
                    id: activeTarget.id,
                    name: activeTarget.name,
                    realCoords: { lat, lon },
                    status: 'SURFACE RECON TARGET',
                    mission: activeTarget.telemetry.classification,
                    description: activeTarget.telemetry.missionSummary,
                    elevationM: activeTarget.coordinates.elevationKm * 1000,
                    coords: latLonToMapCoords(lat, lon),
                };
                setSelectedEquipment(customItem);
            }
        } else if (!selectedEquipment) {
            const defaultEq = SURFACE_EQUIPMENT_CATALOG[0];
            setSelectedEquipment(defaultEq);
        }
    }, [activeTarget]);

    // Sync audio muted state
    useEffect(() => {
        surfaceAudio.updateMuteState(audioMuted);
    }, [audioMuted]);

    const addToast = (type: SurfaceToast['type'], title: string, description?: string) => {
        const id = Date.now() + Math.random();
        setToasts((prev) => [...prev, { id, type, title, description }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4200);
    };

    const handleSelectEquipment = (equipment: SurfaceEquipmentItem) => {
        setSelectedEquipment(equipment);
        addToast(
            'info',
            `TELEMETRY LOCKED: ${equipment.name.toUpperCase()}`,
            `Coordinates: ${equipment.realCoords.lat.toFixed(2)}°N, ${equipment.realCoords.lon.toFixed(2)}°E`,
        );
    };

    const handleInspect = () => {
        if (!selectedEquipment) return;
        addToast(
            'success',
            'DIAGNOSTICS COMPLETE',
            `${selectedEquipment.name}: Power & thermal margins nominal. Scientific payload telemetry transmitting.`,
        );
    };

    const handleRecenter = () => {
        if (!selectedEquipment?.coords) return;
        cameraTargetRef.current.set(
            selectedEquipment.coords[0],
            selectedEquipment.coords[1],
            selectedEquipment.coords[2],
        );
        addToast(
            'info',
            'CAMERA RE-CENTERED',
            `Aligning sensor array to ${selectedEquipment.name}.`,
        );
    };

    const handleReturnToOrbit = () => {
        if (isExiting) return;
        setIsExiting(true);
        surfaceAudio.playCollapse();
        surfaceAudio.stopAmbience(1200);

        // Simultaneously trigger return to orbit so orbital globe begins crossfading in
        returnToOrbit();

        setTimeout(() => {
            setIsMounted(false);
            setIsExiting(false);
        }, 800);
    };

    // Calculate current 3D focus coordinate
    const focusCoords = useMemo<[number, number, number] | null>(() => {
        if (!selectedEquipment?.coords) return null;
        return selectedEquipment.coords;
    }, [selectedEquipment]);

    if (!isMounted) return null;

    return (
        <div
            className={`surface-terrain-experience ${isExiting ? 'is-exiting' : 'is-active'}`}
            role="region"
            aria-label="3D Martian Surface Terrain View"
        >
            <div className="surface-vignette-overlay" aria-hidden="true" />

            {/* Top Navigation & Status Bar */}
            <SurfaceHeaderBanner
                selectedEquipment={selectedEquipment}
                onReturnToOrbit={handleReturnToOrbit}
            />

            {/* Left Radar Navigation Gizmo */}
            <SurfaceRadarGizmo
                equipmentList={SURFACE_EQUIPMENT_CATALOG}
                selectedEquipment={selectedEquipment}
                cameraTargetRef={cameraTargetRef}
                onSelectEquipment={handleSelectEquipment}
            />

            {/* Right Telemetry Panel (when target selected) */}
            {selectedEquipment && (
                <SurfaceTelemetryPanel
                    equipment={selectedEquipment}
                    onClose={() => setSelectedEquipment(null)}
                    onInspect={handleInspect}
                    onRecenter={handleRecenter}
                />
            )}

            {/* Toasts Feedback */}
            <SurfaceToastSystem
                toasts={toasts}
                onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
            />

            {/* 3D Scene Canvas with Low FOV=12 for scale & telephoto depth */}
            <Canvas
                camera={{
                    fov: 12,
                    position: [0, 800, 1000],
                    near: 0.1,
                    far: 5000,
                }}
            >
                {/* Atmospheric dusty horizon background */}
                <color attach="background" args={['#c7a47b']} />

                <Suspense fallback={null}>
                    {/* 3D Martian Surface Ground Mesh */}
                    <MarsTerrainMesh />

                    {/* Dynamic Dust Particles streaming above terrain peaks */}
                    <MartianDustParticles />

                    {/* Light, subtle ground fog hovering above plains */}
                    <MartianAtmosphericFog />

                    {/* Fixed-size Beacon Pins for NASA Hardware & Landmarks */}
                    {SURFACE_EQUIPMENT_CATALOG.map((eq) => (
                        <SurfaceBeaconPin
                            key={eq.id}
                            equipment={eq}
                            isSelected={selectedEquipment?.id === eq.id}
                            onClick={() => handleSelectEquipment(eq)}
                        />
                    ))}

                    <Environment preset="sunset" environmentIntensity={0.65} />
                    <directionalLight position={[100, 80, 50]} intensity={0.6} color="#ffd4b8" />
                    <ambientLight intensity={0.28} color="#9a6e4d" />

                    {/* Subtle, full-resolution DepthOfField focused on active camera target */}
                    <EffectComposer enableNormalPass={false}>
                        <DepthOfField
                            target={[0, 0, 0]}
                            focalLength={0.4}
                            bokehScale={0.9}
                        />
                    </EffectComposer>
                </Suspense>

                {/* Buttery, sluggish inertia MapControls */}
                <SurfaceMapControls
                    focusTarget={focusCoords}
                    cameraTargetRef={cameraTargetRef}
                />
            </Canvas>

            <Loader
                dataInterpolation={(p) => `Streaming Martian Surface Terrain... ${p.toFixed(0)}%`}
                containerStyles={{ background: '#020205' }}
                innerStyles={{ width: '320px' }}
                barStyles={{ background: '#f18b62' }}
            />
        </div>
    );
};
