import { create } from "zustand";
import type { AppState } from "./schema";

export const useAppStore = create<AppState>((set) => ({
    hasInitializedAudio: false,
    isPlaying: false,
    isDataReady: false,
    amps: [],
    currentTime: 0,
    currentFrame: 0,
    intensity: { prev: 0, current: 0 },
    file: null,

    setHasInitializedAudio: (hasInitializedAudio: boolean) => set({ hasInitializedAudio }),
    setIsPlaying: (isPlaying) => set({ isPlaying }),
    setIsDataReady: (isDataReady) => set({ isDataReady }),
    setAmps: (amps) => set({ amps }),
    setCurrentTime: (currentTime) => set({ currentTime }),
    setCurrentFrame: (currentFrame) => set({ currentFrame }),
    setIntensity: (intensity) => set({ intensity }),
    setFile: (file: File | null) => set({ file }),
}));
