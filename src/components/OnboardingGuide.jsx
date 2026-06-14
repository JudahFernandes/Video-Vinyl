import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const steps = [
  {
    id: 'tv-change',
    text: "Switch up the vibe — pick your video right here",
    highlight: { w: 40, h: 40, padX: 0, padY: 0, offsetX: 0, offsetY: -12 },
    arrowPath: "M 10 10 C 60 0 110 -30 160 -60",
    labelOffset: { x: -200, y: 20 },
    position: { left: '51%', top: '67%' },
    textAlign: 'right',
  },
  {
    id: 'tv-volume',
    text: "Crank it up or keep it cinematic and quiet",
    highlight: { w: 80, h: 80, padX: 0, padY: 0, offsetX: 0, offsetY: -10 },
    arrowPath: "M 10 10 C 20 -20 30 -60 20 -100",
    labelOffset: { x: -210, y: 30 },
    position: { left: '62%', top: '57%' },
    textAlign: 'right',
  },
  {
    id: 'vinyl-track',
    text: "Drop a track and let the record spin",
    highlight: { w: 150, h: 150, padX: 0, padY: 0, offsetX: 0, offsetY: 0 },
    arrowPath: "M 10 10 C -10 40 -20 80 -10 120",
    labelOffset: { x: 20, y: -20 },
    position: { left: '47%', top: '58%' },
    textAlign: 'left',
  },
  {
    id: 'vinyl-volume',
    text: "Dial in the perfect sound level here",
    highlight: { w: 60, h: 150, padX: 0, padY: 0, offsetX: 0, offsetY: -28 },
    arrowPath: "M 10 10 C 40 20 80 10 110 0",
    labelOffset: { x: -230, y: 0 },
    position: { left: '48%', top: '83%' },
    textAlign: 'right',
  },
  {
    id: 'vinyl-queue',
    text: "Queue up the night — add more tracks to the shelf",
    highlight: { w: 250, h: 250, padX: 0, padY: 0, offsetX: 0, offsetY: 15 },
    arrowPath: "M 10 10 C -30 -10 -70 -20 -110 -10",
    labelOffset: { x: 20, y: 0 },
    position: { left: '35%', top: '83%' },
    textAlign: 'left',
  },
  {
    id: 'shelf-tools',
    text: "Doodle freely with the Scrapper — made a mess? Polish erases it",
    highlight: { w: 250, h: 80, padX: 0, padY: 0, offsetX: 0, offsetY: -66 },
    arrowPath: "M 10 10 C 40 20 80 40 110 70",
    labelOffset: { x: -250, y: -20 },
    position: { left: '71%', top: '57%' },
    textAlign: 'right',
  },
  {
    id: 'shelf-frames',
    text: "Hang a memory — drag a frame onto the wall and make it yours",
    highlight: { w: 250, h: 160, padX: 0, padY: 0, offsetX: 0, offsetY: 50 },
    arrowPath: "M 10 10 C 30 -10 60 -30 90 -20",
    labelOffset: { x: -240, y: 20 },
    position: { left: '66%', top: '82%' },
    textAlign: 'right',
  },
];

const STORAGE_KEY = 'onboarding_complete_v1';
const PAD = 12; // spotlight padding around target element

