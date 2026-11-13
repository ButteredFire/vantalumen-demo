import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  MARS_AXIAL_TILT_RAD,
  MARS_SIDEREAL_ROTATION_SECONDS,
} from '../../config/celestialCatalog';
import { POI_LANDMARKS_CATALOG } from '../../config/poiLandmarks';
import { useCosmosStore } from '../../store/useCosmosStore';
import { MarsLODMesh } from './MarsLODMesh';
import { MarsAtmosphereMesh } from './MarsAtmosphereMesh';
import { POIMarker3D } from './POIMarker3D';

export const MarsPlanetGroup: React.FC = () => {
  const rotatingBodyRef = useRef<THREE.Group>(null!);
  const planetCenter = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  useFrame(() => {
    if (!rotatingBodyRef.current) return;
    const simTime = useCosmosStore.getState().simulationTime;
    // Góc tự quay của Sao Hỏa quanh trục nghiêng 25.19 độ
    rotatingBodyRef.current.rotation.y =
      (simTime / MARS_SIDEREAL_ROTATION_SECONDS) * Math.PI * 2;
    rotatingBodyRef.current.getWorldPosition(planetCenter);
  });

  return (
    <group rotation={[0, 0, MARS_AXIAL_TILT_RAD]}>
      {/* Khối cầu Sao Hỏa + các điểm nóng bề mặt xoay đồng bộ */}
      <group ref={rotatingBodyRef}>
        <MarsLODMesh />
        {POI_LANDMARKS_CATALOG.map((poi, idx) => (
          <POIMarker3D
            key={poi.id}
            target={poi}
            planetCenter={planetCenter}
            variant={((idx % 4) + 1) as 1 | 2 | 3 | 4}
          />
        ))}
      </group>

      {/* Lớp vỏ khí quyển tán xạ Rayleigh & Mie */}
      <MarsAtmosphereMesh />
    </group>
  );
};
