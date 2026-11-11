// App.jsx
import React, { Suspense, useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { Html, MapControls, useGLTF, Loader, Environment, shaderMaterial } from '@react-three/drei';
import { EffectComposer, DepthOfField } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Howl } from 'howler';

import './App.css';
import './SciFi.css';



import { motion, AnimatePresence } from 'framer-motion';

// Animation logic for the main container
const containerVariants = {
    hidden: { 
        opacity: 0, 
        scale: 0.95,
        filter: "brightness(1)"
    },
    visible: { 
        opacity: 1, 
        scale: 1,
        // The flash effect: Brightness spikes to 2.5 then settles at 1
        filter: ["brightness(1)", "brightness(2.5)", "brightness(1)"],
        transition: { 
            duration: 0.4, 
            ease: "easeOut",
            when: "beforeChildren", // Wait for container flash before showing children
            staggerChildren: 0.15   // Show each child 150ms apart
        }
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        transition: { duration: 0.2 }
    }
};

// Animation logic for individual text elements/stats inside the container
const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
        opacity: 1, 
        x: 0, 
        transition: { type: "spring", stiffness: 300, damping: 24 }
    }
};

const uiSounds = {
    open: new Howl({ src: ['/ui_popup.mp3'], volume: 0.01 }),
    openImportant: new Howl({ src: ['/ui_popup_important.mp3'], volume: 0.01 }),
    close: new Howl({ src: ['/ui_collapse.mp3'], volume: 0.01 }),
    mouse: [
        new Howl({ src: ['/ui_mouse_1.mp3'], volume: 0.01 }),
        new Howl({ src: ['/ui_mouse_2.mp3'], volume: 0.01 }),
        new Howl({ src: ['/ui_mouse_3.mp3'], volume: 0.01 }),
        new Howl({ src: ['/ui_mouse_4.mp3'], volume: 0.01 })
    ]
};


