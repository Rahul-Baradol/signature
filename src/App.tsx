import { useRef, useState, useEffect } from "react";
import Particles from "./Particles";
import { SlMusicToneAlt } from "react-icons/sl";
import { MdOutlineFileUpload } from "react-icons/md";
import github from '../public/github.png'
import linkedin from '../public/linkedin2.png'
import portfolio from '../public/me.svg'
import Terms from "./Terms";

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

  const [amps, setAmps] = useState<number[]>([]);

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

          setAmps(
            Array.from({ length: liveData.length / 4 }, (_, i) =>
              (liveData[i * 4] + liveData[i * 4 + 1] + liveData[i * 4 + 2] + liveData[i * 4 + 3]) / 4
            )
          );

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
      let backgroundColorString = "radial-gradient(circle at center,";
      amps.forEach((amp, index) => {
        const intensity = amp / 255;
        let r, g, b;
        r = Math.round(140 * intensity);
        g = Math.round(100 * intensity);
        b = 255;

        backgroundColorString += ` rgba(${r}, ${g}, ${b}, ${Math.min(intensity * 2, 1)}) ${Math.round((index / amps.length) * 140)}%,`
      });
      backgroundColorString += " rgba(0, 0, 0, 0) 140%)";
      backgroundRef.current.style.background = backgroundColorString;
    }
  }, [backgroundRef, beatIntensity])

  return (
    <div
      ref={backgroundRef}
      className="w-screen h-screen flex flex-col gap-5 items-center justify-center transition-all relative"
    >
      {!file ? (
        <div className="bg-transparent flex flex-col items-center gap-5">
          <label className="cursor-pointer text-white text-[30px] px-6 py-3 w-full h-full flex flex-row-reverse items-center justify-center gap-2 border-2 border-gray-400 rounded-lg">
            <div className="text-[15px]">Upload MP3 ( to visualize )</div>
            <MdOutlineFileUpload />
            <input
              type="file"
              accept="audio/mpeg, audio/mp3, .mp3"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setFile(e.target.files[0]);
                }
              }}
            />
          </label>
          <Terms />
        </div>
      ) : (
        <div className="bg-transparent">
          <div ref={musicRef} className={`w-[50px] h-[50px] transition-all duration-750 ease-out`}>
            <SlMusicToneAlt className="w-full h-full" />
          </div>
          <Particles beatIntensity={beatIntensity} />
        </div>
      )}

      <div className='absolute top-5 right-5 flex flex-col gap-4'>
        <a href="https://rahulbaradol.in" target='_blank' className={`
                  border-2 border-violet-600 opacity-50 hover:opacity-100 transition-opacity w-fit h-fit rounded-full overflow-hidden`}>
          <img
            width={35}
            height={35}
            src={portfolio}
            alt=""
          />
        </a>

        <a href="https://github.com/Rahul-Baradol" target='_blank' className={`border-2 border-violet-600 opacity-50 hover:opacity-100 transition-opacity w-fit h-fit rounded-full overflow-hidden`}>
          <img
            width={35}
            height={35}
            src={github}
            alt=""
          />
        </a>

        <a href="https://www.linkedin.com/in/rahul-baradol-22723b289/" target='_blank' className={`
                  border-2 border-violet-600 opacity-50 hover:opacity-100 transition-opacity w-fit h-fit rounded-full overflow-hidden`}>
          <img
            width={35}
            height={35}
            src={linkedin}
            alt=""
          />
        </a>
      </div>
    </div>
  );
}
