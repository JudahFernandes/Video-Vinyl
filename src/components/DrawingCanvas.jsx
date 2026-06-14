import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

const DrawingCanvas = forwardRef(function DrawingCanvas({ isActive, color = '#DB8165', opacity = 0.5, brushSize = 6, eraserSize = 20, eraseMode = false, excludeRefs = [] }, ref) {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPos = useRef(null);
  const lastMidPoint = useRef(null);
  useImperativeHandle(ref, () => ({
    clear: () => {
      const canvas = canvasRef.current;
      if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    }
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.putImageData(imageData, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const getPos = (e) => {
      const clientX = e.clientX ?? e.touches?.[0]?.clientX;
      const clientY = e.clientY ?? e.touches?.[0]?.clientY;
      const rect = canvas.getBoundingClientRect();
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const isExcluded = (e) => {
      const clientX = e.clientX ?? e.touches?.[0]?.clientX;
      const clientY = e.clientY ?? e.touches?.[0]?.clientY;

      
      return (excludeRefs || []).some(r => {
        if (!r?.current) return false;

        const rect = r.current.getBoundingClientRect();
        console.log(r.current);
        const blockedRect = {
          left: rect.left + -60,
          top: rect.top + 0,
          right: rect.right - -30,
          bottom: rect.bottom + -80,
        };

        return (
          clientX >= blockedRect.left &&
          clientX <= blockedRect.right &&
          clientY >= blockedRect.top &&
          clientY <= blockedRect.bottom
        );
      });
    };

    const startDrawing = (e) => {
      if (!isActive || (!eraseMode && isExcluded(e))) return;
      isDrawing.current = true;
      lastPos.current = getPos(e);
    };

    const draw = (e) => {
      if (!isActive || !isDrawing.current) return;
      if (e.cancelable) e.preventDefault();

      // Pause rendering while pointer is inside an exclusion zone mid-stroke.
      // Reset anchors so the stroke restarts cleanly from wherever it exits.
      if (!eraseMode && isExcluded(e)) {
        lastPos.current = null;
        lastMidPoint.current = null;
        return;
      }

      // First move after re-entering from an exclusion zone — anchor here, draw next tick.
      if (!lastPos.current) {
        lastPos.current = getPos(e);
        return;
      }

      const pos = getPos(e);
      const midPoint = {
        x: (lastPos.current.x + pos.x) / 2,
        y: (lastPos.current.y + pos.y) / 2,
      };
      ctx.beginPath();
      ctx.moveTo(
        lastMidPoint.current ? lastMidPoint.current.x : lastPos.current.x,
        lastMidPoint.current ? lastMidPoint.current.y : lastPos.current.y
      );
      ctx.quadraticCurveTo(lastPos.current.x, lastPos.current.y, midPoint.x, midPoint.y);

      if (eraseMode) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
        ctx.globalAlpha = 1;
        ctx.lineWidth = eraserSize;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = color;
        ctx.globalAlpha = opacity;
        ctx.lineWidth = brushSize;
      }

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';

      lastMidPoint.current = midPoint;
      lastPos.current = pos;
    };

    const stopDrawing = () => {
      isDrawing.current = false;
      lastPos.current = null;
      lastMidPoint.current = null;
    };



    window.addEventListener('mousedown', startDrawing);
    window.addEventListener('mousemove', draw);
    window.addEventListener('mouseup', stopDrawing);
    window.addEventListener('touchstart', startDrawing);
    window.addEventListener('touchmove', draw, { passive: false });
    window.addEventListener('touchend', stopDrawing);

    return () => {
      window.removeEventListener('mousedown', startDrawing);
      window.removeEventListener('mousemove', draw);
      window.removeEventListener('mouseup', stopDrawing);
      window.removeEventListener('touchstart', startDrawing);
      window.removeEventListener('touchmove', draw);
      window.removeEventListener('touchend', stopDrawing);
    };
  }, [isActive, color, opacity, brushSize, eraserSize, eraseMode, excludeRefs]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: isActive ? 30 : 6,       // dynamic zIndex depending on active state
        pointerEvents: 'none',  // always none — window handles events
        cursor: 'none',
      }}
    />
  );
});

export default DrawingCanvas;
