import * as THREE from 'three';
import type { CelestialTarget, OrbitalElements } from '../types/cosmos.types';

export const MARS_MEAN_RADIUS_KM = 3389.5;
export const MARS_EQUATORIAL_RADIUS_KM = 3396.19;
export const MARS_POLAR_RADIUS_KM = 3376.2;
export const MARS_AXIAL_TILT_DEG = 25.19;
export const MARS_AXIAL_TILT_RAD = THREE.MathUtils.degToRad(MARS_AXIAL_TILT_DEG);
export const MARS_SIDEREAL_ROTATION_SECONDS = 88642.68; // 24.6229 hours

const _orbitalEuler = new THREE.Euler(0, 0, 0, 'YXZ');

/**
 * Computes the 3D orbital position around Mars (1 scene unit = 1 km)
 * given Keplerian orbital elements and accumulated simulation time (in seconds).
 * Zero heap allocations per frame when outVector is provided.
 */
export function computeOrbitalPosition(
    elements: OrbitalElements,
    simulationTimeSeconds: number,
    outVector = new THREE.Vector3(),
): THREE.Vector3 {
    const periodSeconds = elements.orbitalPeriodHours * 3600;
    const meanMotion = (Math.PI * 2) / periodSeconds;
    const m0 = THREE.MathUtils.degToRad(elements.meanAnomalyAtEpochDeg);
    const M = m0 + meanMotion * simulationTimeSeconds;

    // First-order Kepler equation approximation (sufficient for near-circular Martian orbits)
    const e = elements.eccentricity;
    const E = M + e * Math.sin(M) + 0.5 * e * e * Math.sin(2 * M);

    const a = elements.semiMajorAxisKm;
    const xOrbital = a * (Math.cos(E) - e);
    const zOrbital = a * Math.sqrt(1 - e * e) * Math.sin(E);

    const inc = THREE.MathUtils.degToRad(elements.inclinationDeg);
    const asc = THREE.MathUtils.degToRad(elements.ascendingNodeDeg);
    const arg = THREE.MathUtils.degToRad(elements.argumentOfPeriapsisDeg);

    outVector.set(xOrbital, 0, zOrbital);
    _orbitalEuler.set(inc, asc, arg, 'YXZ');
    outVector.applyEuler(_orbitalEuler);
    return outVector;
}

