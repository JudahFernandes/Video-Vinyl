import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, useMotionValue, useAnimation } from 'framer-motion';
import clsx from 'clsx';
import { playScratch, stopScratch } from '../utils/audioUtils';
import { Plus } from 'lucide-react';

export default function VinylPlayer({ isPlaying, currentTime, duration, youtubeId, onSeek, onSeekEnd, onReset, onHoverSlot, onSwap, onAddTrack }) {
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef(null);
    const controls = useAnimation();

    // Rotation constants
    const DEGREES_PER_SEC = 60;

    // Initialize rotation purely as a visual state
    const rotation = useMotionValue(0);

    // Smooth rAF-based rotation
    const rafRef = useRef(null);
    const lastWallTime = useRef(null);

    // Re-anchor on play resume so elapsed time is calculated cleanly
    useEffect(() => {
        if (isPlaying && !isDragging) {
            lastWallTime.current = performance.now();
        }
    }, [isPlaying, isDragging]);

    // rAF loop: advance rotation by real elapsed time while playing
    const tick = useCallback(() => {
        if (isPlaying && !isDragging) {
            const now = performance.now();
            const elapsed = (now - (lastWallTime.current ?? now)) / 1000; // seconds
            rotation.set(rotation.get() + elapsed * DEGREES_PER_SEC);
            lastWallTime.current = now;
        }
        rafRef.current = requestAnimationFrame(tick);
    }, [isPlaying, isDragging, rotation]);

    useEffect(() => {
        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, [tick]);

    const lastAngle = useRef(0);
    const lastTimestamp = useRef(0);
    const lastRot = useRef(0);
    const scrubTime = useRef(0);
    const activeHoverIndex = useRef(null);

    const onPan = (event, info) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const point = info.point;
        const dx = point.x - centerX;
        const dy = point.y - centerY;

        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        let delta = angle - lastAngle.current;
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;

        lastAngle.current = angle;
        const newRotation = rotation.get() + delta;
        rotation.set(newRotation);

        const now = Date.now();
        const timeDelta = now - lastTimestamp.current;
        const rotDelta = newRotation - lastRot.current;
        if (timeDelta > 0) {
            const velocity = Math.abs(rotDelta / timeDelta) * 5;
            playScratch(velocity);
        }
        lastTimestamp.current = now;
        lastRot.current = newRotation;

        scrubTime.current += delta / DEGREES_PER_SEC;
        const newTime = Math.max(0, Math.min(scrubTime.current, duration || Infinity));
        scrubTime.current = newTime;

        if (onSeek) onSeek(newTime);
    };

    const onPanStart = (event, info) => {
        setIsDragging(true);
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        lastAngle.current = Math.atan2(info.point.y - centerY, info.point.x - centerX) * (180 / Math.PI);
        lastTimestamp.current = Date.now();
        lastRot.current = rotation.get();
        scrubTime.current = currentTime; // Anchor the relative scrub time
        playScratch(0.5);
    };

    const onPanEnd = () => {
        setIsDragging(false);
        stopScratch();
        if (onSeekEnd) onSeekEnd();
    };

    return (
        <div className="relative flex items-center justify-center pointer-events-auto select-none">
            <motion.div
                ref={containerRef}
                className={clsx(
                    "relative w-40 h-40 md:w-40 md:h-40 rounded-full select-none",
                    isPlaying ? "cursor-grab active:cursor-grabbing" : "cursor-move"
                )}
                style={{ rotate: rotation, x: 0, y: 0 }}
                animate={isPlaying ? { scale: [1, 1.015, 1] } : { scale: 1 }}
                transition={isPlaying ? {
                    duration: 1.8,
                    repeat: Infinity,
                    ease: "easeInOut"
                } : { duration: 0.5 }}

                // Mode 1: Scrubbing (Playing)
                onPan={(e, info) => {
                    if (!isPlaying) return;
                    onPan(e, info);
                }}
                onPanStart={(e, info) => {
                    if (!isPlaying) return;
                    onPanStart(e, info);
                }}
                onPanEnd={onPanEnd}

                // Mode 2: Dragging (Paused)
                drag={!isPlaying}
                dragSnapToOrigin={true}
                dragElastic={0.2}
                dragMomentum={false}
                whileDrag={{ scale: 1.1, zIndex: 100 }}
                onDrag={(e, info) => {
                    if (isPlaying) return;
                    // Collision detection
                    const slots = document.querySelectorAll('[id^="shelf-slot-"]');
                    let found = null;
                    slots.forEach(slot => {
                        const rect = slot.getBoundingClientRect();
                        if (info.point.x >= rect.left && info.point.x <= rect.right &&
                            info.point.y >= rect.top && info.point.y <= rect.bottom) {
                            found = parseInt(slot.id.replace('shelf-slot-', ''));
                        }
                    });
                    if (found !== activeHoverIndex.current) {
                        activeHoverIndex.current = found;
                        if (onHoverSlot) onHoverSlot(found);
                    }
                }}
                onDragEnd={(e, info) => {
                    if (isPlaying) return;

                    const swapIndex = activeHoverIndex.current;
                    activeHoverIndex.current = null;
                    if (onHoverSlot) onHoverSlot(null);

                    if (swapIndex !== null) {
                        if (onSwap) onSwap(swapIndex);
                    } else {
                        // Original box logic fallback
                        const boxElement = document.getElementById('vinyl-box-target');
                        if (containerRef.current && boxElement) {
                            const vinylRect = containerRef.current.getBoundingClientRect();
                            const boxRect = boxElement.getBoundingClientRect();
                            const isOverlapping = !(
                                vinylRect.right < boxRect.left ||
                                vinylRect.left > boxRect.right ||
                                vinylRect.bottom < boxRect.top ||
                                vinylRect.top > boxRect.bottom
                            );
                            if (isOverlapping && onReset) onReset();
                        }
                    }
                }}
            >
                {/* Vinyl Record */}
                <img
                    src="/assets/VinylPlayer.webp"
                    alt="Vinyl Record"
                    className="absolute inset-0 w-full h-full object-cover rounded-full pointer-events-none select-none drop-shadow-xl"
                    draggable={false}
                />

                {/* Track Thumbnail (Center Cover) */}
                {youtubeId ? (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-1/3 h-1/3 rounded-full overflow-hidden border-2 border-black/20 shadow-inner translate-y-[-2px]">
                            <img
                                src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
                                alt="Current Track"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
                        <button
                            onClick={onAddTrack}
                            className="w-1/3 h-1/3 rounded-full flex items-center justify-center border-2 border-white/20 bg-black/40 hover:bg-black/60 hover:scale-105 transition-all shadow-inner translate-y-[-2px]"
                        >
                            <Plus size={32} className="text-white/80 animate-pulse" />
                        </button>
                    </div>
                )}

                {/* Disc Hole Shadow */}
                <div className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-black/40 rounded-full blur-[2px] pointer-events-none" />
            </motion.div>
        </div>
    );
}
