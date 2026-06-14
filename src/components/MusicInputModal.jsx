import React, { useState } from 'react';
import { X, Play } from 'lucide-react';
import MusicInput from './MusicInput';

export default function MusicInputModal({ onSelect, onClose }) {
    const [selectedTrack, setSelectedTrack] = useState({ id: null, title: '' });
    const [error, setError] = useState('');

    const handleMusicSelect = ({ videoId, title }) => {
        setSelectedTrack({ id: videoId, title });
        setError('');
    };

    const handleConfirm = () => {
        if (!selectedTrack.id) {
            setError('Please select a track first.');
            return;
        }
        onSelect({ youtubeId: selectedTrack.id, title: selectedTrack.title });
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm text-white p-6">
            <div className="max-w-md w-full space-y-8 bg-nos-dark/90 p-8 rounded-2xl border border-white/10 shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                >
                    <X size={20} className="text-white" />
                </button>

                <div className="text-center">
                    <h2 className="text-3xl font-light tracking-widest mb-2 font-serif">CHOOSE TRACK</h2>
                    <p className="text-gray-400 text-sm">Search or paste a YouTube link.</p>
                </div>

                <div className="space-y-6">
                    <MusicInput onSelect={handleMusicSelect} />

                    {error && <p className="text-red-400 text-sm text-center animate-pulse">{error}</p>}

                    <button
                        onClick={handleConfirm}
                        disabled={!selectedTrack.id}
                        className="w-full bg-white text-black font-bold py-4 rounded-full hover:bg-gray-200 transition-transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Play size={20} fill="currentColor" />
                        Load Track
                    </button>
                </div>
            </div>
        </div>
    );
}
