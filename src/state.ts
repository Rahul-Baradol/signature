import { updateAudioControls, updateCanvas, updateMusicIconProperties } from "./controller";
import type { Particle } from "./Particle";

class State {
    private file: File | null = null;
    private audio: HTMLAudioElement | null = null;
    private isPlaying: boolean = false;

    private amps: number[] = [];
    private historyOfIntensities: number[] = [];

    public particles: Particle[] = [];

    private beatIntensity = {
        current: 0,
        prev: 0,
    };

    setFile(file: File) {
        this.file = file;
        console.log("File set to: ", file);
    }

    getFile() {
        return this.file;
    }

    setAudio(audio: HTMLAudioElement) {
        this.audio = audio;
        console.log("Audio set to: ", audio);
    }

    seekAudio(time: number) {
        if (this.audio) {
            this.audio.currentTime = time;
        }
    }

    getAudio() {
        return this.audio;
    }

    pauseAudio() {
        if (this.audio) {
            this.audio.pause();
            this.setIsPlaying(false);
        }
    }

    playAudio() {
        if (this.audio) {
            this.audio.play();
            this.setIsPlaying(true);
        }
    }

    setIsPlaying(isPlaying: boolean) {
        this.isPlaying = isPlaying;
    }

    getIsPlaying() {
        return this.isPlaying;
    }

    setHistoryOfIntensities(intensities: number[]) {
        this.historyOfIntensities = intensities;
    }

    getHistoryOfIntensities() {
        return this.historyOfIntensities;
    }

    setAmps(ampsArray: number[]) {
        this.amps = ampsArray;
        // updateGradients(this.amps);
    }

    getAmps() {
        return this.amps;
    }

    setBeatIntensity(current: number, prev: number) {
        this.beatIntensity.current = current;
        this.beatIntensity.prev = prev;
        
        updateAudioControls();
        updateMusicIconProperties(this.beatIntensity);
        updateCanvas(this.beatIntensity, this.particles);
    }

    getBeatIntensity() {
        return this.beatIntensity;
    }
}

export const state = new State();