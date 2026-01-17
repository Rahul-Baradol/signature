import { useLayoutEffect, useRef } from "react";

type Props = {
  amps: number[]; // expected 64
  width?: number;
  height?: number;
};

export function AudioGradientCanvas({
  amps,
  width = window.innerWidth,
  height = window.innerHeight,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useLayoutEffect(() => {
    if (!amps || amps.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const cx = width / 2;
    const cy = height / 2;
    const maxRadius = Math.max(width, height) * 0.7;

    ctx.clearRect(0, 0, width, height);

    const grad = ctx.createRadialGradient(
      cx,
      cy,
      0,
      cx,
      cy,
      maxRadius
    );

    const multiplier = 10;

    for (let i = 0; i < 64; i++) {
      const amp = amps[i] ?? 0;
      const intensity = amp / 255;

      const r = Math.round(140 * intensity);
      const g = Math.round(100 * intensity);
      const b = 255;

      const alpha =
        Math.log(1 + multiplier * intensity) /
        Math.log(1 + multiplier);

      // 0 → 1 range, allow slight overshoot for “expansion”
      const pos = Math.min(1, i / 63);

      grad.addColorStop(
        pos,
        `rgba(${r},${g},${b},${alpha})`
      );
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }, [amps, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
      }}
    />
  );
}
