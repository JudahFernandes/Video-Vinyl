import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Music } from 'lucide-react';
import { handleMusicInput } from '../utils/musicUtils';

/**
 * Shared Music Input Component
 * Handles URL parsing and YouTube Search with live suggestions.
 * 
 * @param {Object} props
 * @param {function} props.onSelect - Callback with the selected track object ({ videoId, title }).
 * @param {string} [props.placeholder] - Custom placeholder.
 */
export default function MusicInput({
    onSelect,
    placeholder = "Search for a song or paste a YouTube link"
}) {
    const [input, setInput] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const debounceTimerRef = useRef(null);
    const inputRef = useRef(null);
    const isSelectionRef = useRef(false); // Track if current input is a selection

    // Debounced search on input change
    useEffect(() => {
        // Clear previous timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Don't search if this is a confirmed selection
        if (isSelectionRef.current) {
            return;
        }

        // Clear results and error if input is empty
        if (!input.trim()) {
            setSearchResults([]);
            setError('');
            setIsLoading(false);
            return;
        }

        // Set loading state
        setIsLoading(true);
        setError('');

        // Debounce search by 500ms
        debounceTimerRef.current = setTimeout(async () => {
            try {
                const result = await handleMusicInput(input);
                console.log('Search Result:', result);

                if (result.type === 'search') {
                    if (result.error) {
                        // API returned an error
                        setError(result.error);
                        setSearchResults([]);
                    } else if (result.results && result.results.length > 0) {
                        setSearchResults(result.results);
                        setError('');
                    } else {
                        // No results found
                        setError('No videos found. Try a different search.');
                        setSearchResults([]);
                    }
                } else if (result.type === 'video') {
                    // It's a direct URL, don't search
                    setSearchResults([]);
                    setError('');
                    // If it's a direct URL, we might want to treat it as a selection too?
                    // But for now, just clearing results is enough.
                    onSelect({ videoId: result.value, title: trimmedInput }); // Auto-select implementation for direct ID
                }

            } catch (err) {
                console.error('Search error:', err);
                setError('Search failed. Please try again.');
                setSearchResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 500);

        // Cleanup on unmount
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [input, onSelect]);

    const handleInputChange = useCallback((e) => {
        isSelectionRef.current = false; // User is typing, not a selection
        setInput(e.target.value);
    }, []);

    const handleResultClick = useCallback((video) => {
        isSelectionRef.current = true; // Mark as selection to prevent search
        setInput(video.title);
        setSearchResults([]);
        setError('');
        onSelect({ videoId: video.videoId, title: video.title });
    }, [onSelect]);

    return (
        <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <Music size={16} /> Soundtrack (YouTube)
            </label>

            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    placeholder={placeholder}
                    value={input}
                    onChange={handleInputChange}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-nos-accent text-sm"
                />
                {isLoading && (
                    <div className="absolute right-4 top-3.5 text-xs text-gray-400">
                        Searching...
                    </div>
                )}
            </div>

            {/* Search Results Display */}
            {searchResults.length > 0 && (
                <div className="mt-2 space-y-2 max-h-60 overflow-y-auto custom-scrollbar border border-white/5 rounded-md p-1 bg-black/20">
                    {searchResults.map((result) => (
                        <div
                            key={result.videoId}
                            onClick={() => handleResultClick(result)}
                            className="flex items-center gap-3 p-2 rounded-md hover:bg-white/10 cursor-pointer transition-colors"
                        >
                            <img src={result.thumbnail} alt={result.title} className="w-16 h-12 object-cover rounded" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate text-left">{result.title}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {error && <p className="text-red-400 text-xs text-center">{error}</p>}
        </div>
    );
}
