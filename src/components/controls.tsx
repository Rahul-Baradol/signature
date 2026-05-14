import { motion, AnimatePresence } from "framer-motion";
import { TIME_SIGNATURES } from "@/store/schema";
import { useAppStore } from "@/store/use-app-store";
import { useEffect, useRef, useState } from "react";
import { Play, Settings, Square, Circle, MicOff, Mic, Trash, Save, FolderOpen, Headphones, LoaderCircle, Zap } from "lucide-react";
import { serializeLooperState, deserializeLooperState } from "@/utils/looper-file-util";
import { exportLoopsToMp3 } from "@/utils/export-mp3-util";

export function MetronomeControls() {
    const {
        studioMode,
        looperState,
        isMetronomeActive,
        bpm,
        timeSignature,
        loops,
        loopBarCount,
        removeLoop,
        setLoops,
        setBpm,
        setLooperState,
        setTimeSignature,
        setIsMetronomeActive,
        setCount,
        setIntensity,
        setLoopBarCount,
        setIsBpmDetecting,
    } = useAppStore();

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const metronomeIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [saveModalOpen, setSaveModalOpen] = useState(false);
    const [saveName, setSaveName] = useState("");
    const [exportMp3ModalOpen, setExportMp3ModalOpen] = useState(false);
    const [exportMp3Name, setExportMp3Name] = useState("");
    const [exportMp3Bars, setExportMp3Bars] = useState(8);
    const [isExportingMp3, setIsExportingMp3] = useState(false);
    const [exportMp3Progress, setExportMp3Progress] = useState(0);

    const [bpmDetectPhase, setBpmDetectPhase] = useState<"idle" | "countdown" | "recording" | "result" | "error">("idle");
    const [bpmDetectCountdown, setBpmDetectCountdown] = useState(4);
    const [detectedBpm, setDetectedBpm] = useState<number | null>(null);
    const bpmDetectActive = useRef(false);
    const bpmDetectTimerRef = useRef<NodeJS.Timeout | null>(null);

    const barsDivReference = useRef<HTMLDivElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const saveInputRef = useRef<HTMLInputElement | null>(null);

    const handleSave = () => {
        setSaveName("");
        setSaveModalOpen(true);
        setTimeout(() => saveInputRef.current?.focus(), 50);
    };

    const handleExportMp3 = () => {
        setExportMp3Name("");
        setExportMp3Bars(8);
        setExportMp3Progress(0);
        setExportMp3ModalOpen(true);
    };

    const commitExportMp3 = async () => {
        const filename = exportMp3Name.trim() || "my-session";
        setIsExportingMp3(true);
        setExportMp3Progress(0);
        await exportLoopsToMp3({
            loops,
            bpm,
            timeSignature,
            exportBars: exportMp3Bars,
            filename,
            onProgress: setExportMp3Progress,
        });
        setIsExportingMp3(false);
        setExportMp3ModalOpen(false);
    };

    const commitSave = () => {
        const filename = saveName.trim() || "my-session";
        const json = serializeLooperState(loops, bpm, timeSignature, loopBarCount);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${filename}.signature`;
        a.click();
        URL.revokeObjectURL(url);
        setSaveModalOpen(false);
    };

    const handleLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = "";

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = event.target?.result as string;
                const state = deserializeLooperState(json);
                setLoops(state.loops);
                setBpm(state.bpm);
                setTimeSignature(state.timeSignature);
                setLoopBarCount(state.loopBarCount);
            } catch {
                alert("Failed to load file — it may be corrupted or not a valid .signature file.");
            }
        };
        reader.readAsText(file);
    };

    const toggleMuteLoop = async (index: number) => {
        const updatedLoops = loops.map((loop, i) => {
            if (i === index) {
                return { ...loop, muted: !loop.muted };
            }
            return loop;
        });
        setLoops(updatedLoops);
    }

    const updateLoopName = (index: number, newName: string) => {
        const updatedLoops = loops.map((loop, i) =>
            i === index ? { ...loop, name: newName } : loop
        );
        setLoops(updatedLoops);
    }

    useEffect(() => {
        if (barsDivReference.current) {
            barsDivReference.current.scrollTop = 0;
        }
    }, [loops])

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.code === "Space") {
                e.preventDefault();
                toggleMetronome();
            }
        };

        if (studioMode === "metronome") {
            window.addEventListener("keydown", onKeyDown);
        }

        return () => window.removeEventListener("keydown", onKeyDown);
    }, [studioMode]);

    function getNewCount(currentCount: number): number {
        let newCount = currentCount + 1;
        switch (timeSignature) {
            case "2/4":
                return (newCount <= 2) ? newCount : 1;
            case "3/4":
                return (newCount <= 3) ? newCount : 1;
            case "4/4":
                return (newCount <= 4) ? newCount : 1;
            case "6/8":
                return (newCount <= 6) ? newCount : 1;
        }
    }

    useEffect(() => {
        if (metronomeIntervalRef.current) {
            clearInterval(metronomeIntervalRef.current);
            metronomeIntervalRef.current = null;
        }

        if (!isMetronomeActive) {
            setCount(0);
            setIntensity({ prev: 0, current: 0 });
            return;
        }

        let lengthOfABeat = (60 / bpm) * 1000;
        if (timeSignature === "6/8") {
            lengthOfABeat /= 2;
        }

        const intervalId = setInterval(() => {
            const { count } = useAppStore.getState();
            setCount(getNewCount(count));
        }, lengthOfABeat);

        metronomeIntervalRef.current = intervalId;

        return () => {
            clearInterval(intervalId);
            metronomeIntervalRef.current = null;
        };
    }, [isMetronomeActive])

    const disableMeterControls = () => {
        let shouldBeDisabled = isMetronomeActive;
        if (studioMode === "looper") {
            shouldBeDisabled = shouldBeDisabled || (loops.length > 0 || looperState !== "idle");
        }
        return shouldBeDisabled;
    };

    const disablePlay = () => {
        return isMetronomeActive && looperState !== "playing";
    }

    const disableRecord = () => {
        return isMetronomeActive && looperState !== "recording";
    }

    const disableSettings = () => {
        return isMetronomeActive || looperState !== "idle";
    }

    const disableLoopControls = () => {
        return isMetronomeActive || looperState !== "idle";
    }

    const toggleMetronome = () => {
        const { isMetronomeActive: isMetronomeActiveTmp } = useAppStore.getState();
        setIsMetronomeActive(!isMetronomeActiveTmp);
    }

    const resetBpmDetect = () => {
        bpmDetectActive.current = false;
        if (bpmDetectTimerRef.current) clearInterval(bpmDetectTimerRef.current);
        setIsMetronomeActive(false);
        setIsBpmDetecting(false);
        setBpmDetectPhase("idle");
        setDetectedBpm(null);
        setBpmDetectCountdown(4);
    };

    const applyDetectedBpm = () => {
        if (detectedBpm !== null) setBpm(detectedBpm);
        resetBpmDetect();
    };

    const startRecordingPhase = async () => {
        setBpmDetectPhase("recording");
        setBpmDetectCountdown(4);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const audioCtx = new AudioContext();
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 1024;
            source.connect(analyser);

            const dataArray = new Float32Array(analyser.fftSize);
            let beatCount = 0;
            let lastBeatTime = 0;
            const minBeatInterval = 200;
            const startTime = performance.now();

            let countdownVal = 4;
            bpmDetectTimerRef.current = setInterval(() => {
                countdownVal--;
                setBpmDetectCountdown(Math.max(0, countdownVal));
                if (countdownVal <= 0 && bpmDetectTimerRef.current) {
                    clearInterval(bpmDetectTimerRef.current);
                }
            }, 1000);

            let threshold = 0.05;
            let calibrationDone = false;
            const calibrationSamples: number[] = [];

            const stopAndAnalyze = () => {
                stream.getTracks().forEach(t => t.stop());
                audioCtx.close();
                if (bpmDetectTimerRef.current) {
                    clearInterval(bpmDetectTimerRef.current);
                }
                const bpm = Math.round((beatCount / 4) * 60);
                setDetectedBpm(Math.max(40, Math.min(240, bpm)));
                setBpmDetectPhase("result");
            };

            const detect = () => {
                if (!bpmDetectActive.current) {
                    stream.getTracks().forEach(t => t.stop());
                    audioCtx.close();
                    return;
                }

                const now = performance.now();
                const elapsed = now - startTime;

                analyser.getFloatTimeDomainData(dataArray);
                let rms = 0;
                for (let i = 0; i < dataArray.length; i++) {
                    rms += dataArray[i] * dataArray[i];
                }
                rms = Math.sqrt(rms / dataArray.length);

                if (elapsed < 500) {
                    calibrationSamples.push(rms);
                } else if (!calibrationDone) {
                    const avg = calibrationSamples.reduce((a, b) => a + b, 0) / Math.max(calibrationSamples.length, 1);
                    threshold = Math.max(avg * 2.5, 0.03);
                    calibrationDone = true;
                }

                if (calibrationDone && rms > threshold && now - lastBeatTime > minBeatInterval) {
                    beatCount++;
                    lastBeatTime = now;
                }

                if (elapsed < 4000) {
                    requestAnimationFrame(detect);
                } else {
                    stopAndAnalyze();
                }
            };

            requestAnimationFrame(detect);
        } catch {
            setBpmDetectPhase("error");
        }
    };

    const startBpmDetect = () => {
        if (bpmDetectTimerRef.current) {
            clearInterval(bpmDetectTimerRef.current);
        }
        bpmDetectActive.current = true;
        setIsBpmDetecting(true);
        setDetectedBpm(null);
        setBpmDetectPhase("countdown");
        setBpmDetectCountdown(4);

        let count = 4;
        bpmDetectTimerRef.current = setInterval(() => {
            count--;
            setBpmDetectCountdown(count);
            if (count === 0) {
                if (bpmDetectTimerRef.current) {
                    clearInterval(bpmDetectTimerRef.current);
                }
                startRecordingPhase();
            }
        }, 1000);
    };

    const handleSetBpm = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.value.length > 3) {
            return;
        }

        const value = Number(e.target.value);
        if (!Number.isNaN(value) && value <= 240) {
            setBpm(value);
        }
    }

    const handlePlay = () => {
        setIsMetronomeActive(!isMetronomeActive)
        if (looperState === "idle") {
            setLooperState("playing");
        } else if (looperState === "playing") {
            setLooperState("stop-playing");
        }
    }

    const handleRecord = () => {
        if (looperState === "idle") {
            setLooperState("ready-for-count-in");
            setIsMetronomeActive(true);
        } else if (looperState === "recording") {
            setLooperState("saving-recording");
            setIsMetronomeActive(false);
        }
    }

    return (
        <>
            <AnimatePresence>
                {saveModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSaveModalOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-80"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.92, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: 16 }}
                            transition={{ type: "spring", damping: 22, stiffness: 260 }}
                            className="fixed inset-0 z-90 flex items-center justify-center pointer-events-none"
                        >
                            <div
                                onClick={(e) => e.stopPropagation()}
                                className="pointer-events-auto w-80 rounded-2xl bg-black/70 backdrop-blur-2xl border border-white/15 shadow-[0_0_40px_rgba(99,102,241,0.2)] p-7 flex flex-col gap-5"
                            >
                                <div className="flex flex-col gap-1">
                                    <p className="text-white/40 text-xs uppercase tracking-widest">drop it</p>
                                    <h2 className="text-white text-xl font-bold tracking-tight">Name this session</h2>
                                    <p className="text-white/50 text-xs mt-0.5">Your loops deserve a good name.</p>
                                </div>

                                <div className="flex items-center rounded-xl bg-white/5 border border-white/10 px-3 overflow-hidden focus-within:border-white/30 transition-colors">
                                    <input
                                        ref={saveInputRef}
                                        type="text"
                                        value={saveName}
                                        onChange={(e) => setSaveName(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === "Enter") commitSave(); if (e.key === "Escape") setSaveModalOpen(false); }}
                                        placeholder="late-night-banger"
                                        className="flex-1 bg-transparent text-white text-sm py-3 outline-none placeholder:text-white/20"
                                    />
                                    <span className="text-white/30 text-xs shrink-0">.signature</span>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setSaveModalOpen(false)}
                                        className="flex-1 py-2.5 rounded-xl text-sm text-white/50 border border-white/10 hover:bg-white/5 transition"
                                    >
                                        cancel
                                    </button>
                                    <button
                                        onClick={commitSave}
                                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-black bg-white hover:bg-white/90 transition"
                                    >
                                        save it
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {exportMp3ModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => { if (!isExportingMp3) setExportMp3ModalOpen(false); }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-80"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.92, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: 16 }}
                            transition={{ type: "spring", damping: 22, stiffness: 260 }}
                            className="fixed inset-0 z-90 flex items-center justify-center pointer-events-none"
                        >
                            <div
                                onClick={(e) => e.stopPropagation()}
                                className="pointer-events-auto w-80 rounded-2xl bg-black/70 backdrop-blur-2xl border border-white/15 shadow-[0_0_40px_rgba(99,102,241,0.2)] p-7 flex flex-col gap-5"
                            >
                                <div className="flex flex-col gap-1">
                                    <p className="text-white/40 text-xs uppercase tracking-widest">export</p>
                                    <h2 className="text-white text-xl font-bold tracking-tight">Export as MP3</h2>
                                    <p className="text-white/50 text-xs mt-0.5">Audio-only export, 128 kbps.</p>
                                </div>

                                <div className="flex items-center rounded-xl bg-white/5 border border-white/10 px-3 overflow-hidden focus-within:border-white/30 transition-colors">
                                    <input
                                        type="text"
                                        value={exportMp3Name}
                                        onChange={(e) => setExportMp3Name(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === "Enter" && !isExportingMp3) commitExportMp3(); if (e.key === "Escape" && !isExportingMp3) setExportMp3ModalOpen(false); }}
                                        placeholder="my-session"
                                        disabled={isExportingMp3}
                                        className="flex-1 bg-transparent text-white text-sm py-3 outline-none placeholder:text-white/20 disabled:opacity-50"
                                    />
                                    <span className="text-white/30 text-xs shrink-0">.mp3</span>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <span className="text-white/40 text-xs uppercase tracking-widest">Bars to export</span>
                                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10">
                                        <button
                                            onClick={() => setExportMp3Bars(Math.max(1, exportMp3Bars - 1))}
                                            disabled={isExportingMp3}
                                            className="text-white w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-lg"
                                        >-</button>
                                        <span className="flex-1 text-center text-white text-sm font-semibold">{exportMp3Bars} bars</span>
                                        <button
                                            onClick={() => setExportMp3Bars(Math.min(64, exportMp3Bars + 1))}
                                            disabled={isExportingMp3}
                                            className="text-white w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-lg"
                                        >+</button>
                                    </div>
                                </div>

                                {isExportingMp3 && (
                                    <div className="flex flex-col gap-2">
                                        <div className="flex justify-between text-xs text-white/40">
                                            <span>Exporting...</span>
                                            <span>{Math.round(exportMp3Progress * 100)}%</span>
                                        </div>
                                        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                                            <motion.div
                                                className="h-full rounded-full bg-indigo-400"
                                                animate={{ width: `${exportMp3Progress * 100}%` }}
                                                transition={{ ease: "linear" }}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setExportMp3ModalOpen(false)}
                                        disabled={isExportingMp3}
                                        className="flex-1 py-2.5 rounded-xl text-sm text-white/50 border border-white/10 hover:bg-white/5 transition disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        cancel
                                    </button>
                                    <button
                                        onClick={commitExportMp3}
                                        disabled={isExportingMp3}
                                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-black bg-white hover:bg-white/90 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isExportingMp3 ? <LoaderCircle className="w-4 h-4 animate-spin text-black" /> : <Headphones className="w-4 h-4" />}
                                        {isExportingMp3 ? "exporting..." : "export"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {bpmDetectPhase !== "idle" && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-80"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.92, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: 16 }}
                            transition={{ type: "spring", damping: 22, stiffness: 260 }}
                            className="fixed inset-0 z-90 flex items-center justify-center pointer-events-none"
                        >
                            <div className="pointer-events-auto w-80 rounded-2xl bg-black/70 backdrop-blur-2xl border border-white/15 shadow-[0_0_40px_rgba(99,102,241,0.2)] p-7 flex flex-col gap-5 items-center">
                                {bpmDetectPhase === "countdown" && (
                                    <>
                                        <p className="text-white/40 text-xs uppercase tracking-widest self-start">get ready</p>
                                        <motion.div
                                            key={bpmDetectCountdown}
                                            initial={{ scale: 1.5, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ type: "spring", damping: 18, stiffness: 300 }}
                                            className="text-8xl font-black text-white tabular-nums"
                                        >
                                            {bpmDetectCountdown}
                                        </motion.div>
                                        <p className="text-white/40 text-xs text-center tracking-wide">recording starts when this hits zero</p>
                                        <div className="w-full h-0.75 rounded-full bg-white/10 overflow-hidden">
                                            <motion.div
                                                key="countdown-progress"
                                                initial={{ width: "0%" }}
                                                animate={{ width: "100%" }}
                                                transition={{ duration: 4, ease: "linear" }}
                                                className="h-full rounded-full bg-white/50"
                                            />
                                        </div>
                                        <button onClick={resetBpmDetect} className="text-white/30 text-xs hover:text-white/60 transition">cancel</button>
                                    </>
                                )}
                                {bpmDetectPhase === "recording" && (
                                    <>
                                        <div className="flex items-center gap-2 self-start">
                                            <motion.span
                                                animate={{ opacity: [1, 0.2, 1] }}
                                                transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }}
                                                className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0"
                                            />
                                            <p className="text-red-400 text-xs uppercase tracking-widest font-semibold">recording</p>
                                        </div>
                                        <motion.div
                                            key={bpmDetectCountdown}
                                            initial={{ scale: 1.5, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ type: "spring", damping: 18, stiffness: 300 }}
                                            className="text-8xl font-black text-red-400 tabular-nums"
                                        >
                                            {bpmDetectCountdown}
                                        </motion.div>
                                        <p className="text-white/40 text-xs text-center tracking-wide">play your music — we're listening</p>
                                        <div className="w-full h-0.75 rounded-full bg-white/10 overflow-hidden">
                                            <motion.div
                                                key="recording-progress"
                                                initial={{ width: "0%" }}
                                                animate={{ width: "100%" }}
                                                transition={{ duration: 4, ease: "linear" }}
                                                className="h-full rounded-full bg-red-500"
                                            />
                                        </div>
                                        <button onClick={resetBpmDetect} className="text-white/30 text-xs hover:text-white/60 transition">cancel</button>
                                    </>
                                )}
                                {bpmDetectPhase === "result" && (
                                    <>
                                        <p className="text-white/40 text-xs uppercase tracking-widest self-start">detected tempo</p>
                                        <motion.div
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="text-8xl font-black text-white tabular-nums"
                                        >
                                            {detectedBpm}
                                        </motion.div>
                                        <p className="text-white/50 text-sm">BPM</p>
                                        <div className="flex gap-2 w-full">
                                            <button onClick={resetBpmDetect} className="flex-1 py-2.5 rounded-xl text-sm text-white/50 border border-white/10 hover:bg-white/5 transition">
                                                dismiss
                                            </button>
                                            <button onClick={startBpmDetect} className="flex-1 py-2.5 rounded-xl text-sm text-white/70 border border-white/10 hover:bg-white/5 transition">
                                                retry
                                            </button>
                                            <button onClick={applyDetectedBpm} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-black bg-white hover:bg-white/90 transition">
                                                apply
                                            </button>
                                        </div>
                                    </>
                                )}
                                {bpmDetectPhase === "error" && (
                                    <>
                                        <p className="text-white/40 text-xs uppercase tracking-widest">error</p>
                                        <h2 className="text-white text-xl font-bold">Mic access denied</h2>
                                        <p className="text-white/50 text-sm text-center">Allow microphone access to detect BPM</p>
                                        <button onClick={resetBpmDetect} className="w-full py-2.5 rounded-xl text-sm font-semibold text-black bg-white hover:bg-white/90 transition mt-1">
                                            ok
                                        </button>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {(studioMode === "metronome") && (
                <div className="hidden lg:block absolute bottom-20 left-1/2 -translate-x-1/2 z-50 text-sm font-medium text-white/80">
                    Press <span className="px-2 py-1 rounded bg-white/10">Space</span> to toggle {studioMode}
                </div>
            )}

            <div className="hidden lg:flex flex-row justify-center absolute top-0 left-0 w-screen overflow-hidden py-6">
                <motion.div className="flex flex-row items-center gap-4 z-5 rounded-full">
                    <div className="flex flex-row items-center gap-1 px-4 py-3 border border-white/10 rounded-full">
                        <div className={`text-white text-sm transition-opacity duration-200 ${disableMeterControls() ? 'opacity-40' : 'opacity-100'}`}>
                            BPM
                        </div>
                        <input
                            type="text"
                            value={bpm}
                            disabled={disableMeterControls()}
                            onChange={handleSetBpm}
                            className={`w-8 text-white text-end text-sm outline-none bg-transparent transition-opacity duration-200 ${disableMeterControls() ? 'opacity-40' : 'opacity-100'}`}
                        />
                        <button
                            onClick={startBpmDetect}
                            disabled={disableMeterControls() || bpmDetectPhase !== "idle"}
                            title="Auto detect BPM"
                            className={`ml-1 p-1 rounded-full hover:bg-white/10 transition ${disableMeterControls() ? 'opacity-40 cursor-not-allowed' : 'opacity-100'}`}
                        >
                            <Zap className="w-3 h-3 text-white" />
                        </button>
                    </div>

                    <div className="h-4 border border-white/30"></div>

                    {TIME_SIGNATURES.map((item, index) => (
                        <motion.button
                            key={index}
                            disabled={disableMeterControls()}
                            whileHover={!disableMeterControls() ? { backgroundColor: "rgba(255, 255, 255, 0.15)" } : {}}
                            whileTap={!disableMeterControls() ? { scale: 0.9 } : {}}
                            onClick={() => setTimeSignature(item)}
                            className={`z-50 p-3 rounded-full backdrop-blur-md border border-white/10 transition-all shadow-lg text-sm text-white ${disableMeterControls() ? 'opacity-40' : 'opacity-100'
                                }`}
                            style={{
                                backgroundColor: (timeSignature == item) ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)'
                            }}
                        >
                            {item}
                        </motion.button>
                    ))}
                    {studioMode === "looper" && (
                        <>
                            <div className="h-4 border border-white/30"></div>
                            <div className={`flex flex-row items-center gap-2 px-4 py-3 border border-white/10 rounded-full transition-opacity duration-200`}>
                                <span className="text-white text-sm">Bars</span>
                                <button
                                    onClick={() => setLoopBarCount(Math.max(1, loopBarCount - 1))}
                                    className="text-white text-sm w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 disabled:cursor-not-allowed"
                                >-</button>
                                <span className="text-white text-sm w-4 text-center">{loopBarCount}</span>
                                <button
                                    onClick={() => setLoopBarCount(Math.min(8, loopBarCount + 1))}
                                    className="text-white text-sm w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 disabled:cursor-not-allowed"
                                >+</button>
                            </div>
                        </>
                    )}
                </motion.div>
            </div>

            <div className="absolute bottom-20 flex flex-row items-center justify-center gap-4 w-full">
                {/* For, metronome  */}
                {(studioMode === "metronome") ? (
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsMetronomeActive(!isMetronomeActive)}
                        className="group p-4 w-fit h-fit z-50 flex items-center justify-center gap-2 border border-white rounded-full bg-black text-white text-sm font-semibold shadow-xl lg:hidden"
                    >
                        {isMetronomeActive ? <Square className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
                    </motion.button>
                ) : null}

                {/* For, looper */}
                {(studioMode === "looper") ? (
                    <div className="flex gap-3 z-50">
                        <motion.button
                            whileTap={!disablePlay() ? { scale: 0.95 } : {}}
                            disabled={disablePlay()}
                            onClick={handlePlay}
                            className={`p-4 rounded-full border flex items-center gap-2 text-sm font-bold transition-all duration-200 bg-[rgb(0, 0, 0, 0.15)] border-white ${disablePlay() ? "opacity-40 cursor-not-allowed" : "opacity-100"
                                }`}
                        >
                            {looperState === "playing" ? <Square className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
                        </motion.button>

                        <motion.button
                            whileTap={!disableRecord() ? { scale: 0.95 } : {}}
                            onClick={handleRecord}
                            disabled={disableRecord()}
                            className={`p-4 rounded-full border flex items-center gap-2 text-sm font-bold transition-all duration-200 ${disableRecord() ? "opacity-40 cursor-not-allowed" : "opacity-100"
                                } ${looperState === "recording"
                                    ? "bg-red-500 border-red-500 text-white"
                                    : "bg-[rgb(0, 0, 0, 0.15)] border-white text-white"
                                }`}
                        >
                            <Circle className="w-5 h-5 fill-white" />
                        </motion.button>

                        <motion.div
                            ref={barsDivReference}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 16 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="
                            absolute bottom-0 left-5 w-56 h-[40vh] p-4
                            hidden lg:flex lg:flex-col gap-3
                            rounded-2xl
                            bg-black/25 backdrop-blur-xl
                            border border-white/15
                            shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_0_20px_rgba(99,102,241,0.15),0_0_10px_rgba(0,112,243,0.3)]
                            overflow-y-auto
                            "
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".signature"
                                className="hidden"
                                onChange={handleLoad}
                            />
                            <div className="flex items-center justify-between">
                                <span className="text-white/40 text-xs uppercase">Loops</span>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={disableLoopControls()}
                                        title="Load session"
                                        className={`p-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition ${disableLoopControls() ? "opacity-40 cursor-not-allowed" : ""}`}
                                    >
                                        <FolderOpen className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={disableLoopControls() || loops.length === 0}
                                        title="Save session"
                                        className={`p-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition ${disableLoopControls() || loops.length === 0 ? "opacity-40 cursor-not-allowed" : ""}`}
                                    >
                                        <Save className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        onClick={handleExportMp3}
                                        disabled={disableLoopControls() || loops.length === 0}
                                        title="Export as MP3"
                                        className={`p-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition ${disableLoopControls() || loops.length === 0 ? "opacity-40 cursor-not-allowed" : ""}`}
                                    >
                                        <Headphones className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                            {
                                (loops.length === 0) ? (
                                    <motion.div
                                        className="w-full h-full flex items-center justify-center text-center text-sm font-semibold italic"
                                    >
                                        No loops in the bucket
                                    </motion.div>
                                ) : null
                            }
                            {loops.map((loop, index) => (
                                <motion.div
                                    key={index}
                                    layout
                                    initial={{ opacity: 0, scale: 0.96 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                    className="group
                 flex items-center justify-between
                 px-3 py-2
                 rounded-lg
                 bg-white/5 hover:bg-white/10
                 border border-white/10
                 transition-colors"
                                >
                                    <div className="flex flex-row items-center gap-1">
                                        <button
                                            onClick={() => removeLoop(index)}
                                            disabled={disableLoopControls()}
                                            className={`p-1.5 rounded-md
                                                    text-white/60
                                                    hover:text-white
                                                    hover:bg-white/10
                                                    transition
                                                    ${disableLoopControls() ? "opacity-40 cursor-not-allowed" : "opacity-100"}
                                            `}
                                        >
                                            <Trash className="h-4 w-4" />
                                        </button>

                                        <input
                                            value={loop.name}
                                            onChange={(e) => updateLoopName(index, e.target.value)}
                                            disabled={disableLoopControls()}
                                            className="text-sm font-medium text-white/90 truncate bg-transparent border-none outline-none focus:bg-white/10 focus:rounded px-1 w-full min-w-0"
                                        />
                                    </div>

                                    <button
                                        onClick={() => toggleMuteLoop(index)}
                                        disabled={disableLoopControls()}
                                        className={`p-1.5 rounded-md
                                            text-white/60
                                            hover:text-white
                                            hover:bg-white/10
                                            transition
                                            ${disableLoopControls() ? "opacity-40 cursor-not-allowed" : "opacity-100"}                        
                                        `}
                                    >
                                        {loop.muted ? (
                                            <MicOff className="h-4 w-4" />
                                        ) : (
                                            <Mic className="h-4 w-4" />
                                        )}
                                    </button>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                ) : null}

                {/* Settings Toggle */}
                <motion.button
                    whileTap={!disableSettings() ? { scale: 0.95 } : {}}
                    onClick={() => setIsSidebarOpen(true)}
                    disabled={disableSettings()}
                    className={`lg:hidden z-50 p-4 rounded-full bg-black/40 backdrop-blur-md border border-white text-white transition-opacity duration-200 ${disableSettings() ? "opacity-40" : "opacity-100"
                        }`}
                >
                    <Settings className="w-5 h-5" />
                </motion.button>
            </div>

            <AnimatePresence>
                {isSidebarOpen ? (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsSidebarOpen(false)}
                            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-60"
                        />
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="lg:hidden fixed top-0 left-0 h-screen overflow-y-scroll w-72 bg-neutral-950 border-r border-white/10 z-70 p-8 flex flex-col gap-10"
                        >
                            <div className="flex justify-between items-center">
                                <h2 className="text-white font-bold tracking-widest text-lg uppercase">{studioMode}</h2>
                                <button onClick={() => setIsSidebarOpen(false)} className="text-white/40 text-xl">✕</button>
                            </div>
                            <div className="flex flex-col gap-4">
                                <span className="text-white/40 text-xs uppercase">Tempo</span>
                                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                                    <span className="text-white text-sm">BPM</span>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={bpm}
                                            disabled={disableMeterControls()}
                                            onChange={handleSetBpm}
                                            className="bg-transparent text-white text-right outline-none w-16 text-xl"
                                        />
                                        <button
                                            onClick={startBpmDetect}
                                            disabled={disableMeterControls() || bpmDetectPhase !== "idle"}
                                            title="Auto detect BPM"
                                            className={`p-1.5 rounded-lg hover:bg-white/10 transition ${disableMeterControls() ? 'opacity-40 cursor-not-allowed' : 'opacity-100'}`}
                                        >
                                            <Zap className="w-4 h-4 text-white" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-4">
                                <span className="text-white/40 text-xs uppercase">Time Signature</span>
                                <div className="grid grid-cols-2 gap-3">
                                    {TIME_SIGNATURES.map((item, index) => (
                                        <button
                                            key={index}
                                            disabled={disableMeterControls()}
                                            onClick={() => setTimeSignature(item)}
                                            className={`p-4 rounded-xl border transition-all text-sm ${item === timeSignature
                                                ? 'bg-white text-black border-white'
                                                : 'bg-white/5 text-white border-white/10'
                                                } ${disableMeterControls() ? 'opacity-40' : 'opacity-100'}`}
                                        >
                                            {item}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {
                                studioMode === "looper" ? <div className="flex flex-col gap-4">
                                    <span className="text-white/40 text-xs uppercase">Bars per loop</span>
                                    <div className={`flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 transition-opacity duration-200 ${disableMeterControls() ? 'opacity-40' : 'opacity-100'}`}>
                                        <span className="text-white text-sm">Bars</span>
                                        <div className="flex items-center gap-3">
                                            <button
                                                disabled={disableMeterControls()}
                                                onClick={() => setLoopBarCount(Math.max(1, loopBarCount - 1))}
                                                className="text-white text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 disabled:cursor-not-allowed"
                                            >-</button>
                                            <span className="text-white text-xl w-6 text-center">{loopBarCount}</span>
                                            <button
                                                disabled={disableMeterControls()}
                                                onClick={() => setLoopBarCount(Math.min(8, loopBarCount + 1))}
                                                className="text-white text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 disabled:cursor-not-allowed"
                                            >+</button>
                                        </div>
                                    </div>
                                </div> : null
                            }
                            {
                                studioMode === "looper" ? <div className="flex flex-col gap-4 h-full">
                                    <div className="flex items-center justify-between">
                                        <span className="text-white/40 text-xs uppercase">Loops</span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={disableLoopControls()}
                                                title="Load session"
                                                className={`p-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition ${disableLoopControls() ? "opacity-40 cursor-not-allowed" : ""}`}
                                            >
                                                <FolderOpen className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={handleSave}
                                                disabled={disableLoopControls() || loops.length === 0}
                                                title="Save session"
                                                className={`p-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition ${disableLoopControls() || loops.length === 0 ? "opacity-40 cursor-not-allowed" : ""}`}
                                            >
                                                <Save className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={handleExportMp3}
                                                disabled={disableLoopControls() || loops.length === 0}
                                                title="Export as MP3"
                                                className={`p-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition ${disableLoopControls() || loops.length === 0 ? "opacity-40 cursor-not-allowed" : ""}`}
                                            >
                                                <Headphones className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                    {
                                        loops.length === 0 ? (
                                            <motion.div
                                                className="w-full h-full flex text-sm font-semibold italic"
                                            >
                                                No loops in the bucket
                                            </motion.div>
                                        ) : null
                                    }
                                    {loops.map((loop, index) => (
                                        <motion.div
                                            key={index}
                                            layout
                                            initial={{ opacity: 0, scale: 0.96 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ duration: 0.2, ease: "easeOut" }}
                                            className="group
                 flex items-center justify-between
                 px-3 py-2
                 rounded-lg
                 bg-white/5 hover:bg-white/10
                 border border-white/10
                 transition-colors"
                                        >
                                            <div className="flex flex-row items-center gap-1">
                                                <button
                                                    onClick={() => removeLoop(index)}
                                                    disabled={disableLoopControls()}
                                                    className={`p-1.5 rounded-md
                                                    text-white/60
                                                    hover:text-white
                                                    hover:bg-white/10
                                                    transition
                                                    ${disableLoopControls() ? "opacity-40 cursor-not-allowed" : "opacity-100"}
                                            `}
                                                >
                                                    <Trash className="h-4 w-4" />
                                                </button>

                                                <input
                                                    value={loop.name}
                                                    onChange={(e) => updateLoopName(index, e.target.value)}
                                                    disabled={disableLoopControls()}
                                                    className="text-sm font-medium text-white/90 truncate bg-transparent border-none outline-none focus:bg-white/10 focus:rounded px-1 w-full min-w-0"
                                                />
                                            </div>

                                            <button
                                                onClick={() => toggleMuteLoop(index)}
                                                disabled={disableLoopControls()}
                                                className={`p-1.5 rounded-md
                                            text-white/60
                                            hover:text-white
                                            hover:bg-white/10
                                            transition
                                            ${disableLoopControls() ? "opacity-40 cursor-not-allowed" : "opacity-100"}                        
                                        `}
                                            >
                                                {loop.muted ? (
                                                    <MicOff className="h-4 w-4" />
                                                ) : (
                                                    <Mic className="h-4 w-4" />
                                                )}
                                            </button>
                                        </motion.div>
                                    ))}
                                </div> : null
                            }
                        </motion.div>
                    </>
                ) : null}
            </AnimatePresence>
        </>
    );
}