import { motion, AnimatePresence } from "framer-motion";
import { TIME_SIGNATURES } from "@/store/schema";
import { useAppStore } from "@/store/use-app-store";
import { useEffect, useRef, useState } from "react";
import { Play, Settings, Square, Circle, MicOff, Mic, Trash, Save, FolderOpen } from "lucide-react";
import { serializeLooperState, deserializeLooperState } from "@/utils/looper-file-util";

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
    } = useAppStore();

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [metronomeIntervalId, setMetronomeIntervalId] = useState<NodeJS.Timeout | null>(null);
    const [saveModalOpen, setSaveModalOpen] = useState(false);
    const [saveName, setSaveName] = useState("");

    const barsDivReference = useRef<HTMLDivElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const saveInputRef = useRef<HTMLInputElement | null>(null);

    const handleSave = () => {
        setSaveName("");
        setSaveModalOpen(true);
        setTimeout(() => saveInputRef.current?.focus(), 50);
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
        if (metronomeIntervalId) {
            clearInterval(metronomeIntervalId);
            setCount(0);
        }

        switch (isMetronomeActive) {
            case false:
                setMetronomeIntervalId(null);
                setIntensity({
                    prev: 0,
                    current: 0
                })
                break;

            case true:
                let lengthOfABeat = (60 / bpm) * 1000; // bounce, this is for quarter note
                if (timeSignature === "6/8") {
                    lengthOfABeat /= 2; // halve the duration for 6/8
                }

                const intervalId = setInterval(() => {
                    const { count } = useAppStore.getState();
                    setCount(getNewCount(count));
                }, lengthOfABeat);

                setMetronomeIntervalId(intervalId);
                break;
        }
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

            {(studioMode === "metronome") && (
                <div className="hidden lg:block absolute bottom-20 left-1/2 -translate-x-1/2 z-50 text-sm font-medium text-white/80">
                    Press <span className="px-2 py-1 rounded bg-white/10">Space</span> to toggle {studioMode}
                </div>
            )}

            <div className="hidden lg:flex flex-row justify-center absolute top-0 left-0 w-screen overflow-hidden py-6">
                <motion.div className="flex flex-row items-center gap-4 z-5 rounded-full">
                    <div className="flex flex-row justify-between gap-1 px-4 py-3 border border-white/10 rounded-full">
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
                                    <input
                                        type="text"
                                        value={bpm}
                                        disabled={disableMeterControls()}
                                        onChange={handleSetBpm}
                                        className="bg-transparent text-white text-right outline-none w-16 text-xl"
                                    />
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