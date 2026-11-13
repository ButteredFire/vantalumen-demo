import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import { Select } from '@react-three/postprocessing';
import * as THREE from 'three';
import {
  CELESTIAL_BODIES_CATALOG,
  computeOrbitalPosition,
} from '../../config/celestialCatalog';
import { useCosmosStore, type CelestialTarget } from '../../store/useCosmosStore';
import { AssetCalloutBox } from '../../ui/hud/AssetCalloutBox';

const spacecraftList = CELESTIAL_BODIES_CATALOG.filter(
  (item) => item.category === 'SPACECRAFT',
);

interface SpacecraftNodeProps {
  target: CelestialTarget;
}

const SpacecraftNode: React.FC<SpacecraftNodeProps> = ({ target }) => {
  const groupRef = useRef<THREE.Group>(null!);
  const centrifugeRef = useRef<THREE.Mesh>(null!);
  const worldPosRef = useRef(new THREE.Vector3());

  const selectTarget = useCosmosStore((state) => state.selectTarget);
  const controlsLocked = useCosmosStore((state) => state.controlsLocked);
  const activeTargetId = useCosmosStore((state) => state.activeTarget?.id);
  const viewStage = useCosmosStore((state) => state.viewStage);

  const orbitPoints = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const elems = target.orbitalElements!;
    const periodSec = elems.orbitalPeriodHours * 3600;
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * periodSec;
      pts.push(computeOrbitalPosition(elems, t));
    }
    return pts;
  }, [target]);

  useFrame((_, delta) => {
    if (!groupRef.current || !target.orbitalElements) return;
    const simTime = useCosmosStore.getState().simulationTime;
    computeOrbitalPosition(target.orbitalElements, simTime, groupRef.current.position);
    groupRef.current.lookAt(0, 0, 0);
    groupRef.current.getWorldPosition(worldPosRef.current);
    useCosmosStore.getState().updateDynamicPosition(target.id, worldPosRef.current);

    if (centrifugeRef.current) {
      centrifugeRef.current.rotation.z += delta * 0.9;
    }
  });

  const isSelected = activeTargetId === target.id;
  const isStation = target.id === 'ares_station';
  const showCallout = !controlsLocked && !(isSelected && viewStage === 'SUB_SCENE');

  return (
    <group>
      <Line
        points={orbitPoints}
        color={isSelected ? '#7cdaa1' : '#f18b62'}
        opacity={isSelected ? 0.7 : 0.25}
        transparent
        lineWidth={1.1}
      />

      <group ref={groupRef} position={target.position}>
        {/* Tổ hợp hình học chi tiết của Tàu quỹ đạo MRO hoặc Trạm Không gian Ares */}
        <group scale={[1.8, 1.8, 1.8]}>
          {/* Thân chính bọc lá cách nhiệt vàng MLI hoặc vỏ hợp kim trạm */}
          <mesh>
            <cylinderGeometry args={[10, 12, 34, 16]} />
            <meshStandardMaterial
              color={isStation ? '#d8e3f2' : '#eab64d'}
              metalness={0.85}
              roughness={0.28}
            />
          </mesh>

          {/* Ăng-ten chảo parabol độ lợi cao (High-Gain Dish) hoặc Vòng quay trọng lực nhân tạo */}
          {isStation ? (
            <mesh ref={centrifugeRef} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[28, 3.2, 16, 48]} />
              <meshStandardMaterial color="#b9cbe2" metalness={0.78} roughness={0.32} />
            </mesh>
          ) : (
            <mesh position={[0, 20, 0]}>
              <sphereGeometry args={[14, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.42]} />
              <meshStandardMaterial
                color="#f4f6fa"
                metalness={0.6}
                roughness={0.35}
                side={THREE.DoubleSide}
              />
            </mesh>
          )}

          {/* Hai cánh pin mặt trời quang điện trải rộng */}
          <mesh position={[38, 0, 0]}>
            <boxGeometry args={[52, 1.2, 14]} />
            <meshStandardMaterial color="#1d428a" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[-38, 0, 0]}>
            <boxGeometry args={[52, 1.2, 14]} />
            <meshStandardMaterial color="#1d428a" metalness={0.9} roughness={0.2} />
          </mesh>

          {/* Động cơ đẩy Ion & Đèn hiệu định vị phát sáng HDR qua SelectiveBloom */}
          <Select enabled>
            <mesh position={[0, -20, 0]}>
              <sphereGeometry args={[5.5, 16, 16]} />
              <meshStandardMaterial
                color="#68e8ff"
                emissive="#38dcff"
                emissiveIntensity={4.2}
                toneMapped={false}
              />
            </mesh>
          </Select>
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
            title={isStation ? 'Ares Orbital Gateway' : 'Mars Reconnaissance Orbiter'}
            meta={isStation ? 'STATION • LEO 1.810 KM' : 'ORBITER • POLAR 350 KM'}
            category="SPACECRAFT"
            variant={isStation ? 4 : 1}
            isSelected={isSelected}
            isVisible={showCallout}
            onClick={() => selectTarget(target)}
          />
        </Html>
      </group>
    </group>
  );
};

export const OrbitalFleet: React.FC = () => {
  return (
    <group>
      {spacecraftList.map((sc) => (
        <SpacecraftNode key={sc.id} target={sc} />
      ))}
    </group>
  );
};
