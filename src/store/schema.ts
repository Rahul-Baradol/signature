export type Intensity = {
    prev: number;
    current: number;
};

export type AppState = {
    hasInitializedAudio: boolean;
    isPlaying: boolean;
    amps: number[];
    currentTime: number;
    currentFrame: number;
    intensity: Intensity;
    file: File | null;

    setHasInitializedAudio: (hasInitializedAudio: boolean) => void;
    setIsPlaying: (isPlaying: boolean) => void;
    setAmps: (amps: number[]) => void;
    setCurrentTime: (currentTime: number) => void;
    setCurrentFrame: (currentFrame: number) => void;
    setIntensity: (intensity: Intensity) => void;
    setFile: (file: File | null) => void;
};