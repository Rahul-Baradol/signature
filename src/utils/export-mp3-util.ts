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

  // ── 2. Convert Float32 PCM → Int16 ────────────────────────────────────────
  const pcmFloat = rendered.getChannelData(0);
  const pcmInt16 = new Int16Array(pcmFloat.length);
  for (let i = 0; i < pcmFloat.length; i++) {
    pcmInt16[i] = Math.max(-32768, Math.min(32767, Math.round(pcmFloat[i] * 32767)));
  }

  // ── 3. Encode to MP3 with lamejs ──────────────────────────────────────────
  const encoder = new Mp3Encoder(1, SAMPLE_RATE, 128);
  const CHUNK = 1152; // must be a multiple of 576
  const mp3Chunks: Uint8Array[] = [];

  for (let i = 0; i < pcmInt16.length; i += CHUNK) {
    const slice = pcmInt16.subarray(i, i + CHUNK);
    const encoded = encoder.encodeBuffer(slice); // returns Uint8Array
    if (encoded.length > 0) mp3Chunks.push(encoded);
    onProgress?.((i + CHUNK) / pcmInt16.length);
    // Yield every 50 chunks to keep the UI responsive
    if (((i / CHUNK) % 50) === 0) await new Promise<void>((r) => setTimeout(r, 0));
  }

  const tail = encoder.flush(); // returns Uint8Array
  if (tail.length > 0) mp3Chunks.push(tail);

  // ── 4. Download ───────────────────────────────────────────────────────────
  const blob = new Blob(mp3Chunks.map(chunk => new Uint8Array(chunk)), { type: "audio/mpeg" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.mp3`;
  a.click();
  URL.revokeObjectURL(url);
}
