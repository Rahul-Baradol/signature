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