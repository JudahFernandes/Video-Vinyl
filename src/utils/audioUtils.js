
// Web Audio API Context
let audioCtx = null;
let noiseBuffer = null;

const createNoiseBuffer = () => {
    if (!audioCtx) return;
    const bufferSize = audioCtx.sampleRate * 2; // 2 seconds of noise
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        // Pinkish noise (rough approximation)
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5; // Compensate for gain loss
    }
    return buffer;
};

let lastOut = 0;

export const initAudio = () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        noiseBuffer = createNoiseBuffer();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
};

let activeSource = null;
let activeGain = null;

export const playScratch = (velocity = 1) => {
    initAudio();
    if (!audioCtx || !noiseBuffer) return;

    // Avoid overlapping sounds too much
    if (activeSource) {
        // fade out old
        try {
            activeGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        } catch (e) { }
    }

    const source = audioCtx.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = true;

    const gainNode = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    filter.type = 'bandpass';
    filter.frequency.value = 800 + (Math.random() * 400); // Varying friction pitch
    filter.Q.value = 1.5; // Resonant friction

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // Velocity maps to pitch and volume
    const safeVelocity = Math.min(Math.max(Math.abs(velocity), 0.1), 5);
    source.playbackRate.value = 0.5 + (safeVelocity * 0.2);

    const volume = Math.min(0.05 + (safeVelocity * 0.05), 0.3); // Cap at 0.3
    gainNode.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + 0.05);

    source.start();

    activeSource = source;
    activeGain = gainNode;
};

export const stopScratch = () => {
    if (activeSource && activeGain && audioCtx) {
        activeGain.gain.cancelScheduledValues(audioCtx.currentTime);
        activeGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);

        const oldSource = activeSource;
        setTimeout(() => {
            try { oldSource.stop(); } catch (e) { }
        }, 200);

        activeSource = null;
        activeGain = null;
    }
};
