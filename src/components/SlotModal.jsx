import React, { useState } from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import MusicInput from './MusicInput';

/**
 * Modal overlay for adding a song to a specific shelf slot.
 * Reuses MusicInput for YouTube search / URL paste.
 *
 * @param {number}   slotIndex  - Which slot (0–5) is being filled.
 * @param {function} onAdd      - Called with (slotIndex, trackData) on success.
 * @param {function} onClose    - Called when the user cancels.
 */
export default function SlotModal({ slotIndex, onAdd, onClose }) {
    const [selectedTrack, setSelectedTrack] = useState(null);
    const [error, setError] = useState('');

    const handleMusicSelect = ({ videoId, title }) => {
        // MusicInput calls onSelect with an object { videoId, title }.
        setSelectedTrack({ youtubeId: videoId, title });
        setError('');
    };

    const handleConfirm = () => {
        if (!selectedTrack) {
            setError('Please select a song first.');
            return;
        }
        onAdd(slotIndex, selectedTrack);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="max-w-md w-full bg-nos-dark/95 p-8 rounded-2xl border border-white/10 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar mx-4"
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                    aria-label="Close modal"
                >
                    <X size={22} />
                </button>

                <div className="text-center space-y-6">
                    <div>
                        <h2 className="text-2xl font-light tracking-widest font-serif">ADD TO SHELF</h2>
                        <p className="text-gray-500 text-xs mt-1 tracking-wide">Slot {slotIndex + 1} of 6</p>
                    </div>

                    {/* Reuse existing MusicInput */}
                    <MusicInput
                        onSelect={handleMusicSelect}
                        placeholder="Paste YouTube Link or Search..."
                    />

                    {error && <p className="text-red-400 text-sm animate-pulse">{error}</p>}

                    {/* Action buttons */}
                    <div className="flex flex-col items-center gap-3 pt-2">
                        <button
                            onClick={handleConfirm}
                            disabled={!selectedTrack}
                            className="w-full bg-white text-black font-bold py-3 rounded-full hover:bg-gray-200 transition-transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-sm tracking-wide"
                        >
                            Add to Queue
                        </button>
                        <button
                            onClick={onClose}
                            className="text-xs text-gray-500 hover:text-white tracking-widest uppercase transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
