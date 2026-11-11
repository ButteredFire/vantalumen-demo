// App.jsx
import React, { Suspense, useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MapControls, useGLTF, Loader, Environment } from '@react-three/drei';
import { EffectComposer, DepthOfField } from '@react-three/postprocessing';
import * as THREE from 'three';
import './App.css';

useGLTF.preload('/mars_terrain.glb');

function MarsTerrain() {
    const { scene } = useGLTF('/mars_terrain.glb');
    return <primitive object={scene} position={[0, 0, 0]} />;
}

function MartianDust() {
    const pointsRef = useRef();
    const particleCount = 3000;

    const particlesPosition = useMemo(() => {
        const positions = new Float32Array(particleCount * 3);
        const startHeight = 3.0;
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 2000;
            positions[i * 3 + 1] = startHeight + Math.random() * 60;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 1000;
        }
        return positions;
    }, [particleCount]);

    useFrame((state, delta) => {
        if (pointsRef.current) {
            const positions = pointsRef.current.geometry.attributes.position.array;
            for (let i = 0; i < particleCount; i++) {
                positions[i * 3] -= 15 * delta;
                positions[i * 3 + 2] -= 5 * delta;

                if (positions[i * 3] < -1000) positions[i * 3] = 1000;
                if (positions[i * 3 + 2] < -500) positions[i * 3 + 2] = 500;
            }
            pointsRef.current.geometry.attributes.position.needsUpdate = true;
        }
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute 
                    attach="attributes-position"
                    count={particleCount}
                    array={particlesPosition}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial 
                size={1.5} 
                color="#f0784f" 
                transparent={true} 
                opacity={0.4} 
                sizeAttenuation={true} 
                depthWrite={false} 
            />
        </points>
    );
}

function CustomMapControls() {
    const controlsRef = useRef();
    
    const limitX = 1000 / 1.5; 
    const limitZ = 500 / 1.5; 

    useFrame((state) => {
        if (controlsRef.current) {
            const controls = controlsRef.current;
            const camera = state.camera;
            const target = controls.target;

            const distance = camera.position.distanceTo(target);
            
            // 1. RESTRICTED ZOOM TILT LOGIC
            // The mapping floor is raised to 450 to match the new minDistance.
            // The angle shift is made slightly more subtle to reflect the shorter zoom travel.
            const targetAngle = THREE.MathUtils.mapLinear(
                distance, 
                450, 800,                       
                Math.PI / 3.2, Math.PI / 4.2    
            );
            
            controls.minPolarAngle = targetAngle;
            controls.maxPolarAngle = targetAngle;

            const clampedX = THREE.MathUtils.clamp(target.x, -limitX, limitX);
            const clampedZ = THREE.MathUtils.clamp(target.z, -limitZ, limitZ);

            if (target.x !== clampedX || target.z !== clampedZ) {
                const diffX = clampedX - target.x;
                const diffZ = clampedZ - target.z;
                
                target.x = clampedX;
                target.z = clampedZ;
                
                camera.position.x += diffX;
                camera.position.z += diffZ;
            }
        }
    });

    return (
        <MapControls 
            ref={controlsRef}
            makeDefault
            enableDamping={true}
            // 2. BUTTERY ZOOM INTERPOLATION
            // Lowering dampingFactor creates longer inertia tails
            dampingFactor={0.01} 
            enableRotate={false}
            // Raised minDistance drastically to hover high above the terrain
            minDistance={450} 
            maxDistance={800}
            minAzimuthAngle={0}
            maxAzimuthAngle={0}
            // Lowering zoomSpeed neutralizes the snappy wheel steps
            zoomSpeed={0.25} 
            panSpeed={0.8}
        />
    );
}


