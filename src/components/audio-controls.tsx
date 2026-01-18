import { FiPlay } from "react-icons/fi";
import { CiPause1 } from "react-icons/ci";
import { useAppStore } from "@/store/use-app-store";
import { useEffect, useRef, useState } from "react";

interface Props {
  isFullscreen: boolean;
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
  onToggle: () => void;
}

export const AudioControls = ({ audioRef, onToggle, isFullscreen }: Props) => {
  const duration = audioRef.current?.duration || 0;
  const { isPlaying, currentTime, setCurrentTime } = useAppStore();

  const [showControls, setShowControls] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  useEffect(() => {
    let lastMoveTime = Date.now();
    const IDLETIME = 1000;

    const mouseMoved = async () => {
      setShowControls(true);
      lastMoveTime = Date.now();
    }

    document.addEventListener("mousemove", mouseMoved);
      
    const intervalId = setInterval(() => {
      if ((Date.now() - lastMoveTime) >= IDLETIME) {
        setShowControls(false);
      }
    }, 100)

    return () => {
      document.removeEventListener("mousemove", mouseMoved);
      clearInterval(intervalId);
    };
  }, [])

  return (
    <div
      ref={ref}
      className={`bottom-5 w-11/12 max-w-3xl flex flex-row items-center justify-center gap-4 ${isFullscreen? 'opacity-0' : 'opacity-40'} ${showControls ? 'opacity-100' : ''} hover:opacity-100 transition-opacity duration-750 bg-black/20 p-4 rounded-xl backdrop-blur-sm`}
    >
      <input
        type="range"
        min={0}
        max={duration}
        step={0.1}
        value={currentTime}
        onChange={(e) => {
          if (audioRef.current) {
            audioRef.current.currentTime = parseFloat(e.target.value);
            setCurrentTime(parseFloat(e.target.value));
          }
        }}
        className="w-full accent-violet-500"
      />
      <span className="text-white font-mono text-sm min-w-[45px]">
        {formatTime(currentTime)}
      </span>
      <button
        onClick={onToggle}
        className="text-white border-2 border-gray-400 rounded-lg px-4 py-2 hover:bg-white/20 transition-all"
      >
        {isPlaying ? <CiPause1 /> : <FiPlay />}
      </button>
    </div>
  );
};