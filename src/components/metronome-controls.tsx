import { motion, AnimatePresence } from "framer-motion";
import { TIME_SIGNATURES } from "@/store/schema";
import { useAppStore } from "@/store/use-app-store";
import { useEffect, useState } from "react";
import { Play, Settings, Square } from "lucide-react";

export function MetronomeControls() {
    const { isMetronomeActive, bpm, timeSignature, setBpm, setTimeSignature, setIsMetronomeActive } = useAppStore();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.code === "Space") {
                e.preventDefault();
                setIsMetronomeActive(!isMetronomeActive);
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isMetronomeActive, setIsMetronomeActive]);

    const disablePanel = () => {
        return isMetronomeActive;
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

    return (
        <>
            {/* --- For desktop --- */}
            <div
                className="
          hidden lg:block
          absolute bottom-20 left-1/2 -translate-x-1/2 z-50
          text-sm font-medium text-white/80
        "
            >
                Press <span className="px-2 py-1 rounded bg-white/10">Space</span> to toggle metronome
            </div>

            <div className="hidden lg:flex flex-row justify-center absolute top-0 left-0 w-screen overflow-hidden py-6">
                <motion.div
                    className="flex flex-row items-center gap-4 z-5 rounded-full bg-transparent/20 backdrop-blur-md "
                >
                    <div className="flex flex-row justify-between gap-1 px-4 py-3 border border-white/10 rounded-full">
                        <div className={`text-white text-sm transition-all ${disablePanel() ? 'opacity-40' : 'opacity-100'}`}>
                            BPM
                        </div>
                        <motion.input
                            type="text"
                            value={bpm}
                            disabled={disablePanel()}
                            onChange={handleSetBpm}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: disablePanel() ? 0.4 : 1, scale: 1 }}
                            className="w-8 bg-black/40 text-white text-end text-sm outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                    </div>

                    <div className="h-4 border border-white/30"></div>

                    {TIME_SIGNATURES.map((item, index) => (
                        <motion.button
                            key={index}
                            disabled={disablePanel()}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: disablePanel() ? 0.4 : 1, scale: 1, backgroundColor: (timeSignature == item) ? 'rgba(255, 255, 255, 0.15)' : 'black' }}
                            whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.15)" }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                                setTimeSignature(item);
                            }}
                            className={`z-50 p-3 rounded-full backdrop-blur-md border border-white/10 transition-all shadow-lg text-sm text-white`}
                        >
                            {item}
                        </motion.button>
                    ))}
                </motion.div>
            </div>

            {/* --- For mobile --- */}
            <div className="absolute bottom-20 flex flex-row items-center justify-center gap-4 lg:hidden w-full">
                <motion.button
                    initial={{ opacity: 0, y: 20, }}
                    animate={{ opacity: 1, y: 0, }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{
                        scale: 1.05,
                        backgroundColor: "white",
                        color: "black",
                        boxShadow: "0px 0px 20px rgba(255, 255, 255, 0.3)",
                    }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    onClick={() => setIsMetronomeActive(!isMetronomeActive)}
                    className={`lg:hidden group p-3 w-fit h-fit z-50
                 flex items-center justify-center gap-2 border border-white
                 rounded-full bg-black text-white text-sm font-semibold shadow-xl  cursor-pointer
                 `}
                >
                    {isMetronomeActive ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </motion.button>

                <motion.button
                    initial={{ opacity: 0, y: 20, }}
                    animate={{ opacity: disablePanel() ? 0.4 : 1, y: 0, }}
                    disabled={disablePanel()}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{
                        scale: 1.05,
                        backgroundColor: "white",
                        color: "black",
                        boxShadow: "0px 0px 20px rgba(255, 255, 255, 0.3)",
                    }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    onClick={() => setIsSidebarOpen(true)}
                    className="lg:hidden z-50 p-3 rounded-full bg-black/40 backdrop-blur-md border border-white text-white text-xs font-bold"
                >
                    <Settings className="w-5 h-5" />
                </motion.button>
            </div>

            <AnimatePresence>
                {isSidebarOpen ? (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsSidebarOpen(false)}
                            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                        />

                        {/* Sidebar Content */}
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="lg:hidden fixed top-0 left-0 h-full w-72 bg-neutral-950 border-r border-white/10 z-[70] p-8 flex flex-col gap-10"
                        >
                            <div className="flex justify-between items-center">
                                <h2 className="text-white font-bold tracking-widest text-lg">Metronome</h2>
                                <button onClick={() => setIsSidebarOpen(false)} className="text-white/40">✕</button>
                            </div>

                            <div className="flex flex-col gap-4">
                                <span className="text-white/40 text-xs uppercase">Tempo</span>
                                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                                    <span className="text-white text-sm">BPM</span>
                                    <input
                                        type="text"
                                        value={bpm}
                                        disabled={disablePanel()}
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
                                            disabled={disablePanel()}
                                            onClick={() => {
                                                setTimeSignature(item);
                                            }}
                                            className={`p-4 rounded-xl border transition-all text-sm ${item === timeSignature
                                                ? 'bg-white text-black border-white'
                                                : 'bg-white/5 text-white border-white/10'
                                                } ${disablePanel() ? 'opacity-40' : 'opacity-100'}`}
                                        >
                                            {item}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </>
                ) : null}
            </AnimatePresence>
        </>
    );
}