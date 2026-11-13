import * as THREE from 'three';
import type { CelestialTarget, CelestialTargetId } from '../types/cosmos.types';
import { CELESTIAL_BODIES_CATALOG, MARS_MEAN_RADIUS_KM } from './celestialCatalog';

/**
 * Converts planetocentric Latitude / Longitude (in degrees) and radius (in km)
 * into a 3D Cartesian coordinate vector on the Mars sphere.
 */
export function latLonToMarsVector3(
    latDeg: number,
    lonDeg: number,
    radiusKm: number = MARS_MEAN_RADIUS_KM,
): THREE.Vector3 {
    const phi = THREE.MathUtils.degToRad(90 - latDeg);
    const theta = THREE.MathUtils.degToRad(lonDeg + 180);

    const x = -radiusKm * Math.sin(phi) * Math.cos(theta);
    const y = radiusKm * Math.cos(phi);
    const z = radiusKm * Math.sin(phi) * Math.sin(theta);

    return new THREE.Vector3(x, y, z);
}

const POI_SURFACE_OFFSET_KM = 18; // Slight offset above terrain for 3D label placement

export const POI_LANDMARKS_CATALOG: CelestialTarget[] = [
    {
        id: 'jezero_crater',
        name: 'Jezero Crater',
        subtitle: 'Ancient River Delta • Perseverance & Ingenuity Site',
        category: 'SURFACE_POI',
        position: latLonToMarsVector3(18.38, 77.58, MARS_MEAN_RADIUS_KM + POI_SURFACE_OFFSET_KM),
        radius: 180,
        safeViewDistance: 980,
        isSurfaceLanding: true,
        coordinates: {
            lat: 18.38,
            lon: 77.58,
            height: 16500,
            elevationKm: -2.5,
        },
        telemetry: {
            classification: 'Impact Crater with Lacustrine Deltaic Deposits',
            meanTemperatureC: '-55 °C (Day -15 °C, Night -85 °C)',
            atmosphericPressurePa: '740 Pa',
            surfaceGravityMs2: '3.721 m/s²',
            orbitalVelocityKms: '0.229 km/s',
            geologicalAge: '3.8 – 3.9 Billion Years (Noachian Epoch)',
            missionSummary:
                'A 45 km diameter crater on the western rim of Isidis Planitia, where an ancient river once entered forming a rich clay delta. Hosts NASA\'s Mars 2020 Perseverance Rover and Ingenuity Helicopter.',
            keyHighlights: [
                'Landing Site: 18.38°N, 77.58°E (Octavia E. Butler Landing)',
                'Crater Diameter: 45.0 km • MOLA Elevation: -2,500 m',
                'Actively caching rock core samples for Mars Sample Return',
            ],
        },
    },
    {
        id: 'olympus_mons',
        name: 'Olympus Mons',
        subtitle: 'Largest Shield Volcano in the Solar System (+21.2 km)',
        category: 'SURFACE_POI',
        position: latLonToMarsVector3(18.65, 226.2, MARS_MEAN_RADIUS_KM + POI_SURFACE_OFFSET_KM),
        radius: 310,
        safeViewDistance: 1250,
        isSurfaceLanding: true,
        coordinates: {
            lat: 18.65,
            lon: 226.2,
            height: 38000,
            elevationKm: 21.229,
        },
        telemetry: {
            classification: 'Colossal Shield Volcano (Tharsis Volcanic Province)',
            meanTemperatureC: '-72 °C at the caldera summit',
            atmosphericPressurePa: '72 Pa (~12% of Martian surface mean)',
            surfaceGravityMs2: '3.71 m/s²',
            orbitalVelocityKms: '0.228 km/s (Surface rotational speed)',
            geologicalAge: 'Hesperian – Amazonian Epoch (Recent activity ~25 Ma)',
            missionSummary:
                'Stands nearly 2.5 times the height of Mount Everest above the datum, spanning 624 km across with vertical basal cliffs up to 8 km high and a complex caldera measuring 85 × 60 km.',
            keyHighlights: [
                'Coordinates: 18.65°N, 226.20°E (Tharsis Bulge)',
                'MOLA Summit Elevation: +21,229 m • Basal Diameter: 624 km',
                'Summit extends above 88% of atmospheric dust storms',
            ],
        },
    },
    {
        id: 'valles_marineris',
        name: 'Valles Marineris',
        subtitle: '4,000 km Tectonic Canyon System • 7 km Deep',
        category: 'SURFACE_POI',
        position: latLonToMarsVector3(-13.9, 300.8, MARS_MEAN_RADIUS_KM + POI_SURFACE_OFFSET_KM),
        radius: 400,
        safeViewDistance: 1450,
        isSurfaceLanding: true,
        coordinates: {
            lat: -13.9,
            lon: 300.8,
            height: 28000,
            elevationKm: -7.1,
        },
        telemetry: {
            classification: 'Extensional Tectonic Rift Chasm System',
            meanTemperatureC: '-48 °C (Basin floor warmer than highlands)',
            atmosphericPressurePa: '890 Pa (Higher pressure at canyon floor)',
            surfaceGravityMs2: '3.725 m/s²',
            orbitalVelocityKms: '0.234 km/s',
            geologicalAge: '~3.5 Billion Years (Hesperian Epoch)',
            missionSummary:
                'Spans nearly one-fourth of Mars\' equatorial circumference. Formed as the crust cracked during Tharsis uplift, subsequent widening caused by groundwater sapping and monumental landslides.',
            keyHighlights: [
                'Central Chasma (Melas): 13.90°S, 300.80°E',
                'Length: 4,000 km • Width: Up to 200 km • Depth: ~7,100 m',
                'Frequent water-ice morning fog accumulates in deep chasms',
            ],
        },
    },
    {
        id: 'gale_crater',
        name: 'Gale Crater (Mount Sharp)',
        subtitle: '5.5 km Sedimentary Mountain • Curiosity Rover Site',
        category: 'SURFACE_POI',
        position: latLonToMarsVector3(-5.4, 137.8, MARS_MEAN_RADIUS_KM + POI_SURFACE_OFFSET_KM),
        radius: 210,
        safeViewDistance: 1050,
        isSurfaceLanding: true,
        coordinates: {
            lat: -5.4,
            lon: 137.8,
            height: 19000,
            elevationKm: -4.5,
        },
        telemetry: {
            classification: 'Impact Crater with Stratified Central Mound',
            meanTemperatureC: '-46 °C (-90 °C to 0 °C diurnal range)',
            atmosphericPressurePa: '840 Pa',
            surfaceGravityMs2: '3.72 m/s²',
            orbitalVelocityKms: '0.240 km/s',
            geologicalAge: '3.5 – 3.8 Billion Years',
            missionSummary:
                'A 154 km crater hosting the 5.5 km high central mound Aeolis Mons (Mount Sharp). Rock layers document the climatic transition of early Mars from a wet environment to an arid desert.',
            keyHighlights: [
                'Bradbury Landing Site: 5.40°S, 137.80°E (Curiosity Rover)',
                'Confirmed past habitable lake conditions and indigenous organic molecules',
                'Transition layers: Smectite clays shifting to sulfate salts uphill',
            ],
        },
    },
    {
        id: 'hellas_planitia',
        name: 'Hellas Planitia',
        subtitle: 'Deepest Impact Basin on Mars (-8.2 km)',
        category: 'SURFACE_POI',
        position: latLonToMarsVector3(-42.4, 70.5, MARS_MEAN_RADIUS_KM + POI_SURFACE_OFFSET_KM),
        radius: 450,
        safeViewDistance: 1650,
        isSurfaceLanding: true,
        coordinates: {
            lat: -42.4,
            lon: 70.5,
            height: 42000,
            elevationKm: -8.2,
        },
        telemetry: {
            classification: 'Ancient Giant Impact Basin (Basin Floor Lowland)',
            meanTemperatureC: '-52 °C',
            atmosphericPressurePa: '1,155 Pa (89% higher than MOLA zero datum)',
            surfaceGravityMs2: '3.73 m/s²',
            orbitalVelocityKms: '0.178 km/s',
            geologicalAge: '~4.1 – 3.8 Billion Years (Late Heavy Bombardment)',
            missionSummary:
                'Spanning 2,300 km in diameter and plunging deeper than 8 km below the datum. The deep basin maintains atmospheric pressure high enough to momentarily allow liquid water above 0 °C.',
            keyHighlights: [
                'Center: 42.40°S, 70.50°E',
                'Deepest point on Mars (Badwater Crater): -8,200 m',
                'Total relief difference of ~30 km compared to Olympus Mons summit',
            ],
        },
    },
];

export const ALL_CELESTIAL_TARGETS: CelestialTarget[] = [
    ...CELESTIAL_BODIES_CATALOG,
    ...POI_LANDMARKS_CATALOG,
];

export function findTargetById(id: CelestialTargetId): CelestialTarget | undefined {
    return ALL_CELESTIAL_TARGETS.find((item) => item.id === id);
}
