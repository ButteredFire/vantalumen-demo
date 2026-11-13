import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCosmosStore } from '../../store/useCosmosStore';
import warpTunnelFrag from '../../shaders/warp/warpTunnel.frag.glsl';

const warpTunnelVert = `
#include <common>
#include <logdepthbuf_pars_vertex>
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  #include <logdepthbuf_vertex>
}
`;

export const DeepSpaceStarfield: React.FC = () => {
  const starsRef = useRef<THREE.Points>(null!);
  const warpMaterialRef = useRef<THREE.ShaderMaterial>(null!);
  const warpFactorRef = useRef(0);

  const { positions, colors } = useMemo(() => {
    const count = 7500;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Phân bố sao trên vỏ cầu bán kính 350.000 - 650.000 km
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 360000 + Math.random() * 280000;

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.cos(phi);
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      // Phân loại phổ màu sao (O/B xanh trắng, G vàng, K/M cam đỏ)
      const temp = Math.random();
      if (temp > 0.82) {
        col[i * 3] = 0.72;
        col[i * 3 + 1] = 0.85;
        col[i * 3 + 2] = 1.0;
      } else if (temp > 0.35) {
        col[i * 3] = 0.98;
        col[i * 3 + 1] = 0.96;
        col[i * 3 + 2] = 0.92;
      } else {
        col[i * 3] = 1.0;
        col[i * 3 + 1] = 0.76;
        col[i * 3 + 2] = 0.58;
      }
    }

    return { positions: pos, colors: col };
  }, []);

  const warpUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uWarpFactor: { value: 0 },
      uAccentColor: { value: new THREE.Color('#ff7b47') },
    }),
    [],
  );

  useFrame(({ clock }, delta) => {
    if (starsRef.current) {
      starsRef.current.rotation.y = clock.getElapsedTime() * 0.003;
    }

    const viewStage = useCosmosStore.getState().viewStage;
    const targetWarp =
      viewStage === 'LAUNCHING'
        ? 1.35
        : viewStage === 'WARPING'
          ? 1.0
          : viewStage === 'PRELOADING'
            ? 0.28
            : 0.0;
    warpFactorRef.current = THREE.MathUtils.lerp(
      warpFactorRef.current,
      targetWarp,
      Math.min(1, delta * 4.5),
    );

    if (warpMaterialRef.current) {
      warpMaterialRef.current.uniforms.uTime.value = clock.getElapsedTime();
      warpMaterialRef.current.uniforms.uWarpFactor.value = warpFactorRef.current;
    }
  });

  return (
    <group>
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[colors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={580}
          vertexColors
          transparent
          opacity={0.92}
          sizeAttenuation
          depthWrite={false}
        />
      </points>

      {/* Vòm hiệu ứng kéo giãn ánh sao khi bay chuyển cảnh Warp */}
      <mesh>
        <sphereGeometry args={[320000, 32, 32]} />
        <shaderMaterial
          ref={warpMaterialRef}
          vertexShader={warpTunnelVert}
          fragmentShader={warpTunnelFrag}
          uniforms={warpUniforms}
          transparent
          depthWrite={false}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};
