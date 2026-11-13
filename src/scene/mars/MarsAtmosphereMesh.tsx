import React, { useMemo } from 'react';
import * as THREE from 'three';
import { MARS_MEAN_RADIUS_KM } from '../../config/celestialCatalog';
import { SUN_DIRECTION_VECTOR } from '../environment/SunLightSource';
import marsAtmosphereVert from '../../shaders/atmosphere/marsAtmosphere.vert.glsl';
import marsAtmosphereFrag from '../../shaders/atmosphere/marsAtmosphere.frag.glsl';

const ATMOSPHERE_RADIUS = MARS_MEAN_RADIUS_KM * 1.034;

export const MarsAtmosphereMesh: React.FC = () => {
  const uniforms = useMemo(
    () => ({
      uSunDirection: {
        value: new THREE.Vector3(...SUN_DIRECTION_VECTOR).normalize(),
      },
      uRayleighColor: { value: new THREE.Color('#ff7a45') },
      uMieDustColor: { value: new THREE.Color('#ffaa66') },
      uAtmosphereIntensity: { value: 1.15 },
    }),
    [],
  );

  return (
    <mesh>
      <sphereGeometry args={[ATMOSPHERE_RADIUS, 96, 96]} />
      <shaderMaterial
        vertexShader={marsAtmosphereVert}
        fragmentShader={marsAtmosphereFrag}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
};
