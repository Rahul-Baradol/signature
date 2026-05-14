export type Intensity = {
    prev: number;
    current: number;
};

export enum StudioActivationStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    LOADING = "loading",
}

export type LooperState = "idle" | "playing" | "stop-playing" | "saving-recording" | "ready-for-count-in" | "count-in" | "recording";

export type MicrophonePermissionStatus = "granted" | "denied" | "loading" | "prompt";

export type StudioMode = "openmic" | "metronome" | "looper";

export const TIME_SIGNATURES = ["4/4", "3/4", "2/4", "6/8"] as const;

export type TimeSignature = typeof TIME_SIGNATURES[number];

export interface Loop {
    timesignature: TimeSignature;
    bpm: number;
    barCount: number;
    name: string;
    muted: boolean;
    recordedBuffer: AudioBuffer;
}

export type AppState = {
    // general
    activateStudio: StudioActivationStatus;
    amps: number[];
    intensity: Intensity;
    setActivateStudio: (activateStudio: StudioActivationStatus) => void;
    setAmps: (amps: number[]) => void;
    setIntensity: (intensity: Intensity) => void;

    // visualizer
    file: File | null;
    isPlaying: boolean;
    isDataReady: boolean;
    currentTime: number;
    currentFrame: number;
    hasInitializedAudio: boolean;
    setFile: (file: File | null) => void;
    setIsPlaying: (isPlaying: boolean) => void;
    setIsDataReady: (isDataReady: boolean) => void;
    setCurrentTime: (currentTime: number) => void;
    setCurrentFrame: (currentFrame: number) => void;
    setHasInitializedAudio: (hasInitializedAudio: boolean) => void;

    // studio
    studioMode: StudioMode;
    microphonePermission: MicrophonePermissionStatus;
    setStudioMode: (studioMode: StudioMode) => void;
    setMicrophonePermission: (microphonePermission: MicrophonePermissionStatus) => void;

    // metronome states
    count: number;
    bpm: number;
    timeSignature: TimeSignature;
    isMetronomeActive: boolean;

    isBpmDetecting: boolean;

    setCount: (count: number) => void;
    setBpm: (bpm: number) => void;
    setTimeSignature: (timeSignature: TimeSignature) => void;
    setIsMetronomeActive: (isMetronomeActive: boolean) => void;
    setIsBpmDetecting: (isBpmDetecting: boolean) => void;

    // looper states
    loops: Loop[];
    looperState: LooperState;
    loopBarCount: number;

    addLoop: (loop: Loop) => void;
    removeLoop: (index: number) => void;
    setLoops: (loops: Loop[]) => void;
    setLooperState: (looperState: LooperState) => void;
    setLoopBarCount: (loopBarCount: number) => void;
};