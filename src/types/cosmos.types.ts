import type * as THREE from 'three';

export type SpectralMode = 'VISUAL_RGB' | 'THERMAL_IR' | 'MOLA_ELEVATION';

export type ViewStage =
    | 'PRELOADING'
    | 'LAUNCHING'
    | 'ORBITAL_OVERVIEW'
    | 'WARPING'
    | 'SUB_SCENE'
    | 'SURFACE_VIEW'
    | 'SURFACE_CESIUM';

export type CelestialTargetId =
    | 'mars'
    | 'phobos'
    | 'deimos'
    | 'mro_orbiter'
    | 'ares_station'
    | 'olympus_mons'
    | 'valles_marineris'
    | 'jezero_crater'
    | 'hellas_planitia'
    | 'gale_crater'
    | string;

export type CelestialCategory = 'PLANET' | 'MOON' | 'SPACECRAFT' | 'SURFACE_POI';

export interface SurfaceCoordinates {
    lat: number;
    lon: number;
    height: number;
    elevationKm: number;
}

export interface OrbitalElements {
    semiMajorAxisKm: number;
    eccentricity: number;
    inclinationDeg: number;
    ascendingNodeDeg: number;
    argumentOfPeriapsisDeg: number;
    meanAnomalyAtEpochDeg: number;
    orbitalPeriodHours: number;
}

export interface ScientificTelemetry {
    classification: string;
    meanTemperatureC: string;
    atmosphericPressurePa: string;
    surfaceGravityMs2: string;
    orbitalVelocityKms: string;
    geologicalAge: string;
    missionSummary: string;
    keyHighlights: string[];
}

export interface CelestialTarget {
    id: CelestialTargetId;
    name: string;
    subtitle: string;
    category: CelestialCategory;
    position: THREE.Vector3;
    radius: number;
    safeViewDistance: number;
    isSurfaceLanding?: boolean;
    coordinates?: SurfaceCoordinates;
    orbitalElements?: OrbitalElements;
    modelPath?: string;
    telemetry: ScientificTelemetry;
}

export interface SurfaceEquipmentItem {
    id: string;
    name: string;
    realCoords: { lat: number; lon: number };
    status: string;
    mission: string;
    description: string;
    elevationM?: number;
    coords?: [number, number, number];
}

export interface LODTierConfig {
    level: 0 | 1 | 2 | 3;
    maxDistanceKm: number;
    segments: number;
    label: string;
}
