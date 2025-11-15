import { Particle } from "./Particle";
import { state } from "./state";

export function hideScene1() {
    const inputElement = document.getElementById("scene1");
    if (inputElement) {
        inputElement.style.display = "none";
    }
}

export function initializeCanvas() {
    const canvas = document.getElementById("particleCanvas") as HTMLCanvasElement;
    const context = canvas.getContext("2d")!;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    function spawnParticle() {
        if (state.particles.length < 200) {
            state.particles.push(new Particle(canvas, context));
        }
    }

    function animate() {
        context.clearRect(0, 0, canvas.width, canvas.height);

        spawnParticle();

        state.particles.forEach((p, i) => {
            p.update();
            p.draw();

            if (p.isDead()) {
                state.particles.splice(i, 1);
            }
        });

        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);

    function setCanvasSize() {
        state.particles = [];
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }

    window.addEventListener("resize", setCanvasSize);
}

export function initializeAudioControls() {
    const audioRange: HTMLInputElement | null = document.getElementById("audioRange") as HTMLInputElement;
    const currentTime: HTMLSpanElement | null = document.getElementById("currentTime") as HTMLSpanElement;
    const playPauseButton: HTMLDivElement | null = document.getElementById("playPauseButton") as HTMLDivElement;

    playPauseButton.addEventListener("click", () => {
        if (state.getIsPlaying() == true) {
            state.pauseAudio();
            playPauseButton.textContent = "Play";
        } else {
            state.playAudio();
            playPauseButton.textContent = "Pause";
        }
    });

    audioRange.addEventListener("input", (e) => {
        if (e.target) {
            const audioElement = state.getAudio();
            if (audioElement) {
                audioElement.currentTime = parseFloat((e.target as HTMLInputElement).value);
                currentTime.textContent = `${Math.floor(audioElement.currentTime / 60)}:${Math.floor(audioElement.currentTime % 60).toString().padStart(2, "0")}`;
                state.seekAudio(audioElement.currentTime);
            }
        }
    });
}

export function beginShow() {
    if (state.getFile()) {
        let animationId: number;
        const audioCtx = new (window.AudioContext || window.AudioContext)();

        const reader = new FileReader();
        reader.onload = async (e) => {
            const arrayBuffer = e.target?.result as ArrayBuffer;

            // Decode full track
            const decodedData = await audioCtx.decodeAudioData(arrayBuffer);

            // Pre-scan using OfflineAudioContext
            const offlineCtx = new OfflineAudioContext(
                decodedData.numberOfChannels,
                decodedData.length,
                decodedData.sampleRate
            );
            const source = offlineCtx.createBufferSource();
            source.buffer = decodedData;

            const analyser = offlineCtx.createAnalyser();
            analyser.fftSize = 512;

            source.connect(analyser);
            analyser.connect(offlineCtx.destination);

            source.start();

            // --- Now start actual playback ---
            const liveSource = audioCtx.createMediaElementSource(state.getAudio()!);
            const liveAnalyser = audioCtx.createAnalyser();
            liveAnalyser.fftSize = 512;
            const liveData = new Uint8Array(liveAnalyser.frequencyBinCount);

            liveSource.connect(liveAnalyser);
            liveAnalyser.connect(audioCtx.destination);

            state.playAudio();

            function rmsRange(arr: any, start: number, end: number) {
                let sumSq = 0;
                for (let i = Math.floor(start); i < Math.floor(end); i++) {
                    sumSq += arr[i];
                }
                return sumSq / (end - start)
            }

            function detectBeat() {
                liveAnalyser.getByteFrequencyData(liveData);

                const lowCount = Math.floor(liveData.length * 0.5);
                const midCount = Math.floor(liveData.length * 0.30);

                const avgLow = rmsRange(liveData, 0, lowCount);
                const avgMid = rmsRange(liveData, lowCount, lowCount + midCount);
                const avgHigh = rmsRange(liveData, lowCount + midCount, liveData.length);

                let eff = Math.max(avgLow, avgMid, avgHigh) / 255;

                let avg = eff;
                if (state.getHistoryOfIntensities().length == 60) {
                    let minIntensity = Math.min(...state.getHistoryOfIntensities());
                    let maxIntensity = Math.max(...state.getHistoryOfIntensities());

                    avg = (eff - minIntensity) / (maxIntensity - minIntensity);
                    avg = Math.min(Math.max(avg, 0), 1);
                }

                if (avg <= 0.5) {
                    state.setAmps(
                        Array.from({ length: liveData.length / 4 }, (_, i) =>
                            (liveData[i * 4] + liveData[i * 4 + 1] + liveData[i * 4 + 2] + liveData[i * 4 + 3]) / 4
                        )
                    );
                } else {
                    state.setAmps(
                        Array.from({ length: Math.ceil(liveData.length / 3) }, (_, i) => {
                            const start = i * 3;
                            const end = Math.min(start + 3, liveData.length);
                            const sum = liveData.slice(start, end).reduce((acc, val) => acc + val, 0);
                            return sum / (end - start);
                        })
                    );
                }

                const pushDirection = (avg > state.getBeatIntensity().current) ? 1 : -1;
                state.setBeatIntensity(
                    Math.min((pushDirection * 0.075 * avg) + avg, 1),
                    state.getBeatIntensity().current
                );

                const updated = [...state.getHistoryOfIntensities(), eff];
                if (updated.length > 60) {
                    updated.shift();
                }

                state.setHistoryOfIntensities(updated);
                requestAnimationFrame(detectBeat);
            };

            animationId = requestAnimationFrame(detectBeat);
        };

        reader.readAsArrayBuffer(state.getFile()!);
    }
}

