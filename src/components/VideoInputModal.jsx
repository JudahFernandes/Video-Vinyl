import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';
import clsx from 'clsx';
import VideoClipper from './VideoClipper';

export default function VideoInputModal({ onSelect, onClose }) {
    const [videoFile, setVideoFile] = useState(null);
    const [showClipper, setShowClipper] = useState(false);
    const [videoDuration, setVideoDuration] = useState(0);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setError('');
            const videoUrl = URL.createObjectURL(file);
            const video = document.createElement('video');
            video.preload = 'metadata';

            video.onloadedmetadata = () => {
                URL.revokeObjectURL(videoUrl);
                setVideoDuration(video.duration);
                setVideoFile(file);
                setShowClipper(true);
            };

            video.src = videoUrl;
        }
    };

    const handleClipSelected = (clipBounds) => {
        const videoUrl = URL.createObjectURL(videoFile);
        onSelect({ videoUrl, clipBounds });
    };

    const handleCancelClip = () => {
        setShowClipper(false);
        setVideoFile(null);
        setVideoDuration(0);
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm text-white p-6">
            {!showClipper ? (
                <div className="max-w-md w-full space-y-8 bg-nos-dark/90 p-8 rounded-2xl border border-white/10 shadow-2xl relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                    >
                        <X size={20} className="text-white" />
                    </button>

                    <div className="text-center">
                        <h2 className="text-3xl font-light tracking-widest mb-2 font-serif">CHANGE MEMORY</h2>
                        <p className="text-gray-400 text-sm">Upload a new video loop.</p>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                                <Upload size={16} /> Memory (Video Loop)
                            </label>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept="video/mp4,video/webm"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="video-upload"
                                />
                                <label
                                    htmlFor="video-upload"
                                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors border-white/20 hover:border-white/40 hover:bg-white/5"
                                >
                                    <span className="text-gray-400 text-sm">Click to upload Video</span>
                                    <span className="text-xs text-gray-600 mt-1">MP4 or WebM (Max 60s)</span>
                                </label>
                            </div>
                        </div>

                        {error && <p className="text-red-400 text-sm text-center animate-pulse">{error}</p>}
                    </div>
                </div>
            ) : (
                <VideoClipper
                    videoFile={videoFile}
                    onClipSelected={handleClipSelected}
                    onCancel={handleCancelClip}
                />
            )}
        </div>
    );
}
