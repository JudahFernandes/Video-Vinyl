import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Check } from 'lucide-react';

const CLIP_SHAPES = {
    Frame_1: { type: 'rect',   aspectRatio: 16 / 9 },
    Frame_2: { type: 'oval',   aspectRatio: 0.9 },
    Frame_3: { type: 'circle', aspectRatio: 1 },
    Frame_4: { type: 'rect',   aspectRatio: 42 / 45 },
};

function getClipPath(type, w, h) {
    switch (type) {
        case 'circle': return `circle(${Math.min(w, h) / 2}px at ${w / 2}px ${h / 2}px)`;
        case 'oval':   return `ellipse(${w / 2.8}px ${h / 2}px at ${w / 2}px ${h / 2}px)`;
        default:       return 'none';
    }
}

export default function CropModal({ imageUrl, aspectRatio = 1, frameType, onConfirm, onCancel }) {
    const canvasRef    = useRef(null);
    const containerRef = useRef(null);
    const imageRef     = useRef(new Image());

    // Store pan/zoom in refs so event handlers always see latest values
    const stateRef = useRef({ imgPos: { x: 0, y: 0 }, zoom: 1, isDragging: false, dragStart: { x: 0, y: 0 } });

    const [cropWindow, setCropWindow] = useState({ width: 300, height: 300 });
    const cropWindowRef = useRef({ width: 300, height: 300 });

    // Trigger re-render for canvas redraw
    const [renderTick, setRenderTick] = useState(0);
    const forceRedraw = () => setRenderTick(t => t + 1);

    const shapeConfig = CLIP_SHAPES[frameType] || { type: 'rect', aspectRatio };
    const cropAspect  = shapeConfig.aspectRatio;

    useEffect(() => {
        const img = imageRef.current;
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            if (!containerRef.current) return;
            const containerWidth  = containerRef.current.clientWidth;
            const containerHeight = Math.min(window.innerHeight * 0.6, 500);

            let cw = containerWidth * 0.75;
            let ch = cw / cropAspect;
            if (ch > containerHeight * 0.8) {
                ch = containerHeight * 0.8;
                cw = ch * cropAspect;
            }

            const newCropWindow = { width: cw, height: ch };
            setCropWindow(newCropWindow);
            cropWindowRef.current = newCropWindow;

            const scaleX      = cw / img.width;
            const scaleY      = ch / img.height;
            const initialZoom = Math.max(scaleX, scaleY);

            stateRef.current.zoom = initialZoom;
            stateRef.current.imgPos = {
                x: (cw - img.width  * initialZoom) / 2,
                y: (ch - img.height * initialZoom) / 2,
            };
            forceRedraw();
        };
        img.src = imageUrl;
    }, [imageUrl, cropAspect]);

    const enforceBounds = (pos, currentZoom) => {
        const img          = imageRef.current;
        const scaledWidth  = img.width  * currentZoom;
        const scaledHeight = img.height * currentZoom;
        const cw           = cropWindowRef.current.width;
        const ch           = cropWindowRef.current.height;

        return {
            x: scaledWidth  >= cw ? Math.min(0, Math.max(cw - scaledWidth,  pos.x)) : pos.x,
            y: scaledHeight >= ch ? Math.min(0, Math.max(ch - scaledHeight, pos.y)) : pos.y,
        };
    };

    // Draw canvas using ref values (always fresh)
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx  = canvas.getContext('2d');
        const img  = imageRef.current;
        const { imgPos, zoom } = stateRef.current;
        const { width, height } = cropWindowRef.current;

        canvas.width  = width;
        canvas.height = height;
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, imgPos.x, imgPos.y, img.width * zoom, img.height * zoom);
    }, [renderTick, cropWindow]);

    const handlePointerDown = (e) => {
        e.preventDefault();
        const touch = e.touches ? e.touches[0] : e;
        stateRef.current.isDragging = true;
        stateRef.current.dragStart  = {
            x: touch.clientX - stateRef.current.imgPos.x,
            y: touch.clientY - stateRef.current.imgPos.y,
        };
    };

    const handlePointerMove = (e) => {
        e.preventDefault();
        if (!stateRef.current.isDragging) return;
        const touch = e.touches ? e.touches[0] : e;
        const newPos = {
            x: touch.clientX - stateRef.current.dragStart.x,
            y: touch.clientY - stateRef.current.dragStart.y,
        };
        stateRef.current.imgPos = enforceBounds(newPos, stateRef.current.zoom);
        forceRedraw();
    };

    const handlePointerUp = () => {
        stateRef.current.isDragging = false;
    };

    const handleWheel = (e) => {
        e.preventDefault();
        const img     = imageRef.current;
        const cw      = cropWindowRef.current.width;
        const ch      = cropWindowRef.current.height;
        const minZoom = Math.max(cw / img.width, ch / img.height);
        const newZoom = Math.max(minZoom, Math.min(
            stateRef.current.zoom * (1 - e.deltaY * 0.002),
            minZoom * 5
        ));

        const zoomDelta = newZoom / stateRef.current.zoom;
        const cx = cw / 2;
        const cy = ch / 2;

        const newPos = {
            x: cx - (cx - stateRef.current.imgPos.x) * zoomDelta,
            y: cy - (cy - stateRef.current.imgPos.y) * zoomDelta,
        };

        stateRef.current.zoom   = newZoom;
        stateRef.current.imgPos = enforceBounds(newPos, newZoom);
        forceRedraw();
    };

    const handleConfirm = () => {
        const img         = imageRef.current;
        const { imgPos, zoom } = stateRef.current;
        const exportScale = 2;
        const fw          = cropWindowRef.current.width  * exportScale;
        const fh          = cropWindowRef.current.height * exportScale;

        const finalCanvas = document.createElement('canvas');
        finalCanvas.width  = fw;
        finalCanvas.height = fh;
        const ctx = finalCanvas.getContext('2d');
        ctx.imageSmoothingQuality = 'high';

        ctx.beginPath();
        if (shapeConfig.type === 'circle') {
            ctx.arc(fw / 2, fh / 2, Math.min(fw, fh) / 2, 0, Math.PI * 2);
        } else if (shapeConfig.type === 'oval') {
            ctx.ellipse(fw / 2, fh / 2, fw / 2.8, fh / 2, 0, 0, Math.PI * 2);
        } else {
            ctx.rect(0, 0, fw, fh);
        }
        ctx.clip();

        ctx.drawImage(img, imgPos.x * exportScale, imgPos.y * exportScale,
            img.width * zoom * exportScale, img.height * zoom * exportScale);

        onConfirm(finalCanvas.toDataURL('image/png', 1.0));
    };

    const svgClip = getClipPath(shapeConfig.type, cropWindow.width, cropWindow.height);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm select-none">
            <div className="max-w-xl w-full bg-nos-dark p-6 rounded-2xl border border-white/10 shadow-2xl flex flex-col items-center">
                <div className="w-full flex justify-between items-center mb-6">
                    <h3 className="text-xl font-serif tracking-widest text-white">CROP PHOTO</h3>
                    <button onClick={onCancel} className="p-2 bg-white/5 rounded-full hover:bg-white/20 transition-colors">
                        <X size={20} className="text-white" />
                    </button>
                </div>

                <div ref={containerRef} className="w-full flex justify-center items-center bg-black/50 rounded-xl relative"
                    style={{ minHeight: '300px', padding: '24px 0' }}>

                    <div className="relative" style={{ width: cropWindow.width, height: cropWindow.height }}>

                        {/* Interactive crop canvas clipped to shape */}
                        <div
                            className="absolute inset-0 cursor-move touch-none overflow-hidden"
                            style={{ clipPath: svgClip !== 'none' ? svgClip : undefined,
                                     border: svgClip === 'none' ? '1px solid rgba(255,255,255,0.2)' : 'none' }}
                            onMouseDown={handlePointerDown}
                            onMouseMove={handlePointerMove}
                            onMouseUp={handlePointerUp}
                            onMouseLeave={handlePointerUp}
                            onTouchStart={handlePointerDown}
                            onTouchMove={handlePointerMove}
                            onTouchEnd={handlePointerUp}
                            onWheel={handleWheel}
                        >
                            <canvas ref={canvasRef} className="absolute top-0 left-0"
                                style={{ width: '100%', height: '100%' }} />

                            {/* Grid lines */}
                            <div className="absolute inset-0 pointer-events-none opacity-15 flex flex-col justify-evenly">
                                <div className="w-full h-px bg-white" />
                                <div className="w-full h-px bg-white" />
                            </div>
                            <div className="absolute inset-0 pointer-events-none opacity-15 flex justify-evenly">
                                <div className="h-full w-px bg-white" />
                                <div className="h-full w-px bg-white" />
                            </div>
                        </div>

                        {/* SVG dim mask outside shape */}
                        {svgClip !== 'none' && (
                            <svg className="absolute inset-0 pointer-events-none"
                                width={cropWindow.width} height={cropWindow.height}
                                style={{ overflow: 'visible' }}>
                                <defs>
                                    <mask id="crop-mask">
                                        <rect width={cropWindow.width} height={cropWindow.height} fill="white" />
                                        {shapeConfig.type === 'circle' && (
                                            <circle cx={cropWindow.width / 2} cy={cropWindow.height / 2}
                                                r={Math.min(cropWindow.width, cropWindow.height) / 2} fill="black" />
                                        )}
                                        {shapeConfig.type === 'oval' && (
                                            <ellipse cx={cropWindow.width / 2} cy={cropWindow.height / 2}
                                                rx={cropWindow.width / 2.8} ry={cropWindow.height / 2} fill="black" />
                                        )}
                                    </mask>
                                </defs>
                                <rect width={cropWindow.width} height={cropWindow.height}
                                    fill="rgba(0,0,0,0.65)" mask="url(#crop-mask)" />
                            </svg>
                        )}
                    </div>
                </div>

                <p className="w-full text-center mt-4 text-xs text-white/70">Scroll to zoom · Drag to pan</p>

                <div className="w-full flex gap-3 mt-6">
                    <button onClick={onCancel}
                        className="flex-1 py-3 text-white bg-white/10 rounded-full font-medium hover:bg-white/20 transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleConfirm}
                        className="flex-1 py-3 text-black bg-nos-accent rounded-full font-bold hover:brightness-110 flex items-center justify-center gap-2 transition-transform active:scale-95">
                        <Check size={18} /> Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}