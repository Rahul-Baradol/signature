export enum PerformanceMode {
    Low,
    Medium,
    High
}

export enum GradientUpdateMode {
    Constant,
    Adaptive
}

export function calculateAmpsForPerformanceMode(amps: number[], mode: PerformanceMode): number[] {
    switch (mode) {
        case PerformanceMode.Low:
            return downsampleAmps(amps, 16, GradientUpdateMode.Constant);
        case PerformanceMode.Medium:
            return downsampleAmps(amps, 8, GradientUpdateMode.Constant);
        case PerformanceMode.High:
        default:
            return downsampleAmps(amps, 4, GradientUpdateMode.Constant);
    }
}

function downsampleAmps(amps: number[], groupLength: number, updateMode: GradientUpdateMode): number[] {
    const downsampled: number[] = [];

    switch (updateMode) {
        case GradientUpdateMode.Adaptive:
            // For adaptive, we can implement a more complex logic if needed
            // For now, we'll just use the same downsampling as constant
            break;
        case GradientUpdateMode.Constant:
            for (let i = 0; i < amps.length; i += groupLength) {
                const group = amps.slice(i, i + groupLength);
                const avg = group.reduce((sum, val) => sum + val, 0) / group.length;
                downsampled.push(avg);
            }
    }

    return downsampled;
}