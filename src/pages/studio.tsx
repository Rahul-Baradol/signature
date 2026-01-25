import { SlMusicToneAlt } from "react-icons/sl";

import { getMusicTransform, getBackgroundGradient } from "@/utils/visualizer-util";

import { useAppStore } from "@/store/use-app-store";

export default function Studio() {
  const { amps, intensity } = useAppStore();

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
          <SlMusicToneAlt />
        </div>
      </div>
    </div>
  );
}