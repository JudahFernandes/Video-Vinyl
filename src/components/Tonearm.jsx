import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function Tonearm({ isPlaying, onTogglePlay }) {
    const canvasRef = useRef(null);
    const imgRef = useRef(null);
    const containerRef = useRef(null);

    // Render image to hidden canvas for pixel perfect hit detection
    useEffect(() => {
        const img = imgRef.current;
        const canvas = canvasRef.current;
        if (!img || !canvas) return;

        const renderCanvas = () => {
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(img, 0, 0);
        };

        if (img.complete) {
            renderCanvas();
        } else {
            img.addEventListener('load', renderCanvas);
            return () => img.removeEventListener('load', renderCanvas);
        }
    }, []);

    const handlePointerDown = (e) => {
        const canvas = canvasRef.current;
        const container = containerRef.current;

        if (!canvas || !container) {
            onTogglePlay(); // Fallback if ref is missing
            return;
        }

        // Get hit coordinates relative to the container element
        const rect = container.getBoundingClientRect();

        // e.clientX/Y from mouse/pointer events, or touches array from touch events
        const clientX = e.clientX ?? (e.touches && e.touches[0].clientX);
        const clientY = e.clientY ?? (e.touches && e.touches[0].clientY);

        if (clientX == null || clientY == null) return;

        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const x = (clientX - rect.left) * scaleX;
        const y = (clientY - rect.top) * scaleY;

        const ctx = canvas.getContext('2d');
        const pixel = ctx.getImageData(x, y, 1, 1).data;

        // Check if the alpha channel is greater than a threshold (10 out of 255)
        if (pixel[3] > 10) {
            onTogglePlay();
        }
    };

    return (
        <div className="relative w-22 h-30 md:w-34 md:h-34 pointer-events-none z-20 select-none translate-y-12 -translate-x-10">
            {/* Rotating Arm */}
            <motion.div
                ref={containerRef}
                className="absolute top-20 right-2 w-1/2 h-full origin-[66%_16%] pointer-events-auto cursor-pointer select-none"
                animate={{
                    rotate: isPlaying ? 20 : 0,
                }}
                transition={{
                    type: "spring",
                    stiffness: 40,
                    damping: 10,
                    restDelta: 0.001
                }}
                onPointerDown={handlePointerDown}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                {/* Hidden canvas for hit detection */}
                <canvas ref={canvasRef} className="hidden" />
                {/* Arm Image */}
                <img
                    ref={imgRef}
                    src="/assets/tonearm.webp"
                    alt="Turntable Tonearm"
                    className="w-full h-full object-contain select-none pointer-events-none"
                    draggable={false}
                />
            </motion.div>
        </div>
    );
}