export const CELESTIAL_BODIES_CATALOG: CelestialTarget[] = [
    {
        id: 'mars',
        name: 'Mars',
        subtitle: '4th Planet from the Sun • Central Planetary Body',
        category: 'PLANET',
        position: new THREE.Vector3(0, 0, 0),
        radius: MARS_MEAN_RADIUS_KM,
        safeViewDistance: 10500,
        telemetry: {
            classification: 'Terrestrial Planet (Silicate Crust & Iron Core)',
            meanTemperatureC: '-63 °C (-140 °C to +20 °C)',
            atmosphericPressurePa: '610 Pa (95.3% CO₂, 2.6% N₂, 1.9% Ar)',
            surfaceGravityMs2: '3.721 m/s² (0.379 g)',
            orbitalVelocityKms: '24.07 km/s (Mean Heliocentric)',
            geologicalAge: '4.603 Billion Years (Noachian to Amazonian)',
            missionSummary:
                'The Red Planet hosts the largest shield volcano in the solar system (Olympus Mons), the vast tectonic canyon system Valles Marineris (4,000 km long), and ancient lacustrine delta deposits in Jezero Crater.',
            keyHighlights: [
                'Mean Volumetric Radius: 3,389.5 km • Axial Tilt: 25.19°',
                'Sol Duration: 24h 39m 35s (1.027 Earth days)',
                'Atmospheric iron(III) oxide dust produces the iconic reddish sky glow',
            ],
        },
    },
    {
        id: 'phobos',
        name: 'Phobos (Mars I)',
        subtitle: 'Innermost and Largest Natural Martian Satellite',
        category: 'MOON',
        position: new THREE.Vector3(9376, 210, 0),
        radius: 140, // Scaled for 3D visibility in orbital view (actual mean radius 11.27 km)
        safeViewDistance: 620,
        modelPath: '/assets/models/moons/phobos_draco.glb',
        orbitalElements: {
            semiMajorAxisKm: 9376,
            eccentricity: 0.0151,
            inclinationDeg: 1.093,
            ascendingNodeDeg: 48.0,
            argumentOfPeriapsisDeg: 150.0,
            meanAnomalyAtEpochDeg: 15.0,
            orbitalPeriodHours: 7.6538,
        },
        telemetry: {
            classification: 'Irregular Carbon-Rich Asteroidal Satellite (C/D type)',
            meanTemperatureC: '-40 °C (Day) to -112 °C (Night)',
            atmosphericPressurePa: '0 Pa (Hard Space Vacuum)',
            surfaceGravityMs2: '0.0057 m/s² (580 µg)',
            orbitalVelocityKms: '2.138 km/s',
            geologicalAge: '~4.3 Billion Years (Captured or Co-accreted)',
            missionSummary:
                'Orbits only ~6,000 km above the Martian surface—faster than Mars rotates. Rises in the west and sets in the east twice per Martian day. Dominated by the 9 km wide Stickney impact crater.',
            keyHighlights: [
                'Dimensions: 27 × 22 × 18 km (Mean radius 11.27 km)',
                'Extremely rapid orbital period: 7 hours 39 minutes',
                'Decaying orbit: Spiraling inward by 1.8 meters per century due to tidal forces',
            ],
        },
    },
    {
        id: 'deimos',
        name: 'Deimos (Mars II)',
        subtitle: 'Outer Natural Satellite of Mars',
        category: 'MOON',
        position: new THREE.Vector3(-23463, 420, 0),
        radius: 110, // Scaled for 3D visibility (actual mean radius 6.2 km)
        safeViewDistance: 500,
        modelPath: '/assets/models/moons/deimos_draco.glb',
        orbitalElements: {
            semiMajorAxisKm: 23463.2,
            eccentricity: 0.00033,
            inclinationDeg: 1.788,
            ascendingNodeDeg: 316.0,
            argumentOfPeriapsisDeg: 290.0,
            meanAnomalyAtEpochDeg: 195.0,
            orbitalPeriodHours: 30.312,
        },
        telemetry: {
            classification: 'Outer Minor Satellite (Carbonaceous Chondrite Rich)',
            meanTemperatureC: '-40 °C (Mean Equilibrium)',
            atmosphericPressurePa: '0 Pa (Hard Space Vacuum)',
            surfaceGravityMs2: '0.003 m/s² (300 µg)',
            orbitalVelocityKms: '1.351 km/s',
            geologicalAge: '~4.3 Billion Years',
            missionSummary:
                'Smooth regolith-blanketed surface concealing older impact scars. Its largest craters are Swift (1.0 km) and Voltaire (1.9 km). Serves as an ideal staging platform for deep-space transport.',
            keyHighlights: [
                'Semi-Major Axis: 23,463.2 km',
                'Orbital Period: 30.31 Hours (Near-synchronous with Martian Sol)',
                'Escape Velocity: 5.6 m/s (Human sprint escape threshold)',
            ],
        },
    },
    {
        id: 'mro_orbiter',
        name: 'Mars Reconnaissance Orbiter (MRO)',
        subtitle: 'High-Resolution Remote Sensing Orbiter (HiRISE / CRISM)',
        category: 'SPACECRAFT',
        position: new THREE.Vector3(0, 3100, 2100),
        radius: 55,
        safeViewDistance: 280,
        modelPath: '/assets/models/spacecraft/mars_reconnaissance_orbiter.glb',
        orbitalElements: {
            semiMajorAxisKm: 3740, // ~350 km altitude above surface
            eccentricity: 0.002,
            inclinationDeg: 92.6, // Sun-synchronous polar orbit
            ascendingNodeDeg: 24.0,
            argumentOfPeriapsisDeg: 90.0,
            meanAnomalyAtEpochDeg: 65.0,
            orbitalPeriodHours: 1.87,
        },
        telemetry: {
            classification: 'Remote Sensing Orbiter & Deep Space UHF Relay Hub',
            meanTemperatureC: 'Active thermal control loop (-20 °C to +35 °C internal)',
            atmosphericPressurePa: 'Low Mars Orbit (LEO-Mars ~300 km)',
            surfaceGravityMs2: 'Microgravity (Free-fall orbital mechanics)',
            orbitalVelocityKms: '3.42 km/s',
            geologicalAge: 'Launched Aug 12, 2005 • Orbit Insertion Mar 10, 2006',
            missionSummary:
                'Equipped with the 0.5-meter HiRISE telescope resolving surface details down to 30 cm/pixel, and the CRISM imaging spectrometer mapping hydrated minerals to select rover landing sites.',
            keyHighlights: [
                'Operational Orbit: 255 × 320 km (92.6° Inclined Polar Orbit)',
                'Relayed over 450 Terabits of scientific research to Earth',
                'Primary high-bandwidth UHF relay node for surface rovers',
            ],
        },
    },
    {
        id: 'ares_station',
        name: 'Ares Orbital Gateway',
        subtitle: 'Medium Orbital Command & Logistics Hub (MOI Gateway)',
        category: 'SPACECRAFT',
        position: new THREE.Vector3(-4200, 1200, 2800),
        radius: 75,
        safeViewDistance: 340,
        modelPath: '/assets/models/stations/ares_orbital_station_lod0.glb',
        orbitalElements: {
            semiMajorAxisKm: 5200,
            eccentricity: 0.001,
            inclinationDeg: 28.5,
            ascendingNodeDeg: 140.0,
            argumentOfPeriapsisDeg: 45.0,
            meanAnomalyAtEpochDeg: 240.0,
            orbitalPeriodHours: 3.12,
        },
        telemetry: {
            classification: 'Modular Rotating Artificial-Gravity Space Station',
            meanTemperatureC: '+21.5 °C (Pressurized habitat environmental loop)',
            atmosphericPressurePa: '101.3 kPa (Standard Earth N₂/O₂ atmosphere)',
            surfaceGravityMs2: '3.72 m/s² (Centrifugal Martian gravity simulation)',
            orbitalVelocityKms: '2.89 km/s',
            geologicalAge: 'Next-Generation Deep Space Orbital Infrastructure',
            missionSummary:
                'Command and telemetry bridge coordinating surface landings and low-latency (<20 ms) remote operations for autonomous exploration fleets across Jezero Crater and Tharsis.',
            keyHighlights: [
                'Orbital Altitude: 1,810 km equatorial circular orbit',
                '150 kW Hall-Effect Ion Propulsion orbital maintenance array',
                'Dual docking hubs for interplanetary crew shuttles and descent modules',
            ],
        },
    },
];
