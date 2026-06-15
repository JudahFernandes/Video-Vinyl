import React, { useState, useRef, useEffect } from 'react';
import TVDisplay from './components/TVDisplay';
import YouTubeAudio from './components/YouTubeAudio';
import VinylPlayer from './components/VinylPlayer';
import VideoInputModal from './components/VideoInputModal';
import MusicInputModal from './components/MusicInputModal';
import Tonearm from './components/Tonearm';
import VolumeKnob from './components/VolumeKnob';
import VinylVolumeKnob from './components/VinylVolumeKnob';
import VinylBox from './components/VinylBox';
import DropOverlay from './components/DropOverlay';
import SlotModal from './components/SlotModal';
import ShelfWithFrames from './components/ShelfWithFrames';
import DraggableFrame from './components/DraggableFrame';
import CropModal from './components/CropModal';
import DrawingCanvas from './components/DrawingCanvas';
import OnboardingGuide from './components/OnboardingGuide';
import clsx from 'clsx';
import { Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// No longer needed — cursor is a fixed DOM element, not a CSS data-URL cursor.

function App() {
  const [appState, setAppState] = useState('PLAYING');
  const [setupData, setSetupData] = useState({ videoUrl: '/assets/default_video.webm', youtubeId: null, title: null, cropData: null });
  const [clipBounds, setClipBounds] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(50);
  const [vinylVolume, setVinylVolume] = useState(50);
  const [isUserActive, setIsUserActive] = useState(true);

  const [showVideoInput, setShowVideoInput] = useState(false);
  const [showMusicInput, setShowMusicInput] = useState(false);
  const [introDuration, setIntroDuration] = useState(4000);

  // Photo Frames State
  const [placedFrames, setPlacedFrames] = useState([]);
  const [activeDragItem, setActiveDragItem] = useState(null); // { id, type, frameType, x, y, offsetX, offsetY }
  const [cropModalData, setCropModalData] = useState(null); // { frameId, imageUrl }

  // Shelf open/collapsed state
  const [isRightShelfOpen, setIsRightShelfOpen] = useState(true);
  const [isLeftShelfOpen, setIsLeftShelfOpen] = useState(true);
  const [activeTool, setActiveTool] = useState(null); // null | 'Polish' | 'Scrapper'

  const audioRef = useRef(null);
  const videoRef = useRef(null);
  const activityTimerRef = useRef(null);
  const drawingCanvasRef = useRef(null);

  // Refs for exclusion zones bounds check
  const tvContainerRef = useRef(null);
  const vinylPlatformRef = useRef(null);
  const shelfRef = useRef(null);

  // Refs for onboarding spotlight targets
  const tvChangeButtonRef = useRef(null);
  const tvVolumeKnobRef = useRef(null);
  const vinylPlayerRef = useRef(null);
  const vinylVolumeKnobRef = useRef(null);
  const vinylBoxRef = useRef(null);

  const dragHoldTimer = useRef(null);
  const pendingDragItem = useRef(null);
  const lastMousePos = useRef({ x: -200, y: -200 }); // tracks cursor pos for instant tool-cursor placement

  const handleAudioReady = (event) => {
    setDuration(event.target.getDuration());
    setIsPlaying(true);
    event.target.playVideo();
  };

  const handleProgress = (time) => setCurrentTime(time);

  const handleSeek = (time) => {
    const newTime = Math.max(0, Math.min(time, duration));
    setCurrentTime(newTime);
    if (audioRef.current) audioRef.current.seekTo(newTime);
  };

  const handleVolumeChange = (e) => {
    const newVol = Number(e.target.value);
    setVolume(newVol);
    if (videoRef.current) {
      if (videoRef.current.muted) {
        videoRef.current.muted = false; // only unmute if currently muted
      }
      videoRef.current.volume = newVol / 100;
    }
  };

  useEffect(() => {
    const resetTimer = () => {
      setIsUserActive(true);
      if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
      activityTimerRef.current = setTimeout(() => setIsUserActive(false), 3000);
    };
    const events = ['mousemove', 'mousedown', 'touchstart', 'keydown', 'click'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();
    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimer));
      if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
    };
  }, []);

  // Track last mouse position globally so cursor tool appears at correct spot immediately
  useEffect(() => {
    const updatePos = (e) => { lastMousePos.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('mousemove', updatePos);
    window.addEventListener('mousedown', updatePos);
    return () => {
      window.removeEventListener('mousemove', updatePos);
      window.removeEventListener('mousedown', updatePos);
    };
  }, []);

  // Custom cursor — fixed DOM <img> so it never disappears at viewport edges.
  // cursor: none is forced via a <style> tag; the image hotspot is aligned to
  // e.clientX / e.clientY (the same coords DrawingCanvas draws at) via transform.
  useEffect(() => {
    if (!activeTool) return;

    // Hide the native cursor globally.
    const styleTag = document.createElement('style');
    styleTag.id = 'tool-cursor-override';
    styleTag.textContent = 'html, body, * { cursor: none !important; }';
    document.head.appendChild(styleTag);

    // Build the DOM cursor image — initialize at last known mouse position.
    const cursorEl = document.createElement('img');
    cursorEl.src = `/assets/${activeTool}_cursor.png`;
    cursorEl.style.cssText = [
      'position: fixed',
      'pointer-events: none',
      'z-index: 99999',
      'width: 84px',
      'height: auto',
      // Initialize at last known mouse position (not off-screen).
      `top: ${lastMousePos.current.y}px`,
      `left: ${lastMousePos.current.x}px`,
      // Hotspot alignment:
      //   Scrapper → pen tip is bottom-left corner of the image → shift up by full height.
      //   Polish   → eraser center → shift image left+up by half its size.
      `transform: ${activeTool === 'Scrapper' ? 'translate(0%, -100%)' : 'translate(-50%, -50%)'}`,
    ].join(';');
    document.body.appendChild(cursorEl);

    const onMove = (e) => {
      cursorEl.style.left = e.clientX + 'px';
      cursorEl.style.top = e.clientY + 'px';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mousedown', onMove);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onMove);
      cursorEl.remove();
      styleTag.remove();
    };
  }, [activeTool]);

  // Escape key deselects active tool
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && activeTool) {
        setActiveTool(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTool]);

  const cancelPendingDrag = () => {
    if (dragHoldTimer.current) {
      clearTimeout(dragHoldTimer.current);
      dragHoldTimer.current = null;
    }
    pendingDragItem.current = null;
  };

  // Frame Drag & Drop Handlers
  useEffect(() => {
    const handlePointerMove = (e) => {
      const clientX = e.clientX ?? (e.touches && e.touches[0].clientX);
      const clientY = e.clientY ?? (e.touches && e.touches[0].clientY);
      if (clientX == null || clientY == null) return;

      if (pendingDragItem.current) {
        pendingDragItem.current.x = clientX;
        pendingDragItem.current.y = clientY;
      }

      if (!activeDragItem) return;

      setActiveDragItem(prev => ({
        ...prev,
        x: clientX,
        y: clientY
      }));
    };

    const isOverlappingExclusionZone = (centerX, centerY) => {
      const frameHalf = 100; // half of frame size (200px / 2)

      // All 4 corners of the frame
      const corners = [
        { x: centerX - frameHalf, y: centerY - frameHalf }, // top-left
        { x: centerX + frameHalf, y: centerY - frameHalf }, // top-right
        { x: centerX - frameHalf, y: centerY + frameHalf }, // bottom-left
        { x: centerX + frameHalf, y: centerY + frameHalf }, // bottom-right
        { x: centerX, y: centerY }, // center
      ];

      const isInsideRect = (ref, point) => {
        if (!ref.current) return false;
        const r = ref.current.getBoundingClientRect();
        return (
          point.x >= r.left &&
          point.x <= r.right &&
          point.y >= r.top &&
          point.y <= r.bottom
        );
      };

      // Reject if ANY corner overlaps TV or vinyl
      return corners.some(corner =>
        isInsideRect(tvContainerRef, corner) ||
        isInsideRect(vinylPlatformRef, corner)
      );
    };

    const handlePointerUp = (e) => {
      cancelPendingDrag(); // always cancel pending on release
      if (!activeDragItem) return;

      const { id, type, frameType, x, y, photo } = activeDragItem;
      const clientX = e.clientX ?? (e.changedTouches && e.changedTouches[0].clientX) ?? x;
      const clientY = e.clientY ?? (e.changedTouches && e.changedTouches[0].clientY) ?? y;

      const finalX = activeDragItem.x;
      const finalY = activeDragItem.y;

      // ── Check if dropped on shelf ──────────────────────────────
      const isOnShelf = (() => {
        if (!shelfRef.current) return false;
        const r = shelfRef.current.getBoundingClientRect();
        return finalX >= r.left && finalX <= r.right
          && finalY >= r.top && finalY <= r.bottom;
      })();

      if (isOnShelf) {
        if (activeDragItem.type === 'MOVE_EXISTING') {
          // Remove frame from canvas entirely — resets to empty in shelf
          setPlacedFrames(prev => prev.filter(f => f.id !== activeDragItem.id));
        }
        setActiveDragItem(null);
        return;
      }

      if (isOverlappingExclusionZone(finalX, finalY)) {
        // Snap back — for NEW_FROM_SHELF just cancel, for MOVE_EXISTING restore old position
        if (activeDragItem.type === 'MOVE_EXISTING') {
          setPlacedFrames(prev => prev.map(f =>
            f.id === activeDragItem.id
              ? { ...f, x: activeDragItem.originX, y: activeDragItem.originY }
              : f
          ));
        }
        setActiveDragItem(null);
        return;
      }

      if (type === 'NEW_FROM_SHELF') {
        const newFrame = {
          id: Math.random().toString(36).substring(7),
          frameType,
          x: finalX,
          y: finalY,
          scale: 1,
          photo: null
        };
        setPlacedFrames(prev => [...prev, newFrame]);
      } else if (type === 'MOVE_EXISTING') {
        setPlacedFrames(prev => prev.map(f =>
          f.id === id ? { ...f, x: finalX, y: finalY } : f
        ));
      }

      setActiveDragItem(null);
    };

    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchend', handlePointerUp);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });

    return () => {
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchend', handlePointerUp);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
    };
  }, [activeDragItem]);

  const handleDragStartFromShelf = (e, frameId) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isRightShelfOpen) return; // blocked when shelf is collapsed
    const clientX = e.clientX ?? (e.touches && e.touches[0].clientX);
    const clientY = e.clientY ?? (e.touches && e.touches[0].clientY);

    pendingDragItem.current = {
      type: 'NEW_FROM_SHELF',
      frameType: frameId,
      x: clientX,
      y: clientY,
      offsetX: 0,
      offsetY: 0
    };

    // Only activate drag after hold threshold
    dragHoldTimer.current = setTimeout(() => {
      setActiveDragItem(pendingDragItem.current);
      pendingDragItem.current = null;
    }, 150);
  };

  const handleDragStartFromCanvas = (e, frame) => {
    e.preventDefault();
    e.stopPropagation();

    const clientX = e.clientX ?? (e.touches && e.touches[0].clientX);
    const clientY = e.clientY ?? (e.touches && e.touches[0].clientY);

    pendingDragItem.current = {
      type: 'MOVE_EXISTING',
      id: frame.id,
      frameType: frame.frameType,
      photo: frame.photo,
      scale: frame.scale ?? 1,
      x: clientX,
      y: clientY,
      offsetX: 0,
      offsetY: 0,
      originX: frame.x,
      originY: frame.y,
    };

    dragHoldTimer.current = setTimeout(() => {
      setActiveDragItem(pendingDragItem.current);
      pendingDragItem.current = null;
    }, 150);
  };

  const handleOpenCropModal = (frameId, imageUrl, aspectRatio) => {
    setCropModalData({ frameId, imageUrl, aspectRatio });
  };

  const handleFrameResize = (frameId, newScale) => {
    setPlacedFrames(prev => prev.map(f =>
      f.id === frameId ? { ...f, scale: newScale } : f
    ));
  };

  const handleCropConfirm = (croppedDataUrl) => {
    setPlacedFrames(prev => prev.map(f =>
      f.id === cropModalData.frameId ? { ...f, photo: { src: croppedDataUrl } } : f
    ));
    setCropModalData(null);
  };

  useEffect(() => {
    if (appState === 'INTRO') {
      const timer = setTimeout(() => setAppState('PLAYING'), introDuration);
      return () => clearTimeout(timer);
    }
  }, [appState, introDuration]);

  const [isVinylDroppedOnBox, setIsVinylDroppedOnBox] = useState(false);
  const [queue, setQueue] = useState(Array(6).fill(null));
  const [activeSlotIndex, setActiveSlotIndex] = useState(null);
  const [hoveredSlotIndex, setHoveredSlotIndex] = useState(null);

  const handleSlotClick = (index) => {
    if (!isLeftShelfOpen) return; // blocked when shelf is collapsed
    setActiveSlotIndex(index);
  };
  const handleSlotAdd = (index, trackData) => {
    setQueue(prev => {
      const next = [...prev];
      next[index] = trackData;
      return next;
    });
    setActiveSlotIndex(null);
    // Bug 4 Fix: do NOT reset currentTime or seek(0) here — adding to shelf must not interrupt the playing track
  };
  const handleSlotModalClose = () => setActiveSlotIndex(null);
  const handleDragHover = (index) => setHoveredSlotIndex(index);

  const handleSwap = (index) => {
    if (!isLeftShelfOpen) return; // blocked when shelf is collapsed
    const shelfTrack = queue[index];
    if (!shelfTrack) { setHoveredSlotIndex(null); return; }
    if (!setupData.youtubeId) { setHoveredSlotIndex(null); return; }
    const currentTrack = { youtubeId: setupData.youtubeId, title: setupData.title };
    setQueue(prev => { const next = [...prev]; next[index] = currentTrack; return next; });
    setSetupData(prev => ({ ...prev, youtubeId: shelfTrack.youtubeId, title: shelfTrack.title }));
    setIsPlaying(true);
    setHoveredSlotIndex(null);
  };

  const hasQueuedTracks = queue.some(t => t !== null);

  const handleTrackEnd = () => {
    const nextIndex = queue.findIndex(t => t !== null);
    if (nextIndex === -1) return;
    const nextTrack = queue[nextIndex];
    setQueue(prev => { const next = [...prev]; next[nextIndex] = null; return next; });
    setSetupData(prev => ({ ...prev, youtubeId: nextTrack.youtubeId, title: nextTrack.title }));
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const togglePlay = () => setIsPlaying(!isPlaying);
  const handleVinylReset = () => setIsVinylDroppedOnBox(true);
  const handleChangeTrack = (youtubeId) => {
    setSetupData(prev => ({ ...prev, youtubeId }));
    setCurrentTime(0);
    setIsVinylDroppedOnBox(false);
    setIsPlaying(true);
  };

  const handleAddTrack = ({ youtubeId, title }) => {
    setSetupData(prev => ({ ...prev, youtubeId, title }));
    setCurrentTime(0);
    setIsPlaying(true);
    setShowMusicInput(false);
  };

  const handleChangeVideo = ({ videoUrl, clipBounds, cropData }) => {
    setSetupData(prev => ({ ...prev, videoUrl, cropData }));
    setClipBounds(clipBounds);
    setShowVideoInput(false);
    setAppState('PLAYING');
    // Unmute now that user has interacted
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.muted = false;
        videoRef.current.volume = volume / 100;
        videoRef.current.play().catch(() => { });
      }
    }, 100);
  };

  const showControls = isUserActive || !isPlaying;
  const isModalOpen = !!(showVideoInput || showMusicInput || activeSlotIndex !== null);
  const isToolActive = !!(activeTool);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-nos-dark font-sans text-white">
      {/* Noise Overlay */}
      <div className="noise-overlay z-50 pointer-events-none"></div>

      {/* Drawing Canvas — z-5 idle, z-30 when active (above UI); excludes shelf/TV/vinyl zones */}
      <DrawingCanvas
        ref={drawingCanvasRef}
        isActive={activeTool === 'Scrapper' || activeTool === 'Polish'}
        eraseMode={activeTool === 'Polish'}
        color="#8C4834"
        opacity={1}
        brushSize={1.5}
        eraserSize={20}
        excludeRefs={[tvContainerRef]}
      />

      {/* Interaction lock overlay — blocks all UI when a tool is active */}
      {activeTool && (
        <div
          className="absolute inset-0 pointer-events-auto"
          style={{ zIndex: 28 }}
          onPointerDown={(e) => {
            e.currentTarget.dataset.startX = e.clientX.toString();
            e.currentTarget.dataset.startY = e.clientY.toString();
          }}
          onPointerUp={(e) => {
            const startX = parseFloat(e.currentTarget.dataset.startX || '0');
            const startY = parseFloat(e.currentTarget.dataset.startY || '0');
            const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
            if (dist < 5) {
              setActiveTool(null);
            }
          }}
        />
      )}

      {/* TV Display — z-0, pointer-events-none on wrapper so UI layer isn't blocked.
          The knob inside TVDisplay has z-50 + pointerEvents:'all' to stay clickable. */}
      {setupData?.videoUrl && (
        <div
          className={clsx(
            "absolute inset-0 z-0 flex items-center justify-center transition-opacity duration-1000 p-20",
            isVinylDroppedOnBox ? "blur-sm scale-105" : "",
            appState === "INTRO" ? "opacity-0" : "opacity-100",
            "pointer-events-none"
          )}
        >
          <div className="flex items-center justify-center w-full h-full max-w-4xl max-h-[80%] rounded-lg pointer-events-none">
            <div ref={tvContainerRef} className="pointer-events-none">
              <TVDisplay
                src={setupData.videoUrl}
                clipBounds={clipBounds}
                cropData={setupData.cropData}
                videoRef={videoRef}
                volume={volume}
                onVolumeChange={handleVolumeChange}
              />
            </div>
          </div>
        </div>
      )}

      {/* Render Placed Frames Layer (Z-index above background, below modals) */}
      {/* Placed Frames Layer — must sit below shelf z-index */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 15,
          opacity: isModalOpen ? 0.15 : isToolActive ? 0.4 : 1,
          filter: isModalOpen ? 'blur(4px)' : 'none',
        }}
      >
        <AnimatePresence>
          {placedFrames.map((frame, index) => (
            // Hide the originally placed item while it's being actively dragged
            activeDragItem?.id === frame.id ? null : (
              <DraggableFrame
                key={frame.id}
                frame={frame}
                zIndex={16 + index}
                onDragStart={handleDragStartFromCanvas}
                onOpenCrop={handleOpenCropModal}
                onResize={handleFrameResize}
              />
            )
          ))}
        </AnimatePresence>
      </div>

      {/* Dark Background for Intro */}
      <div className={clsx(
        "absolute inset-0 bg-nos-dark pointer-events-none transition-opacity duration-2000 z-0",
        appState === 'PLAYING' ? "opacity-0" : "opacity-100"
      )}></div>

      {/* Audio Layer */}
      {setupData?.youtubeId && (
        <YouTubeAudio
          ref={audioRef}
          videoId={setupData.youtubeId}
          isPlaying={isPlaying}
          loop={!hasQueuedTracks}
          volume={vinylVolume}
          onReady={handleAudioReady}
          onProgress={handleProgress}
          onEnd={handleTrackEnd}
        />
      )}



      {/* UI Layer — z-10, but knob is z-50 inside TVDisplay so it renders above this */}
      <div className="relative z-10 w-full h-full">

        {/* Volume Knob — right side of TV frame */}
        {appState === 'PLAYING' && setupData?.videoUrl && (
          <>
            <div
              ref={tvVolumeKnobRef}
              className={`absolute z-20 transition-opacity duration-500 ${activeTool ? 'pointer-events-none opacity-40' : 'pointer-events-auto opacity-100'}`}
              style={{
                top: '50%',
                left: 'calc(50% + 160px)',
                transform: 'translateY(-127%)',
              }}
            >
              <VolumeKnob volume={volume} onChange={handleVolumeChange} />
            </div>

            <div
              ref={tvChangeButtonRef}
              className={`absolute z-20 cursor-pointer group ${activeTool ? 'pointer-events-none opacity-40' : 'pointer-events-auto opacity-100'}`}
              onClick={() => !activeTool && setShowVideoInput(true)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); !activeTool && setShowVideoInput(true); } }}
              role="button"
              tabIndex={0}
              aria-label="Change video"
              style={{
                top: '50%',
                left: 'calc(50% + 175px)',
                transform: 'translateY(90%)',
              }}
            >
              <div className="flex flex-col items-center gap-2">
                <img src="/assets/TV_Button.webp" alt="Change Video" className="w-8 h-8 object-contain drop-shadow-lg" />
                <span className="text-[10px] text-white/70 font-serif tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity select-none">
                  Change
                </span>
              </div>
            </div>
          </>
        )}

        <AnimatePresence>
          {isVinylDroppedOnBox && (
            <DropOverlay
              onClose={() => setIsVinylDroppedOnBox(false)}
              onStart={handleChangeTrack}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {activeSlotIndex !== null && (
            <SlotModal
              slotIndex={activeSlotIndex}
              onAdd={handleSlotAdd}
              onClose={handleSlotModalClose}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showVideoInput && (
            <VideoInputModal onSelect={handleChangeVideo} onClose={() => setShowVideoInput(false)} />
          )}
          {showMusicInput && (
            <MusicInputModal onSelect={handleAddTrack} onClose={() => setShowMusicInput(false)} />
          )}
          {cropModalData && (
            <CropModal
              imageUrl={cropModalData.imageUrl}
              aspectRatio={cropModalData.aspectRatio}
              frameType={cropModalData.frameId ?
                placedFrames.find(f => f.id === cropModalData.frameId)?.frameType
                : undefined}
              onConfirm={handleCropConfirm}
              onCancel={() => setCropModalData(null)}
            />
          )}
        </AnimatePresence>

        <div className="absolute inset-0 pointer-events-none">

          <AnimatePresence>
            {appState === 'INTRO' && (
              <motion.div
                key="intro-vinyl"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-auto"
              >
                <div className="scale-150">
                  <VinylPlayer
                    isPlaying={isPlaying} currentTime={currentTime}
                    duration={duration} youtubeId={setupData?.youtubeId} onSeek={handleSeek}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {appState === 'PLAYING' && (
              <motion.div
                key="playing-scene"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ duration: 2, delay: 0.5 }}
                className="absolute inset-0 pointer-events-none"
              >
                <motion.div
                  animate={{ opacity: showControls ? 1 : 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute select-none pointer-events-none"
                  style={{ left: '10px', top: '20px' }}
                >
                  <span className="font-brittany text-lg text-white/80 tracking-wide drop-shadow-md block">
                    {setupData?.title || 'No Track Playing'}
                  </span>
                  <span className="font-brittany text-sm text-white/70 tracking-wide mt-0.5 block">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </motion.div>

                <div
                  className="absolute pointer-events-auto"
                  style={{ bottom: 0, left: '50%', transform: 'translateX(-50%)' }}
                >
                  <div
                    className={`flex items-end justify-center gap-50 pb-4 transition-opacity duration-300 ${activeTool ? 'opacity-40' : 'opacity-100'}`}
                  >

                    <motion.div
                      id="vinyl-box-target"
                      ref={vinylBoxRef}
                      animate={{ opacity: showControls ? 1 : 0 }}
                      transition={{ duration: 0.5 }}
                      className={`relative flex-shrink-0 self-end ${activeTool ? 'pointer-events-none' : 'pointer-events-auto'}`}
                      style={{ zIndex: activeTool ? 20 : 35 }}
                    >
                      <VinylBox queue={queue} onSlotClick={handleSlotClick} hoveredSlotIndex={hoveredSlotIndex} isOpen={isLeftShelfOpen} onOpenChange={setIsLeftShelfOpen} />
                    </motion.div>

                    <div
                      className={`relative flex flex-col items-center flex-shrink-0 ${activeTool ? 'pointer-events-none' : 'pointer-events-auto'}`}
                      ref={vinylPlatformRef}
                      style={{ zIndex: activeTool ? 20 : 35 }}
                    >
                      <div className="relative flex items-center justify-center">
                        <div ref={vinylPlayerRef} className="relative z-10 translate-y-34 -translate-x-10">
                          <VinylPlayer
                            isPlaying={isPlaying} currentTime={currentTime}
                            duration={duration} youtubeId={setupData?.youtubeId}
                            onSeek={handleSeek} onSeekEnd={() => { }}
                            onReset={handleVinylReset} onHoverSlot={handleDragHover} onSwap={handleSwap}
                            onAddTrack={() => setShowMusicInput(true)}
                          />
                        </div>
                        <div className="absolute z-20 pointer-events-auto" style={{ top: '20px', right: '-45px' }}>
                          <Tonearm isPlaying={isPlaying} onTogglePlay={togglePlay} />
                        </div>
                      </div>
                      <div className="relative z-0 -mt-6 select-none">
                        <img src="/assets/VinylPlatform.webp" alt="Vinyl Platform"
                          className="w-75 h-auto object-contain drop-shadow-2xl pointer-events-none" draggable={false} />

                        <div ref={vinylVolumeKnobRef} className="absolute z-20 pointer-events-auto" style={{ bottom: '-15px', right: '-3px', }}>
                          <VinylVolumeKnob volume={vinylVolume} onChange={setVinylVolume} />
                        </div>
                      </div>
                    </div>

                    <motion.div
                      animate={{ opacity: showControls ? 1 : 0 }}
                      transition={{ duration: 0.5 }}
                      className="relative flex-shrink-0 self-end pointer-events-auto select-none"
                      style={{ zIndex: 35 }}
                    >
                      <ShelfWithFrames
                        ref={shelfRef}
                        onDragStart={handleDragStartFromShelf}
                        placedFrames={placedFrames}
                        activeDragItem={activeDragItem}
                        isOpen={isRightShelfOpen}
                        onOpenChange={setIsRightShelfOpen}
                        activeTool={activeTool}
                        onToolSelect={setActiveTool}
                      />
                    </motion.div>

                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Ghost Item during Drag (Top Z-Index) */}
      {activeDragItem && (
        <div
          className="absolute pointer-events-none z-[100] opacity-80"
          style={{
            left: activeDragItem.x,
            top: activeDragItem.y,
            width: 140, height: 140,
            transform: `translate(-50%, -50%) scale(${activeDragItem.scale ?? 1})`,
            transformOrigin: 'center center',
          }}
        >
          {/* Photo ABOVE frame — z-20, clipped to shape */}
          {activeDragItem.photo && (() => {
            const configs = {
              Frame_1: { clip: 'inset(0% 0% 0% 0% round 4px)', style: { top: '21%', left: '10%', width: '80%', height: '58%' } },
              Frame_2: { clip: 'ellipse(38% 50% at 50% 50%)', style: { top: '13%', left: '12%', width: '76%', height: '74%' } },
              Frame_3: { clip: 'circle(50% at 50% 50%)', style: { top: '10%', left: '15%', width: '72%', height: '78%' } },
              Frame_4: { clip: 'inset(0% 0% 0% 0% round 4px)', style: { top: '12%', left: '16%', width: '68%', height: '76%' } },
            };
            const config = configs[activeDragItem.frameType] || configs.Frame_4;
            return (
              <>
                <div
                  className="absolute z-20 overflow-hidden pointer-events-none"
                  style={{ ...config.style, clipPath: config.clip }}
                >
                  <img
                    src={activeDragItem.photo.src}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                </div>
                {/* Vintage overlay on ghost */}
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
                  />
                </div>
              </>
            );
          })()}
          {/* Frame BELOW photo — z-10 */}
          <img
            src={`/assets/${activeDragItem.frameType}.webp`}
            alt="Dragged photo frame"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10 drop-shadow-2xl"
            draggable={false}
          />
        </div>
      )}

      {/* Onboarding — renders above everything on first visit */}
      <OnboardingGuide
        highlightRefs={{
          'tv-change': tvChangeButtonRef,
          'tv-volume': tvVolumeKnobRef,
          'vinyl-track': vinylPlayerRef,
          'vinyl-volume': vinylVolumeKnobRef,
          'vinyl-queue': vinylBoxRef,
          'shelf-tools': shelfRef,
          'shelf-frames': shelfRef,
        }}
      />

    </div>
  );
}

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export default App;
