import React from 'react';
import type * as THREE from 'three';
import { EffectComposer, SelectiveBloom, Vignette, SMAA } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

export interface PostProcessingRigProps {
  sunLightRef: React.RefObject<THREE.DirectionalLight | null>;
}

export const PostProcessingRig: React.FC<PostProcessingRigProps> = ({ sunLightRef }) => {
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <SMAA />
      <SelectiveBloom
        lights={[sunLightRef as React.RefObject<THREE.Object3D>]}
        intensity={1.8}
        luminanceThreshold={0.85} // Chỉ lấy các điểm có cường độ phát xạ > 0.85 (HDR)
        luminanceSmoothing={0.2}
        mipmapBlur
      />
      <Vignette
        offset={0.25}
        darkness={0.65}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
};
