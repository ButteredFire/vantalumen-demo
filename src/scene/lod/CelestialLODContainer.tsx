import React from 'react';
import { Detailed } from '@react-three/drei';
import type * as THREE from 'three';

type LODChildElement = React.ReactElement<THREE.Object3D>;

export interface CelestialLODContainerProps {
  distances?: number[];
  children: [LODChildElement, LODChildElement, LODChildElement, LODChildElement];
}

export const CelestialLODContainer: React.FC<CelestialLODContainerProps> = ({
  distances = [0, 15000, 60000, 180000],
  children: [tier0, tier1, tier2, tier3],
}) => {
  return (
    <Detailed distances={distances}>
      {tier0}
      {tier1}
      {tier2}
      {tier3}
    </Detailed>
  );
};
