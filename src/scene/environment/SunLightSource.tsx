import React from 'react';
import type * as THREE from 'three';
import { Select } from '@react-three/postprocessing';

export const SUN_DIRECTION_VECTOR: [number, number, number] = [140000, 38000, 95000];

interface SunLightSourceProps {
  sunLightRef: React.RefObject<THREE.DirectionalLight | null>;
}

export const SunLightSource: React.FC<SunLightSourceProps> = ({ sunLightRef }) => {
  return (
    <group>
      {/* Ánh sáng môi trường vũ trụ cực nhẹ để vùng tối của Sao Hỏa vẫn thấy rõ cấu trúc địa hình */}
      <ambientLight intensity={0.16} color="#2b3348" />
      <hemisphereLight args={['#ffd9b8', '#151824', 0.22]} />

      {/* Nguồn sáng định hướng Mặt Trời */}
      <directionalLight
        ref={sunLightRef}
        position={SUN_DIRECTION_VECTOR}
        intensity={3.6}
        color="#fff4ea"
        castShadow
      />

      {/* Đĩa quang cầu Mặt Trời tự phát sáng gắn vào SelectiveBloom */}
      <Select enabled>
        <mesh position={SUN_DIRECTION_VECTOR}>
          <sphereGeometry args={[2800, 32, 32]} />
          <meshStandardMaterial
            color="#fff8ee"
            emissive="#ffae52"
            emissiveIntensity={4.5}
            toneMapped={false}
          />
        </mesh>
      </Select>
    </group>
  );
};
