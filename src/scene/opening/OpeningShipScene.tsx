import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Select } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useCosmosStore } from '../../store/useCosmosStore';
import { preloadCoreSpaceAssets } from '../../core/loaders/useProgressiveAsset';

export const OPENING_CAMERA_POS = new THREE.Vector3(0, 8000, 88000);
export const OPENING_LOOK_TARGET = new THREE.Vector3(0, 0, 0);

const STREAK_COUNT = 260;

interface StreakData {
  x: number;
  y: number;
  z: number;
  speedFactor: number;
  baseLength: number;
  color: THREE.Color;
}

export const OpeningShipScene: React.FC = () => {
  const { gl } = useThree();
  const viewStage = useCosmosStore((state) => state.viewStage);

  const stageGroupRef = useRef<THREE.Group>(null!);
  const shipRigRef = useRef<THREE.Group>(null!);
  const thrusterGlowRef = useRef<THREE.MeshStandardMaterial>(null!);
  const exhaustLeftRef = useRef<THREE.Mesh>(null!);
  const exhaustRightRef = useRef<THREE.Mesh>(null!);
  const instancedStreaksRef = useRef<THREE.InstancedMesh>(null!);

  const launchProgressRef = useRef(0);
  const shipSurgeZRef = useRef(0);
  const dummyObj = useMemo(() => new THREE.Object3D(), []);
  const prefersReducedMotion = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  // Kích hoạt tải trước các mô hình .glb nén Draco & bộ giải mã ngay khi Opening Scene gắn lên Canvas
  useEffect(() => {
    preloadCoreSpaceAssets(gl);
  }, [gl]);

  // Tính góc định hướng từ OPENING_CAMERA_POS nhìn thẳng về Sao Hỏa (0,0,0)
  const stageQuaternion = useMemo(() => {
    const m = new THREE.Matrix4();
    m.lookAt(OPENING_CAMERA_POS, OPENING_LOOK_TARGET, new THREE.Vector3(0, 1, 0));
    return new THREE.Quaternion().setFromRotationMatrix(m);
  }, []);

  // Khởi tạo dữ liệu vệt sao quanh tàu trong hành lang bay (-Z hướng về Sao Hỏa)
  const streaks = useMemo<StreakData[]>(() => {
    const items: StreakData[] = [];
    for (let i = 0; i < STREAK_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 11 + Math.random() * 78;
      const tone = Math.random();
      const color =
        tone > 0.65
          ? new THREE.Color('#78d8ff')
          : tone > 0.25
            ? new THREE.Color('#e8f1ff')
            : new THREE.Color('#ffad75');

      items.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius * 0.72,
        z: -260 + Math.random() * 290,
        speedFactor: 0.7 + Math.random() * 0.9,
        baseLength: 2.8 + Math.random() * 5.2,
        color,
      });
    }
    return items;
  }, []);

  useEffect(() => {
    if (!instancedStreaksRef.current) return;
    streaks.forEach((s, idx) => {
      instancedStreaksRef.current.setColorAt(idx, s.color);
    });
    if (instancedStreaksRef.current.instanceColor) {
      instancedStreaksRef.current.instanceColor.needsUpdate = true;
    }
  }, [streaks]);

  useFrame(({ clock }, delta) => {
    const stage = useCosmosStore.getState().viewStage;
    if (stage !== 'PRELOADING' && stage !== 'LAUNCHING') return;

    const dt = Math.min(delta, 0.05);
    const t = clock.getElapsedTime();
    const isLaunching = stage === 'LAUNCHING';
    const motionScale = prefersReducedMotion ? 0.25 : 1;

    launchProgressRef.current = THREE.MathUtils.lerp(
      launchProgressRef.current,
      isLaunching ? 1 : 0,
      dt * 3.2,
    );

    const launchBoost = launchProgressRef.current;

    // 1. Chuyển động lơ lửng tinh tế khi chờ & vọt thẳng về phía trước khi LAUNCHING
    if (shipRigRef.current) {
      if (isLaunching) {
        shipSurgeZRef.current -= dt * (42 + launchBoost * 240) * motionScale;
      } else {
        shipSurgeZRef.current = 0;
      }

      const hoverY = Math.sin(t * 1.45) * 0.28 * motionScale;
      const hoverX = Math.cos(t * 0.95) * 0.18 * motionScale;
      const bankZ = Math.sin(t * 0.8) * 0.045 * motionScale;
      const pitchX = Math.cos(t * 1.1) * 0.02 * motionScale - launchBoost * 0.04;

      shipRigRef.current.position.set(hoverX, -4.3 + hoverY, -24 + shipSurgeZRef.current);
      shipRigRef.current.rotation.set(pitchX, 0, bankZ);
    }

    // 2. Tăng cường độ phát sáng động cơ & luồng phản lực khi kích hoạt Alpha Jump
    if (thrusterGlowRef.current) {
      const pulse = 3.2 + Math.sin(t * 9) * 0.45;
      thrusterGlowRef.current.emissiveIntensity = pulse + launchBoost * 5.8;
    }

    const exhaustScaleZ = 1 + launchBoost * 3.6 + Math.sin(t * 18) * 0.08;
    if (exhaustLeftRef.current && exhaustRightRef.current) {
      exhaustLeftRef.current.scale.set(1 + launchBoost * 0.4, 1 + launchBoost * 0.4, exhaustScaleZ);
      exhaustRightRef.current.scale.set(1 + launchBoost * 0.4, 1 + launchBoost * 0.4, exhaustScaleZ);
    }

    // 3. Luồng vệt sao bay ngang qua tàu liên tục suốt trạng thái chờ và kéo giãn mạnh khi nhảy
    if (instancedStreaksRef.current) {
      const baseSpeed = (48 + launchBoost * 320) * motionScale;
      const stretchMultiplier = 1 + launchBoost * 5.5 * motionScale;

      for (let i = 0; i < STREAK_COUNT; i++) {
        const s = streaks[i];
        s.z += dt * baseSpeed * s.speedFactor;
        if (s.z > 28) {
          s.z = -260 - Math.random() * 40;
        }

        dummyObj.position.set(s.x, s.y, s.z);
        dummyObj.scale.set(1, 1, s.baseLength * stretchMultiplier);
        dummyObj.updateMatrix();
        instancedStreaksRef.current.setMatrixAt(i, dummyObj.matrix);
      }
      instancedStreaksRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  if (viewStage !== 'PRELOADING' && viewStage !== 'LAUNCHING') {
    return null;
  }

  return (
    <group
      ref={stageGroupRef}
      position={OPENING_CAMERA_POS}
      quaternion={stageQuaternion}
    >
      {/* Ánh sáng cục bộ làm nổi khối thân tàu thám hiểm ở tiền cảnh */}
      <pointLight position={[12, 10, -8]} intensity={320} distance={120} color="#ffd9bd" />
      <pointLight position={[-14, -4, -18]} intensity={180} distance={90} color="#52c8ff" />

      {/* Luồng vệt sao 3D chạy dọc hành lang bay quanh tàu */}
      <instancedMesh
        ref={instancedStreaksRef}
        args={[undefined, undefined, STREAK_COUNT]}
        frustumCulled={false}
      >
        <boxGeometry args={[0.14, 0.14, 1]} />
        <meshBasicMaterial
          toneMapped={false}
          transparent
          opacity={0.86}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </instancedMesh>

      {/* Tàu Thám Hiểm Tiền Cảnh (Ares Alpha Cruiser) — tách biệt hoàn toàn với OrbitalFleet */}
      <group ref={shipRigRef} position={[0, -4.3, -24]}>
        {/* Thân chính khí động học hướng về phía -Z */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.85, 1.55, 10.5, 12]} />
          <meshStandardMaterial color="#cfd9e8" metalness={0.82} roughness={0.28} />
        </mesh>

        {/* Mũi tàu cảm biến vươn về phía trước (-Z) */}
        <mesh position={[0, 0.05, -6.9]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.85, 3.4, 12]} />
          <meshStandardMaterial color="#e8eef7" metalness={0.78} roughness={0.25} />
        </mesh>

        {/* Khoang chỉ huy (Bridge Spine) trên lưng tàu */}
        <mesh position={[0, 1.05, -0.8]}>
          <boxGeometry args={[1.45, 0.85, 4.6]} />
          <meshStandardMaterial color="#9fb0c8" metalness={0.75} roughness={0.35} />
        </mesh>

        {/* Đèn dẫn hướng khoang chỉ huy */}
        <Select enabled>
          <mesh position={[0, 1.2, -3.15]}>
            <boxGeometry args={[1.1, 0.22, 0.18]} />
            <meshStandardMaterial
              color="#7ee8ff"
              emissive="#38dcff"
              emissiveIntensity={3.2}
              toneMapped={false}
            />
          </mesh>
        </Select>

        {/* Cánh tản nhiệt & cánh ổn định trái/phải */}
        <mesh position={[3.2, -0.15, 0.8]} rotation={[0, 0.22, -0.08]}>
          <boxGeometry args={[4.8, 0.18, 2.4]} />
          <meshStandardMaterial color="#27364f" metalness={0.86} roughness={0.3} />
        </mesh>
        <mesh position={[-3.2, -0.15, 0.8]} rotation={[0, -0.22, 0.08]}>
          <boxGeometry args={[4.8, 0.18, 2.4]} />
          <meshStandardMaterial color="#27364f" metalness={0.86} roughness={0.3} />
        </mesh>

        {/* Cặp vỏ động cơ (Engine Nacelles) hai bên sườn */}
        <mesh position={[2.25, -0.25, 2.4]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.58, 0.72, 4.4, 16]} />
          <meshStandardMaterial color="#6e7f99" metalness={0.88} roughness={0.25} />
        </mesh>
        <mesh position={[-2.25, -0.25, 2.4]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.58, 0.72, 4.4, 16]} />
          <meshStandardMaterial color="#6e7f99" metalness={0.88} roughness={0.25} />
        </mesh>

        {/* Lõi phát xạ động cơ Plasma/Ion & luồng phụt (SelectiveBloom) */}
        <Select enabled>
          <mesh position={[2.25, -0.25, 4.65]}>
            <sphereGeometry args={[0.55, 16, 16]} />
            <meshStandardMaterial
              ref={thrusterGlowRef}
              color="#9cf2ff"
              emissive="#3ad8ff"
              emissiveIntensity={3.5}
              toneMapped={false}
            />
          </mesh>
          <mesh position={[-2.25, -0.25, 4.65]}>
            <sphereGeometry args={[0.55, 16, 16]} />
            <meshStandardMaterial
              color="#9cf2ff"
              emissive="#3ad8ff"
              emissiveIntensity={3.5}
              toneMapped={false}
            />
          </mesh>
          {/* Động cơ chính giữa */}
          <mesh position={[0, 0, 5.3]}>
            <sphereGeometry args={[0.92, 20, 20]} />
            <meshStandardMaterial
              color="#ffbe8a"
              emissive="#ff7b47"
              emissiveIntensity={4.0}
              toneMapped={false}
            />
          </mesh>

          {/* Nón phản lực giãn dài khi nhấn Launch */}
          <mesh
            ref={exhaustLeftRef}
            position={[2.25, -0.25, 6.2]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <coneGeometry args={[0.5, 3.2, 16]} />
            <meshBasicMaterial
              color="#4ee3ff"
              transparent
              opacity={0.55}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
          <mesh
            ref={exhaustRightRef}
            position={[-2.25, -0.25, 6.2]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <coneGeometry args={[0.5, 3.2, 16]} />
            <meshBasicMaterial
              color="#4ee3ff"
              transparent
              opacity={0.55}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        </Select>
      </group>
    </group>
  );
};
