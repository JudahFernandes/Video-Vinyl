import React, { useRef, useState, useEffect } from 'react';

export default function VolumeKnob({ volume, onChange }) {
    const knobRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleMouseDown = (e) => {
        e.stopPropagation(); // Prevent event from reaching tonearm
        setIsDragging(true);

        // Initial calculation
        handleMove(e.clientX, e.clientY);

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleTouchStart = (e) => {
        e.stopPropagation();
        setIsDragging(true);

        const touch = e.touches[0];
        handleMove(touch.clientX, touch.clientY);

        window.addEventListener('touchmove', handleTouchMove);
        window.addEventListener('touchend', handleMouseUp);
    };

    const handleMove = (clientX, clientY) => {
        if (!knobRef.current) return;

        const rect = knobRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Calculate angle relative to center
        // atan2(y,x) gives 0 at 3 o'clock, 90 at 6, 180/-180 at 9, -90 at 12
        let angle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);

        // Transform coordinate system:
        // We want -135deg (Bottom-Left) to be 0% vol
        // We want +135deg (Bottom-Right) to be 100% vol
        // Top (12 o'clock) corresponds to -90 in atan2.

        // Let's shift the angle so -135 starts at 0 value in our calculations
        // Original atan2:
        // -135deg (visual) is approx 135deg (atan2, bottom-left) ? No, standard atan2:
        // Bottom-Left is approx 135.
        // Quick visual map for atan2(y,x):
        // Right: 0
        // Down: 90
        // Left: 180
        // Top: -90

        // We want knob to start at 7 o'clock (-135 visual rotation from top)
        // 7 o'clock in atan2 is approx 135 degrees.
        // 5 o'clock (max volume) is approx 45 degrees.

        // Let's create a custom mapping relative to "down" (90deg)
        // Shift angle so that 90deg (down) is the split point

        let adjustedAngle = angle - 90;
        if (adjustedAngle < -180) adjustedAngle += 360;

        // New mapping:
        // Top (-90 originally) -> -180
        // Bottom (90 originally) -> 0
        // Left (180) -> 90
        // Right (0) -> -90

        // This is tricky visually. Let's use the simplest absolute map:
        // Convert to 0-360 starting from South (Bottom) going Clockwise?
        // Let's stick to the visual rotation logic we already use for rendering:
        // rotation = (volume / 100) * 270 - 135
        // Min (-135) is roughly 7:30 o'clock
        // Max (135) is roughly 4:30 o'clock

        // Angle Calculation:
        // Calculate angle from straight up (12 o'clock)
        // Standard Angle (SA) = angle - 90? No.

        // Let's use standard positive angle 0-360 from North clockwise
        const rad = Math.atan2(clientY - centerY, clientX - centerX);
        let deg = rad * (180 / Math.PI);

        // Shift so 0 is North (12 o'clock)
        deg = deg + 90;

        // Normalize 0-360
        // 0 = North
        // 90 = East
        // 180 = South
        // 270 (-90) = West

        // Map to our knob range: -135 to +135
        // -135 is roughly 225 degrees (Counter-Clockwise) or -135.

        // Let's just normalize to -180 (Bottom) to +180 (Bottom) with 0 at Top.
        // atan2(y,x) where x=0, y=-1 (Top) -> -90. +90 -> 0.
        // Yes, `deg + 90` makes Top = 0.
        // Right = 90.
        // Bottom = 180.
        // Left = 270 -> -90 (since atan2 jumps).

        // Let's fix the normalization:
        // If we use `deg + 90`, Left (-180) becomes -90? No wait.
        // atan2 return -180 to 180.
        // Top (-90) + 90 = 0.
        // Right (0) + 90 = 90.
        // Bottom (90) + 90 = 180.
        // Left (180) + 90 = 270.
        // Left (-180) + 90 = -90.

        // Fix wrap around 180
        // We want range: -135 (Min) to +135 (Max).
        // 0 is Center.

        // If deg is > 180, wrap to negative?
        // Actually, if we just use the raw `deg + 90`.
        // We need it to be continuous.
        // If we go left: 0 -> -10 -> ... -> -135.
        // If we go right: 0 -> 10 -> ... -> 135.

        // Current logic:
        // Left side from Top is 270..360 (if normalized positive).
        // Let's try: if (deg > 180) deg -= 360;

        if (deg > 180) deg -= 360;
        // Now:
        // Top = 0
        // Right = 90
        // Bottom = 180
        // Left = -90 (Wait, 270-360 = -90). Correct. -90 is Left.

        // So valid map is:
        // Angle in range [-135, 135] -> Map to Volume.
        // Dead Zone: 135 to 180 AND -180 to -135. (The bottom wedge).

        let targetVolume = volume;

        // Check Dead Zone
        if (deg > 135 || deg < -135) {
            // Gap Protection
            // If we are closer to Max, snap to Max.
            if (deg > 135 && deg < 180) {
                // In bottom-right gap -> Max
                targetVolume = 100;
            } else if (deg < -135 && deg > -180) {
                // In bottom-left gap -> Min
                targetVolume = 0;
            } else {
                // Deep dead zone (exactly bottom), assume stick with previous
                // Or smarter: if prev volume was high, stick high.
                if (volume > 50) targetVolume = 100;
                else targetVolume = 0;
            }
        } else {
            // Valid Range
            // Map [-135, 135] to [0, 100]
            // Scale: 270 deg range = 100 vol units.
            // Offset: -135 -> 0.
            // vol = (deg + 135) / 2.7
            targetVolume = (deg + 135) / 2.7;
        }

        // Hard clamp
        targetVolume = Math.min(100, Math.max(0, targetVolume));

        onChange({ target: { value: targetVolume } });
    };

    const handleMouseMove = (e) => handleMove(e.clientX, e.clientY);
    const handleTouchMove = (e) => {
        const touch = e.touches[0];
        handleMove(touch.clientX, touch.clientY);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleMouseUp);
    };

    // Map 0-100 volume to -135 to 135 degrees (270° range)
    // 0% = -135deg (left), 50% = 0deg (top), 100% = 135deg (right)
    const rotation = (volume / 100) * 270 - 135;

    return (
        <div className="flex flex-col items-center gap-2 group cursor-grab active:cursor-grabbing select-none"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
        >
            <div ref={knobRef} className="relative w-18 h-18 rounded-full transition-transform active:scale-95">
                {/* Knob Image */}
                <img
                    src="/assets/volume_knob.webp"
                    alt="Volume Knob"
                    className="w-full h-full object-contain pointer-events-none select-none"
                    style={{
                        transform: `rotate(${rotation}deg)`,
                        transition: isDragging ? 'none' : 'transform 0.2s ease-out'
                    }}
                />

               
            </div>
            <span className="text-[10px] text-white/70 font-serif tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity select-none">
                Volume
            </span>
        </div>
    );
}