// 1. Define a custom soft-edge fog shader material
const FogPlaneMaterial = shaderMaterial(
    { 
      uTime: 0, 
      uColor: new THREE.Color('#ffd6b0') 
    },
    // Vertex Shader
    /* glsl */`
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    // Fragment Shader
    /* glsl */`
        varying vec2 vUv;
        uniform vec3 uColor;
        uniform float uTime;

        // Simple 2D pseudo-noise function
        float random(vec2 st) {
            return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
        }

        float noise(vec2 st) {
            vec2 i = floor(st);
            vec2 f = fract(st);
            float a = random(i);
            float b = random(i + vec2(1.0, 0.0));
            float c = random(i + vec2(0.0, 1.0));
            float d = random(i + vec2(1.0, 1.0));
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }

        void main() {
            // Center-based edge fade so borders stay soft
            vec2 center = vUv - 0.5;
            float dist = length(center) * 2.0;
            float edgeFade = smoothstep(1.0, 0.2, dist); 

            // Scroll the noise coordinates over time to make the fog drift
            vec2 scrolledUv = vUv * 3.0 + vec2(uTime * 0.03, uTime * 0.015);
            float n = noise(scrolledUv);

            // Combine noise variation with the base opacity and edge fade
            float alpha = 0.12 * edgeFade * (0.5 + 0.5 * n);

            gl_FragColor = vec4(uColor, alpha);
        }
    `
)
  
// Register the material so R3F recognizes it as <fogPlaneMaterial />
extend({ FogPlaneMaterial })


function SciFiUIContainer({ title, important, children, style, onClose }) {
    // Play sounds on mount and unmount
    React.useEffect(() => {
        if (important)      uiSounds.openImportant.play();
        else                uiSounds.open.play();
        return () => uiSounds.close.play();
    }, []);

    return (
        <motion.div 
            className="sci-fi-container"
            style={style}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
        >
            {/* Optional Close Button */}
            {onClose && (
                <button 
                    onClick={onClose} 
                    style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#00e5ff', cursor: 'pointer', fontFamily: 'Courier New' }}
                >
                    [X]
                </button>
            )}
            <motion.div variants={itemVariants} className="sci-fi-title">
                {title}
            </motion.div>
            <div className="sci-fi-content">
                {React.Children.map(children, child => (
                    <motion.div variants={itemVariants}>
                        {child}
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}


function EquipmentPin({ loaded, position, label, onClick }) {
    const handleMouseEnter = () => {
        // Generate a random number between 0 and 3
        const randomIndex = Math.floor(Math.random() * uiSounds.mouse.length);
        uiSounds.mouse[randomIndex].play();
    };

    return (
        <Html position={position} zIndexRange={[100, 0]}>
            <div 
                className={`map-pin ${loaded ? 'on-load' : ''}`}
                onClick={onClick}
                onMouseEnter={handleMouseEnter}
            >
                <div className="pin-label">{label}</div>
            </div>
        </Html>
    );
}



useGLTF.preload('/mars_terrain.glb');


function MarsTerrain() {
    const { scene } = useGLTF('/mars_terrain.glb');
    return <primitive object={scene} position={[0, 0, 0]} />;
}


function MartianDust() {
    const pointsRef = useRef();
    const particleCount = 3000;
    const particleSpeed = 100;

    const [particlesPosition, randomOffsets] = useMemo(() => {
        const positions = new Float32Array(particleCount * 3);
        const offsets = new Float32Array(particleCount); // Store individual speed/phase offsets for variety

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 2000;     // X: -1000 to 1000
            positions[i * 3 + 1] = 3.0 + Math.random() * 60;     // Y: height
            positions[i * 3 + 2] = (Math.random() - 0.5) * 1000; // Z: -500 to 500
            
            offsets[i] = Math.random() * 0.5 + 0.75; // Speed multiplier variance
        }
        return [positions, offsets];
    }, [particleCount]);

    useFrame((state, delta) => {
        if (pointsRef.current) {
            const positions = pointsRef.current.geometry.attributes.position.array;
            
            for (let i = 0; i < particleCount; i++) {
                const speed = particleSpeed * randomOffsets[i];
                
                // Move particles along X and Z
                positions[i * 3] -= speed * delta;
                positions[i * 3 + 2] -= (speed / 3) * delta;

                // Recycle smoothly: when it crosses the left boundary, 
                // respawn it on the right side with a randomized Z depth.
                if (positions[i * 3] < -1000) {
                    positions[i * 3] = 1000;
                    positions[i * 3 + 2] = (Math.random() - 0.5) * 1000;
                    positions[i * 3 + 1] = 3.0 + Math.random() * 60; // Optional: re-randomize height too
                }
                
                // Also wrap Z if it goes out of bounds
                if (positions[i * 3 + 2] < -500) {
                    positions[i * 3 + 2] = 500;
                }
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
                size={3.0} 
                color="#f0784f" 
                transparent={true} 
                opacity={0.8} 
                sizeAttenuation={true} 
                depthWrite={false} 
            />
        </points>
    );
}


function CustomMapControls({ focusTarget }) {
    const controlsRef = useRef();
    const limitX = 1000 / 1.5; 
    const limitZ = 500 / 1.5; 

    useFrame((state) => {
        if (controlsRef.current) {
            const controls = controlsRef.current;
            const camera = state.camera;
            const target = controls.target;

            // DYNAMIC ZOOM TILT (Remains the same)
            const distance = camera.position.distanceTo(target);
            const targetAngle = THREE.MathUtils.mapLinear(
                distance, 450, 800, Math.PI / 3.2, Math.PI / 4.2    
            );
            controls.minPolarAngle = targetAngle;
            controls.maxPolarAngle = targetAngle;

            // IF A PIN IS CLICKED: Smoothly pan the target to the pin's coordinates
            if (focusTarget) {
                // Lerp (Linear Interpolate) moves the camera 3% towards the target every frame
                target.x = THREE.MathUtils.lerp(target.x, focusTarget[0], 0.03);
                target.z = THREE.MathUtils.lerp(target.z, focusTarget[2], 0.03);
                
                // Optional: Slightly pull the camera in closer for inspection
                const zoomTarget = 500; 
                if (distance > zoomTarget) {
                    camera.position.lerp(
                        new THREE.Vector3(camera.position.x, camera.position.y - 10, camera.position.z), 
                        0.02
                    );
                }
            } 
            // STANDARD BOUNDARY CLAMP: Only applies if the user is free-roaming
            else {
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
        }
    });

    return (
        <MapControls 
            ref={controlsRef}
            makeDefault
            enableDamping={true}
            dampingFactor={0.01} 
            enableRotate={false}
            minDistance={450} 
            maxDistance={1000}
            minAzimuthAngle={0}
            maxAzimuthAngle={0}
            zoomSpeed={0.25} 
            panSpeed={0.8}
            // Temporarily disable user panning if a cinematic swoop is happening
            enabled={!focusTarget} 
        />
    );
}


export function MartianFog() {
    const materialRef = useRef()
  
    // Optional: animate time if you want to add noise/movement later
    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uTime = state.clock.elapsedTime
        }
    })
  
    return (
        <mesh 
            rotation={[-Math.PI / 2, 0, 0]} 
            position={[0, 200, 0]} // Placed slightly above 0 to prevent z-fighting with ground
        >
            {/* 1000x500 plane with high segment density if needed for displacement later */}
            <planeGeometry args={[5000, 5000, 16, 16]} />
            <fogPlaneMaterial 
                ref={materialRef} 
                transparent={true} 
                depthWrite={false} 
                blending={THREE.NormalBlending}
                // renderOrder ensures it draws cleanly relative to post-processing/terrain
                renderOrder={999}
            />
        </mesh>
    )
}


function useAmbientAudio(src, play, volume = 0.4, fadeDuration = 2000) {
    const soundRef = useRef(null);
    const soundIdRef = useRef(null);

    useEffect(() => {
        // Initialize the Web Audio API sound
        const sound = new Howl({
            src: [src],
            loop: true,
            volume: 0, // Start at 0 for the fade-in
            html5: false,
            onload: () => {
                // If 'play' became true while it was still loading, start playing now
                if (play && !sound.playing()) {
                    soundIdRef.current = sound.play();
                    sound.fade(0, volume, fadeDuration, soundIdRef.current);
                }
            }
        });

        soundRef.current = sound;

        return () => {
            sound.unload(); // Clean up memory on unmount
        };
    }, [src]);

    useEffect(() => {
        const sound = soundRef.current;
        if (!sound) return;

        if (play) {
            // Only play if not already playing to prevent overlapping instances
            if (!sound.playing()) {
                soundIdRef.current = sound.play();
                sound.fade(0, volume, fadeDuration, soundIdRef.current);
            }
        } else {
            // If it's playing, fade out and stop
            if (sound.playing() && soundIdRef.current !== null) {
                sound.fade(sound.volume(soundIdRef.current), 0, fadeDuration, soundIdRef.current);
                
                const currentId = soundIdRef.current;
                setTimeout(() => {
                    sound.stop(currentId);
                }, fadeDuration);
            }
        }
    }, [play, volume, fadeDuration]);
}

  


export default function App() {
    // State to track if the user has clicked to enter the experience
    const [entered, setEntered] = useState(false);
    const [selectedEquipment, setSelectedEquipment] = useState(null);

    // Mounts the audio in memory and fades it in when 'entered' becomes true
    useAmbientAudio('/mars_ambience.mp3', entered, 0.1, 3000);

    const equipmentData = [
        {
            name: "Beagle 2 Lander",
            coords: [-34, 0, 15],
            status: "DORMANT (Since Dec 25, 2003)",
            mission: "Astrobiology & Exobiology",
            description: "Found 11 years after contact was lost. Partially deployed solar panels blocked its communications antenna, leaving it stranded but intact on the surface."
        },
        {
            name: "Perseverance Rover",
            coords: [40, 0, -35],
            status: "DORMANT (Since Dec 25, 2003)",
            mission: "Astrobiology & Exobiology",
            description: "The rover remains in excellent condition as it scales the rim of Jezero Crater, exploring ancient, 4-billion-year-old hydrothermally altered terrains."
        },
    ];

    return (
        <div className="canvas-container">
            <div className="vignette-overlay"></div>
            
            <AnimatePresence>
                {!entered && (
                    <motion.div 
                        key="start-screen"
                        className="enter-overlay"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0, filter: "blur(10px)" }}
                        transition={{ duration: 1.5 }}
                        style={{
                            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                            backgroundColor: 'rgba(5, 5, 5, 0.9)', zIndex: 50
                        }}
                    >
                        <button 
                            onClick={() => setEntered(true)}
                            className='sci-fi-button'
                        >
                            <span>Initiate Demo</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Render the futuristic UI only after entering */}
            <AnimatePresence>
                {entered && (
                    <div style={{ position: 'absolute', top: '40px', left: '40px', zIndex: 20 }}>
                        <SciFiUIContainer title="Project VantaLumen" style={{ width: '300px', marginBottom: '20px' }}>
                            <p>LOCATION: ISIDIS PLANITIA, MARS</p>
                            <p>HQ: VANTALUMEN</p>
                            <p>ATMOSPHERE: 95% CO2</p>
                            <p>SURFACE TEMP: -60°C</p>
                            <p className="sci-fi-blinking-text">AWAITING TARGET SELECTION...</p>
                        </SciFiUIContainer>

                        {/* A second container will naturally render with the same flash/stagger */}
                        {/*
                        <SciFiUIContainer title="Attributions" style={{ width: '300px' }}>
                            <p>AMBIENCE: </p>
                            <p>DEGRADATION: 14%</p>
                        </SciFiUIContainer>
                        */}
                    </div>
                )}
            </AnimatePresence>

            {entered && (
                <div className="ui-layer sci-fi-subtitle">
                    <p>MARTIAN TERRAIN</p>
                </div>
            )}  


            <AnimatePresence>
                {/* Pop up the specific equipment data when a pin is clicked */}
                {selectedEquipment && (
                    <div style={{ position: 'absolute', top: '40px', right: '40px', zIndex: 20 }}>
                        <SciFiUIContainer 
                            important={true}
                            title={selectedEquipment.name.toUpperCase()}
                            style={{ width: '350px' }}
                            onClose={() => setSelectedEquipment(null)} // User can close the panel to free-roam again
                        >
                            <p>LAT/LON: 11.53°N, 90.43°E</p>
                            <p>STATUS: {selectedEquipment.status}</p>
                            <p>MISSION: {selectedEquipment.mission}</p>
                            <br/>
                            <p style={{ color: '#aaa' }}>{selectedEquipment.description}</p>
                        </SciFiUIContainer>
                    </div>
                )}
            </AnimatePresence>



            <Canvas camera={{ fov: 12, position: [0, 800, 1000], near: 0.1, far: 4000 }}>
                <color attach="background" args={['#c7a47b']} />

                <Suspense fallback={null}>
                    {/* Render the Pin on the map. Render this conditionally if you want it to hide when clicked */}
                    {equipmentData.map(
                        (eq, idx) => (
                            <EquipmentPin
                                key={idx}
                                loaded={entered}
                                label={eq.name.toUpperCase()}
                                position={eq.coords} 
                                onClick={() => {
                                    if (selectedEquipment) {
                                        uiSounds.openImportant.play();
                                    }
                                    setSelectedEquipment(eq);
                                }} 
                            />
                        )
                    )}

                    <MarsTerrain />
                    <MartianDust />
                    <MartianFog />
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

                {/* Pass the selected equipment state to the controls to trigger the swoop */}
                {entered && (
                    <CustomMapControls 
                        focusTarget={selectedEquipment ? selectedEquipment.coords : null} 
                    />
                )}
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