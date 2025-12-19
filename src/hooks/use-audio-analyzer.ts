import { useState, useEffect, useRef } from "react";

export const useAudioAnalyzer = (file: File | null) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [amps, setAmps] = useState<number[]>([]);
    const [currentTime, setCurrentTime] = useState(0);
    const [intensity, setIntensity] = useState({ prev: 0, current: 0 });

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

                    if (avg <= 0.5) {
                        setAmps(
                            Array.from({ length: dataArray.length / 4 }, (_, i) =>
                                (dataArray[i * 4] + dataArray[i * 4 + 1] + dataArray[i * 4 + 2] + dataArray[i * 4 + 3]) / 4
                            )
                        );
                    } else {
                        setAmps(
                            Array.from({ length: Math.ceil(dataArray.length / 3) }, (_, i) => {
                                const start = i * 3;
                                const end = Math.min(start + 3, dataArray.length);
                                const sum = dataArray.slice(start, end).reduce((acc, val) => acc + val, 0);
                                return sum / (end - start);
                            })
                        );
                    }

                    setIntensity((prev) => {
                        const pushDirection = avg > prev.current ? 1 : -1;
                        return {
                            prev: prev.current,
                            current: Math.min(pushDirection * 0.075 * avg + avg, 1),
                        };
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
        }
    }, [file]);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) audioRef.current.pause();
        else audioRef.current.play();
        setIsPlaying(!isPlaying);
    };

    return { isPlaying, amps, intensity, currentTime, togglePlay, audioRef };
};