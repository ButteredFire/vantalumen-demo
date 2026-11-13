import React from 'react';
import { useGLTF } from '@react-three/drei';

// Preload the terrain GLB for instant rendering upon landing
useGLTF.preload('/mars_terrain.glb');

export const MarsTerrainMesh: React.FC = () => {
    const { scene } = useGLTF('/mars_terrain.glb');
    return <primitive object={scene} position={[0, 0, 0]} />;
};
