import React, { Suspense, useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { Html, MapControls, useGLTF, Loader, Environment, shaderMaterial } from '@react-three/drei';
import { EffectComposer, DepthOfField } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Howl } from 'howler';
import { motion, AnimatePresence } from 'framer-motion';

import './App.css';
import './SciFi.css';


// Preload geometry
useGLTF.preload('/mars_terrain.glb');



// ========== SCI-FI CONTAINER ANIMATION LOGIC & PROPERTIES ==========
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


// ========== SOUND EFFECTS ==========
const uiSounds = {
    open: new Howl({ src: ['/ui_popup.mp3'], volume: 0.01 }),
    openImportant: new Howl({ src: ['/ui_popup_important.mp3'], volume: 0.01 }),
    close: new Howl({ src: ['/ui_collapse.mp3'], volume: 0.01 }),
    error: new Howl({ src: ['/ui_error.mp3'], volume: 0.1 }),
    mouse: [
        new Howl({ src: ['/ui_mouse_1.mp3'], volume: 0.05 }),
        new Howl({ src: ['/ui_mouse_2.mp3'], volume: 0.05 }),
        new Howl({ src: ['/ui_mouse_3.mp3'], volume: 0.05 }),
        new Howl({ src: ['/ui_mouse_4.mp3'], volume: 0.05 })
    ]
};


// ========== CUSTOM SOFT-EDGE FOG SHADER ==========
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



// ========== HELPER FUNCTIONS ==========

/* Plays a random sci-fi mouse sound (e.g., for hover sfx) */
function playSciFiMouseSound() {
    const randomIndex = Math.floor(Math.random() * uiSounds.mouse.length);
    uiSounds.mouse[randomIndex].play();
}


/* Ambience audio loader helper */
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


/* Converts latitude (N) and longitude (E) to map coordinates 
    Reference: East-longitude system (NASA)
*/
function latLonToMapCoords(lat, lon) {
    // Normalize longitude to [0, 360), then shift to the [-180, 180] range 
    // centered on the Prime Meridian (0° is at the center of the map).
    let normalizedLon = ((lon % 360) + 360) % 360;
    if (normalizedLon > 180) {
        normalizedLon -= 360;
    }

    // Map longitude (-180 to 180) to X (-1000 to 1000)
    // Positive East longitude moves to the right (+X)
    const x = (normalizedLon / 180) * 1000;

    // Map latitude (90 North to -90 South) to Z (-500 to 500)
    // North (+90) is at the top (-500), South (-90) is at the bottom (500)
    const z = -(lat / 90) * 500;

    return [x, 0, z];
}



// ========== CUSTOM ELEMENTS =====

