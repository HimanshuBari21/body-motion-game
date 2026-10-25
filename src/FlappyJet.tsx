import { useEffect, useRef, useCallback, useState } from 'react';
import './FlappyJet.css';

// ── Game Constants ──────────────────────────────────────────────
const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 720;
const GRAVITY = 0.1;
const FLAP_FORCE = -4.2;
const PIPE_WIDTH = 70;
const PIPE_GAP = 210;
const PIPE_SPEED = 2.4;
const PIPE_SPAWN_INTERVAL = 200; // frames
const JET_WIDTH = 50;
const JET_HEIGHT = 35;
const STAR_COUNT = 60;
const PARTICLE_COUNT = 5;

// ── Types ───────────────────────────────────────────────────────
interface Pipe {
  x: number;
  topHeight: number;
  scored: boolean;
}

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface ExplosionParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

type GameState = 'menu' | 'playing' | 'gameover';

// ── Helper: Draw Fighter Jet SVG on Canvas ──────────────────────
function drawJet(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rotation: number,
  engineGlow: number
) {
  ctx.save();
  ctx.translate(x + JET_WIDTH / 2, y + JET_HEIGHT / 2);
  ctx.rotate(rotation);

  // Engine exhaust glow
  const exhaustGrad = ctx.createRadialGradient(-28, 0, 2, -28, 0, 14 + engineGlow * 6);
  exhaustGrad.addColorStop(0, 'rgba(255, 200, 50, 0.9)');
  exhaustGrad.addColorStop(0.4, 'rgba(255, 120, 20, 0.6)');
  exhaustGrad.addColorStop(1, 'rgba(255, 60, 10, 0)');
  ctx.fillStyle = exhaustGrad;
  ctx.beginPath();
  ctx.ellipse(-28, 0, 14 + engineGlow * 6, 6 + engineGlow * 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Engine flame
  ctx.fillStyle = `rgba(255, 255, 200, ${0.6 + engineGlow * 0.4})`;
  ctx.beginPath();
  ctx.ellipse(-26, 0, 6 + engineGlow * 3, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Fuselage shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.beginPath();
  ctx.ellipse(2, 3, 24, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Main fuselage
  const bodyGrad = ctx.createLinearGradient(0, -10, 0, 10);
  bodyGrad.addColorStop(0, '#8899aa');
  bodyGrad.addColorStop(0.3, '#c8d8e8');
  bodyGrad.addColorStop(0.5, '#a0b0c4');
  bodyGrad.addColorStop(1, '#607080');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.moveTo(27, 0);
  ctx.quadraticCurveTo(24, -6, 15, -7);
  ctx.lineTo(-18, -5);
  ctx.quadraticCurveTo(-24, -4, -22, 0);
  ctx.quadraticCurveTo(-24, 4, -18, 5);
  ctx.lineTo(15, 7);
  ctx.quadraticCurveTo(24, 6, 27, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#506070';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Cockpit
  const cockpitGrad = ctx.createLinearGradient(12, -4, 12, 4);
  cockpitGrad.addColorStop(0, '#66ddff');
  cockpitGrad.addColorStop(0.5, '#2299cc');
  cockpitGrad.addColorStop(1, '#115577');
  ctx.fillStyle = cockpitGrad;
  ctx.beginPath();
  ctx.moveTo(22, 0);
  ctx.quadraticCurveTo(18, -4, 10, -4);
  ctx.quadraticCurveTo(8, 0, 10, 4);
  ctx.quadraticCurveTo(18, 4, 22, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Top wing
  const wingGrad = ctx.createLinearGradient(0, -18, 0, -5);
  wingGrad.addColorStop(0, '#556677');
  wingGrad.addColorStop(1, '#8899aa');
  ctx.fillStyle = wingGrad;
  ctx.beginPath();
  ctx.moveTo(8, -6);
  ctx.lineTo(-2, -18);
  ctx.lineTo(-14, -18);
  ctx.lineTo(-8, -6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#445566';
  ctx.lineWidth = 0.6;
  ctx.stroke();

  // Bottom wing
  ctx.fillStyle = wingGrad;
  ctx.beginPath();
  ctx.moveTo(8, 6);
  ctx.lineTo(-2, 18);
  ctx.lineTo(-14, 18);
  ctx.lineTo(-8, 6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#445566';
  ctx.lineWidth = 0.6;
  ctx.stroke();

  // Tail fin (top)
  const tailGrad = ctx.createLinearGradient(-18, -14, -18, -4);
  tailGrad.addColorStop(0, '#cc3333');
  tailGrad.addColorStop(1, '#882222');
  ctx.fillStyle = tailGrad;
  ctx.beginPath();
  ctx.moveTo(-16, -5);
  ctx.lineTo(-22, -14);
  ctx.lineTo(-26, -14);
  ctx.lineTo(-22, -4);
  ctx.closePath();
  ctx.fill();

  // Tail fin (bottom)
  ctx.fillStyle = tailGrad;
  ctx.beginPath();
  ctx.moveTo(-16, 5);
  ctx.lineTo(-22, 14);
  ctx.lineTo(-26, 14);
  ctx.lineTo(-22, 4);
  ctx.closePath();
  ctx.fill();

  // Wing stripes (markings)
  ctx.strokeStyle = 'rgba(255,50,50,0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(4, -8);
  ctx.lineTo(-4, -14);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(4, 8);
  ctx.lineTo(-4, 14);
  ctx.stroke();

  // Nose highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.beginPath();
  ctx.ellipse(20, -2, 5, 2, -0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ── Helper: Draw Pipe ───────────────────────────────────────────
function drawPipe(
  ctx: CanvasRenderingContext2D,
  x: number,
  topHeight: number,
  canvasHeight: number,
  gap: number
) {
  // Top pipe
  const topGrad = ctx.createLinearGradient(x, 0, x + PIPE_WIDTH, 0);
  topGrad.addColorStop(0, '#1a3a4a');
  topGrad.addColorStop(0.3, '#2a5a6a');
  topGrad.addColorStop(0.5, '#3a7a8a');
  topGrad.addColorStop(0.7, '#2a5a6a');
  topGrad.addColorStop(1, '#1a3a4a');
  ctx.fillStyle = topGrad;
  ctx.fillRect(x, 0, PIPE_WIDTH, topHeight);

  // Top pipe cap
  const capHeight = 20;
  const capGrad = ctx.createLinearGradient(x - 5, 0, x + PIPE_WIDTH + 5, 0);
  capGrad.addColorStop(0, '#0d2833');
  capGrad.addColorStop(0.3, '#1a4a5a');
  capGrad.addColorStop(0.5, '#2a6a7a');
  capGrad.addColorStop(0.7, '#1a4a5a');
  capGrad.addColorStop(1, '#0d2833');
  ctx.fillStyle = capGrad;
  ctx.fillRect(x - 5, topHeight - capHeight, PIPE_WIDTH + 10, capHeight);

  // Top pipe border
  ctx.strokeStyle = 'rgba(100, 220, 255, 0.3)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, 0, PIPE_WIDTH, topHeight);
  ctx.strokeRect(x - 5, topHeight - capHeight, PIPE_WIDTH + 10, capHeight);

  // Danger lights on top pipe cap
  ctx.fillStyle = `rgba(255, 60, 60, ${0.6 + Math.sin(Date.now() / 300) * 0.4})`;
  ctx.beginPath();
  ctx.arc(x + PIPE_WIDTH / 2, topHeight - capHeight / 2, 3, 0, Math.PI * 2);
  ctx.fill();

  // Glow around danger light
  const dangerGlow = ctx.createRadialGradient(
    x + PIPE_WIDTH / 2, topHeight - capHeight / 2, 0,
    x + PIPE_WIDTH / 2, topHeight - capHeight / 2, 10
  );
  dangerGlow.addColorStop(0, `rgba(255, 60, 60, ${0.3 + Math.sin(Date.now() / 300) * 0.2})`);
  dangerGlow.addColorStop(1, 'rgba(255, 60, 60, 0)');
  ctx.fillStyle = dangerGlow;
  ctx.beginPath();
  ctx.arc(x + PIPE_WIDTH / 2, topHeight - capHeight / 2, 10, 0, Math.PI * 2);
  ctx.fill();

  // Bottom pipe
  const bottomY = topHeight + gap;
  ctx.fillStyle = topGrad;
  ctx.fillRect(x, bottomY, PIPE_WIDTH, canvasHeight - bottomY);

  // Bottom pipe cap
  ctx.fillStyle = capGrad;
  ctx.fillRect(x - 5, bottomY, PIPE_WIDTH + 10, capHeight);

  // Bottom pipe border
  ctx.strokeStyle = 'rgba(100, 220, 255, 0.3)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, bottomY, PIPE_WIDTH, canvasHeight - bottomY);
  ctx.strokeRect(x - 5, bottomY, PIPE_WIDTH + 10, capHeight);

  // Danger lights on bottom pipe cap
  ctx.fillStyle = `rgba(255, 60, 60, ${0.6 + Math.sin(Date.now() / 300 + Math.PI) * 0.4})`;
  ctx.beginPath();
  ctx.arc(x + PIPE_WIDTH / 2, bottomY + capHeight / 2, 3, 0, Math.PI * 2);
  ctx.fill();

  const dangerGlow2 = ctx.createRadialGradient(
    x + PIPE_WIDTH / 2, bottomY + capHeight / 2, 0,
    x + PIPE_WIDTH / 2, bottomY + capHeight / 2, 10
  );
  dangerGlow2.addColorStop(0, `rgba(255, 60, 60, ${0.3 + Math.sin(Date.now() / 300 + Math.PI) * 0.2})`);
  dangerGlow2.addColorStop(1, 'rgba(255, 60, 60, 0)');
  ctx.fillStyle = dangerGlow2;
  ctx.beginPath();
  ctx.arc(x + PIPE_WIDTH / 2, bottomY + capHeight / 2, 10, 0, Math.PI * 2);
  ctx.fill();

  // Metallic highlight lines on pipes
  ctx.strokeStyle = 'rgba(150, 240, 255, 0.08)';
  ctx.lineWidth = 1;
  for (let i = 0; i < topHeight; i += 30) {
    ctx.beginPath();
    ctx.moveTo(x + 8, i);
    ctx.lineTo(x + 8, i + 15);
    ctx.stroke();
  }
  for (let i = bottomY + capHeight; i < canvasHeight; i += 30) {
    ctx.beginPath();
    ctx.moveTo(x + 8, i);
    ctx.lineTo(x + 8, i + 15);
    ctx.stroke();
  }
}

// ── Main Component ──────────────────────────────────────────────
export default function FlappyJet() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState>('menu');
  const [displayState, setDisplayState] = useState<GameState>('menu');
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    const saved = localStorage.getItem('flappyjet-best');
    return saved ? parseInt(saved, 10) : 0;
  });

  // Game state refs (for animation frame loop)
  const jetYRef = useRef(CANVAS_HEIGHT / 2);
  const jetVelRef = useRef(0);
  const pipesRef = useRef<Pipe[]>([]);
  const scoreRef = useRef(0);
  const frameRef = useRef(0);
  const starsRef = useRef<Star[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const explosionRef = useRef<ExplosionParticle[]>([]);
  const engineGlowRef = useRef(0);
  const animFrameRef = useRef(0);
  const shakeRef = useRef(0);

  // Initialize stars
  const initStars = useCallback(() => {
    const stars: Star[] = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        size: Math.random() * 2.5 + 0.5,
        speed: Math.random() * 1.2 + 0.3,
        opacity: Math.random() * 0.8 + 0.2,
      });
    }
    starsRef.current = stars;
  }, []);

  // Spawn engine trail particles
  const spawnTrailParticles = useCallback((x: number, y: number) => {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particlesRef.current.push({
        x: x - 5,
        y: y + (Math.random() - 0.5) * 8,
        vx: -(Math.random() * 3 + 1),
        vy: (Math.random() - 0.5) * 2,
        life: 1,
        maxLife: 1,
        size: Math.random() * 4 + 2,
        color: Math.random() > 0.5 ? '#ff8833' : '#ffcc44',
      });
    }
  }, []);

  // Spawn explosion particles
  const spawnExplosion = useCallback((x: number, y: number) => {
    const colors = ['#ff4444', '#ff8833', '#ffcc44', '#ffffff', '#ff6622', '#ffaa00'];
    for (let i = 0; i < 40; i++) {
      const angle = (Math.PI * 2 * i) / 40 + Math.random() * 0.3;
      const speed = Math.random() * 6 + 2;
      explosionRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        size: Math.random() * 5 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }, []);

  // Reset game
  const resetGame = useCallback(() => {
    jetYRef.current = CANVAS_HEIGHT / 2;
    jetVelRef.current = 0;
    pipesRef.current = [];
    scoreRef.current = 0;
    frameRef.current = 0;
    particlesRef.current = [];
    explosionRef.current = [];
    engineGlowRef.current = 0;
    shakeRef.current = 0;
    setScore(0);
  }, []);

  // Flap action
  const flap = useCallback(() => {
    if (gameStateRef.current === 'menu') {
      resetGame();
      gameStateRef.current = 'playing';
      setDisplayState('playing');
      jetVelRef.current = FLAP_FORCE;
      engineGlowRef.current = 1;
    } else if (gameStateRef.current === 'playing') {
      jetVelRef.current = FLAP_FORCE;
      engineGlowRef.current = 1;
    } else if (gameStateRef.current === 'gameover') {
      resetGame();
      gameStateRef.current = 'menu';
      setDisplayState('menu');
    }
  }, [resetGame]);

  // Main game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    initStars();

    const loop = () => {
      const state = gameStateRef.current;

      // ── Update ──
      // Update stars (always)
      starsRef.current.forEach((star) => {
        star.x -= star.speed;
        if (star.x < 0) {
          star.x = CANVAS_WIDTH;
          star.y = Math.random() * CANVAS_HEIGHT;
        }
      });

      if (state === 'playing') {
        // Physics
        jetVelRef.current += GRAVITY;
        jetYRef.current += jetVelRef.current;
        engineGlowRef.current *= 0.92;
        frameRef.current++;

        // Spawn trail
        spawnTrailParticles(CANVAS_WIDTH / 4, jetYRef.current + JET_HEIGHT / 2);

        // Spawn pipes
        if (frameRef.current % PIPE_SPAWN_INTERVAL === 0) {
          const minTop = 60;
          const maxTop = CANVAS_HEIGHT - PIPE_GAP - 60;
          const topHeight = Math.random() * (maxTop - minTop) + minTop;
          pipesRef.current.push({ x: CANVAS_WIDTH, topHeight, scored: false });
        }

        // Move pipes
        pipesRef.current.forEach((pipe) => {
          pipe.x -= PIPE_SPEED;
        });

        // Remove off-screen pipes
        pipesRef.current = pipesRef.current.filter((p) => p.x > -PIPE_WIDTH - 20);

        // Score
        pipesRef.current.forEach((pipe) => {
          if (!pipe.scored && pipe.x + PIPE_WIDTH < CANVAS_WIDTH / 4) {
            pipe.scored = true;
            scoreRef.current++;
            setScore(scoreRef.current);
          }
        });

        // Collision detection
        const jetX = CANVAS_WIDTH / 4;
        const jetY = jetYRef.current;

        // Ground/ceiling
        if (jetY < 0 || jetY + JET_HEIGHT > CANVAS_HEIGHT) {
          spawnExplosion(jetX + JET_WIDTH / 2, jetY + JET_HEIGHT / 2);
          shakeRef.current = 15;
          gameStateRef.current = 'gameover';
          setDisplayState('gameover');
          if (scoreRef.current > bestScore) {
            setBestScore(scoreRef.current);
            localStorage.setItem('flappyjet-best', String(scoreRef.current));
          }
        }

        // Pipe collision
        for (const pipe of pipesRef.current) {
          const pipeRight = pipe.x + PIPE_WIDTH;
          const jetRight = jetX + JET_WIDTH;
          const jetBottom = jetY + JET_HEIGHT;

          if (jetRight > pipe.x + 8 && jetX < pipeRight - 8) {
            if (jetY < pipe.topHeight - 4 || jetBottom > pipe.topHeight + PIPE_GAP + 4) {
              spawnExplosion(jetX + JET_WIDTH / 2, jetY + JET_HEIGHT / 2);
              shakeRef.current = 15;
              gameStateRef.current = 'gameover';
              setDisplayState('gameover');
              if (scoreRef.current > bestScore) {
                setBestScore(scoreRef.current);
                localStorage.setItem('flappyjet-best', String(scoreRef.current));
              }
              break;
            }
          }
        }
      }

      // Update particles
      particlesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.04;
      });
      particlesRef.current = particlesRef.current.filter((p) => p.life > 0);

      // Update explosion
      explosionRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.97;
        p.vy *= 0.97;
        p.vy += 0.08;
        p.life -= 0.02;
      });
      explosionRef.current = explosionRef.current.filter((p) => p.life > 0);

      // Screen shake
      if (shakeRef.current > 0) shakeRef.current--;

      // ── Render ──
      ctx.save();
      if (shakeRef.current > 0) {
        const shakeX = (Math.random() - 0.5) * shakeRef.current * 1.5;
        const shakeY = (Math.random() - 0.5) * shakeRef.current * 1.5;
        ctx.translate(shakeX, shakeY);
      }

      // Sky gradient background
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      skyGrad.addColorStop(0, '#050a18');
      skyGrad.addColorStop(0.3, '#0a1628');
      skyGrad.addColorStop(0.6, '#0f2238');
      skyGrad.addColorStop(1, '#132a42');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Distant nebula effect
      const nebulaGrad = ctx.createRadialGradient(
        CANVAS_WIDTH * 0.7, CANVAS_HEIGHT * 0.3, 0,
        CANVAS_WIDTH * 0.7, CANVAS_HEIGHT * 0.3, 200
      );
      nebulaGrad.addColorStop(0, 'rgba(80, 40, 120, 0.15)');
      nebulaGrad.addColorStop(0.5, 'rgba(40, 20, 80, 0.08)');
      nebulaGrad.addColorStop(1, 'rgba(20, 10, 40, 0)');
      ctx.fillStyle = nebulaGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Stars
      starsRef.current.forEach((star) => {
        const twinkle = Math.sin(Date.now() / 500 + star.x) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * twinkle})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Ground line with glow
      const groundY = CANVAS_HEIGHT - 2;
      ctx.strokeStyle = 'rgba(100, 200, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(CANVAS_WIDTH, groundY);
      ctx.stroke();

      const groundGlow = ctx.createLinearGradient(0, CANVAS_HEIGHT - 30, 0, CANVAS_HEIGHT);
      groundGlow.addColorStop(0, 'rgba(100, 200, 255, 0)');
      groundGlow.addColorStop(1, 'rgba(100, 200, 255, 0.08)');
      ctx.fillStyle = groundGlow;
      ctx.fillRect(0, CANVAS_HEIGHT - 30, CANVAS_WIDTH, 30);

      // Pipes
      pipesRef.current.forEach((pipe) => {
        drawPipe(ctx, pipe.x, pipe.topHeight, CANVAS_HEIGHT, PIPE_GAP);
      });

      // Engine trail particles
      particlesRef.current.forEach((p) => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Explosion particles
      explosionRef.current.forEach((p) => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
        // Glow
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
        glow.addColorStop(0, p.color.replace(')', ', 0.3)').replace('rgb', 'rgba'));
        glow.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Fighter jet (only when playing or menu)
      if (state === 'playing' || state === 'menu') {
        const jetX = CANVAS_WIDTH / 4;
        const jetY = state === 'menu'
          ? CANVAS_HEIGHT / 2 + Math.sin(Date.now() / 400) * 15
          : jetYRef.current;
        const rotation = state === 'menu'
          ? Math.sin(Date.now() / 600) * 0.1
          : Math.min(Math.max(jetVelRef.current / 15, -0.5), 0.7);

        drawJet(ctx, jetX, jetY, rotation, state === 'menu' ? 0.5 : engineGlowRef.current);
      }

      // Score display (playing)
      if (state === 'playing') {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 48px "Orbitron", "Segoe UI", monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(100, 200, 255, 0.5)';
        ctx.shadowBlur = 15;
        ctx.fillText(String(scoreRef.current), CANVAS_WIDTH / 2, 70);
        ctx.restore();
      }

      // Menu overlay
      if (state === 'menu') {
        // Title
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.font = 'bold 42px "Orbitron", "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(100, 200, 255, 0.6)';
        ctx.shadowBlur = 20;
        ctx.fillText('FLAPPY JET', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 100);
        ctx.restore();

        // Subtitle
        ctx.fillStyle = 'rgba(150, 220, 255, 0.7)';
        ctx.font = '18px "Orbitron", "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('TACTICAL FLIGHT SIMULATOR', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 65);

        // Best score
        if (bestScore > 0) {
          ctx.fillStyle = 'rgba(255, 200, 100, 0.8)';
          ctx.font = '16px "Orbitron", "Segoe UI", sans-serif';
          ctx.fillText(`BEST: ${bestScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
        }

        // Start instruction
        const pulse = Math.sin(Date.now() / 500) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
        ctx.font = '20px "Orbitron", "Segoe UI", sans-serif';
        ctx.fillText('TAP OR PRESS SPACE', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 120);

        ctx.fillStyle = 'rgba(150, 200, 255, 0.5)';
        ctx.font = '14px "Orbitron", "Segoe UI", sans-serif';
        ctx.fillText('TO ENGAGE THRUSTERS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 148);
      }

      // Game over overlay
      if (state === 'gameover') {
        // Dim overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Game over panel background
        ctx.fillStyle = 'rgba(10, 20, 40, 0.85)';
        const panelX = CANVAS_WIDTH / 2 - 140;
        const panelY = CANVAS_HEIGHT / 2 - 110;
        const panelW = 280;
        const panelH = 220;
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelW, panelH, 12);
        ctx.fill();
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Game over text
        ctx.save();
        ctx.fillStyle = '#ff5555';
        ctx.font = 'bold 32px "Orbitron", "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(255, 50, 50, 0.5)';
        ctx.shadowBlur = 15;
        ctx.fillText('MISSION FAILED', CANVAS_WIDTH / 2, panelY + 50);
        ctx.restore();

        // Score
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = '18px "Orbitron", "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`SCORE: ${scoreRef.current}`, CANVAS_WIDTH / 2, panelY + 95);

        // Best
        ctx.fillStyle = 'rgba(255, 200, 100, 0.8)';
        ctx.font = '16px "Orbitron", "Segoe UI", sans-serif';
        ctx.fillText(`BEST: ${Math.max(scoreRef.current, bestScore)}`, CANVAS_WIDTH / 2, panelY + 125);

        // New best indicator
        if (scoreRef.current > 0 && scoreRef.current >= bestScore) {
          ctx.fillStyle = '#ffcc00';
          ctx.font = 'bold 14px "Orbitron", "Segoe UI", sans-serif';
          ctx.fillText('★ NEW RECORD ★', CANVAS_WIDTH / 2, panelY + 155);
        }

        // Restart instruction
        const pulse = Math.sin(Date.now() / 500) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(150, 220, 255, ${pulse})`;
        ctx.font = '15px "Orbitron", "Segoe UI", sans-serif';
        ctx.fillText('TAP TO RETURN TO BASE', CANVAS_WIDTH / 2, panelY + 195);
      }

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [initStars, spawnTrailParticles, spawnExplosion, bestScore]);

  // Input handlers
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        flap();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [flap]);

  return (
    <div className="flappy-jet-container" id="flappy-jet-game">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="flappy-jet-canvas"
        onClick={flap}
        onTouchStart={(e) => {
          e.preventDefault();
          flap();
        }}
      />
      <div className="flappy-jet-info">
        {displayState === 'playing' && (
          <div className="flappy-jet-score-hud" id="score-hud">
            <span className="hud-label">ALTITUDE SCORE</span>
            <span className="hud-value">{score}</span>
          </div>
        )}
      </div>
    </div>
  );
}
