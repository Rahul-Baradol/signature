import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { SocialSidebar } from '@/components/social-sidebar';
import { motion } from 'framer-motion';
import { CircleHelp, House, LoaderCircle, MaximizeIcon, Mic, MinimizeIcon, Monitor } from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import { calculateAmpsForPerformanceMode, PerformanceMode } from '@/utils/performance-mode-util';
import { calculateIntensityFrame } from '@/utils/visualizer-util';
import { easeInOut, gaussian, step } from '@/utils/math';
import { StudioPanel } from '@/components/studio-panel';
import { StudioHelpPanel } from '@/components/studio-help-panel';
import { StudioActivationStatus, type Loop } from '@/store/schema';

export const StudioLayout = () => {
    const { activateStudio, count, timeSignature, bpm, studioMode, intensity, setAmps, setBpm, setIntensity, microphonePermission, setMicrophonePermission, isMetronomeActive, looperState, loops, addLoop, setLooperState, setIsMetronomeActive, setTimeSignature, loopBarCount, setLoopBarCount, openmicRecorderState, setOpenmicRecorderState, setOpenmicRecording } = useAppStore();

    const navigate = useNavigate();
    const containerRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isHelpOpen, setIsHelpOpen] = useState(() => !localStorage.getItem('studio_help_seen'));

    const closeHelp = () => {
        localStorage.setItem('studio_help_seen', 'true');
        setIsHelpOpen(false);
    };

    const audioCtxRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    const workletNodeRef = useRef<AudioWorkletNode | null>(null);
    const recordedChunks = useRef<Float32Array[]>([]);

    const loopIntervalId = useRef<NodeJS.Timeout[]>([]);
    const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
    const recordedBarsCount = useRef<number>(0);

    const startRecording = async () => {
        if (!audioCtxRef.current) {
            return;
        }

        await audioCtxRef.current.audioWorklet.addModule('/recorder-processor.js');

        const workletNode = new AudioWorkletNode(audioCtxRef.current, 'recorder-processor');

        workletNode.port.onmessage = (e) => {
            if (e.data.command === 'DATA') {
                recordedChunks.current.push(new Float32Array(e.data.buffer));
            }
        };

        sourceRef.current?.connect(workletNode);

        workletNode.port.postMessage({ command: 'START' });
        workletNodeRef.current = workletNode;
    };

    const finalizeRecordedBuffer = (): AudioBuffer | null => {
        if (audioCtxRef.current == null || workletNodeRef.current == null) {
            return null;
        }
        workletNodeRef.current.port.postMessage({ command: 'STOP' });

        const totalLength = recordedChunks.current.reduce((acc, chunk) => acc + chunk.length, 0);
        if (totalLength === 0) {
            recordedChunks.current = [];
            return null;
        }

        const audioBuffer = audioCtxRef.current.createBuffer(
            1,
            totalLength,
            audioCtxRef.current.sampleRate
        );

        const channelData = audioBuffer.getChannelData(0);
        let offset = 0;
        for (const chunk of recordedChunks.current) {
            channelData.set(chunk, offset);
            offset += chunk.length;
        }

        recordedChunks.current = [];
        return audioBuffer;
    };

    const stopRecording = () => {
        const audioBuffer = finalizeRecordedBuffer();
        if (!audioBuffer) {
            return;
        }

        const newLoop: Loop = {
            name: `Loop ${loops.length + 1}`,
            timesignature: timeSignature,
            bpm: bpm,
            barCount: loopBarCount,
            muted: false,
            recordedBuffer: audioBuffer
        };

        addLoop(newLoop);

        setLooperState("playing");
        setIsMetronomeActive(true);
    };

    const stopOpenmicRecording = () => {
        const audioBuffer = finalizeRecordedBuffer();
        setOpenmicRecording(audioBuffer);
        setOpenmicRecorderState(audioBuffer ? "recorded" : "idle");
    };

    const playAndLoopAllBars = () => {
        if (loopIntervalId.current) {
            loopIntervalId.current.forEach(clearInterval);
            loopIntervalId.current = [];
        }

        const context = audioCtxRef.current;
        const mainAnalyser = analyserRef.current;

        if (!context || !mainAnalyser || loops.length === 0) {
            return;
        }

        const mixer = context.createGain();
        mixer.connect(mainAnalyser);
        mixer.connect(context.destination);

        let beatTimeInSecond = (60 / bpm);
        if (timeSignature === "6/8") {
            beatTimeInSecond /= 2;
        }

        let barDurationInSecond: number;
        if (timeSignature == "4/4") {
            barDurationInSecond = beatTimeInSecond * 4;
        } else if (timeSignature == "3/4") {
            barDurationInSecond = beatTimeInSecond * 3;
        } else if (timeSignature == "2/4") {
            barDurationInSecond = beatTimeInSecond * 2;
        } else if (timeSignature === "6/8") {
            barDurationInSecond = beatTimeInSecond * 6;
        }

        const scheduleLoop = (startTime: number, loopIndex: number) => {
            const concernedLoop = loops[loopIndex];

            if (!concernedLoop.recordedBuffer || concernedLoop.muted) {
                return;
            }

            const source = context.createBufferSource();
            activeSourcesRef.current.push(source);

            source.buffer = concernedLoop.recordedBuffer;
            source.connect(mixer);
            source.start(startTime);
        }

        const currentTime = context.currentTime;

        activeSourcesRef.current = [];
        loops.forEach((loop: Loop, loopIndex: number) => {
            scheduleLoop(currentTime + beatTimeInSecond, loopIndex);

            const loopDurationInSecond = barDurationInSecond ? (barDurationInSecond * loop.barCount) : undefined;
            if (loopDurationInSecond && beatTimeInSecond) {
                const intervalId = setInterval(() => {
                    scheduleLoop(context.currentTime + beatTimeInSecond, loopIndex);
                }, loopDurationInSecond * 1000);

                if (loopIntervalId.current) {
                    loopIntervalId.current.push(intervalId);
                }
            }
        });
    };

    const stopAllBars = () => {
        if (loopIntervalId.current) {
            loopIntervalId.current.forEach(clearInterval);
        }
        loopIntervalId.current = [];

        activeSourcesRef.current.forEach(src => {
            try { src.stop(); } catch { }
        });

        activeSourcesRef.current = [];
        setLooperState("idle");
    };

    useEffect(() => {
        if (count == 1) {
            switch (looperState) {
                case "ready-for-count-in":
                    setLooperState("count-in");
                    break;
                case "count-in":
                    recordedBarsCount.current = 0;
                    setLooperState("recording");
                    break;
                case "recording":
                    recordedBarsCount.current += 1;
                    if (recordedBarsCount.current >= loopBarCount) {
                        setLooperState("saving-recording");
                        setIsMetronomeActive(false);
                    }
                    break;
            }
        }
    }, [count])

    useEffect(() => {
        if (isMetronomeActive && looperState === "recording") {
            startRecording();
        } else if (!isMetronomeActive && looperState === "saving-recording") {
            stopRecording();
        } else if (isMetronomeActive && looperState === "playing") {
            playAndLoopAllBars();
        } else if (!isMetronomeActive && looperState === "stop-playing") {
            stopAllBars();
            setIsMetronomeActive(false);
        }
    }, [isMetronomeActive, looperState])

    useEffect(() => {
        if (openmicRecorderState === "recording") {
            startRecording();
        } else if (openmicRecorderState === "stop-requested") {
            stopOpenmicRecording();
        }
    }, [openmicRecorderState])

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

        animationFrameRef.current = requestAnimationFrame(tick);
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
                animationFrameRef.current = requestAnimationFrame(sweep);
            } else {
                setMicrophonePermission("granted");
                tick();
            }
        };

        animationFrameRef.current = requestAnimationFrame(() => sweep(performance.now()));
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

        return () => {
            document.removeEventListener('fullscreenchange', handleFsChange);
        }
    }, []);

    useEffect(() => {
        if (studioMode === "metronome") {
            setAmps([]);
            setIntensity({
                prev: 0,
                current: 0
            })
        } else if ((studioMode === "openmic" || studioMode === "looper") && microphonePermission === "granted") {
            tick();
        }

        if (studioMode !== "openmic" && openmicRecorderState !== "idle") {
            if (openmicRecorderState === "recording") {
                workletNodeRef.current?.port.postMessage({ command: 'STOP' });
                recordedChunks.current = [];
            }
            setOpenmicRecorderState("idle");
            setOpenmicRecording(null);
        }

        if (studioMode === "looper" && loops.length > 0) {
            setBpm(loops[0].bpm);
            setTimeSignature(loops[0].timesignature);
            setLoopBarCount(loops[0].barCount);
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
        };
    }, [studioMode]);

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

                // On remount with already-granted permission the studioMode effect
                // fires before analyserRef is ready and tick() returns early.
                // Start the loop here once the analyser is wired up.
                if (!animationFrameRef.current) {
                    tick();
                }
            } catch (err) {
                console.error('Mic init failed', err);
            }
        };

        initMic();

        return () => {
            isMounted = false;

            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
            analyserRef.current?.disconnect();
            sourceRef.current?.disconnect();
            audioCtxRef.current?.close();

            analyserRef.current = null;
            sourceRef.current = null;
            audioCtxRef.current = null;
        };
    }, [microphonePermission]);

    const isMobile = /iPhone|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;

    if (isMobile) {
        return (
            <div className="h-screen w-screen bg-black flex flex-col items-center justify-center gap-5 px-8 text-center">
                <Monitor className="w-10 h-10 text-white/50" />
                <div className="flex flex-col gap-2">
                    <span className="text-base font-semibold text-white">Open on Desktop</span>
                    <span className="text-sm text-white/50 max-w-xs">
                        Studio is designed for desktop and laptop screens. Please visit on a larger device for the best experience.
                    </span>
                </div>
            </div>
        );
    }

    if (activateStudio === StudioActivationStatus.LOADING) {
        return (
            <div className="h-screen w-screen bg-black flex items-center justify-center gap-2">
                <span className='text-sm italic'>Profiling Your Device's Capabilities</span>
                <LoaderCircle className="animate-spin" />
            </div>
        )
    }

    if (activateStudio === StudioActivationStatus.INACTIVE) {
        return (
            <div className="h-screen w-screen bg-black flex items-center justify-center gap-2">
                <span className='text-sm italic'>Nice try, but hardware doesn't support yet :(</span>
            </div>
        )
    }

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
                    disabled={microphonePermission === "loading"}
                    className={`group absolute w-60 h-12.5 bottom-20 left-1/2 z-50
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
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: isMetronomeActive ? 0.4 : 1, scale: 1 }}
                            whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.15)" }}
                            whileTap={{ scale: 0.9 }}
                            className="z-50 p-2 rounded-full bg-black/20 backdrop-blur-md border border-white/10 transition-all shadow-lg cursor-pointer"
                            title={"Home"}
                            onClick={(() => {
                                navigate("/")
                            })}
                            disabled={isMetronomeActive}
                        >
                            <House className="w-4.5 h-4.5 text-white" />
                        </motion.button>

                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.15)" }}
                            whileTap={{ scale: 0.9 }}
                            onClick={toggleFullscreen}
                            className="z-50 p-2 rounded-full bg-black/20 backdrop-blur-md border border-white/10 transition-all shadow-lg cursor-pointer"
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
                        <div className='w-4/5 border border-white/30'></div>
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.1, backgroundColor: isHelpOpen ? "rgba(255,255,255,0.2)" : "rgba(255, 255, 255, 0.15)" }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => isHelpOpen ? closeHelp() : setIsHelpOpen(true)}
                            className="z-50 p-2 rounded-full bg-black/20 backdrop-blur-md border border-white/10 transition-all shadow-lg cursor-pointer"
                            title="Help"
                        >
                            <CircleHelp className="w-4.5 h-4.5 text-white" />
                        </motion.button>
                    </div>

                    <StudioHelpPanel
                        isOpen={isHelpOpen}
                        onClose={closeHelp}
                        studioMode={studioMode}
                    />


                    {!isFullscreen ? <SocialSidebar /> : <></>}
                </main>
            </motion.div>
        </div>
    );
};