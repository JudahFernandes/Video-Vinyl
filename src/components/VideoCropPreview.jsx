import React, { useState, useRef } from 'react';

export default function VideoCropPreview({ videoUrl, onConfirm, onCancel }) {
  const [offsetY, setOffsetY] = useState(0); // only vertical pan needed
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const offsetStartY = useRef(0);

  // On metadata load — size the video to fill container width
  // For vertical videos this means height overflows, giving room to pan up/down
  // For landscape videos height fits naturally, no pan needed
  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const containerW = container.offsetWidth;
    const containerH = container.offsetHeight;
    const videoW = video.videoWidth;
    const videoH = video.videoHeight;

    // Calculate the scale that fills the container with no black bars
    const scale = Math.max(containerW / videoW, containerH / videoH);

    // Set video to exact pixel size so it fills/overflows the container
    video.style.width = `${videoW * scale}px`;
    video.style.height = `${videoH * scale}px`;

    // Reset pan to center
    setOffsetY(0);
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    isDragging.current = true;
    dragStartY.current = e.clientY;
    offsetStartY.current = offsetY;

    const onMove = (mv) => {
      if (!isDragging.current) return;
      const delta = mv.clientY - dragStartY.current;
      setOffsetY(offsetStartY.current + delta);
    };

    const onUp = () => {
      isDragging.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    // Scroll zooms — resize video imperatively
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const currentW = parseFloat(video.style.width) || container.offsetWidth;
    const currentH = parseFloat(video.style.height) || container.offsetHeight;
    const factor = e.deltaY < 0 ? 1.05 : 0.95;
    const newW = currentW * factor;
    const newH = currentH * factor;

    // Don't let it shrink below fill size
    const minScale = Math.max(
      container.offsetWidth / video.videoWidth,
      container.offsetHeight / video.videoHeight
    );
    const minW = video.videoWidth * minScale;
    const minH = video.videoHeight * minScale;

    video.style.width = `${Math.max(newW, minW)}px`;
    video.style.height = `${Math.max(newH, minH)}px`;
  };

  const handleConfirm = () => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const containerH = container.offsetHeight;
    const containerW = container.offsetWidth;

    // Store offset as percentage of container so TVDisplay can reproduce it
    onConfirm({
      xPct: 0,
      yPct: offsetY / containerH,
      widthPct: parseFloat(video.style.width) / containerW,
      heightPct: parseFloat(video.style.height) / containerH,
    });
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm text-white p-4 md:p-6">
      <div className="max-w-3xl w-full space-y-6 bg-nos-dark/95 p-6 md:p-8 rounded-2xl border border-white/10 shadow-2xl">
        
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-light tracking-widest font-serif">FRAME YOUR MEMORY</h2>
          <p className="text-gray-400 text-sm">Drag to reposition · Scroll to zoom</p>
        </div>

        {/* THE CROP WINDOW — this never moves, overflow hidden clips the video */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onWheel={handleWheel}
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '16/9',
            overflow: 'hidden',      // ← THIS is the crop. Container never moves.
            borderRadius: '8px',
            background: '#000',
            cursor: 'grab',
            userSelect: 'none',
          }}
        >
          <video
            ref={videoRef}
            src={videoUrl}
            autoPlay
            loop
            muted
            playsInline
            draggable={false}
            onLoadedMetadata={handleLoadedMetadata}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              // ONLY the video moves — translate applied here directly
              transform: `translate(-50%, calc(-50% + ${offsetY}px))`,
              objectFit: 'fill',       // fill the exact px dimensions set by handleLoadedMetadata
              pointerEvents: 'none',   // container receives all mouse events
              userSelect: 'none',
              display: 'block',
            }}
          />

          {/* Grid overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              zIndex: 10,
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)
              `,
              backgroundSize: '33.33% 33.33%',
            }}
          />
        </div>

        <div className="flex gap-3 md:gap-4 pt-2 w-full">
          <button
            onClick={onCancel}
            className="flex-1 bg-white/5 border border-white/10 text-white py-3 md:py-4 rounded-full hover:bg-white/10 transition-colors text-sm md:text-base"
          >
            Back
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 bg-nos-accent text-black font-bold py-3 md:py-4 rounded-full hover:bg-nos-accent/90 transition-all active:scale-95 text-sm md:text-base"
          >
            Use This Frame
          </button>
        </div>

      </div>
    </div>
  );
}
