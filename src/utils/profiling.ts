export class FrameProfiler {
    sampleSize: number;
    times: number[];
    last: number | null;

    constructor(sampleSize = 600) { // 10 seconds at 60fps
        this.sampleSize = sampleSize;
        this.times = [];
        this.last = null;
    }

    start() {
        this.last = performance.now();
        requestAnimationFrame(this.tick.bind(this));
    }

    tick(now: number) {
        const delta = now - this.last!;
        this.last = now;

        this.times.push(delta);

        if (this.times.length < this.sampleSize) {
            requestAnimationFrame(this.tick.bind(this));
        } else {
            this.report();
        }
    }

    report() {
        const sorted = [...this.times].sort((a, b) => a - b);

        const avg = this.times.reduce((a, b) => a + b, 0) / this.times.length;
        const p99 = sorted[Math.floor(sorted.length * 0.99)];
        const p1 = sorted[Math.floor(sorted.length * 0.01)];

        console.table({
            avgFrameTime: avg.toFixed(2) + " ms",
            avgFPS: (1000 / avg).toFixed(2),
            p99FrameTime: p99.toFixed(2) + " ms",
            p1FrameTime: p1.toFixed(2) + " ms"
        });
    }
}