export function updateGradients(amps: number[]) {
    let backgroundColorString = "radial-gradient(circle at center,";
    amps.forEach((amp, index) => {
        const intensity = amp / 255;
        let r, g, b;
        r = Math.round(140 * intensity);
        g = Math.round(100 * intensity);
        b = 255;

        const multiplier = 10;
        const alpha = Math.log(1 + (multiplier * intensity)) / Math.log(1 + multiplier);
        backgroundColorString += ` rgba(${r}, ${g}, ${b}, ${alpha}) ${Math.round((index / amps.length) * 140)}%,`
    });
    backgroundColorString += " rgba(0, 0, 0, 0) 140%)";
    document.getElementById('scene2')!.style.background = backgroundColorString;
}

export function updateMusicIconProperties(beatIntensity: { current: number; prev: number }) {
    const multipler = 10;
    const alpha = Math.log(1 + (multipler * beatIntensity.current)) / Math.log(1 + multipler);

    const scale = 1 + (alpha * 2.5);
    const skewY = (alpha * -10)
    const skewX = (alpha * 5);

    document.getElementById("icon")!.style.transform = `
        scale(${scale}) skewY(${skewY}deg) skewX(${skewX}deg)
    `;
}

export function updateCanvas(beatIntensity: { current: number; prev: number }, particles: Particle[]) {
    const pushDirection = (beatIntensity.current > (0.5 * beatIntensity.prev)) ? 1 : -1;

    if (pushDirection === 1) {
        let countOfParticlesToAffect;
        if (beatIntensity.current <= 0.25) {
            countOfParticlesToAffect = 1;
        } else if (beatIntensity.current <= 0.5) {
            countOfParticlesToAffect = 2;
        } else {
            countOfParticlesToAffect = 3;
        }

        switch (true) {
            case (beatIntensity.current <= 0.25):
                countOfParticlesToAffect = 1;
                break;

            case (beatIntensity.current <= 0.5):
                countOfParticlesToAffect = 2;
                break;

            default:
                countOfParticlesToAffect = 3;
        }

        for (let i = 0; i < countOfParticlesToAffect; i++) {
            const randomIndex = Math.floor(Math.random() * particles.length);
            particles[randomIndex].pushDirection = pushDirection;
            particles[randomIndex].beatIntensity = beatIntensity.current;
        }
    } else {
        particles.forEach(p => {
            p.pushDirection = pushDirection;
            p.beatIntensity = beatIntensity.current;
        });
    }
}

export function updateAudioControls() {
    const audioRange: HTMLInputElement | null = document.getElementById("audioRange") as HTMLInputElement;
    const currentTime: HTMLSpanElement | null = document.getElementById("currentTime") as HTMLSpanElement;
    const playPauseButton: HTMLDivElement | null = document.getElementById("playPauseButton") as HTMLDivElement;

    if (state.getAudio() && audioRange && currentTime && playPauseButton) {
        audioRange.max = state.getAudio()!.duration.toString();
        audioRange.disabled = false;
        audioRange.value = state.getAudio()!.currentTime.toString();
        currentTime.textContent = `${Math.floor(state.getAudio()!.currentTime / 60)}:${Math.floor(state.getAudio()!.currentTime % 60).toString().padStart(2, "0")}`;
    }
}