export type Intensity = {
    prev: number;
    current: number;
};

export type LooperState = "idle" | "playing" | "stop-playing" | "saving-recording" | "ready-for-count-in" | "count-in" | "recording";

export type MicrophonePermissionStatus = "granted" | "denied" | "loading" | "prompt";

export type StudioMode = "openmic" | "metronome" | "looper";

export const TIME_SIGNATURES = ["4/4", "3/4", "2/4", "6/8"] as const;

export type TimeSignature = typeof TIME_SIGNATURES[number];

export interface Bar {
    timesignature: TimeSignature;
    bpm: number;
    name: string;
    muted: boolean;
    recordedBuffer: AudioBuffer;
}

export type AppState = {
    // general
    amps: number[];
    intensity: Intensity;
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

    setCount: (count: number) => void;
    setBpm: (bpm: number) => void;
    setTimeSignature: (timeSignature: TimeSignature) => void;
    setIsMetronomeActive: (isMetronomeActive: boolean) => void;

    // looper states
    bars: Bar[];
    looperState: LooperState;

    addBar: (bar: Bar) => void;
    removeBar: (bar: Bar) => void;
    setBars: (bars: Bar[]) => void;
    setLooperState: (looperState: LooperState) => void;
};