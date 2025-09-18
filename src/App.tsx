import React, { useRef, useState, useEffect } from "react";

export default function BeatVisualizer() {
  const [file, setFile] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beatIntensity, setBeatIntensity] = useState(0);

  const audioRef = useRef(null);
  const audioCtxRef = useRef(null);
  const sourceRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);

  useEffect(() => {
    if (file && !isPlaying) {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
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
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        source.connect(analyser);
        analyser.connect(offlineCtx.destination);

        source.start();

        // const renderedBuffer = await offlineCtx.startRendering();

        // // Scan through rendered audio
        // let min = Infinity, max = -Infinity;
        // const step = 1024; // step through samples
        // const channelData = renderedBuffer.getChannelData(0);

        // for (let i = 0; i < channelData.length; i += step) {
        //   analyser.getByteFrequencyData(dataArray);
        //   let avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        //   avg /= 255;
        //   min = Math.min(min, avg);
        //   max = Math.max(max, avg);
        // }

        const preScan = async (file: File): Promise<{ min: number; max: number }> => {
          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
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
          const normalized = (avg - min) / (max - min);
          setBeatIntensity(normalized);
          requestAnimationFrame(detectBeat);
        };

        detectBeat();
      };

      reader.readAsArrayBuffer(file);
    }
  }, [file, isPlaying]);

  useEffect(() => {
    console.log(beatIntensity)
  }, [beatIntensity])

  return (
    <div
      className="w-screen h-screen flex items-center justify-center transition-colors duration-200"
      style={{
        background: `radial-gradient(circle at center, 
          rgba(255, 0, 150, ${0.1 + beatIntensity * 0.9}) 0%, 
          rgba(0, 100, 255, ${0.1 + beatIntensity * 0.9}) 100%)`,
      }}
    >
      {!file ? (
        <label className="cursor-pointer text-white text-xl bg-black/40 px-6 py-3 rounded-lg shadow-lg">
          Upload MP3
          <input
            type="file"
            accept="audio/mp3"
            className="hidden"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </label>
      ) : (
        <h1 className="text-white text-5xl font-bold drop-shadow-lg">
          signature
        </h1>
      )}
    </div>
  );
}
