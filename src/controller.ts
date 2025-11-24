import { pauseIcon, playIcon } from "./html/icons";
import { Particle } from "./Particle";
import { state } from "./state";

export function hideScene1() {
    const inputElement = document.getElementById("scene1");
    if (inputElement) {
        inputElement.style.display = "none";
    }
}

export function initializeCanvas() {
    const particleCanvas = document.getElementById("particleCanvas") as HTMLCanvasElement;
    const gradientCanvas = document.getElementById("gradientCanvas") as HTMLCanvasElement;

    const particleCanvasContext = particleCanvas.getContext("2d")!;
    particleCanvas.width = particleCanvas.offsetWidth;
    particleCanvas.height = particleCanvas.offsetHeight;

    const gradientCanvasContext = gradientCanvas.getContext("2d")!;
    gradientCanvas.width = gradientCanvas.offsetWidth;
    gradientCanvas.height = gradientCanvas.offsetHeight;

    function spawnParticle() {
        if (state.particles.length < 200) {
            state.particles.push(new Particle(particleCanvas, particleCanvasContext));
        }
    }

    const gradientTex = document.getElementById("helperCanvas") as HTMLCanvasElement;
    gradientTex.width = 1;
    gradientTex.height = 256;       // number of stops
    const gctx = gradientTex.getContext('2d')!;

    function updateGradientTexture(amps: number[]) {
        const h = gradientTex.height;
        gctx.clearRect(0, 0, 1, h);

        if (!amps || amps.length === 0) {
            // make fully transparent if no data
            gctx.fillStyle = "rgba(0,0,0,0)";
            gctx.fillRect(0, 0, 1, h);
            return;
        }

        // map pixel row -> amps index with inclusive endpoints
        for (let i = 0; i < h; i++) {
            // normalized t in [0,1]
            const t = i / (h - 1);
            // map to amps index (inclusive)
            const ampIndex = Math.min(amps.length - 1, Math.floor(t * (amps.length - 1)));
            const amp = amps[ampIndex] ?? 0;
            const intensity = amp / 255;

            const r = Math.round(140 * intensity);
            const g = Math.round(100 * intensity);
            const b = 255;

            const multiplier = 10;
            const alpha = Math.log(1 + multiplier * intensity) / Math.log(1 + multiplier);

            gctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            gctx.fillRect(0, i, 1, 1);
        }
    }

    function drawGradientToMainCanvas() {
        gradientCanvasContext.clearRect(0, 0, gradientCanvas.width, gradientCanvas.height);

        const cx = gradientCanvas.width / 2;
        const cy = gradientCanvas.height / 2;
        const maxRadius = Math.max(cx, cy);

        // read tex pixels once
        const tex = gctx.getImageData(0, 0, 1, gradientTex.height).data;
        const steps = gradientTex.height;

        // draw from outer -> inner so smaller circles are on top
        for (let i = steps - 1; i >= 0; i--) {
            const t = i / (steps - 1);
            const radius = t * maxRadius;

            const r = tex[i * 4 + 0];
            const g = tex[i * 4 + 1];
            const b = tex[i * 4 + 2];
            const a = tex[i * 4 + 3] / 255;

            // skip fully transparent rows (saves work)
            if (a === 0) continue;

            gradientCanvasContext.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
            gradientCanvasContext.beginPath();
            gradientCanvasContext.arc(cx, cy, radius, 0, Math.PI * 2);
            gradientCanvasContext.fill();
        }
    }




    function animate() {
        particleCanvasContext.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
        spawnParticle();

        state.particles.forEach((p, i) => {
            p.update();
            p.draw();

            if (p.isDead()) {
                state.particles.splice(i, 1);
            }
        });

        updateGradientTexture(state.getAmps());  // cheap
        drawGradientToMainCanvas();              // extremely fast

        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);

    function setCanvasSize() {
        state.particles = [];
        particleCanvas.width = particleCanvas.offsetWidth;
        particleCanvas.height = particleCanvas.offsetHeight;
        gradientCanvas.width = gradientCanvas.offsetWidth;
        gradientCanvas.height = gradientCanvas.offsetHeight;
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
            playPauseButton.innerHTML = playIcon;
        } else {
            state.playAudio();
            playPauseButton.innerHTML = pauseIcon;
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

                    if ((maxIntensity - minIntensity) == 0) {
                        avg = 0;
                    } else {
                        avg = (eff - minIntensity) / (maxIntensity - minIntensity);
                        avg = Math.min(Math.max(avg, 0), 1);
                    }
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

            requestAnimationFrame(detectBeat);
        };

        reader.readAsArrayBuffer(state.getFile()!);
    }
}

// export function updateGradients(amps: number[]) {
//     let backgroundColorString = "radial-gradient(circle at center,";
//     amps.forEach((amp, index) => {
//         const intensity = amp / 255;
//         let r, g, b;
//         r = Math.round(140 * intensity);
//         g = Math.round(100 * intensity);
//         b = 255;

//         const multiplier = 10;
//         const alpha = Math.log(1 + (multiplier * intensity)) / Math.log(1 + multiplier);
//         backgroundColorString += ` rgba(${r}, ${g}, ${b}, ${alpha}) ${Math.round((index / amps.length) * 140)}%,`
//     });
//     backgroundColorString += " rgba(0, 0, 0, 0) 140%)";
//     document.getElementById('scene2')!.style.background = backgroundColorString;
// }

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
        let countOfParticlesToAffect = 50;

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