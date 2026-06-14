
const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const API_URL = 'https://www.googleapis.com/youtube/v3/search';

/**
 * Searches YouTube for videos matching the query.
 * @param {string} query 
 * @returns {Promise<{results: Array, error?: string}>}
 */
export const searchYouTube = async (query) => {
    if (!API_KEY) {
        console.warn('VITE_YOUTUBE_API_KEY is missing. Search will not work.');
        return { results: [], error: 'YouTube API key is missing. Please add it to your .env file.' };
    }

    try {
        const url = new URL(API_URL);
        url.search = new URLSearchParams({
            part: 'snippet',
            q: query,
            type: 'video',
            maxResults: 5,
            key: API_KEY
        }).toString();

        const response = await fetch(url);

        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData.error?.message || 'YouTube API Error';
            console.error('YouTube API Error:', errorMessage);
            return { results: [], error: `API Error: ${errorMessage}` };
        }

        const data = await response.json();

        const results = data.items.map(item => ({
            videoId: item.id.videoId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails.default.url
        }));

        return { results, error: null };

    } catch (error) {
        console.error('YouTube Search Failed:', error);
        return { results: [], error: 'Network error. Please check your connection.' };
    }
};

/**
 * Handles music input (URL or search query).
 * @param {string} input - The input string.
 * @returns {Promise<{type: 'video' | 'search', value: string, results?: Array, error?: string}>}
 */
export const handleMusicInput = async (input) => {
    if (!input || typeof input !== 'string') {
        return { type: 'search', value: '', results: [], error: null };
    }

    const trimmedInput = input.trim();

    // Regex for YouTube Video IDs
    // Supports:
    // - youtube.com/watch?v=ID
    // - youtube.com/embed/ID
    // - youtube.com/v/ID
    // - youtu.be/ID
    const youtubeRegex = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([^#&?]*).*/;

    const match = trimmedInput.match(youtubeRegex);

    if (match && match[1]) {
        return {
            type: 'video',
            value: match[1]
        };
    }

    const { results, error } = await searchYouTube(trimmedInput);

    return {
        type: 'search',
        value: trimmedInput,
        results,
        error
    };
};
