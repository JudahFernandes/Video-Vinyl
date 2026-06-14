import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import YouTube from 'react-youtube';

const YouTubeAudio = forwardRef(({ videoId, isPlaying, loop = true, volume = 50, onReady, onProgress, onEnd }, ref) => {
    const playerRef = useRef(null);

    useImperativeHandle(ref, () => ({
        seekTo: (seconds) => {
            if (playerRef.current) {
                playerRef.current.seekTo(seconds, true);
            }
        },
        getCurrentTime: () => {
            return playerRef.current ? playerRef.current.getCurrentTime() : 0;
        },
        getDuration: () => {
            return playerRef.current ? playerRef.current.getDuration() : 0;
        },
        setVolume: (volume) => {
            if (playerRef.current) {
                playerRef.current.setVolume(volume);
            }
        }
    }));

    const opts = React.useMemo(() => ({
        height: '1',
        width: '1',
        playerVars: {
            autoplay: 1,
            controls: 0,
            playsinline: 1,
            origin: window.location.origin,
        },
    }), [videoId]);

    const handleEnd = () => {
        if (loop) {
            // manually seek to 0 and replay instead of relying on playerVars.loop
            playerRef.current?.seekTo(0);
            playerRef.current?.playVideo();
        } else {
            // no loop — fire the onEnd prop so App.jsx can play next queued track
            onEnd?.();
        }
    };

    const _onReady = (event) => {
        playerRef.current = event.target;
        if (playerRef.current && playerRef.current.setVolume) {
            playerRef.current.setVolume(volume);
        }
        if (onReady) onReady(event);
    };

    useEffect(() => {
        if (playerRef.current && playerRef.current.setVolume) {
            playerRef.current.setVolume(volume);
        }
    }, [volume]);

    // Sync isPlaying prop with player state
    useEffect(() => {
        if (!playerRef.current) return;
        if (isPlaying) {
            playerRef.current.playVideo();
        } else {
            playerRef.current.pauseVideo();
        }
    }, [isPlaying]);

    useEffect(() => {
        // Polling for progress updates if needed
        let interval;
        if (isPlaying) {
            interval = setInterval(() => {
                if (playerRef.current && onProgress) {
                    onProgress(playerRef.current.getCurrentTime());
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isPlaying, onProgress]);

    return (
        <div className="absolute opacity-0 pointer-events-none -z-50 w-px h-px overflow-hidden">
            <YouTube videoId={videoId} opts={opts} onReady={_onReady} onEnd={handleEnd} />
        </div>
    );
});

export default YouTubeAudio;
