import { SlMusicToneAlt } from "react-icons/sl";

import { getBackgroundGradient } from "@/utils/visualizer-util";
import { useAppStore } from "@/store/use-app-store";
import { useEffect, useRef, useState } from "react";
import { MetronomeControls } from "@/components/metronome-controls";
import { playKick } from "@/utils/sound-util";
import { Particles } from "@/components/particles";

export default function Metronome() {
  const { amps, intensity, bpm, timeSignature, isMetronomeActive, setStudioMode, setAmps, setIntensity } = useAppStore();

  const [count, setCount] = useState(0);
  const [metronomeIntervalId, setMetronomeIntervalId] = useState<NodeJS.Timeout | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);

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

  const elevateParticles = (count: number) => {
    console.log(count)
    if (intensity.current <= intensity.prev) {
      const currentIntensity = (0.5 * intensity.prev) + (Math.random() * 0.1) + 0.4;
      setIntensity({
        current: currentIntensity,
        prev: intensity.current,
      });
    } else {
      const currentIntensity = Math.max((0.5 * intensity.prev) - (Math.random() * 0.50), 0);
      setIntensity({
        current: currentIntensity,
        prev: intensity.current,
      });
    }
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
        setIntensity({
          prev: 0,
          current: 0
        })
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
      let bigHit;
      if (timeSignature === "6/8") {
        bigHit = count == 1 || count == 4;
      } else {
        bigHit = count == 1;
      }

      playKick(audioContextRef.current!, bigHit);
      elevateParticles(count);
    }
  }, [count])

  const containerStyle = {
    background: getBackgroundGradient(amps),
  };

  return (
    <div
      style={containerStyle}
      className="w-screen h-screen flex flex-col gap-5 items-center justify-center transition-all relative overflow-hidden duration-[33]"
    >
      <div className="flex flex-col items-center justify-around bg-transparent">
        <div
          className="text-[30px] transition-all duration-1500 ease-out font-bold text-white"
        >
          {
            (isMetronomeActive ? count : <SlMusicToneAlt />)
          }
        </div>
      </div>

      <MetronomeControls />
      <Particles
        beatIntensity={intensity}
        particleCount={1}
      />
    </div>
  );
}