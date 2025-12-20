import { useEffect, useState } from "react";
import { SlMusicToneAlt } from "react-icons/sl";

import { useAudioAnalyzer } from "../hooks/use-audio-analyzer";
import { getMusicTransform, getBackgroundGradient } from "../utils/visualizer-util";

import Particles from "../components/Particles";
import Terms from "../components/Terms";
import SeizureAlert from "../components/SeizureAlert";
import { UploadSection } from "../components/upload-section";
import { SocialSidebar } from "../components/social-sidebar";
import { AudioControls } from "../components/audio-controls";

export default function BeatVisualizer() {
  const [acceptedTerms, setAcceptedTerms] = useState(
    localStorage.getItem("acceptedTerms") === "true"
  );
  const [dismissedSeizureAlert, setDismissedSeizureAlert] = useState(
    localStorage.getItem("dismissedSeizureAlert") === "true"
  );
  const [isModalVisible, setIsModalVisible] = useState(true);
  const [file, setFile] = useState<File | null>(null);

  const { isPlaying, amps, intensity, togglePlay, audioRef, currentTime } = useAudioAnalyzer(file);

  const containerStyle = {
    background: getBackgroundGradient(amps),
  };

  const musicIconStyle = {
    transform: getMusicTransform(intensity.current),
  };

  useEffect(() => {
    console.log("Intensity: ", intensity.current);
  }, [intensity])

  return (
    <div
      style={containerStyle}
      className="w-screen h-screen flex flex-col gap-5 items-center justify-center transition-all relative overflow-hidden"
    >
      {!file ? (
        <div className="bg-transparent flex flex-col items-center gap-5">
          {acceptedTerms ? (
            <UploadSection onFileSelect={setFile} />
          ) : (
            <Terms
              isModalVisible={isModalVisible}
              setIsModalVisible={setIsModalVisible}
              setAcceptedTerms={setAcceptedTerms}
            />
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-around bg-transparent">
          <div 
            style={musicIconStyle} 
            className="text-[30px] transition-all duration-1500 ease-out font-bold text-white"
          >
            <SlMusicToneAlt />
          </div>
          <Particles beatIntensity={intensity} />
        </div>
      )}

      <SocialSidebar />

      {file && (
        <AudioControls
          file={file}
          audioRef={audioRef}
          isPlaying={isPlaying}
          currentTime={currentTime}
          onToggle={togglePlay}
        />
      )}

      {acceptedTerms && !dismissedSeizureAlert && (
        <SeizureAlert setDismissedSeizureAlert={setDismissedSeizureAlert} />
      )}
    </div>
  );
}