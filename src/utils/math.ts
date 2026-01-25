export const rmsRange = (arr: Uint8Array, s: number, e: number) => {
    let sum = 0;
    for (let j = s; j < e; j++) {
        sum += arr[j];
    }
    return sum / (e - s);
};

export function normalize(value: number, min: number, max: number) {
    return (max === min) ? 0 : Math.min(Math.max((value - min) / (max - min), 0), 1);
}

export function step(value: number, direction: number) {
    return Math.min(direction * 0.075 * value + value, 1);
}

export const easeInOut = (t: number) =>
  t < 0.5
    ? 2 * t * t
    : 1 - Math.pow(-2 * t + 2, 2) / 2;

export const gaussian = (x: number, sigma: number) =>
  Math.exp(-(x * x) / (2 * sigma * sigma));

export const beatEnvelope = (t: number) => {
  if (t < 0.05) return t / 0.05;          // attack (snap)
  if (t < 0.25) return 1 - (t - 0.05) / 0.2; // decay
  return 0;                              // silence
};
