export type Intensity = {
    prev: number;
    current: number;
};

export type AppState = {
    hasMicrophonePermission: boolean;
    hasInitializedAudio: boolean;
    isPlaying: boolean;
    isDataReady: boolean;
    amps: number[];
    currentTime: number;
    currentFrame: number;
    intensity: Intensity;
    file: File | null;

    setHasMicrophonePermission: (hasPermission: boolean) => void;
    setHasInitializedAudio: (hasInitializedAudio: boolean) => void;
    setIsPlaying: (isPlaying: boolean) => void;
    setIsDataReady: (isDataReady: boolean) => void;
    setAmps: (amps: number[]) => void;
    setCurrentTime: (currentTime: number) => void;
    setCurrentFrame: (currentFrame: number) => void;
    setIntensity: (intensity: Intensity) => void;
    setFile: (file: File | null) => void;
};