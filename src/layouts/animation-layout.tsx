import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '@/store/use-app-store';
import { useEffect, useRef } from 'react';
import { AudioControls } from '@/components/audio-controls';
import { SocialSidebar } from '@/components/social-sidebar';
import { calculateAmpsForPerformanceMode, PerformanceMode } from '@/utils/performance-mode-util';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';

export const AnimationLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { file, isPlaying, currentTime, setCurrentFrame, setIsPlaying, setAmps, setCurrentTime, setIntensity } = useAppStore();

  const frameMetaRef = useRef<{ sampleRate: number; hopSize: number; frameCount: number } | null>(null);
  const intensityFramesRef = useRef<{ prev: number; current: number }[] | null>(null);
  const ampsFramesRef = useRef<number[][] | null>(null);
  const visualAmpsRef = useRef<number[][] | null>(null);
  const prevSmoothAmpsRef = useRef<number[]>([]);

  const togglePlay = () => {
    if (!audioRef.current) {
      return;
    }

    if (!audioRef.current.paused) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!file) {
      navigate('/');
      return;
    }

    let cancelled = false;
    const audioCtx = new AudioContext();
    audioCtxRef.current = audioCtx;

    const reader = new FileReader();

    reader.onload = async (e) => {
      if (cancelled) return;

      const decoded = await audioCtx.decodeAudioData(
        e.target!.result as ArrayBuffer
      );

      const fftSize = 512;
      const hopSize = fftSize / 2;
      const sampleRate = decoded.sampleRate;
      const frameCount = Math.floor(decoded.length / hopSize);

      const intensityFrames: { prev: number; current: number }[] = [];
      const ampsFrames: number[][] = [];

      let prevIntensity = 0;
      const history: number[] = [];

      // Precompute frames offline
      for (let i = 0; i < frameCount; i++) {
        if (cancelled) break;

        const offlineCtx = new OfflineAudioContext(
          decoded.numberOfChannels,
          fftSize,
          sampleRate
        );

        const buffer = offlineCtx.createBuffer(
          decoded.numberOfChannels,
          fftSize,
          sampleRate
        );

        for (let ch = 0; ch < decoded.numberOfChannels; ch++) {
          const channelData = decoded
            .getChannelData(ch)
            .subarray(i * hopSize, i * hopSize + fftSize);
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

        ampsFrames.push(
          calculateAmpsForPerformanceMode(Array.from(dataArray), PerformanceMode.High)
        );
      }

      intensityFramesRef.current = intensityFrames;
      ampsFramesRef.current = ampsFrames;
      visualAmpsRef.current = ampsFrames;
      frameMetaRef.current = { sampleRate, hopSize, frameCount };

      const audio = new Audio(URL.createObjectURL(file));
      audioRef.current = audio;

      const src = audioCtx.createMediaElementSource(audio);
      src.connect(audioCtx.destination);

      await audio.play();
      setIsPlaying(true);

      const tick = () => {
        if (!audioRef.current || !frameMetaRef.current || !ampsFramesRef.current) return;

        if (audioRef.current.paused) {
          setIntensity({
            prev: 0,
            current: 0
          });

          setAmps(new Array(ampsFramesRef.current[0].length).fill(0));
          animationFrameRef.current = requestAnimationFrame(tick);
          return;
        }

        const { sampleRate, hopSize, frameCount } = frameMetaRef.current;
        const currentTime = audioRef.current.currentTime;
        setCurrentTime(currentTime);

        const exactFrame = (currentTime * sampleRate) / hopSize;
        const currentIdx = Math.floor(exactFrame);
        const nextIdx = Math.min(currentIdx + 1, frameCount - 1);

        const t = exactFrame - currentIdx;

        if (currentIdx >= frameCount) return;

        const intensityA = intensityFramesRef.current![currentIdx];
        const intensityB = intensityFramesRef.current![nextIdx];

        setIntensity({
          prev: intensityA.current,
          current: intensityA.current + (intensityB.current - intensityA.current) * t
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
    {
      path: '/signature/gradient',
      label: 'Gradient Design',
      color: 'bg-gradient-to-tr from-pink-500 to-yellow-500',
      icon: Icons.Circle
    },
    {
      path: '/signature/concentric-rings',
      label: 'Concentric Circles',
      color: 'bg-slate-800',
      icon: Icons.Rotate3D
    },
  ];

  return (
    <div className="relative bg-transparent flex">
      <nav className="fixed top-5 left-6 z-50 flex flex-col items-center gap-4 px-2.5 py-5 rounded-full shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] border border-white/20">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <div key={item.path} className="group relative flex items-center bg-transparent">
              <motion.button
                onClick={() => navigate(item.path)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`relative w-6 h-6 md:w-12 md:h-12 flex items-center justify-center rounded-full transition-colors duration-200 bg-transparent ${isActive ? 'text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <div>
                  <item.icon className='w-3 md:w-5 h-auto' />
                </div>

                {isActive ? (
                  <motion.div
                    layoutId="activeDot"
                    className="absolute w-6 h-6 md:w-12 md:h-12 border border-white-500 rounded-full"
                  />
                ) : <></>}
              </motion.button>
            </div>
          );
        })}
      </nav>

      <main className="flex-1">
        <Outlet />

        <div className="absolute bottom-4 z-20 w-screen flex flex-row justify-center">
          <AudioControls
            audioRef={audioRef}
            isPlaying={isPlaying}
            currentTime={currentTime}
            onToggle={togglePlay}
          />
        </div>

        <SocialSidebar />
      </main>
    </div>
  );
};