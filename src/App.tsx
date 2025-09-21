import { useRef, useState, useEffect, use } from "react";
import Particles from "./Particles";
import { SlMusicToneAlt } from "react-icons/sl";
import { MdOutlineFileUpload } from "react-icons/md";

export default function BeatVisualizer() {
  const [file, setFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const musicRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);

  const [beatIntensity, setBeatIntensity] = useState({
    prev: 0,
    current: 0
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  const [historyOfIntensities, setHistoryOfIntensities] = useState<number[]>([]);

  useEffect(() => {
    if (file && !isPlaying) {
      const audioCtx = new (window.AudioContext || window.AudioContext)();
      audioCtxRef.current = audioCtx;

      const reader = new FileReader();
      reader.onload = async (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;

        // Decode full track
        const decodedData = await audioCtx.decodeAudioData(arrayBuffer);

        // Pre-scan using OfflineAudioContext
        const offlineCtx = new OfflineAudioContext(
          decodedData.numberOfChannels,
          decodedData.length,
          decodedData.sampleRate
        );
        const source = offlineCtx.createBufferSource();
        source.buffer = decodedData;

        const analyser = offlineCtx.createAnalyser();
        analyser.fftSize = 512;

        source.connect(analyser);
        analyser.connect(offlineCtx.destination);

        source.start();

        // --- Now start actual playback ---
        const audio = new Audio(URL.createObjectURL(file));
        audioRef.current = audio;
        const liveSource = audioCtx.createMediaElementSource(audio);
        const liveAnalyser = audioCtx.createAnalyser();
        liveAnalyser.fftSize = 512;
        const liveData = new Uint8Array(liveAnalyser.frequencyBinCount);

        liveSource.connect(liveAnalyser);
        liveAnalyser.connect(audioCtx.destination);

        analyserRef.current = liveAnalyser;
        dataArrayRef.current = liveData;

        audio.play();
        setIsPlaying(true);

        function rmsRange(arr: any, start: number, end: number) {
          let sumSq = 0;
          for (let i = Math.floor(start); i < Math.floor(end); i++) {
            sumSq += arr[i];
          }
          return sumSq / (end - start)
        }

        const detectBeat = () => {
          liveAnalyser.getByteFrequencyData(liveData);

          const lowCount = Math.floor(liveData.length * 0.5);
          const midCount = Math.floor(liveData.length * 0.30);

          const avgLow = rmsRange(liveData, 0, lowCount);
          const avgMid = rmsRange(liveData, lowCount, lowCount + midCount);
          const avgHigh = rmsRange(liveData, lowCount + midCount, liveData.length);

          let eff = Math.max(avgLow, avgMid, avgHigh) / 255;

          let avg = eff;
          if (historyOfIntensities.length == 60) {
            let minIntensity = Math.min(...historyOfIntensities);
            let maxIntensity = Math.max(...historyOfIntensities);

            avg = (eff - minIntensity) / (maxIntensity - minIntensity);
            avg = Math.min(Math.max(avg, 0), 1);
          }

          setBeatIntensity((prev) => {
            const pushDirection = (avg > prev.current) ? 1 : -1;

            return {
              prev: prev.current,
              current: (pushDirection * 0.075 * avg) + avg
            }
          });

          setHistoryOfIntensities((prev) => {
            const updated = [...prev, eff];
            if (updated.length > 60) {
              updated.shift();
            }
            return updated;
          });

          requestAnimationFrame(detectBeat);
        };

        detectBeat();
      };

      reader.readAsArrayBuffer(file);
    }
  }, [file, isPlaying]);

  useEffect(() => {
    if (musicRef.current) {
      const scale = 1 + (beatIntensity.current * 2.5);
      musicRef.current.style.transform = `scale(${scale})`;
    }

    if (backgroundRef.current) {
      const intensity = Math.min(beatIntensity.current, 0.7);

      let r, g, b;
      r = Math.round(140 * intensity);
      g = Math.round(100 * intensity);
      b = 255;

      backgroundRef.current.style.background = `radial-gradient(circle at center, 
        rgba(${r}, ${g}, ${b}, ${Math.min(intensity * 2, 1)}) 0%, 
        rgba(0, 0, 0, ${Math.min(intensity * 2, 1)}) 100%)`;
    }
  }, [beatIntensity])

  return (
    <div
      ref={backgroundRef}
      className="w-screen h-screen flex items-center justify-center transition-colors duration-200"
    >
      {!file ? (
        <div className="flex flex-col items-center gap-2">
          <div>MP3 file please...</div>
          <label className="cursor-pointer text-white text-xl bg-black/40 px-6 py-3 rounded-lg shadow-lg">
            <MdOutlineFileUpload />
            <input
              type="file"
              accept="audio/mp3"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setFile(e.target.files[0]);
                }
              }}
            />
          </label>
        </div>
      ) : (
        <>
          <div ref={musicRef} className={`w-[50px] h-[50px] transition-all`}>
            <SlMusicToneAlt className="w-full h-full" />
          </div>
          <Particles beatIntensity={beatIntensity} />
        </>
      )}
    </div>
  );
}
