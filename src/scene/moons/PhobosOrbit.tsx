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

const phobosTarget = CELESTIAL_BODIES_CATALOG.find((c) => c.id === 'phobos')!;

export const PhobosOrbit: React.FC = () => {
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
    if (phobosTarget.modelPath) {
      assetManager.gltfLoader
        .loadAsync(phobosTarget.modelPath)
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

  // Sinh đường quỹ đạo elip nghiêng của Phobos
  const orbitPoints = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const elems = phobosTarget.orbitalElements!;
    const periodSec = elems.orbitalPeriodHours * 3600;
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * periodSec;
      pts.push(computeOrbitalPosition(elems, t));
    }
    return pts;
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current || !phobosTarget.orbitalElements) return;
    const simTime = useCosmosStore.getState().simulationTime;
    computeOrbitalPosition(phobosTarget.orbitalElements, simTime, groupRef.current.position);
    groupRef.current.getWorldPosition(worldPosRef.current);
    useCosmosStore.getState().updateDynamicPosition('phobos', worldPosRef.current);

    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.25;
    }
  });

  const isSelected = activeTargetId === 'phobos';
  const showCallout = !controlsLocked && !(isSelected && viewStage === 'SUB_SCENE');

  return (
    <group>
      <Line
        points={orbitPoints}
        color={isSelected ? '#7cdaa1' : '#5f769a'}
        opacity={isSelected ? 0.65 : 0.26}
        transparent
        lineWidth={1.2}
      />

      <group ref={groupRef} position={phobosTarget.position}>
        <group
          ref={meshRef}
          scale={[phobosTarget.radius, phobosTarget.radius, phobosTarget.radius]}
        >
          {loadedScene ? (
            <primitive object={loadedScene} />
          ) : (
            <mesh scale={[1.2, 0.85, 0.95]} castShadow receiveShadow>
              <dodecahedronGeometry args={[1, 3]} />
              <meshStandardMaterial color="#877366" roughness={0.92} metalness={0.05} />
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
            title="Phobos"
            meta="MOON I • 9.376 KM"
            category="MOON"
            variant={2}
            isSelected={isSelected}
            isVisible={showCallout}
            onClick={() => selectTarget(phobosTarget)}
          />
        </Html>
      </group>
    </group>
  );
};
