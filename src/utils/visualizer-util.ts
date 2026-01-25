import { rmsRange } from "./math";

export const getMusicTransform = (intensity: number) => {
  const multiplier = 10;
  const alpha = Math.log(1 + (multiplier * intensity)) / Math.log(1 + multiplier);

  const scale = 1 + (alpha * 2.5);
  const skewY = (alpha * -10);
  const skewX = (alpha * 5);

  return `scale(${scale}) skewY(${skewY}deg) skewX(${skewX}deg)`;
};

export const getBackgroundGradient = (amps: number[]) => {
  if (!amps || amps.length === 0) return "";

  let backgroundColorString = "radial-gradient(circle at center,";

  amps.forEach((amp, index) => {
    const intensity = amp / 255;

    const r = Math.round(140 * intensity);
    const g = Math.round(100 * intensity);
    const b = 255;

    const multiplier = 10;
    const alpha = Math.log(1 + (multiplier * intensity)) / Math.log(1 + multiplier);

    const position = Math.round((index / amps.length) * 140);

    backgroundColorString += ` rgba(${r}, ${g}, ${b}, ${alpha}) ${position}%,`;
  });

  backgroundColorString += " rgba(0, 0, 0, 0) 140%)";

  return backgroundColorString;
};

export function calculateIntensityFrame(dataArray: Uint8Array) {
  const lowCount = Math.floor(dataArray.length * 0.5);
  const midCount = Math.floor(dataArray.length * 0.3);

  const avgLow = rmsRange(dataArray, 0, lowCount);
  const avgMid = rmsRange(dataArray, lowCount, lowCount + midCount);
  const avgHigh = rmsRange(dataArray, lowCount + midCount, dataArray.length);

  return Math.max(avgLow, avgMid, avgHigh) / 255;
}