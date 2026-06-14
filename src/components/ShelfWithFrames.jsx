import React, { forwardRef, useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ShelfWithFrames = forwardRef(function ShelfWithFrames(
    { onDragStart, placedFrames = [], activeDragItem, isOpen = true, onOpenChange, activeTool = null, onToolSelect }, ref
) {
    const frames = [
        { id: 'Frame_1', src: '/assets/Frame_1.webp' },
        { id: 'Frame_2', src: '/assets/Frame_2.webp' },
        { id: 'Frame_3', src: '/assets/Frame_3.webp' },
        { id: 'Frame_4', src: '/assets/Frame_4.webp' }
    ];

    const slotPositions = [
        { left: '13%', top: '37%', width: '25%' },
        { left: '59%', top: '37%', width: '25%' },
        { left: '13%', top: '69%', width: '25%' },
        { left: '59%', top: '69%', width: '25%' },
    ];

    // Which frame IDs are currently placed on the canvas
    const usedFrameIds = [
        ...placedFrames.map(f => f.frameType),
        activeDragItem?.type === 'NEW_FROM_SHELF' ? activeDragItem.frameType : null
    ].filter(Boolean);

    const handlePointerDown = (e, frameId) => {
        e.preventDefault();
        e.stopPropagation();
        if (onDragStart) onDragStart(e, frameId);
    };

    const isDraggingExisting = activeDragItem?.type === 'MOVE_EXISTING';

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
        <div
            ref={ref}
            className={`relative w-40 md:w-60 self-end pointer-events-auto select-none transition-all duration-200 z-[25] ${isDraggingExisting ? 'brightness-125 drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]' : ''}`}
            style={{ position: 'relative', zIndex: 25 }}
            onClick={() => {
                if (activeTool) onToolSelect?.(null);
            }}
        >
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

                    <img
                        ref={shelfImgRef}
                        src="/assets/Shelf.webp"
                        alt="Decorative Shelf"
                        className="w-full h-auto object-contain pointer-events-none"
                        draggable={false}
                        loading="lazy"
                        onLoad={() => {
                            if (shelfImgRef.current) setShelfHeight(shelfImgRef.current.offsetHeight);
                        }}
                    />

                    {/* Tool Slots — top two positions (Scrapper left, Polish right) */}
                    {[
                        { id: 'Scrapper', position: { left: '8%',  top: '2%', width: '38%' } },
                        { id: 'Polish',   position: { left: '48%', top: '2%', width: '38%' } },
                    ].map(tool => (
                        <div
                            key={tool.id}
                            className={`absolute flex items-center justify-center pointer-events-auto cursor-pointer rounded-lg group transition-transform duration-150 ${activeTool !== tool.id ? 'hover:scale-110' : ''}`}
                            style={{
                                left: tool.position.left,
                                top: tool.position.top,
                                width: tool.position.width,
                                aspectRatio: '1 / 1',
                                minWidth: '32px',
                                minHeight: '32px',
                                borderRadius: '10px',
                                transformOrigin: 'center',
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onToolSelect?.(activeTool === tool.id ? null : tool.id);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onToolSelect?.(activeTool === tool.id ? null : tool.id);
                                }
                            }}
                            role="button"
                            tabIndex={0}
                            aria-label={`${tool.id} tool${activeTool === tool.id ? ' (active)' : ''}`}
                        >
                            <AnimatePresence>
                                {activeTool !== tool.id && (
                                    <motion.img
                                        key="tool-img"
                                        initial={{ opacity: 0, scale: 0.6 }}
                                        animate={{ opacity: 0.8, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        whileHover={{ opacity: 1, scale: 1.05 }}
                                        transition={{ duration: 0.2, type: 'spring', bounce: 0.3 }}
                                        src={`/assets/${tool.id}.webp`}
                                        alt={tool.id}
                                        className="w-full h-full object-contain pointer-events-none"
                                        draggable={false}
                                    />
                                )}
                            </AnimatePresence>
                        </div>
                    ))}


                    {frames.map((frame, index) => {
                        const slot = slotPositions[index];
                        const isUsed = usedFrameIds.includes(frame.id);

                        return (
                            <AnimatePresence key={frame.id}>
                                {!isUsed && (
                                    <motion.div
                                        className="absolute flex items-center justify-center pointer-events-auto cursor-grab active:cursor-grabbing"
                                        style={{
                                            left: slot.left,
                                            top: slot.top,
                                            width: slot.width,
                                            aspectRatio: '1 / 1',
                                        }}
                                        initial={{ opacity: 0, scale: 0.6 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        transition={{ duration: 0.25, type: 'spring', bounce: 0.3 }}
                                        whileHover={{ scale: 1.08, filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.4))' }}
                                        whileTap={{ scale: 0.95 }}
                                        onPointerDown={(e) => handlePointerDown(e, frame.id)}
                                    >
                                        <img
                                            src={frame.src}
                                            alt={`Frame ${index + 1}`}
                                            className="w-full h-full object-contain pointer-events-none"
                                            draggable={false}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        );
                    })}
                </motion.div>
            </div>
        </div>
    );
});

export default ShelfWithFrames;