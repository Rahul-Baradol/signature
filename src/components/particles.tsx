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
        this.alpha = 1
        this.pushDirection = 1;
        this.beatIntensity = 0;
        this.vy = 0.5;

        this.context = context;
        this.canvas = canvas;

        this.x = Math.random() * canvas.width;
        this.y = canvas.height + 10;
        this.size = (Math.random() * 2) + 1;
    }

    update() {
        if (this.beatIntensity <= 0.25) {
            this.context.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
        } else if (this.beatIntensity <= 0.5) {
            this.context.fillStyle = `rgba(255, 150, 75, ${this.alpha})`;
        } else {
            this.context.fillStyle = `rgba(255, 100, 0, ${this.alpha})`;
        }

        const direction = (this.pushDirection === 1) ? -1 : 1;
        let speed;
        if (this.pushDirection == 1) {
            speed = this.beatIntensity * 10;
        } else {
            speed = (1 - this.beatIntensity) * 5;
        }

        this.y += (direction * this.vy * speed);
    }

    draw() {
        this.context.beginPath();
        this.context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        this.context.fill();
    }

    isDead() {
        return this.y < 0 || this.y > (this.canvas.height + 10);
    }
}

export const Particles = ({ beatIntensity }: { beatIntensity: any }) => {
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
        if (particles.current) {
            const pushDirection = (beatIntensity.current > (0.5 * beatIntensity.prev)) ? 1 : -1;
    
            if (pushDirection === 1) {
                let countOfParticlesToAffect = 50;
              
                for (let i = 0; i < countOfParticlesToAffect; i++) {
                    const randomIndex = Math.floor(Math.random() * particles.current.length);
                    if (randomIndex < particles.current.length) {
                        particles.current[randomIndex].pushDirection = pushDirection;
                        particles.current[randomIndex].beatIntensity = beatIntensity.current;
                    }
                }
            } else {
                particles.current.forEach(p => {
                    p.pushDirection = pushDirection;
                    p.beatIntensity = beatIntensity.current;
                });
            }
        }
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
