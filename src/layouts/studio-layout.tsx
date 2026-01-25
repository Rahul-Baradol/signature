import { Outlet } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { SocialSidebar } from '@/components/social-sidebar';
import { motion } from 'framer-motion';
import { MaximizeIcon, Mic, MinimizeIcon } from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import { calculateAmpsForPerformanceMode, PerformanceMode } from '@/utils/performance-mode-util';
import { calculateIntensityFrame } from '@/utils/visualizer-util';
import { step } from '@/utils/math';

export const StudioLayout = () => {
    const { intensity, setAmps, setIntensity, hasMicrophonePermission, setHasMicrophonePermission } = useAppStore();

    const containerRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const audioCtxRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const rafRef = useRef<number | null>(null);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen().catch((err) => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const requestMic = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            const audioCtx = new AudioContext();
            await audioCtx.resume(); // IMPORTANT for iOS

            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 512;

            const source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);

            // store refs
            audioCtxRef.current = audioCtx;
            analyserRef.current = analyser;

            setHasMicrophonePermission(true);
        } catch (e) {
            console.error('Mic denied', e);
            alert('Unable to access microphone');
        }
    };

    useEffect(() => {
        const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFsChange);
        return () => document.removeEventListener('fullscreenchange', handleFsChange);
    }, []);

    useEffect(() => {
        if (!hasMicrophonePermission) {
            return;
        }

        let isMounted = true;

        const initMic = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

                if (!isMounted) {
                    return;
                }

                const audioCtx = new AudioContext();
                audioCtxRef.current = audioCtx;

                const analyser = audioCtx.createAnalyser();
                analyser.fftSize = 512; // tweak as needed
                analyser.smoothingTimeConstant = 0.85;

                analyserRef.current = analyser;

                const source = audioCtx.createMediaStreamSource(stream);
                sourceRef.current = source;

                source.connect(analyser);

                const buffer = new Uint8Array(analyser.frequencyBinCount);

                const tick = () => {
                    if (!analyserRef.current) {
                        return;
                    }

                    analyserRef.current.getByteFrequencyData(buffer);
                    setAmps(
                        calculateAmpsForPerformanceMode(Array.from(buffer), PerformanceMode.High)
                    );

                    const effectiveIntensity = calculateIntensityFrame(buffer);
                    const pushDirection = (effectiveIntensity > intensity.prev) ? 1 : -1;
                    const currentIntensity = step(effectiveIntensity, pushDirection);

                    setIntensity({
                        prev: intensity.current,
                        current: currentIntensity
                    });

                    rafRef.current = requestAnimationFrame(tick);
                };

                tick();
            } catch (err) {
                console.error('Mic init failed', err);
            }
        };

        initMic();

        return () => {
            isMounted = false;

            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            analyserRef.current?.disconnect();
            sourceRef.current?.disconnect();
            audioCtxRef.current?.close();

            analyserRef.current = null;
            sourceRef.current = null;
            audioCtxRef.current = null;
        };
    }, [hasMicrophonePermission, setAmps]);

    // const navItems = [
    //   { path: '/signature/gradient', label: 'Gradient', icon: Icons.Circle },
    //   { path: '/signature/concentric-rings', label: 'Rings', icon: Icons.Rotate3D },
    // ];

    return (
        <div
            ref={containerRef}
            className="relative h-screen w-screen bg-black overflow-hidden text-white "
        >
            {!hasMicrophonePermission && (
                <motion.button
                    initial={{ opacity: 0, y: 20, x: "-50%" }}
                    animate={{ opacity: 1, y: 0, x: "-50%" }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{
                        scale: 1.05,
                        backgroundColor: "white",
                        color: "black",
                        boxShadow: "0px 0px 20px rgba(255, 255, 255, 0.3)"
                    }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    onClick={requestMic}
                    className="group absolute bottom-20 left-1/2 z-50
                 flex items-center gap-2 px-6 py-3 
                 rounded-full bg-black text-white text-sm font-semibold shadow-xl border border-white cursor-pointer"
                >
                    <motion.span
                        className='group-hover:-rotate-10 transition-transform duration-750'
                    >
                        <Mic className='text-xs' />
                    </motion.span>
                    Enable Microphone
                </motion.button>
            )}

            <motion.button
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.15)" }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleFullscreen}
                className="absolute top-6 left-6 z-50 p-2 rounded-full bg-black/20 backdrop-blur-md border border-white/10 transition-all shadow-lg"
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
                <motion.div
                    key={isFullscreen ? "minimize" : "maximize"}
                    initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.2, type: "spring", stiffness: 300, damping: 20 }}
                >
                    {isFullscreen ? (
                        <MinimizeIcon className="w-5 h-5" />
                    ) : (
                        <MaximizeIcon className="w-5 h-5" />
                    )}
                </motion.div>
            </motion.button>

            <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full w-full flex"
            >
                <main className="flex-1 relative">
                    <Outlet />

                    {!isFullscreen ? <SocialSidebar /> : <></>}
                </main>
            </motion.div>
        </div>
    );
};