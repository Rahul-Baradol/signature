import { Outlet } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { SocialSidebar } from '@/components/social-sidebar';
import { motion } from 'framer-motion';
import { MaximizeIcon, Mic, MinimizeIcon } from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import { calculateAmpsForPerformanceMode, PerformanceMode } from '@/utils/performance-mode-util';
import { calculateIntensityFrame } from '@/utils/visualizer-util';
import { easeInOut, gaussian, step } from '@/utils/math';
import { StudioPanel } from '@/components/studio-panel';

export const StudioLayout = () => {
    const { studioMode, intensity, setAmps, setIntensity, microphonePermission, setMicrophonePermission } = useAppStore();

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

    function tick() {
        if (!analyserRef.current) {
            return;
        }

        const buffer = new Uint8Array(analyserRef.current.frequencyBinCount);
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

    const sweepGradients = () => {
        const duration = 2000;
        const max = 255;
        const bins = 64;

        let startTime: number | null = null;

        const sweep = (timestamp: number) => {
            if (!startTime) startTime = timestamp;

            const elapsed = timestamp - startTime;
            const rawProgress = Math.min(elapsed / duration, 1);
            const progress = easeInOut(rawProgress);

            const center = progress * (bins - 1);
            const maxValue = max * progress;

            const sweepyGradients = new Array(bins).fill(0);

            for (let i = 0; i < bins; i++) {
                const dist = i - center;

                const energy = gaussian(dist, 3);
                const shimmer = 0.85 + Math.random() * 0.15;

                sweepyGradients[i] = Math.floor(
                    energy * maxValue * shimmer
                );
            }

            setAmps(sweepyGradients);

            if (rawProgress < 1) {
                rafRef.current = requestAnimationFrame(sweep);
            } else {
                setMicrophonePermission("granted");
                tick();
            }
        };


        rafRef.current = requestAnimationFrame(() => sweep(performance.now()));
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

            audioCtxRef.current = audioCtx;
            analyserRef.current = analyser;

            setMicrophonePermission("loading");
            sweepGradients();
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
        if (studioMode === "metronome") {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }

            setAmps([]);
            setIntensity({
                prev: 0,
                current: 0
            })
        }

        if (studioMode === "openmic" && microphonePermission === "granted") {
            tick();
        }
    }, [studioMode])

    useEffect(() => {
        if (microphonePermission != "granted") {
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
    }, [microphonePermission, setAmps]);

    return (
        <div
            ref={containerRef}
            className="relative h-screen w-screen bg-black overflow-hidden text-white "
        >
            {(microphonePermission != "granted" && studioMode != "metronome") ? (
                <motion.button
                    initial={{ opacity: 0, y: 20, x: "-50%" }}
                    animate={{ opacity: (microphonePermission === "loading" ? 0.5 : 1), y: 0, x: "-50%" }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={microphonePermission === "loading"
                        ? {
                            scale: 1.05,
                            backgroundColor: "black",
                        }
                        : {
                            scale: 1.05,
                            backgroundColor: "white",
                            color: "black",
                            boxShadow: "0px 0px 20px rgba(255, 255, 255, 0.3)",
                        }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    onClick={requestMic}
                    className={`group absolute w-[240px] h-[50px] bottom-20 left-1/2 z-50
                 flex items-center justify-center gap-2 
                 rounded-full bg-black text-white text-sm font-semibold shadow-xl border border-white cursor-pointer
                 `}
                >
                    {
                        (microphonePermission == "denied" || microphonePermission == "prompt") ? <>
                            <motion.span
                                className='group-hover:-rotate-10 transition-transform duration-750'
                            >
                                <Mic className='text-xs' />
                            </motion.span>
                            <span>Enable Microphone</span>
                        </> : <>
                            <motion.span
                                className='group-hover:-rotate-10 transition-transform duration-750'
                            >
                                <Mic className='text-xs' />
                            </motion.span>
                            <span>Enabling Microphone...</span>
                        </>
                    }
                </motion.button>
            ) : null}

            <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full w-full flex"
            >
                <main className="flex-1 relative">
                    <Outlet />

                    <div className='flex flex-col items-center gap-5 absolute top-6 left-6'>
                        <motion.button
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.15)" }}
                            whileTap={{ scale: 0.9 }}
                            onClick={toggleFullscreen}
                            className="z-50 p-2 rounded-full bg-black/20 backdrop-blur-md border border-white/10 transition-all shadow-lg"
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
                        <div className='w-4/5 border border-white/30'></div>
                        <StudioPanel />
                    </div>

                    {!isFullscreen ? <SocialSidebar /> : <></>}
                </main>
            </motion.div>
        </div>
    );
};