import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '@/store/use-app-store';
import { useEffect, useRef, useState } from 'react';
import { AudioControls } from '@/components/audio-controls';
import { SocialSidebar } from '@/components/social-sidebar';
import { calculateAmpsForPerformanceMode, PerformanceMode } from '@/utils/performance-mode-util';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';

export const AnimationLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loadingProgress, setLoadingProgress] = useState(0);

  const {
    file, isPlaying, isDataReady, currentTime,
    setCurrentFrame, setIsPlaying, setIsDataReady,
    setAmps, setCurrentTime, setIntensity
  } = useAppStore();

  const frameMetaRef = useRef<{ sampleRate: number; hopSize: number; frameCount: number } | null>(null);
  const intensityFramesRef = useRef<{ prev: number; current: number }[] | null>(null);
  const ampsFramesRef = useRef<number[][] | null>(null);
  const prevSmoothAmpsRef = useRef<number[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (!audioRef.current.paused) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    if (!file) {
      navigate('/');
      return;
    }

    let cancelled = false;
    setIsDataReady(false);
    setLoadingProgress(0);

    const audioCtx = new AudioContext();
    audioCtxRef.current = audioCtx;
    const reader = new FileReader();

    reader.onload = async (e) => {
      if (cancelled) return;

      const decoded = await audioCtx.decodeAudioData(e.target!.result as ArrayBuffer);
      const fftSize = 512;
      const hopSize = fftSize / 2;
      const sampleRate = decoded.sampleRate;
      const frameCount = Math.floor(decoded.length / hopSize);

      const intensityFrames: { prev: number; current: number }[] = [];
      const ampsFrames: number[][] = [];
      let prevIntensity = 0;
      const history: number[] = [];

      for (let i = 0; i < frameCount; i++) {
        if (cancelled) break;

        // Periodic progress update to avoid UI lag
        if (i % 50 === 0) {
          setLoadingProgress(Math.round((i / frameCount) * 100));
        }

        const offlineCtx = new OfflineAudioContext(decoded.numberOfChannels, fftSize, sampleRate);
        const buffer = offlineCtx.createBuffer(decoded.numberOfChannels, fftSize, sampleRate);

        for (let ch = 0; ch < decoded.numberOfChannels; ch++) {
          const channelData = decoded.getChannelData(ch).subarray(i * hopSize, i * hopSize + fftSize);
          buffer.copyToChannel(channelData, ch);
        }

        const source = offlineCtx.createBufferSource();
        source.buffer = buffer;
        const analyser = offlineCtx.createAnalyser();
        analyser.fftSize = fftSize;

        source.connect(analyser);
        analyser.connect(offlineCtx.destination);
        source.start();

        await offlineCtx.startRendering();

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);

        const lowCount = Math.floor(dataArray.length * 0.5);
        const midCount = Math.floor(dataArray.length * 0.3);
        const rmsRange = (arr: Uint8Array, s: number, e: number) => {
          let sum = 0;
          for (let j = s; j < e; j++) sum += arr[j];
          return sum / (e - s);
        };

        const avgLow = rmsRange(dataArray, 0, lowCount);
        const avgMid = rmsRange(dataArray, lowCount, lowCount + midCount);
        const avgHigh = rmsRange(dataArray, lowCount + midCount, dataArray.length);
        const eff = Math.max(avgLow, avgMid, avgHigh) / 255;

        history.push(eff);
        if (history.length > 60) history.shift();

        let avg = eff;
        if (history.length === 60) {
          const min = Math.min(...history);
          const max = Math.max(...history);
          avg = max === min ? 0 : Math.min(Math.max((eff - min) / (max - min), 0), 1);
        }

        const pushDirection = avg > prevIntensity ? 1 : -1;
        const current = Math.min(pushDirection * 0.075 * avg + avg, 1);

        intensityFrames.push({ prev: prevIntensity, current });
        prevIntensity = current;
        ampsFrames.push(calculateAmpsForPerformanceMode(Array.from(dataArray), PerformanceMode.High));
      }

      if (cancelled) return;

      intensityFramesRef.current = intensityFrames;
      ampsFramesRef.current = ampsFrames;
      frameMetaRef.current = { sampleRate, hopSize, frameCount };

      setIsDataReady(true);

      const audio = new Audio(URL.createObjectURL(file));
      audioRef.current = audio;
      const src = audioCtx.createMediaElementSource(audio);
      src.connect(audioCtx.destination);

      await audio.play();
      setIsPlaying(true);

      const tick = () => {
        if (!audioRef.current || !frameMetaRef.current || !ampsFramesRef.current) return;

        if (audioRef.current.paused) {
          setIntensity({ prev: 0, current: 0 });
          setAmps(new Array(ampsFramesRef.current[0].length).fill(0));
          animationFrameRef.current = requestAnimationFrame(tick);
          return;
        }

        const { sampleRate, hopSize, frameCount } = frameMetaRef.current;
        const curTime = audioRef.current.currentTime;
        setCurrentTime(curTime);

        const exactFrame = (curTime * sampleRate) / hopSize;
        const currentIdx = Math.floor(exactFrame);
        const nextIdx = Math.min(currentIdx + 1, frameCount - 1);
        const t = exactFrame - currentIdx;

        if (currentIdx >= frameCount) return;

        const iA = intensityFramesRef.current![currentIdx];
        const iB = intensityFramesRef.current![nextIdx];
        setIntensity({
          prev: iA.current,
          current: iA.current + (iB.current - iA.current) * t
        });

        const ampsA = ampsFramesRef.current![currentIdx];
        const ampsB = ampsFramesRef.current![nextIdx];
        const interpolatedAmps = ampsA.map((valA, i) => {
          const valB = ampsB[i];
          const targetVal = valA + (valB - valA) * t;
          const prevVal = prevSmoothAmpsRef.current[i] || 0;
          const sense = targetVal > prevVal ? 0.8 : 0.15;
          return prevVal + (targetVal - prevVal) * sense;
        });

        prevSmoothAmpsRef.current = interpolatedAmps;
        setAmps(interpolatedAmps);
        setCurrentFrame(currentIdx);
        animationFrameRef.current = requestAnimationFrame(tick);
      };

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    reader.readAsArrayBuffer(file);

    return () => {
      cancelled = true;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      reader.abort();
      audioRef.current?.pause();
      audioCtxRef.current?.close();
    };
  }, [file]);

  const navItems = [
    { path: '/signature/gradient', label: 'Gradient', icon: Icons.Circle },
    { path: '/signature/concentric-rings', label: 'Rings', icon: Icons.Rotate3D },
  ];

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden text-white">
      <AnimatePresence mode="wait">
        {!isDataReady ? (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-full w-screen space-y-6 "
          >
            <div className="relative flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="w-24 h-24 border-t-2 border-b-2 border-white/30 rounded-full"
              />
              <span className="absolute text-sm font-mono">{loadingProgress}%</span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full w-full flex"
          >
            {/* Sidebar Navigation */}
            {/* <nav className="fixed top-1/2 -translate-y-1/2 left-6 z-50 flex flex-col items-center gap-6 px-3 py-8 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`relative p-3 rounded-full transition-all duration-300 ${isActive ? 'text-white bg-white/10' : 'text-gray-500 hover:text-white'
                      }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {isActive && (
                      <motion.div
                        layoutId="nav-glow"
                        className="absolute inset-0 rounded-full border border-white/50"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </nav> */}

            <main className="flex-1 relative">
              <Outlet />

              <div className="absolute bottom-10 left-0 right-0 z-20 flex justify-center">
                <AudioControls
                  audioRef={audioRef}
                  isPlaying={isPlaying}
                  currentTime={currentTime}
                  onToggle={togglePlay}
                />
              </div>

              <SocialSidebar />
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};