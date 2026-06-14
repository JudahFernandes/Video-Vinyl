import React, { useRef, useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

// 6 slots in a 3-row × 2-column grid matching the shelf image
const SLOTS = [
    { row: 0, col: 0, offsetX: 0, offsetY: 9.5 },
    { row: 0, col: 1, offsetX: 0, offsetY: 9.5 },
    { row: 1, col: 0, offsetX: 0, offsetY: 4.8 },
    { row: 1, col: 1, offsetX: 0, offsetY: 4.8 },
    { row: 2, col: 0, offsetX: 0, offsetY: 0 },
    { row: 2, col: 1, offsetX: 0, offsetY: 0 },
];

// Percentages tuned to the VinylPlayerBox.png grid layout
const GRID = {
    padLeft: 8.5,
    padTop: 3,
    slotWidth: 35,
    slotHeight: 22,
    gapX: 13,
    gapY: 14.5,
};

export default function VinylBox({ queue = [], onSlotClick, hoveredSlotIndex, isOpen = true, onOpenChange }) {
    // ── Shelf height measurement ──────────────────────────────────────
    const shelfImgRef = useRef(null);
    const [shelfHeight, setShelfHeight] = useState(300);

    useEffect(() => {
        if (shelfImgRef.current) {
            setShelfHeight(shelfImgRef.current.offsetHeight);
        }
    }, []);

    const collapsedOffset = shelfHeight * 0.72;

    // ── Knob drag logic ───────────────────────────────────────────────
    const dragStartY = useRef(null);
    const dragStartOpen = useRef(null);

    const COLLAPSED_THRESHOLD = 60;
    const OPEN_THRESHOLD = 60;

    const handleKnobPointerMove = (e) => {
        const currentY = e.clientY ?? e.touches?.[0]?.clientY;
        const delta = currentY - dragStartY.current;
        if (dragStartOpen.current && delta > COLLAPSED_THRESHOLD) {
            onOpenChange?.(false);
        } else if (!dragStartOpen.current && delta < -OPEN_THRESHOLD) {
            onOpenChange?.(true);
        }
    };

    const handleKnobPointerUp = () => {
        window.removeEventListener('pointermove', handleKnobPointerMove);
        window.removeEventListener('pointerup', handleKnobPointerUp);
    };

    const handleKnobPointerDown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragStartY.current = e.clientY ?? e.touches?.[0]?.clientY;
        dragStartOpen.current = isOpen;
        window.addEventListener('pointermove', handleKnobPointerMove);
        window.addEventListener('pointerup', handleKnobPointerUp);
    };

    return (
        <div className="relative w-40 md:w-60 select-none">
            {/* Clip container — hides the sliding shelf below its boundary but leaves room at top for knob */}
            <div className="overflow-hidden relative pt-6">
                <motion.div
                    animate={{ y: isOpen ? 0 : collapsedOffset }}
                    transition={{ type: 'spring', stiffness: 300, damping: 35 }}
                    className="relative w-full"
                >
                    {/* Knob — sits at top of shelf, moves with it */}
                    <div
                        className="absolute left-1/2 -translate-x-1/2 -translate-y-1/4 -top-5 z-20 cursor-grab active:cursor-grabbing pointer-events-auto"
                        onPointerDown={handleKnobPointerDown}
                    >
                        <img
                            src="/assets/ShelfKnob.webp"
                            alt="Shelf Knob"
                            className="w-10 h-auto object-contain pointer-events-none"
                            draggable={false}
                            loading="lazy"
                        />
                    </div>

                    {/* Shelf background */}
                    <img
                        ref={shelfImgRef}
                        src="/assets/VinylPlayerBox.webp"
                        alt="Vinyl Shelf"
                        className="w-full h-auto object-contain drop-shadow-2xl pointer-events-none"
                        draggable={false}
                        loading="lazy"
                        onLoad={() => {
                            if (shelfImgRef.current) setShelfHeight(shelfImgRef.current.offsetHeight);
                        }}
                    />

                    {/* Slot overlays */}
                    {SLOTS.map((slot, i) => {
                        const left = GRID.padLeft + slot.col * (GRID.slotWidth + GRID.gapX) + slot.offsetX;
                        const top = GRID.padTop + slot.row * (GRID.slotHeight + GRID.gapY) + slot.offsetY;
                        const track = queue[i];
                        const isHovered = hoveredSlotIndex === i;

                        return (
                            <div
                                key={i}
                                id={`shelf-slot-${i}`}
                                className={clsx(
                                    "absolute flex items-center justify-center overflow-hidden transition-all duration-200",
                                    isHovered ? "ring-4 ring-white/50 bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.4)]" : "ring-0"
                                )}
                                style={{
                                    left: `${left}%`,
                                    top: `${top}%`,
                                    width: `${GRID.slotWidth}%`,
                                    height: `${GRID.slotHeight}%`,
                                }}
                            >
                                {track ? (
                                    /* Filled slot — show thumbnail with hover title */
                                    <div className="relative w-full h-full group">
                                        <img
                                            src={`https://img.youtube.com/vi/${track.youtubeId}/mqdefault.jpg`}
                                            alt="Track thumbnail"
                                            className="w-full h-full object-cover rounded-sm pointer-events-none transition-transform duration-500 group-hover:scale-105"
                                            draggable={false}
                                        />
                                        {/* Title Overlay */}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-1 pointer-events-none">
                                            <p className="text-[10px] text-white/90 leading-tight line-clamp-2 w-full font-sans tracking-tight">
                                                {track.title}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    /* Empty slot — clickable "+" */
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (onSlotClick) onSlotClick(i);
                                        }}
                                        className="w-full h-full flex items-center justify-center pointer-events-auto cursor-pointer group transition-all duration-200"
                                    >
                                        <Plus
                                            size={20}
                                            strokeWidth={1.5}
                                            className="text-white opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-200"
                                        />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </motion.div>
            </div>
        </div>
    );
}
