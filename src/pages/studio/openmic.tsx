import { SlMusicToneAlt } from "react-icons/sl";
import { motion, AnimatePresence } from "framer-motion";
import { Circle, Square, Headphones, Trash, LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { getMusicTransform, getBackgroundGradient } from "@/utils/visualizer-util";
import { exportAudioBufferToMp3 } from "@/utils/export-mp3-util";
import { useAppStore } from "@/store/use-app-store";

function formatElapsed(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function OpenmicStudio() {
  const {
    amps,
    intensity,
    microphonePermission,
    openmicRecorderState,
    openmicRecording,
    setStudioMode,
    setOpenmicRecorderState,
    setOpenmicRecording,
  } = useAppStore();

  const [elapsed, setElapsed] = useState(0);
  const recordingStartRef = useRef<number | null>(null);
  const elapsedTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportName, setExportName] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const exportInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setStudioMode("openmic")
  }, [])

  useEffect(() => {
    if (openmicRecorderState === "recording") {
      recordingStartRef.current = performance.now();
      setElapsed(0);
      elapsedTimerRef.current = setInterval(() => {
        if (recordingStartRef.current !== null) {
          setElapsed(performance.now() - recordingStartRef.current);
        }
      }, 100);
    } else {
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
        elapsedTimerRef.current = null;
      }
      recordingStartRef.current = null;
    }
    return () => {
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
        elapsedTimerRef.current = null;
      }
    };
  }, [openmicRecorderState]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      if (microphonePermission !== "granted") return;

      if (e.code === "KeyR") {
        e.preventDefault();
        handleToggleRecord();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openmicRecorderState, microphonePermission]);

  const handleToggleRecord = () => {
    if (openmicRecorderState === "idle" || openmicRecorderState === "recorded") {
      setOpenmicRecording(null);
      setOpenmicRecorderState("recording");
    } else if (openmicRecorderState === "recording") {
      setOpenmicRecorderState("stop-requested");
    }
  };

  const handleDiscard = () => {
    setOpenmicRecording(null);
    setOpenmicRecorderState("idle");
  };

  const openExportModal = () => {
    setExportName("");
    setExportProgress(0);
    setExportModalOpen(true);
    setTimeout(() => exportInputRef.current?.focus(), 50);
  };

  const commitExport = async () => {
    if (!openmicRecording) return;
    const filename = exportName.trim() || "openmic-take";
    setIsExporting(true);
    setExportProgress(0);
    await exportAudioBufferToMp3({
      buffer: openmicRecording,
      filename,
      onProgress: setExportProgress,
    });
    setIsExporting(false);
    setExportModalOpen(false);
  };

  const containerStyle = {
    background: getBackgroundGradient(amps),
  };

  const musicIconStyle = {
    transform: getMusicTransform(intensity.current),
  };

  const isRecording = openmicRecorderState === "recording" || openmicRecorderState === "stop-requested";
  const hasRecording = openmicRecorderState === "recorded" && openmicRecording !== null;

  return (
    <div
      style={containerStyle}
      className="w-screen h-screen flex flex-col gap-5 items-center justify-center transition-all relative overflow-hidden duration-[33]"
    >
      <div className="flex flex-col items-center justify-around bg-transparent">
        <div
          style={musicIconStyle}
          className="text-[30px] transition-all duration-1500 ease-out font-bold text-white"
        >
          <SlMusicToneAlt />
        </div>
      </div>

      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10"
          >
            <motion.span
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ repeat: Infinity, duration: 0.9, ease: "easeInOut" }}
              className="w-2 h-2 rounded-full bg-red-500"
            />
            <span className="text-red-400 text-xs uppercase tracking-widest font-semibold">REC</span>
            <span className="text-white/60 text-xs tabular-nums">{formatElapsed(elapsed)}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {microphonePermission === "granted" && (
        <>
          <div className="hidden lg:block absolute bottom-36 left-1/2 -translate-x-1/2 z-50 text-sm font-medium text-white/60">
            <span><span className="px-2 py-1 rounded bg-white/10 text-white/80">R</span> record / stop</span>
          </div>

          <div className="absolute bottom-20 flex flex-row items-center justify-center gap-3 w-full z-50">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleToggleRecord}
              disabled={openmicRecorderState === "stop-requested"}
              className={`p-4 rounded-full border flex items-center gap-2 text-sm font-bold transition-all duration-200 ${
                isRecording
                  ? "bg-red-500 border-red-500 text-white"
                  : "bg-[rgb(0,0,0,0.15)] border-white text-white"
              } ${openmicRecorderState === "stop-requested" ? "opacity-40 cursor-not-allowed" : "opacity-100"}`}
            >
              {isRecording ? <Square className="w-5 h-5 fill-white" /> : <Circle className="w-5 h-5 fill-white" />}
            </motion.button>

            <AnimatePresence>
              {hasRecording && (
                <>
                  <motion.button
                    key="export"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={openExportModal}
                    title="Export as MP3"
                    className="p-4 rounded-full border border-white text-white bg-[rgb(0,0,0,0.15)] flex items-center gap-2 text-sm font-bold transition-all duration-200"
                  >
                    <Headphones className="w-5 h-5" />
                  </motion.button>

                  <motion.button
                    key="discard"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDiscard}
                    title="Discard recording"
                    className="p-4 rounded-full border border-white/40 text-white/70 bg-[rgb(0,0,0,0.15)] flex items-center gap-2 text-sm font-bold transition-all duration-200 hover:text-white hover:border-white"
                  >
                    <Trash className="w-5 h-5" />
                  </motion.button>
                </>
              )}
            </AnimatePresence>
          </div>
        </>
      )}

      <AnimatePresence>
        {exportModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { if (!isExporting) setExportModalOpen(false); }}
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
                  <p className="text-white/50 text-xs mt-0.5">
                    {openmicRecording ? `${formatElapsed(openmicRecording.duration * 1000)} recording, 128 kbps.` : "128 kbps."}
                  </p>
                </div>

                <div className="flex items-center rounded-xl bg-white/5 border border-white/10 px-3 overflow-hidden focus-within:border-white/30 transition-colors">
                  <input
                    ref={exportInputRef}
                    type="text"
                    value={exportName}
                    onChange={(e) => setExportName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !isExporting) commitExport(); if (e.key === "Escape" && !isExporting) setExportModalOpen(false); }}
                    placeholder="openmic-take"
                    disabled={isExporting}
                    className="flex-1 bg-transparent text-white text-sm py-3 outline-none placeholder:text-white/20 disabled:opacity-50"
                  />
                  <span className="text-white/30 text-xs shrink-0">.mp3</span>
                </div>

                {isExporting && (
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-xs text-white/40">
                      <span>Exporting...</span>
                      <span>{Math.round(exportProgress * 100)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-indigo-400"
                        animate={{ width: `${exportProgress * 100}%` }}
                        transition={{ ease: "linear" }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setExportModalOpen(false)}
                    disabled={isExporting}
                    className="flex-1 py-2.5 rounded-xl text-sm text-white/50 border border-white/10 hover:bg-white/5 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    cancel
                  </button>
                  <button
                    onClick={commitExport}
                    disabled={isExporting}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-black bg-white hover:bg-white/90 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isExporting ? <LoaderCircle className="w-4 h-4 animate-spin text-black" /> : <Headphones className="w-4 h-4" />}
                    {isExporting ? "exporting..." : "export"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
