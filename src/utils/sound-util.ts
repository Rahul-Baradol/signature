export function playKick(audioContext: AudioContext, big: boolean = false) {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.type = "sine";

    const now = audioContext.currentTime;

    if (big) {
        // Accent beat (still calm)
        osc.frequency.setValueAtTime(1000, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.02);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    } else {
        // Regular beat
        osc.frequency.setValueAtTime(900, now);
        osc.frequency.exponentialRampToValueAtTime(750, now + 0.02);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    }

    osc.connect(gain).connect(audioContext.destination);

    osc.start(now);
    osc.stop(now + 0.1);
}
