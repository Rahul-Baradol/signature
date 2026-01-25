import { create } from "zustand";
import type { AppState, MicrophonePermissionStatus, StudioMode, TimeSignature } from "./schema";

export const useAppStore = create<AppState>((set) => ({
    // general
    amps: [],
    intensity: { prev: 0, current: 0 },
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
    bpm: 120,
    timeSignature: "4/4",
    isMetronomeActive: false,

    setBpm: (bpm: number) => set({ bpm }),
    setTimeSignature: (timeSignature: TimeSignature) => set({ timeSignature }),
    setIsMetronomeActive: (isMetronomeActive: boolean) => set({ isMetronomeActive }),
}));