export default function OnboardingGuide({ highlightRefs = {} }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [done, setDone] = useState(false);
  const [highlightRect, setHighlightRect] = useState(null);

  // Measure target on step change
  useEffect(() => {
    const step = steps[currentStep];
    const ref = highlightRefs[step.id];
    if (ref?.current) {
      const r = ref.current.getBoundingClientRect();
      const padX = step.highlight?.padX ?? PAD;
      const padY = step.highlight?.padY ?? PAD;
      const w = step.highlight?.w ?? r.width + padX * 2;
      const h = step.highlight?.h ?? r.height + padY * 2;
      const cx = r.left + r.width / 2;   // center of element
      const cy = r.top + r.height / 2;
      const offsetX = step.highlight?.offsetX ?? 0;
      const offsetY = step.highlight?.offsetY ?? 0;
      setHighlightRect({
        x: cx - w / 2 + offsetX,
        y: cy - h / 2 + offsetY,
        w,
        h,
      });
    } else {
      setHighlightRect(null);
    }
  }, [currentStep, highlightRefs, visible]);

  // Recalculate on resize
  useEffect(() => {
    const handleResize = () => {
      const step = steps[currentStep];
      const ref = highlightRefs[step.id];
      if (ref?.current) {
        const r = ref.current.getBoundingClientRect();
        const padX = step.highlight?.padX ?? PAD;
        const padY = step.highlight?.padY ?? PAD;
        const w = step.highlight?.w ?? r.width + padX * 2;
        const h = step.highlight?.h ?? r.height + padY * 2;
        const cx = r.left + r.width / 2;   // center of element
        const cy = r.top + r.height / 2;
        setHighlightRect({
          x: r.left - left + offsetX,
          y: r.top - top + offsetY,
          w: r.width + left + right,
          h: r.height + top + bottom,
        });
      }
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentStep, highlightRefs]);

  // Show on first visit
  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      const t = setTimeout(() => setVisible(true), 1800);
      return () => clearTimeout(t);
    } else {
      setDone(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      localStorage.setItem(STORAGE_KEY, 'true');
      setVisible(false);
      setTimeout(() => setDone(true), 600);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const handleSkip = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
    setTimeout(() => setDone(true), 600);
  };

  if (done) return null;

  const step = steps[currentStep];
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // SVG path: full-screen rect with a rounded-rect hole punched via evenodd
  const r = 8; // corner radius of spotlight hole
  const overlayPath = highlightRect
    ? `M 0 0 H ${vw} V ${vh} H 0 Z ` +
    `M ${highlightRect.x + r} ${highlightRect.y} ` +
    `H ${highlightRect.x + highlightRect.w - r} ` +
    `Q ${highlightRect.x + highlightRect.w} ${highlightRect.y} ${highlightRect.x + highlightRect.w} ${highlightRect.y + r} ` +
    `V ${highlightRect.y + highlightRect.h - r} ` +
    `Q ${highlightRect.x + highlightRect.w} ${highlightRect.y + highlightRect.h} ${highlightRect.x + highlightRect.w - r} ${highlightRect.y + highlightRect.h} ` +
    `H ${highlightRect.x + r} ` +
    `Q ${highlightRect.x} ${highlightRect.y + highlightRect.h} ${highlightRect.x} ${highlightRect.y + highlightRect.h - r} ` +
    `V ${highlightRect.y + r} ` +
    `Q ${highlightRect.x} ${highlightRect.y} ${highlightRect.x + r} ${highlightRect.y} Z`
    : `M 0 0 H ${vw} V ${vh} H 0 Z`;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="onboarding-root"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 60 }}
        >
          {/* SVG spotlight overlay — dark everywhere, clear hole over target */}
          <AnimatePresence mode="wait">
            <motion.svg
              key={step.id + '-overlay'}
              className="absolute inset-0 pointer-events-none"
              width={vw}
              height={vh}
              style={{ zIndex: 61, display: 'block' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              <motion.path
                d={overlayPath}
                fill="rgba(0,0,0,0.72)"
                fillRule="evenodd"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              />
              {/* Glowing accent border around the spotlight */}
              {highlightRect && (
                <motion.rect
                  x={highlightRect.x}
                  y={highlightRect.y}
                  width={highlightRect.w}
                  height={highlightRect.h}
                  rx={r}
                  ry={r}
                  fill="none"
                  stroke="#8C4834"
                  strokeWidth="1.5"
                  strokeOpacity="0.65"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                />
              )}
            </motion.svg>
          </AnimatePresence>

          {/* Full-screen click-to-advance */}
          <div
            className="absolute inset-0 pointer-events-auto"
            onClick={handleNext}
            style={{ zIndex: 62 }}
          />

          {/* Step counter — top left */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{
              position: 'absolute',
              top: '20px',
              left: '24px',
              zIndex: 63,
              fontFamily: 'system-ui, sans-serif',
              fontSize: '11px',
              color: 'rgba(255,255,255,0.30)',
              letterSpacing: '0.12em',
              pointerEvents: 'none',
            }}
          >
            {currentStep + 1} / {steps.length}
          </motion.div>

          {/* Back button — bottom left */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: currentStep > 0 ? 1 : 0 }}
            transition={{ delay: 0.3 }}
            onClick={(e) => { e.stopPropagation(); handleBack(); }}
            className="absolute pointer-events-auto transition-all"
            style={{
              zIndex: 63,
              bottom: '28px',
              left: '28px',
              fontFamily: 'system-ui, sans-serif',
              fontSize: '12px',
              color: 'rgba(255,255,255,0.85)',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.20)',
              borderRadius: '6px',
              padding: '6px 14px',
              cursor: currentStep > 0 ? 'pointer' : 'default',
              letterSpacing: '0.08em',
              backdropFilter: 'blur(4px)',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          >
            ← Back
          </motion.button>

          {/* Skip button — bottom right, #8C4834 */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            onClick={(e) => { e.stopPropagation(); handleSkip(); }}
            className="absolute pointer-events-auto transition-all"
            style={{
              zIndex: 63,
              bottom: '28px',
              right: '28px',
              fontFamily: 'system-ui, sans-serif',
              fontSize: '12px',
              color: 'rgba(255,255,255,0.95)',
              background: '#8C4834',
              border: '1px solid rgba(140,72,52,0.6)',
              borderRadius: '6px',
              padding: '6px 14px',
              cursor: 'pointer',
              letterSpacing: '0.08em',
              backdropFilter: 'blur(4px)',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#a0533c'}
            onMouseLeave={e => e.currentTarget.style.background = '#8C4834'}
          >
            Skip Tutorial
          </motion.button>

          {/* Per-step arrow + label */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.32 }}
              className="absolute pointer-events-none"
              style={{
                left: step.position.left,
                top: step.position.top,
                zIndex: 63,
              }}
            >
              {/* Clean SVG curved arrow — tail near label, tip at target */}
              <svg
                width="220"
                height="160"
                viewBox="0 0 220 160"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }}
              >
                <defs>
                  <marker
                    id={`arrow-${step.id}`}
                    markerWidth="8"
                    markerHeight="8"
                    refX="6"
                    refY="3"
                    orient="auto"
                  >
                    <path d="M 0 0 L 6 3 L 0 6 Z" fill="#8C4834" />
                  </marker>
                </defs>
                <motion.path
                  d={step.arrowPath}
                  stroke="#8C4834"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                  markerEnd={`url(#arrow-${step.id})`}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
                />
              </svg>

              {/* Text label — at the tail of the arrow */}
              <div
                style={{
                  position: 'absolute',
                  left: step.labelOffset.x,
                  top: step.labelOffset.y,
                  pointerEvents: 'none',
                  userSelect: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    fontSize: '13px',
                    lineHeight: '1.6',
                    color: 'rgba(255,255,255,0.92)',
                    maxWidth: '240px',
                    width: '240px',
                    textShadow: '0 1px 8px rgba(0,0,0,0.8)',
                    textAlign: step.textAlign ?? 'left',
                    background: 'rgba(0,0,0,0.30)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  {step.text}
                </div>

                {/* "click anywhere" hint — static, below label on every step */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  style={{
                    marginTop: '3px',
                    fontFamily: 'system-ui, sans-serif',
                    fontSize: '11px',
                    color: 'rgba(255,255,255,0.28)',
                    width: '240px',
                    textAlign: 'left',
                  }}
                >
                  click anywhere to continue
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
