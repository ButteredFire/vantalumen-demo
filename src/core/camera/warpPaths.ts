import * as THREE from 'three';
import { MARS_MEAN_RADIUS_KM } from '../../config/celestialCatalog';
import type { CelestialTarget } from '../../types/cosmos.types';

export interface WarpTrajectoryResult {
  curve: THREE.CatmullRomCurve3;
  endPosition: THREE.Vector3;
}

/**
 * Generates a smooth, cusp-free centripetal 3D Catmull-Rom spline from the current camera position
 * to a safe vantage point above the target, curving around Mars's atmospheric shell to prevent planet clipping.
 */
export function buildSafeWarpSpline(
  startPos: THREE.Vector3,
  target: CelestialTarget,
): WarpTrajectoryResult {
  const targetPos = target.position.clone();

  // Compute outward radial direction from Mars origin if target is a surface POI,
  // or approach vector from camera to target for moons/spacecraft.
  let endDir: THREE.Vector3;
  if (target.category === 'SURFACE_POI') {
    endDir = targetPos.clone().normalize();
  } else if (target.id === 'mars') {
    endDir = startPos.clone().normalize();
    if (endDir.lengthSq() < 0.001) endDir.set(0, 0.35, 1).normalize();
  } else {
    endDir = startPos.clone().sub(targetPos).normalize();
    if (endDir.lengthSq() < 0.001) endDir.set(0, 0.4, 1).normalize();
  }

  const endPos = targetPos.clone().add(endDir.clone().multiplyScalar(target.safeViewDistance));
  const chordDist = startPos.distanceTo(endPos);

  // Proportional tangent deflection so short hops never loop wildly
  const upAxis = new THREE.Vector3(0, 1, 0);
  let tangentOffset = upAxis.clone().cross(endDir);
  if (tangentOffset.lengthSq() < 0.001) {
    tangentOffset = new THREE.Vector3(1, 0, 0).cross(endDir);
  }
  tangentOffset.normalize();

  const minSafeOrbitalRadius = MARS_MEAN_RADIUS_KM + 1050;
  const deflectionMagnitude = Math.min(
    chordDist * 0.22,
    Math.max(target.radius * 0.85, 550),
  );

  const p1 = startPos.clone().lerp(endPos, 0.34);
  const p2 = startPos.clone().lerp(endPos, 0.68);

  p1.addScaledVector(tangentOffset, deflectionMagnitude * 0.85);
  p2.addScaledVector(tangentOffset, deflectionMagnitude * 0.65);

  // Push intermediate waypoints outside Mars's upper atmosphere if the chord passes near the planet interior
  if (p1.length() < minSafeOrbitalRadius) {
    p1.normalize().multiplyScalar(minSafeOrbitalRadius);
  }
  if (p2.length() < minSafeOrbitalRadius) {
    p2.normalize().multiplyScalar(minSafeOrbitalRadius);
  }

  const curve = new THREE.CatmullRomCurve3(
    [startPos.clone(), p1, p2, endPos.clone()],
    false,
    'centripetal',
    0.5,
  );
  return { curve, endPosition: endPos };
}
