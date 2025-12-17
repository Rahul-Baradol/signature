import { useEffect, useRef } from "react";

export default function RippleCanvas({ beatIntensity, historyOfIntensities }: { beatIntensity: { prev: number; current: number }; historyOfIntensities: number[] }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const ripplesRef = useRef<any[]>([]);
    const sizeRef = useRef({ width: window.innerWidth, height: window.innerHeight });

    useEffect(() => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;

        function resize() {
            sizeRef.current = {
                width: window.innerWidth,
                height: window.innerHeight,
            };

            const { width, height } = sizeRef.current;

            canvas.width = width;
            canvas.height = height;
        }

        resize();
        window.addEventListener("resize", resize);

        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        const ripples = ripplesRef.current;

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let i = ripples.length - 1; i >= 0; i--) {
                const r = ripples[i];
                r.radius += 1.6;
                r.alpha -= 0.009;

                if (r.alpha <= 0) {
                    ripples.splice(i, 1);
                    continue;
                }

                ctx.beginPath();
                ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(255, 100, 0, ${r.alpha})`;
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            requestAnimationFrame(animate);
        }

        animate();

        return () => {
            window.removeEventListener("resize", resize);
        };
    }, []);

    useEffect(() => {
        const ripples = ripplesRef.current;

        function addRipple(x: number, y: number) {
            ripples.push({
                x,
                y,
                radius: 0,
                alpha: 1,
            });
        }

        function energyScore(history: number[]) {
            const n = history.length;
            if (n < 5) return 0;

            // EMA baseline
            let ema = history[0];
            const alpha = 0.12;
            for (let i = 1; i < n; i++) {
                ema = alpha * history[i] + (1 - alpha) * ema;
            }

            // average positive slope over last window
            let slope = 0;
            for (let i = n - 10; i < n; i++) {
                slope += history[i] - history[i - 1];
            }
            slope = Math.max(0, slope / 10);

            // volatility
            let vol = 0;
            for (let i = n - 10; i < n; i++) {
                vol += Math.abs(history[i] - history[i - 1]);
            }
            vol /= 10;

            return slope * 4 + vol * 1.5 + ema * 0.8;
        }

        const score = energyScore(historyOfIntensities);

        // probability per frame
        const p = Math.min(score, 1);

        if (Math.random() < p) {
            const burst = 1 + Math.floor(score * 4);

            for (let i = 0; i < burst; i++) {
                addRipple(
                    Math.random() * sizeRef.current.width,
                    Math.random() * sizeRef.current.height
                );
            }
        }
    }, [beatIntensity])

    return <canvas ref={canvasRef} className="absolute w-screen h-screen top-0 left-0" />;
}
