import type { Loop, TimeSignature } from "@/store/schema";

interface SerializedAudioData {
    sampleRate: number;
    numberOfChannels: number;
    length: number;
    channelData: number[][];
}

interface SerializedLoop {
    timesignature: TimeSignature;
    bpm: number;
    barCount: number;
    name: string;
    muted: boolean;
    audioData: SerializedAudioData;
}

interface SignatureFile {
    version: 1;
    bpm: number;
    timeSignature: TimeSignature;
    loopBarCount: number;
    loops: SerializedLoop[];
}

export interface DeserializedLooperState {
    loops: Loop[];
    bpm: number;
    timeSignature: TimeSignature;
    loopBarCount: number;
}

export function serializeLooperState(
    loops: Loop[],
    bpm: number,
    timeSignature: TimeSignature,
    loopBarCount: number
): string {
    const serializedLoops: SerializedLoop[] = loops.map((loop) => {
        const channelData: number[][] = [];
        for (let ch = 0; ch < loop.recordedBuffer.numberOfChannels; ch++) {
            channelData.push(Array.from(loop.recordedBuffer.getChannelData(ch)));
        }
        return {
            timesignature: loop.timesignature,
            bpm: loop.bpm,
            barCount: loop.barCount,
            name: loop.name,
            muted: loop.muted,
            audioData: {
                sampleRate: loop.recordedBuffer.sampleRate,
                numberOfChannels: loop.recordedBuffer.numberOfChannels,
                length: loop.recordedBuffer.length,
                channelData,
            },
        };
    });

    const file: SignatureFile = {
        version: 1,
        bpm,
        timeSignature,
        loopBarCount,
        loops: serializedLoops,
    };

    return JSON.stringify(file);
}

export function deserializeLooperState(json: string): DeserializedLooperState {
    const file: SignatureFile = JSON.parse(json);

    const loops: Loop[] = file.loops.map((serializedLoop) => {
        const { sampleRate, numberOfChannels, length, channelData } = serializedLoop.audioData;

        const buffer = new AudioBuffer({ numberOfChannels, length, sampleRate });
        for (let ch = 0; ch < numberOfChannels; ch++) {
            buffer.copyToChannel(new Float32Array(channelData[ch]), ch);
        }

        return {
            timesignature: serializedLoop.timesignature,
            bpm: serializedLoop.bpm,
            barCount: serializedLoop.barCount,
            name: serializedLoop.name,
            muted: serializedLoop.muted,
            recordedBuffer: buffer,
        };
    });

    return {
        loops,
        bpm: file.bpm,
        timeSignature: file.timeSignature,
        loopBarCount: file.loopBarCount,
    };
}
