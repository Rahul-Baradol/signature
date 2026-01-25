export type Intensity = {
    prev: number;
    current: number;
};

export type MicrophonePermissionStatus = "granted" | "denied" | "loading" | "prompt";

export type StudioMode = "openmic" | "metronome";

export const TIME_SIGNATURES = ["4/4", "3/4", "2/4", "6/8"] as const;

export type TimeSignature = typeof TIME_SIGNATURES[number];

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
    bpm: number;
    timeSignature: TimeSignature;
    isMetronomeActive: boolean;

    setBpm: (bpm: number) => void;
    setTimeSignature: (timeSignature: TimeSignature) => void;
    setIsMetronomeActive: (isMetronomeActive: boolean) => void;
};