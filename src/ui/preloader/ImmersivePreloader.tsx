import React, { useEffect, useRef, useState } from 'react';
import { useCosmosStore } from '../../store/useCosmosStore';
import { spatialAudio } from '../../core/audio/SpatialAudioEngine';

export const ImmersivePreloader: React.FC = () => {
    const viewStage = useCosmosStore((state) => state.viewStage);
    const loadingProgress = useCosmosStore((state) => state.loadingProgress);
    const requiredAssetsReady = useCosmosStore((state) => state.requiredAssetsReady);
    const loadingStatusLabel = useCosmosStore((state) => state.loadingStatusLabel);
    const startLaunchSequence = useCosmosStore((state) => state.startLaunchSequence);

    const [displayPct, setDisplayPct] = useState(0);
    const [hasMoved, setHasMoved] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const stageRef = useRef<HTMLDivElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);
    const posRef = useRef({ x: 0, y: 0 });
    const hasMovedRef = useRef(false);
    const targetTiltRef = useRef({ rx: 5, ry: -3 });
    const currentTiltRef = useRef({ rx: 5, ry: -3 });
    const dragStartRef = useRef<{
        pointerX: number;
        pointerY: number;
        startX: number;
        startY: number;
    } | null>(null);

    // Smoothly interpolate display percentage up to the actual loading progress
    useEffect(() => {
        const interval = window.setInterval(() => {
            setDisplayPct((prev) => {
                if (prev === loadingProgress) return prev;
                if (prev < loadingProgress) {
                    return Math.min(
                        loadingProgress,
                        prev + Math.max(1, Math.ceil((loadingProgress - prev) * 0.25)),
                    );
                }
                return loadingProgress;
            });
        }, 35);

        return () => {
            window.clearInterval(interval);
        };
    }, [loadingProgress]);

    // 3D tilt interpolation via rAF & direct DOM transform updates (zero React re-renders on pointermove)
    useEffect(() => {
        if (viewStage !== 'PRELOADING') return;
        const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        if (reduced) {
            targetTiltRef.current = { rx: 0, ry: 0 };
            currentTiltRef.current = { rx: 0, ry: 0 };
        }

        let rafId = 0;
        const updateTiltLoop = () => {
            const cur = currentTiltRef.current;
            const tgt = targetTiltRef.current;
            cur.rx += (tgt.rx - cur.rx) * 0.14;
            cur.ry += (tgt.ry - cur.ry) * 0.14;

            if (cardRef.current) {
                cardRef.current.style.transform = `perspective(1100px) rotateX(${cur.rx.toFixed(2)}deg) rotateY(${cur.ry.toFixed(2)}deg)`;
            }
            rafId = window.requestAnimationFrame(updateTiltLoop);
        };
        rafId = window.requestAnimationFrame(updateTiltLoop);

        const handlePointerMove = (e: PointerEvent) => {
            if (dragStartRef.current) {
                const dx = e.clientX - dragStartRef.current.pointerX;
                const dy = e.clientY - dragStartRef.current.pointerY;

                const maxX = Math.max(120, window.innerWidth * 0.45);
                const maxYUp = Math.max(120, window.innerHeight * 0.72);
                const maxYDown = 40;

                const nextX = Math.max(-maxX, Math.min(maxX, dragStartRef.current.startX + dx));
                const nextY = Math.max(-maxYUp, Math.min(maxYDown, dragStartRef.current.startY + dy));

                posRef.current.x = nextX;
                posRef.current.y = nextY;

                if (stageRef.current) {
                    stageRef.current.style.transform = `translate3d(${nextX.toFixed(1)}px, ${nextY.toFixed(1)}px, 0)`;
                }

                const movedNow = Math.abs(nextX) > 4 || Math.abs(nextY) > 4;
                if (movedNow !== hasMovedRef.current) {
                    hasMovedRef.current = movedNow;
                    setHasMoved(movedNow);
                }
                return;
            }

            if (!reduced) {
                const nx = (e.clientX / window.innerWidth - 0.5) * 2;
                const ny = (e.clientY / window.innerHeight - 0.5) * 2;
                targetTiltRef.current.rx = 5 - ny * 6;
                targetTiltRef.current.ry = -3 + nx * 8;
            }
        };

        const handlePointerUp = () => {
            if (!dragStartRef.current) return;
            dragStartRef.current = null;
            setIsDragging(false);
        };

        window.addEventListener('pointermove', handlePointerMove, { passive: true });
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerUp);

        return () => {
            window.cancelAnimationFrame(rafId);
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointercancel', handlePointerUp);
        };
    }, [viewStage]);

    const handleCardPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest('button')) return;
        e.preventDefault();
        dragStartRef.current = {
            pointerX: e.clientX,
            pointerY: e.clientY,
            startX: posRef.current.x,
            startY: posRef.current.y,
        };
        setIsDragging(true);
    };

    const handleResetPosition = () => {
        posRef.current.x = 0;
        posRef.current.y = 0;
        hasMovedRef.current = false;
        setHasMoved(false);
        if (stageRef.current) {
            stageRef.current.style.transform = 'translate3d(0px, 0px, 0)';
        }
    };

    if (viewStage === 'LAUNCHING') {
        return (
            <div className="alpha-jump-hud-notice" aria-live="polite">
                <span className="telemetry-tag">ALPHA JUMP ENGAGED</span>
                <strong>WARPING SPACE-TIME INTO MARS ORBIT...</strong>
            </div>
        );
    }

    if (viewStage !== 'PRELOADING') return null;

    const isReady = requiredAssetsReady && displayPct >= 100;

    const handleLaunch = () => {
        if (!isReady) return;
        spatialAudio.initAndStart();
        startLaunchSequence();
    };

    return (
        <div className="preloader-backdrop" role="dialog" aria-labelledby="preloader-title">
            <div className="preloader-warp-rings" aria-hidden="true">
                <div className="warp-ring ring-1" />
                <div className="warp-ring ring-2" />
            </div>

            <div
                ref={stageRef}
                className="preloader-3d-stage"
                style={{
                    transform: `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0)`,
                }}
            >
                <div
                    ref={cardRef}
                    onPointerDown={handleCardPointerDown}
                    className={`preloader-card preloader-card-3d glass-panel ${
                        isDragging ? 'is-dragging' : ''
                    }`}
                    style={{
                        transform: `perspective(1100px) rotateX(${currentTiltRef.current.rx.toFixed(2)}deg) rotateY(${currentTiltRef.current.ry.toFixed(2)}deg)`,
                    }}
                >
                    {/* 3D background depth plate & holographic grid */}
                    <div className="card-3d-depth-plate" aria-hidden="true" />
                    <div className="card-3d-holo-grid" aria-hidden="true" />

                    {/* Console drag handle bar */}
                    <div className="card-3d-drag-bar">
                        <span className="drag-grip-label">
                            ⋮⋮ DRAG TO REPOSITION • 3D HOLOGRAPHIC CONSOLE
                        </span>
                        {hasMoved && (
                            <button
                                type="button"
                                className="card-reset-pos-btn"
                                onClick={handleResetPosition}
                                title="Reset card position"
                            >
                                ↺ Reset
                            </button>
                        )}
                    </div>

                    <div className="card-3d-layer-mid">
                        <span className="telemetry-tag">
                            ARES TELEMETRY OS v4.2 • STANDBY FOR ALPHA JUMP
                        </span>
                        <h1 id="preloader-title" className="preloader-heading">
                            MARS ORBITAL ATLAS
                        </h1>
                        <p className="preloader-subtitle">
                            Expedition vessel has entered the Mars approach corridor. Verifying 3D assets, orbital telemetry, and standing by for orbital insertion.
                        </p>
                    </div>

                    <div className="card-3d-layer-front">
                        <div className="preloader-progress-track">
                            <div
                                className="preloader-progress-fill"
                                style={{ width: `${displayPct}%` }}
                            />
                        </div>

                        <div className="preloader-diagnostics">
                            <span>[OK] Logarithmic Depth Buffer (0.1m – 10⁷ km)</span>
                            <span>[OK] Draco WASM &amp; KTX2 Worker Pool</span>
                            <span>{loadingStatusLabel}</span>
                            <span>{displayPct}% SYSTEM ASSETS INITIALIZED</span>
                        </div>

                        <button
                            type="button"
                            disabled={!isReady}
                            onClick={handleLaunch}
                            className="preloader-launch-btn"
                        >
                            {isReady
                                ? 'ENGAGE ORBITAL INSERTION (ALPHA JUMP)'
                                : `INITIALIZING SHIP & MARS TELEMETRY... ${displayPct}%`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
