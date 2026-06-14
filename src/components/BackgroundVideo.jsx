import React, { useRef, useEffect } from 'react';
import clsx from 'clsx';

export default function BackgroundVideo({ src, clipBounds, className }) {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current && clipBounds?.startTime !== undefined) {
            videoRef.current.currentTime = clipBounds.startTime;
        }
    }, [src, clipBounds]);

    const handleEnded = () => {
        // Force restart when video ends
        const restartTime = clipBounds?.startTime || 0;
        if (videoRef.current) {
            videoRef.current.currentTime = restartTime;
            try {
                videoRef.current.play();
            } catch (e) {
                console.warn('Playback restart failed:', e);
            }
        }
    };

    const handleTimeUpdate = (e) => {
        if (clipBounds && clipBounds.endTime) {
            // Buffer of 0.1s to prevent frame perfect misses
            if (e.target.currentTime >= clipBounds.endTime - 0.1) {
                e.target.currentTime = clipBounds.startTime || 0;
                if (e.target.paused) {
                    try {
                        e.target.play();
                    } catch (e) {
                        // Playback might already be active
                    }
                }
            }
        }
    };

    const handleLoadedMetadata = (e) => {
        if (clipBounds?.startTime) {
            e.target.currentTime = clipBounds.startTime;
        }
    };

    if (!src) return null;

    return (
        <div className={clsx(
            "absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none transition-all duration-1000 ease-in-out",
            className // Apply external styles
        )}
            style={{ perspective: '1000px' }}
        >
            {/* Shared Transform Wrapper */}
            <div
                className="relative inline-block shadow-2xl"
                style={{
                    transform: 'translateZ(-200px) scale(0.85) translateY(-10%)', // Cinematic positioning
                    maxWidth: '85%',
                    maxHeight: '85%',
                    boxShadow: '0 0 100px rgba(0,0,0,0.5)' // Soft glow/shadow
                }}
            >
                {/* User Video */}
                <video
                    ref={videoRef}
                    src={src}
                    autoPlay
                    loop={!clipBounds}
                    muted
                    playsInline
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={handleEnded}
                    className={clsx(
                        "w-full h-full object-cover rounded-sm", // Ensure it fills wrapper
                        "brightness-110 contrast-85 sepia-[.20] saturate-80" // Vintage Filter
                    )}
                />

                {/* Vintage Film Overlay */}
                <video
                    src="/assets/VintageLayer.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-fit h-fit object-cover opacity-20 pointer-events-none z-10 mix-blend-screen rounded-sm"
                />
            </div>
        </div>
    );
}
