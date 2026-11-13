import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { MARS_MEAN_RADIUS_KM } from '../../config/celestialCatalog';
import { useCosmosStore } from '../../store/useCosmosStore';

interface FloatingOriginManagerProps {
  children: React.ReactNode;
}

const FLOATING_ORIGIN_THRESHOLD_KM = 250000;

export const FloatingOriginManager: React.FC<FloatingOriginManagerProps> = ({ children }) => {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null!);
  const lastAltitudeBroadcast = useRef(0);

  useFrame(({ clock }) => {
    // 1. Tính độ cao camera so với bề mặt trung bình của Sao Hỏa (1 unit = 1 km)
    const distFromCenter = camera.position.length();
    const altitudeKm = Math.max(1, Math.round(distFromCenter - MARS_MEAN_RADIUS_KM));

    // Chỉ cập nhật store tối đa ~10 lần/giây để tiết kiệm chu kỳ cho HUD
    const elapsed = clock.getElapsedTime();
    if (elapsed - lastAltitudeBroadcast.current > 0.1) {
      lastAltitudeBroadcast.current = elapsed;
      const currentAlt = useCosmosStore.getState().cameraAltitudeKm;
      if (Math.abs(currentAlt - altitudeKm) >= 5) {
        useCosmosStore.getState().setCameraAltitudeKm(altitudeKm);
      }
    }

    // 2. Chống rung giật số thực dấu phẩy động 32-bit (Floating-point jitter) ở khoảng cách cực lớn
    if (camera.position.length() > FLOATING_ORIGIN_THRESHOLD_KM && groupRef.current) {
      const shift = camera.position.clone();
      groupRef.current.position.sub(shift);
      camera.position.set(0, 0, 0);
      useCosmosStore.getState().setFloatingOriginOffset(groupRef.current.position);
    }
  });

  return <group ref={groupRef}>{children}</group>;
};
