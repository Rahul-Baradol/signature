import { Mp3Encoder } from '@breezystack/lamejs';
import type { Loop, TimeSignature } from "@/store/schema";

interface ExportMp3Options {
  loops: Loop[];
  bpm: number;
  timeSignature: TimeSignature;
  exportBars: number;
  filename: string;
  onProgress?: (progress: number) => void;
}

interface ExportBufferMp3Options {
  buffer: AudioBuffer;
  filename: string;
  onProgress?: (progress: number) => void;
}

async function encodeAndDownloadMp3(
  pcmFloat: Float32Array,
  sampleRate: number,
  filename: string,
  onProgress?: (progress: number) => void,
): Promise<void> {
  const pcmInt16 = new Int16Array(pcmFloat.length);
  for (let i = 0; i < pcmFloat.length; i++) {
    pcmInt16[i] = Math.max(-32768, Math.min(32767, Math.round(pcmFloat[i] * 32767)));
  }

  const encoder = new Mp3Encoder(1, sampleRate, 128);
  const CHUNK = 1152;
  const mp3Chunks: Uint8Array[] = [];

  for (let i = 0; i < pcmInt16.length; i += CHUNK) {
    const slice = pcmInt16.subarray(i, i + CHUNK);
    const encoded = encoder.encodeBuffer(slice);
    if (encoded.length > 0) mp3Chunks.push(encoded);
    onProgress?.((i + CHUNK) / pcmInt16.length);
    if (((i / CHUNK) % 50) === 0) await new Promise<void>((r) => setTimeout(r, 0));
  }

  const tail = encoder.flush();
  if (tail.length > 0) mp3Chunks.push(tail);

  const blob = new Blob(mp3Chunks.map(chunk => new Uint8Array(chunk)), { type: "audio/mpeg" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.mp3`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportAudioBufferToMp3({
  buffer,
  filename,
  onProgress,
}: ExportBufferMp3Options): Promise<void> {
  const pcmFloat = buffer.getChannelData(0);
  await encodeAndDownloadMp3(pcmFloat, buffer.sampleRate, filename, onProgress);
}

export async function exportLoopsToMp3({
  loops,
  bpm,
  timeSignature,
  exportBars,
  filename,
  onProgress,
}: ExportMp3Options): Promise<void> {
  const SAMPLE_RATE = 44100;

  // Bar duration (mirrors studio-layout.tsx)
  let beatTime = 60 / bpm;
  if (timeSignature === "6/8") beatTime /= 2;
  const beatsPerBar: Record<TimeSignature, number> = {
    "4/4": 4, "3/4": 3, "2/4": 2, "6/8": 6,
  };
  const barDuration = beatTime * beatsPerBar[timeSignature];
  const exportDuration = exportBars * barDuration;

  // ── 1. Pre-render full audio mix ──────────────────────────────────────────
  const totalSamples = Math.ceil(exportDuration * SAMPLE_RATE);
  const offCtx = new OfflineAudioContext(1, totalSamples, SAMPLE_RATE);

  for (const loop of loops) {
    if (loop.muted || !loop.recordedBuffer) continue;
    const loopDuration = barDuration * loop.barCount;
    let t = 0;
    while (t < exportDuration + 0.05) {
      const src = offCtx.createBufferSource();
      src.buffer = loop.recordedBuffer;
      src.connect(offCtx.destination);
      src.start(t);
      t += loopDuration;
    }
  }

  const rendered = await offCtx.startRendering();

  await encodeAndDownloadMp3(rendered.getChannelData(0), SAMPLE_RATE, filename, onProgress);
}
