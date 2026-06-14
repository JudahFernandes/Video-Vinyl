import React, { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';

export default function VinylVolumeKnob({ volume, onChange }) {
    const [isDragging, setIsDragging] = useState(false);
    const startY = useRef(0);
    const startVolume = useRef(volume);

    // Total vertical travel distance in pixels for the fader
    const TRACK_HEIGHT = 80;

    const handleMouseDown = (e) => {
        e.stopPropagation();
        e.preventDefault();
        setIsDragging(true);
        startY.current = e.clientY;
        startVolume.current = volume;

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleTouchStart = (e) => {
        e.stopPropagation();
        setIsDragging(true);
        const touch = e.touches[0];
        startY.current = touch.clientY;
        startVolume.current = volume;

        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleMouseUp);
    };

    const handleMove = (clientY) => {
        const deltaY = startY.current - clientY; // drag UP = positive delta

        // Map pixel delta to volume percentage
        // If they drag TRACK_HEIGHT pixels up, that's +100% volume
        const volumeDelta = (deltaY / TRACK_HEIGHT) * 100;

        let newVol = startVolume.current + volumeDelta;
        newVol = Math.max(0, Math.min(100, newVol));
        onChange(newVol);
    };

    const handleMouseMove = (e) => {
        e.preventDefault();
        handleMove(e.clientY);
    };

    const handleTouchMove = (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        handleMove(touch.clientY);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleMouseUp);
    };

    // Clean up on unmount just in case
    useEffect(() => {
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleMouseUp);
        };
    }, []);

    // Vertical sliding: 100% volume = top (0px offset), 0% volume = bottom (TRACK_HEIGHT offset)
    const translateY = (1 - (volume / 100)) * TRACK_HEIGHT;

    return (
    <div className="select-none">
        {/* Slider Track Container */}
        <div
            className="relative w-20 flex justify-center cursor-ns-resize"
            style={{ height: `${TRACK_HEIGHT + 80}px` }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
        >
            {/* Knob */}
            <div
                className="absolute w-8 h-8 active:scale-95 z-10"
                style={{
                    left: '50%',
                    transform: `translateX(-50%) translateY(${translateY}px)`,
                    transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                }}
            >
                <img
                    src="/assets/Vinyl_Knob.webp"
                    alt="Vinyl Volume Knob"
                    className="w-full h-full object-contain pointer-events-none select-none drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)]"
                    draggable={false}
                />
            </div>
        </div>
    </div>
);
}
