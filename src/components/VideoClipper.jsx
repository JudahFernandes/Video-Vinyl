import React, { useState, useRef, useEffect } from 'react';
import { Scissors, Play, Pause, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function VideoClipper({ videoFile, onClipSelected, onCancel }) {
    const [startTime, setStartTime] = useState(0);
    const [endTime, setEndTime] = useState(60);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [thumbnails, setThumbnails] = useState([]);
    const [isDragging, setIsDragging] = useState(null); // 'start' | 'end' | 'window' | null
    const [isGeneratingThumbs, setIsGeneratingThumbs] = useState(true);
    const [showBackButton, setShowBackButton] = useState(true);

    const backButtonTimerRef = useRef(null);

    const videoRef = useRef(null);
    const timelineRef = useRef(null);
    const dragStartRef = useRef({ x: 0, startTime: 0, endTime: 0 });

    useEffect(() => {
        if (videoRef.current && videoFile) {
            const videoUrl = URL.createObjectURL(videoFile);
            videoRef.current.src = videoUrl;

            return () => URL.revokeObjectURL(videoUrl);
        }
    }, [videoFile]);

    const handleLoadedMetadata = async () => {
        const videoDuration = videoRef.current.duration;
        setDuration(videoDuration);
        setEndTime(Math.min(60, videoDuration));

        // Generate thumbnails
        await generateThumbnails();
    };

    const generateThumbnails = async () => {
        setIsGeneratingThumbs(true);
        const video = videoRef.current;
        const thumbCount = 12; // Number of thumbnails to generate
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = 80;
        canvas.height = 60;

        const thumbs = [];

        for (let i = 0; i < thumbCount; i++) {
            const time = (video.duration / thumbCount) * i;

            // Seek to time
            video.currentTime = time;

            // Wait for seek to complete
            await new Promise(resolve => {
                video.onseeked = () => {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    thumbs.push(canvas.toDataURL('image/jpeg', 0.7));
                    resolve();
                };
            });
        }

        setThumbnails(thumbs);
        video.currentTime = 0;
        setIsGeneratingThumbs(false);
    };

    const handleTimeUpdate = () => {
        const current = videoRef.current.currentTime;
        setCurrentTime(current);

        // Loop within selected bounds for preview
        if (current >= endTime) {
            videoRef.current.currentTime = startTime;
        }
    };

    const handlePlayPause = () => {
        if (isPlaying) {
            videoRef.current.pause();
        } else {
            videoRef.current.currentTime = startTime;
            videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimelineClick = (e) => {
        if (!timelineRef.current || isDragging) return;

        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = x / rect.width;
        const clickedTime = percent * duration;

        // Seek video to clicked position
        videoRef.current.currentTime = clickedTime;
        setCurrentTime(clickedTime);
    };

    const handleMouseDown = (e, handle) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(handle);

        if (handle === 'window') {
            // Store initial drag position and times
            dragStartRef.current = {
                x: e.clientX,
                startTime,
                endTime
            };
        }

        const handleMouseMove = (moveEvent) => {
            if (!timelineRef.current) return;

            const rect = timelineRef.current.getBoundingClientRect();
            const x = moveEvent.clientX - rect.left;
            const percent = Math.max(0, Math.min(1, x / rect.width));
            const newTime = percent * duration;

            if (handle === 'start') {
                const maxStart = Math.min(endTime - 1, duration - 1);
                const constrainedStart = Math.max(0, Math.min(newTime, maxStart));
                setStartTime(constrainedStart);

                // Ensure selection doesn't exceed 60s
                if (endTime - constrainedStart > 60) {
                    setEndTime(constrainedStart + 60);
                }

                // Update preview to show start frame
                videoRef.current.currentTime = constrainedStart;
            } else if (handle === 'end') {
                const minEnd = startTime + 1;
                const maxEnd = Math.min(startTime + 60, duration);
                const constrainedEnd = Math.max(minEnd, Math.min(newTime, maxEnd));
                setEndTime(constrainedEnd);

                // Update preview to show end frame
                videoRef.current.currentTime = constrainedEnd;
            } else if (handle === 'window') {
                // Calculate delta from drag start
                const deltaX = moveEvent.clientX - dragStartRef.current.x;
                const deltaPercent = deltaX / rect.width;
                const deltaTime = deltaPercent * duration;

                const clipDuration = dragStartRef.current.endTime - dragStartRef.current.startTime;
                let newStart = dragStartRef.current.startTime + deltaTime;
                let newEnd = dragStartRef.current.endTime + deltaTime;

                // Constrain to video bounds
                if (newStart < 0) {
                    newStart = 0;
                    newEnd = clipDuration;
                }
                if (newEnd > duration) {
                    newEnd = duration;
                    newStart = duration - clipDuration;
                }

                setStartTime(newStart);
                setEndTime(newEnd);

                // Update preview to middle of selection
                videoRef.current.currentTime = (newStart + newEnd) / 2;
            }
        };

        const handleMouseUp = () => {
            setIsDragging(null);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    // Auto-hide back button effect
    useEffect(() => {
        const resetTimer = () => {
            setShowBackButton(true);
            if (backButtonTimerRef.current) clearTimeout(backButtonTimerRef.current);
            backButtonTimerRef.current = setTimeout(() => {
                setShowBackButton(false);
            }, 3000); // 3 seconds idle
        };

        const handleMouseMove = () => resetTimer();

        window.addEventListener('mousemove', handleMouseMove);
        resetTimer();

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (backButtonTimerRef.current) clearTimeout(backButtonTimerRef.current);
        };
    }, []);

    const handleConfirm = () => {
        onClipSelected({ startTime, endTime });
    };

    const clipDuration = endTime - startTime;
    const startPercent = (startTime / duration) * 100;
    const endPercent = (endTime / duration) * 100;
    const playheadPercent = ((currentTime - startTime) / (endTime - startTime)) * 100;

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm text-white p-4 md:p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-3xl w-full space-y-6 bg-nos-dark/95 p-6 md:p-8 rounded-2xl border border-white/10 shadow-2xl"
            >
                {/* Back Button */}
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: showBackButton ? 0.7 : 0 }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    onClick={onCancel}
                    className="absolute top-6 left-6 p-2 bg-black/20 rounded-full hover:bg-black/40 transition-colors z-50"
                >
                    <ArrowLeft size={24} className="text-white drop-shadow-md" />
                </motion.button>

                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2 text-nos-accent">
                        <Scissors size={24} />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-light tracking-widest font-serif">SELECT YOUR MEMORY</h2>
                    <p className="text-gray-400 text-sm">
                        Choose the 60-second moment you want to relive forever
                    </p>
                </div>

                {/* Video Preview */}
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                        ref={videoRef}
                        onLoadedMetadata={handleLoadedMetadata}
                        onTimeUpdate={handleTimeUpdate}
                        className="w-full h-full object-contain"
                        playsInline
                    />

                    {/* Play/Pause Overlay */}
                    <button
                        onClick={handlePlayPause}
                        className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors group"
                    >
                        {isPlaying ? (
                            <Pause size={56} className="text-white/90 group-hover:text-white drop-shadow-lg" fill="currentColor" />
                        ) : (
                            <Play size={56} className="text-white/90 group-hover:text-white drop-shadow-lg" fill="currentColor" />
                        )}
                    </button>

                    {/* Duration Badge */}
                    <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium">
                        <span className="text-nos-accent">{clipDuration.toFixed(1)}s</span>
                        <span className="text-gray-400"> / 60s</span>
                    </div>
                </div>

                {/* Timeline Section */}
                <div className="space-y-3">
                    <div className="text-xs text-gray-400 text-center">
                        {isGeneratingThumbs ? 'Generating preview...' : 'Drag handles or window to select your moment'}
                    </div>

                    {/* Timeline with Thumbnails */}
                    <div
                        ref={timelineRef}
                        className="relative h-16 md:h-20 rounded-lg overflow-hidden cursor-pointer select-none"
                        onClick={handleTimelineClick}
                    >
                        {/* Thumbnail Strip */}
                        <div className="absolute inset-0 flex">
                            {thumbnails.map((thumb, i) => (
                                <img
                                    key={i}
                                    src={thumb}
                                    alt={`Frame ${i}`}
                                    className="flex-1 h-full object-cover"
                                    draggable={false}
                                />
                            ))}
                        </div>

                        {/* Dimmed Overlay - Before Start */}
                        <div
                            className="absolute top-0 left-0 h-full bg-black/70 pointer-events-none"
                            style={{ width: `${startPercent}%` }}
                        />

                        {/* Dimmed Overlay - After End */}
                        <div
                            className="absolute top-0 right-0 h-full bg-black/70 pointer-events-none"
                            style={{ width: `${100 - endPercent}%` }}
                        />

                        {/* Selection Window */}
                        <div
                            className="absolute top-0 h-full border-2 border-nos-accent cursor-grab active:cursor-grabbing hover:bg-white/5 transition-colors"
                            style={{
                                left: `${startPercent}%`,
                                width: `${endPercent - startPercent}%`
                            }}
                            onMouseDown={(e) => handleMouseDown(e, 'window')}
                        >
                            {/* Playhead Indicator */}
                            {isPlaying && currentTime >= startTime && currentTime <= endTime && (
                                <div
                                    className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none"
                                    style={{ left: `${Math.max(0, Math.min(100, playheadPercent))}%` }}
                                />
                            )}
                        </div>

                        {/* Start Handle */}
                        <div
                            className="absolute top-0 bottom-0 w-1 bg-nos-accent cursor-ew-resize hover:w-1.5 transition-all z-10"
                            style={{ left: `${startPercent}%` }}
                            onMouseDown={(e) => handleMouseDown(e, 'start')}
                        >
                            <div className="absolute top-1/2 -translate-y-1/2 -left-2 w-4 h-8 bg-nos-accent rounded-full shadow-lg flex items-center justify-center">
                                <div className="w-0.5 h-4 bg-black/30 rounded-full" />
                            </div>
                        </div>

                        {/* End Handle */}
                        <div
                            className="absolute top-0 bottom-0 w-1 bg-nos-accent cursor-ew-resize hover:w-1.5 transition-all z-10"
                            style={{ left: `${endPercent}%` }}
                            onMouseDown={(e) => handleMouseDown(e, 'end')}
                        >
                            <div className="absolute top-1/2 -translate-y-1/2 -right-2 w-4 h-8 bg-nos-accent rounded-full shadow-lg flex items-center justify-center">
                                <div className="w-0.5 h-4 bg-black/30 rounded-full" />
                            </div>
                        </div>
                    </div>

                    {/* Time Labels */}
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>{formatTime(startTime)}</span>
                        <span>{formatTime(endTime)}</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 md:gap-4 pt-2">
                    <button
                        onClick={onCancel}
                        className="flex-1 bg-white/5 border border-white/10 text-white py-3 md:py-4 rounded-full hover:bg-white/10 transition-colors text-sm md:text-base"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isGeneratingThumbs}
                        className="flex-1 bg-nos-accent text-black font-bold py-3 md:py-4 rounded-full hover:bg-nos-accent/90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                    >
                        Use This Moment
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
