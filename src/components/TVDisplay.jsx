import React, { useRef, useEffect } from 'react';
import clsx from 'clsx';


export default function TVDisplay({ src, clipBounds, className, videoRef, volume, onVolumeChange }) {
    const hasInitialized = useRef(false);

    useEffect(() => {
        if (!videoRef?.current) return;
        const v = videoRef.current;
        hasInitialized.current = false; // reset so ref callback fires play() on new src
        v.muted = true;
        v.load();
        v.play().catch(() => {});
    }, [src]);

    const handleEnded = () => {
        const restartTime = clipBounds?.startTime || 0;
        if (videoRef.current) {
            videoRef.current.currentTime = restartTime;
            try { videoRef.current.play(); } catch (e) { }
        }
    };

    const handleTimeUpdate = (e) => {
        if (clipBounds?.endTime && e.target.currentTime >= clipBounds.endTime - 0.1) {
            e.target.currentTime = clipBounds.startTime || 0;
            if (e.target.paused) {
                try { e.target.play(); } catch (e) { }
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
        <div className={clsx('transition-opacity duration-1000', className)}>
            <div
                className="relative mx-auto"
                style={{ width: '480px', aspectRatio: '1 / 1' }}
            >
                {/* Video layer — pointer-events-none so it never blocks anything */}
                <div
                    className="absolute z-0 overflow-hidden pointer-events-none"
                    style={{
                        top: '7.51%',
                        left: '-2px',
                        width: '90.62%',
                        height: '67.32%',
                        borderRadius: '8%',
                    }}
                >
                    {src.endsWith('.gif') ? (
                        <img
                            src={src}
                            alt="TV Display"
                            className="w-full h-full object-cover brightness-110 contrast-85 sepia-[.20] saturate-80 pointer-events-none"
                        />
                    ) : (
                        <video
                            ref={(el) => {
                                if (videoRef) videoRef.current = el;
                                if (el && !hasInitialized.current) {
                                    hasInitialized.current = true;
                                    el.muted = true; // set imperatively, not as HTML attribute
                                    el.play().catch(() => {});
                                }
                            }}
                            src={src}
                            autoPlay
                            loop={!clipBounds}
                            playsInline
                            preload="auto"
                            onTimeUpdate={handleTimeUpdate}
                            onLoadedMetadata={handleLoadedMetadata}
                            onEnded={handleEnded}
                            className="w-full h-full object-cover brightness-110 contrast-85 sepia-[.20] saturate-80 pointer-events-none"
                        />
                    )}
                    <video
                        src="/assets/VintageLayer.webm"
                        autoPlay loop muted playsInline
                        className="absolute inset-0 w-full h-full object-cover opacity-10 mix-blend-screen pointer-events-none z-10"
                    />
                    <div className="absolute inset-0 z-20 pointer-events-none"
                        style={{ background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 1px, transparent 1px, transparent 3px)' }}
                    />
                    <div className="absolute inset-0 z-30 pointer-events-none"
                        style={{ background: 'radial-gradient(circle at -60% -30 center , transparent 60%, rgba(0,0,0,0.65) 100%)' }}
                    />
                    <div className="absolute inset-0 z-20 pointer-events-none"
                        style={{ boxShadow: 'inset 0 0 40px rgba(0,0,0,0.55)' }}
                    />
                </div>

                {/* TV Frame — pointer-events-none */}
                <img
                    src="/assets/VideoFrame.webp"
                    alt="Vintage TV Frame"
                    className="relative z-10 w-auto h-[400px] pointer-events-none select-none -translate-y-15 scale-130"
                    draggable={false}
                    style={{ filter: 'drop-shadow(20px 30px 40px rgba(0,0,0,5))' }}
                />



            </div>
        </div>
    );
}
