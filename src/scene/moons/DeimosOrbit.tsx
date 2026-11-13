import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import {
  CELESTIAL_BODIES_CATALOG,
  computeOrbitalPosition,
} from '../../config/celestialCatalog';
import { assetManager } from '../../core/loaders/KTX2DracoManager';
import { useCosmosStore } from '../../store/useCosmosStore';
import { AssetCalloutBox } from '../../ui/hud/AssetCalloutBox';

const deimosTarget = CELESTIAL_BODIES_CATALOG.find((c) => c.id === 'deimos')!;

export const DeimosOrbit: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null!);
  const meshRef = useRef<THREE.Group>(null!);
  const worldPosRef = useRef(new THREE.Vector3());
  const [loadedScene, setLoadedScene] = useState<THREE.Group | null>(null);

  const selectTarget = useCosmosStore((state) => state.selectTarget);
  const controlsLocked = useCosmosStore((state) => state.controlsLocked);
  const activeTargetId = useCosmosStore((state) => state.activeTarget?.id);
  const viewStage = useCosmosStore((state) => state.viewStage);

  useEffect(() => {
    let mounted = true;
    if (deimosTarget.modelPath) {
      assetManager.gltfLoader
        .loadAsync(deimosTarget.modelPath)
        .then((gltf) => {
          if (mounted) {
            setLoadedScene(gltf.scene);
          }
        })
        .catch(() => {
          // Fallback mesh is already rendered
        });
    }
    return () => {
      mounted = false;
    };
  }, []);

  const orbitPoints = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const elems = deimosTarget.orbitalElements!;
    const periodSec = elems.orbitalPeriodHours * 3600;
    const segments = 144;
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * periodSec;
      pts.push(computeOrbitalPosition(elems, t));
    }
    return pts;
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current || !deimosTarget.orbitalElements) return;
    const simTime = useCosmosStore.getState().simulationTime;
    computeOrbitalPosition(deimosTarget.orbitalElements, simTime, groupRef.current.position);
    groupRef.current.getWorldPosition(worldPosRef.current);
    useCosmosStore.getState().updateDynamicPosition('deimos', worldPosRef.current);

    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.18;
    }
  });

  const isSelected = activeTargetId === 'deimos';
  const showCallout = !controlsLocked && !(isSelected && viewStage === 'SUB_SCENE');

  return (
    <group>
      <Line
        points={orbitPoints}
        color={isSelected ? '#7cdaa1' : '#4a5f82'}
        opacity={isSelected ? 0.65 : 0.22}
        transparent
        lineWidth={1.1}
      />

      <group ref={groupRef} position={deimosTarget.position}>
        <group
          ref={meshRef}
          scale={[deimosTarget.radius, deimosTarget.radius, deimosTarget.radius]}
        >
          {loadedScene ? (
            <primitive object={loadedScene} />
          ) : (
            <mesh scale={[1.15, 0.9, 0.85]} castShadow receiveShadow>
              <dodecahedronGeometry args={[1, 2]} />
              <meshStandardMaterial color="#9e8c7a" roughness={0.88} metalness={0.04} />
            </mesh>
          )}
        </group>

        <Html
          zIndexRange={[15, 0]}
          style={{
            opacity: showCallout ? 1 : 0,
            pointerEvents: showCallout ? 'auto' : 'none',
            transition: 'opacity 0.25s ease',
          }}
        >
          <AssetCalloutBox
            title="Deimos"
            meta="MOON II • 23.463 KM"
            category="MOON"
            variant={3}
            isSelected={isSelected}
            isVisible={showCallout}
            onClick={() => selectTarget(deimosTarget)}
          />
        </Html>
      </group>
    </group>
  );
};
