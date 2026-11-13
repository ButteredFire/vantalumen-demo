import React from 'react';
import type * as THREE from 'three';
import { SunLightSource } from './environment/SunLightSource';
import { DeepSpaceStarfield } from './environment/DeepSpaceStarfield';
import { MarsPlanetGroup } from './mars/MarsPlanetGroup';
import { PhobosOrbit } from './moons/PhobosOrbit';
import { DeimosOrbit } from './moons/DeimosOrbit';
import { OrbitalFleet } from './spacecraft/OrbitalFleet';
import { OpeningShipScene } from './opening/OpeningShipScene';

interface CosmosSceneRootProps {
  sunLightRef: React.RefObject<THREE.DirectionalLight | null>;
}

export const CosmosSceneRoot: React.FC<CosmosSceneRootProps> = ({ sunLightRef }) => {
  return (
    <group>
      <SunLightSource sunLightRef={sunLightRef} />
      <DeepSpaceStarfield />
      <OpeningShipScene />
      <MarsPlanetGroup />
      <PhobosOrbit />
      <DeimosOrbit />
      <OrbitalFleet />
    </group>
  );
};
