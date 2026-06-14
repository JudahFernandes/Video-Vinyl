import React from 'react';
import { X } from 'lucide-react';
import MusicInput from './MusicInput';

export default function DropOverlay({ onClose, onStart }) {

    // Wrapper to close overlay after selection
    const handleSelect = (videoId) => {
        onStart(videoId);
        onClose(); // Optional: App.jsx might handle this, but safe to ensure close here if logic differs
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md text-white p-6 animate-in fade-in duration-300">
            <div className="max-w-md w-full bg-nos-dark/90 p-8 rounded-2xl border border-white/10 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                    aria-label="Close overlay"
                >
                    <X size={24} />
                </button>

                <div className="text-center space-y-6">
                    <h2 className="text-3xl font-light tracking-widest font-serif">CHANGE RECORD</h2>
                    <p className="text-gray-400 text-sm">Select a new track to spin.</p>

                    <MusicInput
                        onSelect={handleSelect}
                        placeholder="Paste YouTube Link or Search..."
                    />

                    <div className="pt-2">
                        <button
                            onClick={onClose}
                            className="text-xs text-gray-500 hover:text-white tracking-widest uppercase transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
