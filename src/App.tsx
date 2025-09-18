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
      const audio = new Audio(URL.createObjectURL(file));
      audioRef.current = audio;
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtxRef.current.createMediaElementSource(audio);
      const analyser = audioCtxRef.current.createAnalyser();
      analyser.fftSize = 512;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      source.connect(analyser);
      analyser.connect(audioCtxRef.current.destination);

      sourceRef.current = source;
      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;

      audio.play();
      setIsPlaying(true);

      const detectBeat = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setBeatIntensity(avg / 255); // normalize between 0 and 1
        requestAnimationFrame(detectBeat);
      };

      detectBeat();
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
          rgba(255, 0, 150, ${0.3 + beatIntensity * 0.7}) 0%, 
          rgba(0, 100, 255, ${0.3 + beatIntensity * 0.7}) 100%)`,
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
