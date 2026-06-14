import React, { useRef } from 'react';
import { Plus } from 'lucide-react';

const FRAME_CONFIGS = {
    Frame_1: {
        aspectRatio: 16 / 9,        // horizontal rectangle
        clip: 'inset(0% 0% 0% 0% round 4px)',
        style: { top: '21%', left: '10%', width: '80%', height: '58%' },
    },
    Frame_2: {
        aspectRatio: 0.6,           // tall oval (portrait)
        clip: 'ellipse(38% 50% at 50% 50%)',
        style: { top: '13%', left: '12%', width: '76%', height: '74%' },
    },
    Frame_3: {
        aspectRatio: 1,             // circle
        clip: 'circle(50% at 50% 50%)',
        style: { top: '10%', left: '15%', width: '72%', height: '78%' },
    },
    Frame_4: {
        aspectRatio: 1,             // square
        clip: 'inset(0% 0% 0% 0% round 4px)',
        style: { top: '12%', left: '16%', width: '68%', height: '76%' },
    },
};

export default function DraggableFrame({ frame, onDragStart, onOpenCrop, onResize, zIndex }) {
    const fileInputRef = useRef(null);
    const config = FRAME_CONFIGS[frame.frameType] || FRAME_CONFIGS.Frame_4;

    const isResizing = useRef(false);
    const resizeStartY = useRef(null);
    const resizeStartScale = useRef(null);

    const MIN_SCALE = 0.5;
    const MAX_SCALE = 2.5;

    const handleResizePointerDown = (e) => {
        e.stopPropagation();
        e.preventDefault();
        isResizing.current = true;
        resizeStartY.current = e.clientY ?? e.touches?.[0]?.clientY;
        resizeStartScale.current = frame.scale ?? 1;

        const onMove = (moveEvent) => {
            if (!isResizing.current) return;
            const currentY = moveEvent.clientY ?? moveEvent.touches?.[0]?.clientY;
            const delta = currentY - resizeStartY.current;
            // dragging down = bigger, dragging up = smaller
            const scaleDelta = delta / 150; // 150px drag = full scale range
            const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, resizeStartScale.current + scaleDelta));
            if (onResize) onResize(frame.id, newScale);
        };

        const onUp = () => {
            isResizing.current = false;
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            window.removeEventListener('touchmove', onMove);
            window.removeEventListener('touchend', onUp);
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        window.addEventListener('touchmove', onMove);
        window.addEventListener('touchend', onUp);
    };

    const handlePointerDown = (e) => {
        if (onDragStart) onDragStart(e, frame);
    };

    const handlePlusClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (fileInputRef.current) fileInputRef.current.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const tempUrl = URL.createObjectURL(file);
            onOpenCrop(frame.id, tempUrl, config.aspectRatio);
            e.target.value = null;
        }
    };

    const scale = frame.scale ?? 1;
    const baseHalf = 35; // half of 140px base size
    const scaledHalf = baseHalf * scale; // actual visual edge distance from center
    const handleOffset = scaledHalf - baseHalf; // extra 10px outside the visual edge

    return (
        <div
            className="absolute select-none pointer-events-auto group"
            style={{
                left: frame.x,
                top: frame.y,
                width: 140,
                height: 140,
                transform: 'translate(-50%, -50%)',
                zIndex,
            }}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
            />

            {/* Scaled inner content — frame, photo, vintage overlay, + button */}
            <div
                className="absolute inset-0"
                style={{
                    transform: `scale(${frame.scale ?? 1})`,
                    transformOrigin: 'center center',
                    cursor: 'grab',
                }}
                onPointerDown={handlePointerDown}
            >
                {/* Frame image — sits BELOW the photo (z-10) */}
                <img
                    src={`/assets/${frame.frameType}.webp`}
                    alt="Frame"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
                    draggable={false}
                    loading="lazy"
                />

                {/* Photo — sits ABOVE the frame (z-20), clipped to shape */}
                {frame.photo && (
                    <div
                        className="absolute z-20 overflow-hidden pointer-events-none"
                        style={{
                            ...config.style,
                            clipPath: config.clip,
                        }}
                    >
                        <img
                            src={frame.photo.src}
                            alt="User Photo"
                            className="w-full h-full object-cover"
                            draggable={false}
                        />
                    </div>
                )}

                {/* Vintage Filter — same clip/position as photo, rendered above it */}
                {frame.photo && (
                    <div
                        className="absolute z-30 overflow-hidden pointer-events-none"
                        style={{
                            ...config.style,
                            clipPath: config.clip,
                            opacity: 0.2,
                        }}
                    >
                        <img
                             src="/assets/PhotoVintage.webp"
                             alt="Vintage photo overlay"
                             className="w-full h-full object-cover pointer-events-none"
                             draggable={false}
                             loading="lazy"
                         />
                    </div>
                )}

                {/* Single + button — shown on hover always, for both add and replace */}
                <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={handlePlusClick}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full transition-all z-40 cursor-pointer opacity-0 group-hover:opacity-100"
                    style={{
                        background: 'rgba(144, 138, 135, 0.65)',
                        border: '1.5px solid rgba(255,255,255,0.25)',
                        backdropFilter: 'blur(4px)',
                    }}
                >
                    <Plus size={18} className="text-white" />
                </button>
            </div>

            {/* Resize handle — sibling of scaled div, NOT inside it, so it never scales */}
            <div
                onPointerDown={handleResizePointerDown}
                className="absolute w-4 h-4 z-50 rounded-full bg-black/30 border border-white/30 cursor-nwse-resize opacity-0 group-hover:opacity-60 transition-opacity pointer-events-auto hover:opacity-100"
                style={{
                    bottom: `-${handleOffset}px`,
                    right: `-${handleOffset}px`,
                    touchAction: 'none',
                }}
            >
                <svg width="8" height="8" viewBox="0 0 10 10" fill="none" className="m-auto mt-[3px]">
                    <path d="M1 9L9 1M6 9H9V6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
        </div>
    );
}