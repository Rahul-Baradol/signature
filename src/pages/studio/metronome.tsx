import { SlMusicToneAlt } from "react-icons/sl";

import { useAppStore } from "@/store/use-app-store";
import { useEffect, useRef } from "react";
import { MetronomeControls } from "@/components/controls";
import { playKick } from "@/utils/sound-util";
import { Particles } from "@/components/particles";

export default function Metronome() {
  const { intensity, count, timeSignature, isMetronomeActive, setStudioMode, setIntensity } = useAppStore();

  const audioContextRef = useRef<AudioContext | null>(null);

  const elevateParticles = () => {
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
    if (isMetronomeActive) {
      let bigHit;
      if (timeSignature === "6/8") {
        bigHit = count == 1 || count == 4;
      } else {
        bigHit = count == 1;
      }

      playKick(audioContextRef.current!, bigHit);
      elevateParticles();
    }
  }, [count])

  return (
    <div
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