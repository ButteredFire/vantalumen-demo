import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import * as THREE from 'three';
import type {
    CelestialTarget,
    CelestialTargetId,
    SpectralMode,
    ViewStage,
    SurfaceEquipmentItem,
} from '../types/cosmos.types';

export type { CelestialTarget, CelestialTargetId, SpectralMode, ViewStage, SurfaceEquipmentItem };

interface CosmosState {
    viewStage: ViewStage;
    activeTarget: CelestialTarget | null;
    selectedSurfaceEquipment: SurfaceEquipmentItem | null;
    timeScale: number;          // Time simulation rate (1 = real-time, 1000 = fast orbital cycle)
    simulationTime: number;     // Accumulated simulation time in seconds
    spectralMode: SpectralMode;
    audioMuted: boolean;
    controlsLocked: boolean;
    loadingProgress: number;
    requiredAssetsReady: boolean;
    loadingStatusLabel: string;
    loadingTasks: Record<string, number>;
    cameraAltitudeKm: number;
    cameraResetTick: number;
    floatingOriginOffset: THREE.Vector3;

    // Dynamic runtime positions of orbiting bodies & rotating surface POIs
    dynamicPositions: Record<string, THREE.Vector3>;

    // Actions
    reportAssetTaskProgress: (taskId: string, progressPct: number, label?: string) => void;
    setLoadingProgress: (progress: number) => void;
    startLaunchSequence: () => void;
    completeLaunchSequence: () => void;
    completePreloader: () => void;
    selectTarget: (target: CelestialTarget | null) => void;
    setSelectedSurfaceEquipment: (equipment: SurfaceEquipmentItem | null) => void;
    enterSurfaceLanding: (target?: CelestialTarget | null) => void;
    returnToOrbit: () => void;
    setViewStage: (stage: ViewStage) => void;
    setTimeScale: (scale: number) => void;
    setSpectralMode: (mode: SpectralMode) => void;
    toggleAudio: () => void;
    setAudioMuted: (muted: boolean) => void;
    advanceSimulationTime: (delta: number) => void;
    setCameraAltitudeKm: (altitudeKm: number) => void;
    setFloatingOriginOffset: (offset: THREE.Vector3) => void;
    updateDynamicPosition: (id: CelestialTargetId, position: THREE.Vector3) => void;
}

const REQUIRED_LOADING_TASKS = [
    'mars_surface_maps',
    'decoders_and_models',
] as const;

export const useCosmosStore = create<CosmosState>()(
    subscribeWithSelector((set, get) => ({
        viewStage: 'PRELOADING',
        activeTarget: null,
        selectedSurfaceEquipment: null,
        timeScale: 100,
        simulationTime: 0,
        spectralMode: 'VISUAL_RGB',
        audioMuted: false,
        controlsLocked: true,
        loadingProgress: 0,
        requiredAssetsReady: false,
        loadingStatusLabel: 'Initializing optical sensors & decompression pipelines...',
        loadingTasks: {
            mars_surface_maps: 0,
            decoders_and_models: 0,
        },
        cameraAltitudeKm: 84610,
        cameraResetTick: 0,
        floatingOriginOffset: new THREE.Vector3(0, 0, 0),
        dynamicPositions: {},

        reportAssetTaskProgress: (taskId, progressPct, label) =>
            set((state) => {
                const clamped = Math.max(0, Math.min(100, progressPct));
                const nextTasks = { ...state.loadingTasks, [taskId]: clamped };
                const total = REQUIRED_LOADING_TASKS.reduce(
                    (sum, key) => sum + (nextTasks[key] ?? 0),
                    0,
                );
                const avgProgress = Math.round(total / REQUIRED_LOADING_TASKS.length);
                const allDone = REQUIRED_LOADING_TASKS.every((key) => (nextTasks[key] ?? 0) >= 100);

                return {
                    loadingTasks: nextTasks,
                    loadingProgress: avgProgress,
                    requiredAssetsReady: allDone,
                    loadingStatusLabel: allDone
                        ? 'Core assets initialized • Standby for orbital jump'
                        : (label ?? state.loadingStatusLabel),
                };
            }),

        setLoadingProgress: (progress) =>
            set((state) => ({
                loadingProgress: Math.max(state.loadingProgress, Math.min(100, progress)),
            })),

        startLaunchSequence: () => {
            if (!get().requiredAssetsReady) return;
            set({
                viewStage: 'LAUNCHING',
                controlsLocked: true,
            });
        },

        completeLaunchSequence: () =>
            set({
                viewStage: 'ORBITAL_OVERVIEW',
                loadingProgress: 100,
                controlsLocked: false,
            }),

        completePreloader: () =>
            set({
                viewStage: 'ORBITAL_OVERVIEW',
                loadingProgress: 100,
                controlsLocked: false,
            }),

        selectTarget: (target) => {
            if (!target) {
                set({
                    activeTarget: null,
                    viewStage: 'ORBITAL_OVERVIEW',
                    controlsLocked: false,
                });
                return;
            }

            // Sync target position with its latest dynamic orbital/rotational world position
            const dynamicPos = get().dynamicPositions[target.id];
            const syncedTarget: CelestialTarget = dynamicPos
                ? { ...target, position: dynamicPos.clone() }
                : { ...target, position: target.position.clone() };

            // When a surface POI/landmark is selected, transition directly to the 3D surface view!
            if (target.category === 'SURFACE_POI' || target.isSurfaceLanding) {
                set({
                    activeTarget: syncedTarget,
                    viewStage: 'SURFACE_VIEW',
                    controlsLocked: false,
                });
                return;
            }

            // For orbital bodies (spacecraft, moons, central Mars overview), warp into inspection
            set({
                activeTarget: syncedTarget,
                viewStage: 'WARPING',
                controlsLocked: true,
            });
        },

        setSelectedSurfaceEquipment: (equipment) =>
            set({ selectedSurfaceEquipment: equipment }),

        enterSurfaceLanding: (target) => {
            const current = target ?? get().activeTarget;
            set({
                activeTarget: current ?? null,
                viewStage: 'SURFACE_VIEW',
                controlsLocked: false,
            });
        },

        returnToOrbit: () =>
            set((state) => ({
                activeTarget: null,
                selectedSurfaceEquipment: null,
                viewStage: 'ORBITAL_OVERVIEW',
                controlsLocked: false,
                cameraResetTick: state.cameraResetTick + 1,
            })),

        setViewStage: (stage) =>
            set({
                viewStage: stage,
                controlsLocked:
                    stage === 'WARPING' || stage === 'PRELOADING' || stage === 'LAUNCHING',
            }),

        setTimeScale: (scale) => set({ timeScale: scale }),

        setSpectralMode: (mode) => set({ spectralMode: mode }),

        toggleAudio: () => set((state) => ({ audioMuted: !state.audioMuted })),

        setAudioMuted: (muted) => set({ audioMuted: muted }),

        advanceSimulationTime: (delta) =>
            set((state) => ({
                simulationTime: state.simulationTime + delta * state.timeScale,
            })),

        setCameraAltitudeKm: (altitudeKm) => set({ cameraAltitudeKm: altitudeKm }),

        setFloatingOriginOffset: (offset) => set({ floatingOriginOffset: offset.clone() }),

        updateDynamicPosition: (id, position) => {
            const dict = get().dynamicPositions;
            if (!dict[id]) {
                dict[id] = position.clone();
            } else {
                dict[id].copy(position);
            }
        },
    })),
);
