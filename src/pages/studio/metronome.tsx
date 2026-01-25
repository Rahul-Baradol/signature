import { SlMusicToneAlt } from "react-icons/sl";

import { getMusicTransform, getBackgroundGradient } from "@/utils/visualizer-util";

import { useAppStore } from "@/store/use-app-store";
import { useEffect, useRef, useState } from "react";
import { MetronomeControls } from "@/components/metronome-controls";
import { easeInOut, gaussian } from "@/utils/math";
import { playKick } from "@/utils/sound-util";

export default function Metronome() {
  const { amps, intensity, bpm, timeSignature, isMetronomeActive, setStudioMode, setAmps } = useAppStore();

  const [count, setCount] = useState(0);
  const [metronomeIntervalId, setMetronomeIntervalId] = useState<NodeJS.Timeout | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);

  const animationFrameRef = useRef<number | null>(null);

  function getNewCount(currentCount: number): number {
    let newCount = currentCount + 1;
    switch (timeSignature) {
      case "2/4":
        return (newCount <= 2) ? newCount : 1;
      case "3/4":
        return (newCount <= 3) ? newCount : 1;
      case "4/4":
        return (newCount <= 4) ? newCount : 1;
      case "6/8":
        return (newCount <= 6) ? newCount : 1;
    }
  }

  const sweepGradients = (duration: number) => {
    const max = 255;
    const bins = 64;

    let startTime: number | null = null;

    const sweep = (timestamp: number) => {
      if (!startTime) startTime = timestamp;

      const elapsed = timestamp - startTime;
      const rawProgress = Math.min(elapsed / duration, 1);
      const progress = easeInOut(rawProgress);

      const center = progress * (bins - 1);
      const maxValue = max * progress;

      const sweepyGradients = new Array(bins).fill(0);

      for (let i = 0; i < bins; i++) {
        const dist = i - center;

        const energy = gaussian(dist, 3);
        const shimmer = 0.85 + Math.random() * 0.15;

        sweepyGradients[i] = Math.floor(
          energy * maxValue * shimmer
        );
      }

      setAmps(sweepyGradients);

      animationFrameRef.current = requestAnimationFrame(() => sweep(performance.now()));
    };


    animationFrameRef.current = requestAnimationFrame(() => sweep(performance.now()));
  };

  useEffect(() => {
    setStudioMode("metronome")

    if (audioContextRef.current) {
      audioContextRef.current.resume();
    } else {
      audioContextRef.current = new AudioContext();
    }
  }, [])

  useEffect(() => {
    if (metronomeIntervalId) {
      clearInterval(metronomeIntervalId);
      setCount(0);
    }

    switch (isMetronomeActive) {
      case false:
        setMetronomeIntervalId(null);
        break;

      case true:
        let lengthOfABeat = (60 / bpm) * 1000; // bounce, this is for quarter note
        if (timeSignature === "6/8") {
          lengthOfABeat /= 2; // halve the duration for 6/8
        }

        const intervalId = setInterval(() => {
          setCount((prevCount) => getNewCount(prevCount));
        }, lengthOfABeat);

        setMetronomeIntervalId(intervalId);
        break;
    }
  }, [isMetronomeActive])

  useEffect(() => {
    if (isMetronomeActive) {
      // if (animationFrameRef.current) {
      //   cancelAnimationFrame(animationFrameRef.current);
      // }

      // sweepGradients(1000);

      if (timeSignature === "6/8") {
        playKick(audioContextRef.current!, count == 1 || count == 4);
      } else {
        playKick(audioContextRef.current!, count == 1);
      }
    }
  }, [count])

  const containerStyle = {
    background: getBackgroundGradient(amps),
  };

  const musicIconStyle = {
    transform: getMusicTransform(intensity.current),
  };

  return (
    <div
      style={containerStyle}
      className="w-screen h-screen flex flex-col gap-5 items-center justify-center transition-all relative overflow-hidden duration-[33]"
    >
      <div className="flex flex-col items-center justify-around bg-transparent">
        <div
          style={musicIconStyle}
          className="text-[30px] transition-all duration-1500 ease-out font-bold text-white"
        >
          {
            (isMetronomeActive ? count : <SlMusicToneAlt />)
          }
        </div>
      </div>

      <MetronomeControls />
    </div>
  );
}