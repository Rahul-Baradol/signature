export class Particle {
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