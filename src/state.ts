import { updateGradients, updateMusicIconProperties } from "./controller";

class State {
    private file: File | null = null;
    private audio: HTMLAudioElement | null = null;
    private isPlaying: boolean = false;

    private amps: number[] = [];
    private historyOfIntensities: number[] = [];

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

    getAudio() {
        return this.audio;
    }

    setIsPlaying(playing: boolean) {
        this.isPlaying = playing;
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
        updateGradients(this.amps);
    }

    getAmps() {
        return this.amps;
    }

    setBeatIntensity(current: number, prev: number) {
        this.beatIntensity.current = current;
        this.beatIntensity.prev = prev;
        updateMusicIconProperties(this.beatIntensity);
    }

    getBeatIntensity() {
        return this.beatIntensity;
    }
}

export const state = new State();