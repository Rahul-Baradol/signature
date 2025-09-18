import { useRef, useEffect } from "react";

class RightParticle {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  alpha: number;
  fadeRate: number;

  constructor(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, CENTER_X: number, CENTER_Y: number) {
    this.context = context;
    this.canvas = canvas;

    this.x = canvas.width;
    this.y = canvas.height - Math.random() * canvas.height;
    this.size = Math.random() * 2 + 1;

    const dx = CENTER_X - this.x + (Math.random() - 0.5) * 100;
    const dy = CENTER_Y - this.y + (Math.random() - 0.5) * 100;
    const mag = Math.sqrt(dx * dx + dy * dy);
    const speed = Math.random() * 0.8 + 0.1;

    this.vx = (dx / mag) * speed;
    this.vy = (dy / mag) * speed;
    this.alpha = 1;
    this.fadeRate = Math.random() * 0.015 + 0.005;
  }

  update() {
    this.vx += (Math.random() - 0.5) * 0.02;
    this.vy += (Math.random() - 0.5) * 0.02;

    this.x += this.vx;
    this.y += this.vy;
  }

  draw() {
    this.context.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
    this.context.beginPath();
    this.context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    this.context.fill();
  }

  isDead() {
    return this.x < this.canvas.width / 2 || this.y > this.canvas.height;
  }
}

class LeftParticle {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  alpha: number;

  constructor(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, CENTER_X: number, CENTER_Y: number) {
    this.context = context;
    this.canvas = canvas;

    this.x = 0;
    this.y = canvas.height - Math.random() * canvas.height;
    this.size = Math.random() * 2 + 1;

    const targetX = CENTER_X * 0.75;
    const targetY = CENTER_Y + (Math.random() - 0.5) * 100;

    const dx = targetX - this.x + (Math.random() - 0.5) * 50;
    const dy = targetY - this.y + (Math.random() - 0.5) * 50;
    const mag = Math.sqrt(dx * dx + dy * dy);
    const speed = Math.random() * 0.8 + 0.1;

    this.vx = (dx / mag) * speed;
    this.vy = (dy / mag) * speed;
    this.alpha = 1;
  }

  update() {
    this.vx += (Math.random() - 0.5) * 0.02;
    this.vy += (Math.random() - 0.5) * 0.02;

    this.x += this.vx;
    this.y += this.vy;
  }

  draw() {
    this.context.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
    this.context.beginPath();
    this.context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    this.context.fill();
  }

  isDead() {
    return this.x > this.canvas.width / 2 || this.y > this.canvas.height;
  }
}

const Particles = ({ audio }: { audio: HTMLAudioElement | null }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particles = useRef<(RightParticle | LeftParticle)[]>([]);
  const beatRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const context = canvas.getContext("2d")!;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const CENTER_X = canvas.width / 2;
    const CENTER_Y = canvas.height / 2;

    // --- audio analyser setup ---
    let analyser: AnalyserNode | null = null;
    let dataArray: Uint8Array | null = null;
    if (audio) {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const src = audioCtx.createMediaElementSource(audio);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      dataArray = new Uint8Array(analyser.frequencyBinCount);
      src.connect(analyser);
      analyser.connect(audioCtx.destination);
    }

    function spawnParticle() {
      if (particles.current.length < 50) {
        particles.current.push(new RightParticle(canvas, context, CENTER_X, CENTER_Y));
        particles.current.push(new LeftParticle(canvas, context, CENTER_X, CENTER_Y));
      }
    }

    function animate() {
      context.clearRect(0, 0, canvas.width, canvas.height);

      // --- update beat info ---
      if (analyser && dataArray) {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        beatRef.current = avg / 255; // normalized 0..1
      }

      spawnParticle();

      particles.current.forEach((p, i) => {
        // boost particle size + velocity based on beat
        const boost = 1 + beatRef.current * 1.5;
        p.size += beatRef.current * 2;
        p.vx *= boost;
        p.vy *= boost;

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
  }, [audio]);

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
