import { useRef, useEffect } from "react";

class Particle {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    x: number;
    y: number;
    size: number;
    vy: number;
    alpha: number;
    pushDirection: number;
    beatIntensity: number;

    constructor(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
        this.context = context;
        this.canvas = canvas;

        this.x = Math.random() * canvas.width;
        this.y = canvas.height;
        this.size = Math.random() * 2 + 1;

        const targetX = this.x;
        const targetY = 0;

        const dx = targetX - this.x + (Math.random() - 0.5) * 50;
        const dy = targetY - this.y + (Math.random() - 0.5) * 50;

        const mag = Math.sqrt(dx * dx + dy * dy);
        const speed = Math.random() * 0.4 + 0.05;

        this.vy = (dy / mag) * speed;

        this.alpha = 1
        this.pushDirection = 1;
        this.beatIntensity = 0;
    }

    update() { 
        if (this.beatIntensity <= 0.25) {
            this.context.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
        } else if (this.beatIntensity <= 0.5) {
            this.context.fillStyle = `rgba(255, 150, 75, ${this.alpha})`;
        } else {
            this.context.fillStyle = `rgba(255, 100, 0, ${this.alpha})`;
        }

        if (this.pushDirection === 1) {
            this.y -= Math.abs(this.vy) * 20 * this.beatIntensity;
        } else {
            this.y += Math.abs(this.vy) * 10
        }
    }

    draw() {
        this.context.beginPath();
        this.context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        this.context.fill();
    }

    isDead() {
        return this.y < 0 || this.y > this.canvas.height;
    }
}

const Particles = ({ beatIntensity }: { beatIntensity: any }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const particles = useRef<Particle[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current!;
        const context = canvas.getContext("2d")!;
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        function spawnParticle() {
            if (particles.current.length < 200) {
                particles.current.push(new Particle(canvas, context));
            }
        }

        function animate() {
            context.clearRect(0, 0, canvas.width, canvas.height);

            spawnParticle();

            particles.current.forEach((p, i) => {
                p.update();
                p.draw();

                if (p.isDead()) {
                    particles.current.splice(i, 1);
                }
            });

            requestAnimationFrame(animate);
        }

        let animationFrameId = requestAnimationFrame(animate);

        function setCanvasSize() {
            particles.current = [];
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        }

        window.addEventListener("resize", setCanvasSize);

        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    useEffect(() => {
        const randomIndices = new Set<number>();
        const pushDirection = (beatIntensity.current > (0.75 * beatIntensity.prev)) ? 1 : -1;

        let countOfParticlesToAffect;
        if (pushDirection == 1) {
            countOfParticlesToAffect = Math.min(50 + Math.floor(beatIntensity.current * 150), particles.current.length);
        } else {
            countOfParticlesToAffect = particles.current.length;
        }

        while (randomIndices.size < countOfParticlesToAffect) {
            randomIndices.add(Math.floor(Math.random() * particles.current.length));
        }

        particles.current.forEach((p, index) => {
            if (randomIndices.has(index)) {
                p.pushDirection = pushDirection;
                p.beatIntensity = beatIntensity.current;
            }
        });
    }, [beatIntensity]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                display: "block",
                background: "transparent",
                width: "100vw",
                height: "100vh",
                position: "fixed",
                top: 0,
                left: 0,
                pointerEvents: "none",
                zIndex: 1,
            }}
        />
    );
};

export default Particles;
