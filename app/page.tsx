"use client"

import { useRef, useState, useEffect } from "react";
import Particles from './Particles'

export default function BeatVisualizer() {
  const [file, setFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const [beatIntensity, setBeatIntensity] = useState({
    prev: 0,
    current: 0
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

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

        const preScan = async (file: File): Promise<{ min: number; max: number }> => {
          const audioCtx = new (window.AudioContext || window.AudioContext)();
          const arrayBuffer = await file.arrayBuffer();
          const decodedData = await audioCtx.decodeAudioData(arrayBuffer);

          const channelData = decodedData.getChannelData(0); // use first channel
          const step = 1024; // sample every N samples
          let min = Infinity;
          let max = -Infinity;

          for (let i = 0; i < channelData.length; i += step) {
            let sum = 0;
            for (let j = 0; j < step && i + j < channelData.length; j++) {
              sum += channelData[i + j] ** 2; // square -> energy
            }
            const rms = Math.sqrt(sum / step); // root mean square
            min = Math.min(min, rms);
            max = Math.max(max, rms);
          }

          return { min, max };
        };

        const { min, max } = await preScan(file);
        console.log("Pre-scan results: ", { min, max });

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

        const detectBeat = () => {
          liveAnalyser.getByteFrequencyData(liveData);
          let avg = liveData.reduce((a, b) => a + b, 0) / liveData.length;
          avg /= 255;
          const normalized = ((avg - min) / (max - min));
          setBeatIntensity((prev) => ({
            prev: prev.current,
            current: normalized,
          }));
          requestAnimationFrame(detectBeat);
        };

        detectBeat();
      };

      reader.readAsArrayBuffer(file);
    }
  }, [file, isPlaying]);

  useEffect(() => {
    console.log("Beat Intensity Updated: ", beatIntensity.current, beatIntensity.prev);
  }, [beatIntensity])

  return (
    <div
      className="w-screen h-screen flex items-center justify-center transition-colors duration-200"
      style={{
        background: `radial-gradient(circle at center, 
          rgba(255, 255, 0, ${beatIntensity.current}) 0%, 
          rgba(0, 0, 0, ${beatIntensity.current}) 100%)`,
      }}
    >
      {!file ? (
        <>

            <label className="cursor-pointer text-white text-xl bg-black/40 px-6 py-3 rounded-lg shadow-lg">
            Upload MP3
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
        </>
      ) : (
        <>
          <h1 className="text-white text-5xl font-bold drop-shadow-lg">
            signature
          </h1>
          <Particles beatIntensity={beatIntensity} />
        </>
      )}
    </div>
  );
}