function SciFiUIContainer({ img, title, important, children, style, onClose }) {
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
            {img && (
                <img src={img} />
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


function SciFiToasts({ toasts }) {
    return (
        <div className="sci-fi-toast-container">
            <AnimatePresence>
                {toasts.map(toast => (
                    <motion.div
                        key={toast.id}
                        layout
                        initial={{ opacity: 0, x: 50, filter: "brightness(2)" }}
                        animate={{ opacity: 1, x: 0, filter: "brightness(1)" }}
                        exit={{ opacity: 0, x: 20, filter: "brightness(0)" }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className={`sci-fi-toast toast-${toast.type}`}
                    >
                        <div className="toast-title">
                            {toast.type === 'error' ? '⚠ ' : 
                             toast.type === 'warning' ? '⬡ ' : 
                             toast.type === 'success' ? '✔ ' : 'ℹ '}
                            {toast.title}
                        </div>
                        {toast.description && <div className="toast-desc">{toast.description}</div>}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}


function EquipmentPin({ loaded, position, label, onClick }) {
    return (
        <Html position={position} zIndexRange={[10, 0]}>
            <div 
                className={`map-pin ${loaded ? 'on-load' : ''}`}
                onClick={onClick}
                onMouseEnter={playSciFiMouseSound}
            >
                <div className="pin-label">{label}</div>
            </div>
        </Html>
    );
}


function NavigationGizmo({ equipmentData, selectedEquipment, cameraTargetRef }) {
    // We update the DOM directly in a fast loop to avoid killing React performance
    useEffect(() => {
        let animationFrameId;
        const gizmoRadius = 70; // Half of the 140px CSS width
        const mapRange = 600;   // How many 3D units the radius represents. Adjust to change "zoom" of the radar

        const updateGizmo = () => {
            if (!cameraTargetRef.current) return;
            const target = cameraTargetRef.current;

            equipmentData.forEach((eq, idx) => {
                const el = document.getElementById(`gizmo-pin-${idx}`);
                if (!el) return;

                // Calculate distance from camera target to equipment pin
                const dx = eq.coords[0] - target.x;
                const dz = eq.coords[2] - target.z;
                const dist = Math.sqrt(dx * dx + dz * dz);
                
                // Scale distance to gizmo pixels
                let drawDist = (dist / mapRange) * gizmoRadius;
                
                // If it's outside the circle, clamp it to the edge
                if (drawDist > gizmoRadius - 4) {
                    drawDist = gizmoRadius - 4; 
                }

                // Calculate the angle and apply to the CSS transform
                const angle = Math.atan2(dz, dx);
                const x = Math.cos(angle) * drawDist;
                const y = Math.sin(angle) * drawDist;
                
                // We use translate(-50%, -50%) natively in the transform to keep the pin centered on its coordinate
                el.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
            });

            animationFrameId = requestAnimationFrame(updateGizmo);
        };

        updateGizmo();
        return () => cancelAnimationFrame(animationFrameId);
    }, [equipmentData]);

    return (
        <motion.div 
            className="sci-fi-gizmo"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
        >
            <div className="gizmo-crosshair"></div>
            {equipmentData.map((eq, idx) => {
                const isActive = selectedEquipment && selectedEquipment.name === eq.name;
                return (
                    <div 
                        key={idx} 
                        id={`gizmo-pin-${idx}`} 
                        className={`gizmo-pin ${isActive ? 'active' : ''}`}
                    />
                );
            })}
        </motion.div>
    );
}


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


function MartianFog() {
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


function CustomMapControls({ focusTarget, cameraTargetRef }) {
    const controlsRef = useRef();
    const limitX = 1000 / 1.5; 
    const limitZ = 500 / 1.5; 

    useFrame((state) => {
        if (controlsRef.current) {
            const controls = controlsRef.current;
            const camera = state.camera;
            const target = controls.target;
            
            // Export target coordinates to the gizmo
            if (cameraTargetRef) {
                cameraTargetRef.current.copy(target);
            }

            // Dynamic zoom tilt
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
                
                // Slightly pull the camera in closer for inspection
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



// =========== MAIN FUNCTION ==========

export default function App() {
    // State to track if the user has clicked to enter the experience
    const [entered, setEntered] = useState(false);
    const [selectedEquipment, setSelectedEquipment] = useState(null);
    const [toasts, setToasts] = useState([]);

    const cameraTargetRef = useRef(new THREE.Vector3(0, 0, 0));

    const [equipmentData, setEquipmentData] = useState([
        {
            name: "Beagle 2 Lander",
            realCoords: { lat: 12.9, lon: 87.0 },
            status: "DORMANT (Since Dec 25, 2003)",
            mission: "Astrobiology & Exobiology",
            description: "Found 11 years after contact was lost. Partially deployed solar panels blocked its communications antenna, leaving it stranded but intact on the surface."
        },
        {
            name: "Perseverance Rover",
            realCoords: { lat: 18.447, lon: 77.402 },
            status: "ACTIVE",
            mission: "Astrobiology & Exobiology",
            description: "The rover remains in excellent condition as it scales the rim of Jezero Crater, exploring ancient, 4-billion-year-old hydrothermally altered terrains."
        },
        /*
        {
            name: "Utopia Planitia",
            realCoords: { lat: 46.7, lon: 117.5 },
            status: "ACTIVE",
            mission: "Astrobiology & Exobiology",
            description: "The rover remains in excellent condition as it scales the rim of Jezero Crater, exploring ancient, 4-billion-year-old hydrothermally altered terrains."
        },
        {
            name: "Olympus Mons",
            realCoords: { lat: 18.39, lon: 226.12 },
            status: "ACTIVE",
            mission: "Astrobiology & Exobiology",
            description: "The rover remains in excellent condition as it scales the rim of Jezero Crater, exploring ancient, 4-billion-year-old hydrothermally altered terrains."
        },
        */
    ]);

    // Calculate map coordinates based on real coordinates
    useEffect(() => {
        for (let i = 0; i < equipmentData.length; i++) {
            const eq = equipmentData[i];
            eq.coords = latLonToMapCoords(eq.realCoords.lat, eq.realCoords.lon);
            equipmentData[i] = eq;
        }

        setEquipmentData(equipmentData);
    }, []);


    // Mounts the audio in memory and fades it in when 'entered' becomes true
    useAmbientAudio('/mars_ambience.mp3', entered, 0.1, 3000);
    
    
    // Toast Manager
    const addToast = (type, title, description) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, type, title, description }]);
        
        // Play corresponding sound
        if (type === 'error') uiSounds.error.play();
        else uiSounds.open.play();
        
        // Auto-dismiss after 4 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    };


    return (
        <div className="canvas-container">
            <div className="vignette-overlay"></div>
            
            <SciFiToasts toasts={toasts} />
            
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
                            onMouseEnter={playSciFiMouseSound}
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
                        <SciFiUIContainer img="/vantalumen.png" title="Project VantaLumen" style={{ width: '300px', marginBottom: '20px' }}>
                            <p>LOCATION: ISIDIS PLANITIA, MARS</p>
                            <p>HQ: VANTALUMEN</p>
                            <p>ATMOSPHERE: 95% CO2</p>
                            <p>SURFACE TEMP: -60°C</p>
                            {selectedEquipment ?
                                <p>TARGET: {selectedEquipment.name.toUpperCase()}</p>
                                :
                                <p className="sci-fi-blinking-text">AWAITING TARGET SELECTION...</p>
                            }
                        </SciFiUIContainer>
                    </div>
                )}
            </AnimatePresence>

            {entered && (
                <div className="ui-layer sci-fi-subtitle">
                    <p>MARTIAN TERRAIN</p>
                </div>
            )}


            {/* Navigation gizmo */}
            {entered && (
                <NavigationGizmo 
                    equipmentData={equipmentData} 
                    selectedEquipment={selectedEquipment} 
                    cameraTargetRef={cameraTargetRef} 
                />
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
                            <p>COORDINATES: {selectedEquipment.realCoords.lat}°N, {selectedEquipment.realCoords.lon}°E</p>
                            <p>STATUS: {selectedEquipment.status}</p>
                            <p>MISSION: {selectedEquipment.mission}</p>
                            <br/>
                            <p style={{ color: '#aaa' }}>{selectedEquipment.description}</p>
                            <br/>
                            <button 
                                onMouseEnter={playSciFiMouseSound}
                                onClick={() => {
                                    // NOTE: Feature not yet supported, so we'll emit an error
                                    uiSounds.error.play();
                                    addToast(
                                        'error', 
                                        'INSPECTION FAILED', 
                                        'Feature is not currently supported.'
                                    );
                                }}
                                className='sci-fi-button'
                            >
                                <span>INSPECT [N/A]</span>
                            </button>
                        </SciFiUIContainer>
                    </div>
                )}
            </AnimatePresence>



            <Canvas camera={{ fov: 12, position: [0, 800, 1000], near: 0.1, far: 4000 }}>
                <color attach="background" args={['#c7a47b']} />

                <Suspense fallback={null}>
                    {/* Render equipment pins */}
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


                {entered && (
                    <CustomMapControls
                        focusTarget={selectedEquipment ? selectedEquipment.coords : null} 
                        cameraTargetRef={cameraTargetRef}
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