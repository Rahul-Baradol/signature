import { FiPlay } from "react-icons/fi";
import { CiPause1 } from "react-icons/ci";
import { useAppStore } from "@/store/use-app-store";

interface Props {
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  currentTime: number;
  onToggle: () => void;
}

export const AudioControls = ({ audioRef, isPlaying, currentTime, onToggle }: Props) => {
  const duration = audioRef.current?.duration || 0;
  const { setCurrentTime } = useAppStore();

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  return (
    <div className="bottom-5 w-11/12 max-w-3xl flex flex-row items-center justify-center gap-4 opacity-40 hover:opacity-100 transition-opacity bg-black/20 p-4 rounded-xl backdrop-blur-sm">
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