function FogLayer() {
    const materialRef = useRef()

    // Optional: Animate the fog texture coordinates over time to make it drift
    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime()
        }
    })

    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 3, 0]}>
            {/* Make the fog plane large enough to cover your scene view */}
            <planeGeometry args={[1000, 500, 128, 128]} />
            <shaderMaterial
                ref={materialRef}
                transparent
                depthWrite={false} // Prevents the fog plane from clipping weirdly with objects behind it
                uniforms={{
                    uTime: { value: 0 },
                    uFogColor: { value: [0.8, 0.8, 0.8] }, // Light gray/white mist
                }}
                vertexShader={`
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `}
                fragmentShader={`
                    uniform float uTime;
                    uniform vec3 uFogColor;
                    varying vec2 vUv;

                    // Simple procedural noise function for the mist texture
                    float noise(vec2 p) {
                        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
                    }

                    void main() {
                        // Create a soft circular fade so the fog doesn't have hard square edges
                        float edgeFade = smoothstep(0.5, 0.2, length(vUv - 0.5));

                        // Generate a moving mist pattern using noise coordinates shifted by time
                        vec2 drift1 = vUv * 5.0 + vec2(uTime * 0.05, uTime * 0.02);
                        vec2 drift2 = vUv * 10.0 - vec2(uTime * 0.02, uTime * 0.07);

                        float n = (noise(floor(drift1)) + noise(floor(drift2))) * 0.5;

                        // Final opacity blends the noise pattern with the edge fadeout
                        float alpha = n * edgeFade * 0.6; // Adjust 0.6 to change max opacity

                        gl_FragColor = vec4(uFogColor, alpha);
                    }
                `}
            />
        </mesh>
    )
}
  


export default function App() {
    // State to track if the user has clicked to enter the experience
    const [entered, setEntered] = useState(false);
    const audioRef = useRef(null);

    const handleEnter = () => {
        setEntered(true);
        if (audioRef.current) {
            audioRef.current.volume = 0.4;
            audioRef.current.play();
        }
    };

    return (
        <div className="canvas-container">
            {/* 3. MARTIAN AMBIENCE */}
            <audio ref={audioRef} src="/martian_wind.mp3" loop />

            <div className="vignette-overlay"></div>
            
            {/* Overlay that blocks the screen until the user clicks, bypassing audio autoplay blocks */}
            {!entered && (
                <div className="enter-overlay" style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    backgroundColor: 'rgba(5, 5, 5, 0.85)', zIndex: 50, backdropFilter: 'blur(5px)'
                }}>
                    <button 
                        onClick={handleEnter}
                        style={{
                            padding: '15px 40px', background: 'transparent', color: '#ff4d00',
                            border: '1px solid #ff4d00', cursor: 'pointer', letterSpacing: '3px',
                            fontFamily: 'sans-serif', textTransform: 'uppercase', transition: '0.3s'
                        }}
                    >
                        Initiate Uplink
                    </button>
                </div>
            )}

            {entered && (
                <div className="ui-layer">
                    <p>MARTIAN TERRAIN</p>
                </div>
            )}

            <Canvas camera={{ fov: 15, position: [0, 600, 800], near: 0.1, far: 4000 }}>
                <color attach="background" args={['#c7a47b']} />
                <fog attach="fog" args={['#c7a47b', 800, 1100]} />

                <Suspense fallback={null}>
                    <MarsTerrain />
                    <MartianDust />
                    <Environment preset="sunset" environmentIntensity={0.6} />
                    <directionalLight position={[100, 80, 50]} intensity={0.5} color="#ffd4b8" />
                    
                    <EffectComposer disableNormalPass>
                        <DepthOfField 
                            target={[0, 0, 0]}     
                            focalLength={0.4}      
                            bokehScale={1.5}         
                            height={700}           
                        />
                    </EffectComposer>
                </Suspense>

                {/* Controls only activate once the user enters */}
                {entered && <CustomMapControls />}
            </Canvas>

            <Loader 
                dataInterpolation={(p) => `Establishing Connection... ${p.toFixed(0)}%`}
                containerStyles={{ background: '#050505' }}
                innerStyles={{ width: '300px' }}
                barStyles={{ background: '#ff4d00' }}
            />
        </div>
    );
}