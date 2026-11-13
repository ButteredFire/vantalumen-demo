import React, { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { Detailed } from '@react-three/drei';
import * as THREE from 'three';
import { MARS_MEAN_RADIUS_KM } from '../../config/celestialCatalog';
import { useProgressiveMarsTextures } from '../../core/loaders/useProgressiveAsset';
import { useCosmosStore } from '../../store/useCosmosStore';

export const MarsLODMesh: React.FC = () => {
  const { gl } = useThree();
  const textures = useProgressiveMarsTextures(gl);
  const spectralMode = useCosmosStore((state) => state.spectralMode);

  // Chọn bản đồ màu tương ứng với chế độ Quang phổ (Optical RGB / Thermal IR / MOLA Elevation)
  const activeColorMap = useMemo(() => {
    switch (spectralMode) {
      case 'THERMAL_IR':
        return textures.thermalIr;
      case 'MOLA_ELEVATION':
        return textures.molaElevation;
      case 'VISUAL_RGB':
      default:
        return textures.albedo;
    }
  }, [spectralMode, textures]);

  const isFalseColorSpectral = spectralMode !== 'VISUAL_RGB';

  const geometries = useMemo(
    () => ({
      high: new THREE.SphereGeometry(MARS_MEAN_RADIUS_KM, 128, 128),
      mid: new THREE.SphereGeometry(MARS_MEAN_RADIUS_KM, 64, 64),
      low: new THREE.SphereGeometry(MARS_MEAN_RADIUS_KM, 24, 24),
    }),
    [],
  );

  return (
    <Detailed distances={[0, 15000, 60000, 180000]}>
      {/* Mức 0: Cận cảnh quỹ đạo thấp (< 15.000 km) - Lưới 128x128 + Bản đồ địa hình chi tiết cao */}
      <mesh geometry={geometries.high} castShadow receiveShadow>
        <meshStandardMaterial
          map={activeColorMap}
          normalMap={textures.normal}
          normalScale={new THREE.Vector2(1.6, 1.6)}
          roughnessMap={textures.roughness}
          roughness={0.88}
          metalness={0.05}
          emissive={isFalseColorSpectral ? '#ffffff' : '#000000'}
          emissiveMap={isFalseColorSpectral ? activeColorMap : null}
          emissiveIntensity={isFalseColorSpectral ? 0.38 : 0}
        />
      </mesh>

      {/* Mức 1: Tầm trung (15.000 - 60.000 km) - Lưới 64x64 */}
      <mesh geometry={geometries.mid}>
        <meshStandardMaterial
          map={activeColorMap}
          normalMap={textures.normal}
          normalScale={new THREE.Vector2(1.0, 1.0)}
          roughness={0.9}
        />
      </mesh>

      {/* Mức 2: Tầm xa (60.000 - 180.000 km) - Khối cầu ít đa giác 24x24 */}
      <mesh geometry={geometries.low}>
        <meshBasicMaterial color="#c1440e" />
      </mesh>

      {/* Mức 3: Khoảng cách liên hành tinh (> 180.000 km) - Điểm sáng Billboard/Sprite */}
      <sprite scale={[1800, 1800, 1]}>
        <spriteMaterial
          color="#ff6b3d"
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>
    </Detailed>
  );
};
