import { create } from "zustand";
import { StudioActivationStatus, type AppState, type Loop, type LooperState, type MicrophonePermissionStatus, type OpenmicRecorderState, type StudioMode, type TimeSignature } from "./schema";

export const useAppStore = create<AppState>((set) => ({
    // general
    activateStudio: StudioActivationStatus.ACTIVE,
    amps: [],
    intensity: { prev: 0, current: 0 },
    setActivateStudio: (activateStudio: StudioActivationStatus) => set({ activateStudio }),
    setIntensity: (intensity) => set({ intensity }),
    setAmps: (amps) => set({ amps }),
    
    // visualizer
    file: null,
    isPlaying: false,
    isDataReady: false,
    currentTime: 0,
    currentFrame: 0,
    hasInitializedAudio: false,
    setFile: (file: File | null) => set({ file }),
    setIsPlaying: (isPlaying) => set({ isPlaying }),
    setIsDataReady: (isDataReady) => set({ isDataReady }),
    setCurrentTime: (currentTime) => set({ currentTime }),
    setCurrentFrame: (currentFrame) => set({ currentFrame }),
    setHasInitializedAudio: (hasInitializedAudio: boolean) => set({ hasInitializedAudio }),

    // studio
    studioMode: "openmic",
    microphonePermission: "prompt",
    setStudioMode: (studioMode: StudioMode) => set({ studioMode }),
    setMicrophonePermission: (microphonePermission: MicrophonePermissionStatus) => set({ microphonePermission: microphonePermission }),

    // metronome states
    count: 0,
    bpm: 120,
    timeSignature: "4/4",
    isMetronomeActive: false,
    isBpmDetecting: false,

    setCount: (count: number) => set({ count }),
    setBpm: (bpm: number) => set({ bpm }),
    setTimeSignature: (timeSignature: TimeSignature) => set({ timeSignature }),
    setIsMetronomeActive: (isMetronomeActive: boolean) => set({ isMetronomeActive }),
    setIsBpmDetecting: (isBpmDetecting: boolean) => set({ isBpmDetecting }),

    // looper states
    loops: [],
    looperState: "idle",
    loopBarCount: 1,

    setLoops: (loops: Loop[]) => set({ loops }),
    addLoop: (loop: Loop) => set((state) => ({ loops: [loop, ...state.loops] })),
    removeLoop: (index: number) => set((state) => ({ loops: state.loops.filter((_, i) => i !== index) })),
    setLooperState: (looperState: LooperState) => set({ looperState }),
    setLoopBarCount: (loopBarCount: number) => set({ loopBarCount }),

    // openmic recording states
    openmicRecorderState: "idle",
    openmicRecording: null,
    setOpenmicRecorderState: (openmicRecorderState: OpenmicRecorderState) => set({ openmicRecorderState }),
    setOpenmicRecording: (openmicRecording: AudioBuffer | null) => set({ openmicRecording }),
}));
