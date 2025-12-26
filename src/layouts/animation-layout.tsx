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

  const { file, isPlaying, currentTime, intensity, setIsPlaying, setAmps, setCurrentTime, setIntensity } = useAppStore();

  const togglePlay = () => {
    if (!audioRef.current) {
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const historyRef = useRef<number[]>([]);
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (file) {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = audioCtx;

      const reader = new FileReader();
      reader.onload = async (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const decodedData = await audioCtx.decodeAudioData(arrayBuffer);

        const offlineCtx = new OfflineAudioContext(
          decodedData.numberOfChannels,
          decodedData.length,
          decodedData.sampleRate
        );
        const offlineSource = offlineCtx.createBufferSource();
        offlineSource.buffer = decodedData;
        const offlineAnalyser = offlineCtx.createAnalyser();
        offlineAnalyser.fftSize = 512;
        offlineSource.connect(offlineAnalyser);
        offlineAnalyser.connect(offlineCtx.destination);
        offlineSource.start();

        const audio = new Audio(URL.createObjectURL(file));
        audioRef.current = audio;
        const liveSource = audioCtx.createMediaElementSource(audio);
        const liveAnalyser = audioCtx.createAnalyser();
        liveAnalyser.fftSize = 512;
        const dataArray = new Uint8Array(liveAnalyser.frequencyBinCount);

        liveSource.connect(liveAnalyser);
        liveAnalyser.connect(audioCtx.destination);
        analyzerRef.current = liveAnalyser;

        audio.play();
        setIsPlaying(true);

        const process = () => {
          if (!analyzerRef.current || !audioRef.current) return;

          setCurrentTime(audioRef.current.currentTime);
          analyzerRef.current.getByteFrequencyData(dataArray);

          const lowCount = Math.floor(dataArray.length * 0.5);
          const midCount = Math.floor(dataArray.length * 0.30);

          const rmsRange = (arr: Uint8Array, start: number, end: number) => {
            let sumSq = 0;
            for (let i = Math.floor(start); i < Math.floor(end); i++) {
              sumSq += arr[i];
            }
            return sumSq / (end - start);
          };

          const avgLow = rmsRange(dataArray, 0, lowCount);
          const avgMid = rmsRange(dataArray, lowCount, lowCount + midCount);
          const avgHigh = rmsRange(dataArray, lowCount + midCount, dataArray.length);

          const eff = Math.max(avgLow, avgMid, avgHigh) / 255;

          historyRef.current = [...historyRef.current, eff].slice(-60);

          let avg = eff;
          if (historyRef.current.length === 60) {
            const minIntensity = Math.min(...historyRef.current);
            const maxIntensity = Math.max(...historyRef.current);
            if (maxIntensity - minIntensity == 0) {
              avg = 0;
            } else {
              avg = (eff - minIntensity) / (maxIntensity - minIntensity);
              avg = Math.min(Math.max(avg, 0), 1);
            }
          }

          setAmps(calculateAmpsForPerformanceMode(Array.from(dataArray), PerformanceMode.High));

          const pushDirection = avg > intensity.current ? 1 : -1;
          setIntensity({
            prev: intensity.current,
            current: Math.min(pushDirection * 0.075 * avg + avg, 1),
          });

          animationFrameRef.current = requestAnimationFrame(process);
        };

        animationFrameRef.current = requestAnimationFrame(process);
      };

      reader.readAsArrayBuffer(file);

      return () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        reader.abort();
        audioRef.current?.pause();
        audioCtxRef.current?.close();
        setAmps([]);
        setIntensity({ prev: 0, current: 0 });
        setCurrentTime(0);
      };
    } else {
      navigate('/');
    }
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