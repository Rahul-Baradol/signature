import { FiPlay } from "react-icons/fi";
import { CiPause1 } from "react-icons/ci";
import { useAppStore } from "@/store/use-app-store";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  isFullscreen: boolean;
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
  onToggle: () => void;
  autoplayBlocked?: boolean;
}

export const AudioControls = ({ audioRef, onToggle, isFullscreen, autoplayBlocked }: Props) => {
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

  const forceVisible = autoplayBlocked && !isFullscreen;

  return (
    <div
      ref={ref}
      className={`bottom-5 w-11/12 max-w-3xl flex flex-row items-center justify-center gap-4 ${isFullscreen ? 'opacity-0' : 'opacity-40'} ${showControls || forceVisible ? 'opacity-100' : ''} hover:opacity-100 transition-opacity duration-750 bg-black/20 p-4 rounded-xl backdrop-blur-sm`}
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
      <span className="text-white font-mono text-sm min-w-11.25">
        {formatTime(currentTime)}
      </span>
      <div className="relative">
        <AnimatePresence>
          {autoplayBlocked && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap"
            >
              <motion.span
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
                className="block text-xs text-white bg-violet-600/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg"
              >
                Tap to play
              </motion.span>
              <div className="mx-auto mt-1 w-2 h-2 bg-violet-600/90 rotate-45 translate-y-[-60%]" />
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={onToggle}
          className={`text-white border-2 rounded-lg px-4 py-2 hover:bg-white/20 transition-all ${autoplayBlocked ? 'border-violet-400 animate-pulse' : 'border-gray-400'}`}
        >
          {isPlaying ? <CiPause1 /> : <FiPlay />}
        </button>
      </div>
    </div>
  );
};