import type { SurfaceEquipmentItem } from '../types/cosmos.types';

/**
 * Converts Martian Latitude (N/S) and Longitude (E) into 3D coordinates on the flat terrain model.
 * Matches OLD_DEMO projection math:
 * Longitude [-180, 180] maps to X [-1000, 1000]
 * Latitude [90, -90] maps to Z [-500, 500]
 */
export function latLonToMapCoords(lat: number, lon: number): [number, number, number] {
    let normalizedLon = ((lon % 360) + 360) % 360;
    if (normalizedLon > 180) {
        normalizedLon -= 360;
    }
    const x = (normalizedLon / 180) * 1000;
    const z = -(lat / 90) * 500;
    return [x, 0, z];
}

export const SURFACE_EQUIPMENT_CATALOG: SurfaceEquipmentItem[] = [
    {
        id: 'perseverance',
        name: 'Perseverance Rover & Ingenuity',
        realCoords: { lat: 18.447, lon: 77.402 },
        status: 'ACTIVE (Sol 1320+)',
        mission: 'Astrobiology & Sample Return Caching',
        description: 'Actively exploring ancient river delta deposits and ascending the western rim of Jezero Crater. Has cached over 24 rock core samples and deployed the Ingenuity Mars Helicopter.',
        elevationM: -2500,
        coords: latLonToMapCoords(18.447, 77.402),
    },
    {
        id: 'beagle_2',
        name: 'Beagle 2 Lander',
        realCoords: { lat: 12.9, lon: 87.0 },
        status: 'DORMANT (Found 2014)',
        mission: 'Exobiology & Geochemistry',
        description: 'ESA/UK lander located in Isidis Planitia, 11 years after contact was lost during Christmas 2003 descent. High-resolution MRO HiRISE imagery confirmed successful touchdown, but incomplete solar panel unfolding blocked its transmission antenna.',
        elevationM: -3200,
        coords: latLonToMapCoords(12.9, 87.0),
    },
    {
        id: 'curiosity',
        name: 'Curiosity Rover (MSL)',
        realCoords: { lat: -5.4, lon: 137.8 },
        status: 'ACTIVE (Sol 4350+)',
        mission: 'Habitability & Paleoclimate Investigation',
        description: 'Climbing the lower foothills of Mount Sharp (Aeolis Mons) in Gale Crater since 2012. Proven ancient Gale Crater once held a freshwater lake system capable of supporting microbial life.',
        elevationM: -4500,
        coords: latLonToMapCoords(-5.4, 137.8),
    },
    {
        id: 'opportunity',
        name: 'Opportunity Rover (MER-B)',
        realCoords: { lat: -1.95, lon: 354.47 },
        status: 'MISSION COMPLETE (2004–2018)',
        mission: 'Hydration Mineralogy & Deep Geological Traverse',
        description: 'Historic rover that operated for nearly 15 years across Meridiani Planum, trekking 45.16 kilometers before the catastrophic 2018 global dust storm covered its solar arrays in Perseverance Valley.',
        elevationM: -1400,
        coords: latLonToMapCoords(-1.95, 354.47),
    },
    {
        id: 'viking_1',
        name: 'Viking 1 Lander',
        realCoords: { lat: 22.48, lon: 312.05 },
        status: 'HISTORIC MONUMENT (Touchdown July 20, 1976)',
        mission: 'First Successful Extended Surface Mission',
        description: 'The first spacecraft to successfully land on Mars and operate long-term on the surface (Chryse Planitia), returning iconic initial color photographs and atmospheric pressure profiles.',
        elevationM: -2690,
        coords: latLonToMapCoords(22.48, 312.05),
    },
    {
        id: 'olympus_mons_site',
        name: 'Olympus Mons Caldera Rim',
        realCoords: { lat: 18.65, lon: 226.2 },
        status: 'NATURAL GEOLOGICAL WONDER',
        mission: 'Volcanology & High-Altitude Survey',
        description: 'Summit caldera complex of the solar system\'s highest volcano (+21.2 km). The atmosphere here is thin (72 Pa) with panoramic views extending beyond the Tharsis rise.',
        elevationM: 21229,
        coords: latLonToMapCoords(18.65, 226.2),
    },
    {
        id: 'valles_marineris_site',
        name: 'Valles Marineris (Melas Chasma)',
        realCoords: { lat: -13.9, lon: 300.8 },
        status: 'TECTONIC SURVEY SITE',
        mission: 'Deep Canyon & Fog Stratigraphy',
        description: 'Floor of the deepest segment of the grand canyon network (-7.1 km below datum). Often experiences early morning water-ice clouds and dense atmospheric pooling.',
        elevationM: -7100,
        coords: latLonToMapCoords(-13.9, 300.8),
    },
    {
        id: 'hellas_site',
        name: 'Hellas Planitia (Badwater Floor)',
        realCoords: { lat: -42.4, lon: 70.5 },
        status: 'DEEP BASIN DEPRESSION',
        mission: 'High-Pressure Boundary Survey',
        description: 'Deepest point on Mars (-8.2 km). The ambient atmospheric pressure exceeds 1,155 Pa, creating unique atmospheric thermodynamic stability conditions on the planet.',
        elevationM: -8200,
        coords: latLonToMapCoords(-42.4, 70.5),
    },
];

export function findSurfaceEquipmentByCoords(lat: number, lon: number): SurfaceEquipmentItem | undefined {
    return SURFACE_EQUIPMENT_CATALOG.find(
        (eq) => Math.abs(eq.realCoords.lat - lat) < 1.0 && Math.abs(eq.realCoords.lon - lon) < 1.0
    );
}

export function findSurfaceEquipmentById(id: string): SurfaceEquipmentItem | undefined {
    return SURFACE_EQUIPMENT_CATALOG.find((eq) => eq.id === id);
}
