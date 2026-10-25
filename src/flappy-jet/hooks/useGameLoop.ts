import { useEffect, useRef, useCallback, useState } from 'react';
import type { GameState, Pipe, Star, Particle } from '../types/game';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GRAVITY,
  FLAP_FORCE,
  PIPE_WIDTH,
  PIPE_GAP,
  PIPE_SPEED,
  PIPE_SPAWN_INTERVAL,
  PIPE_MIN_EDGE_MARGIN,
  JET_WIDTH,
  JET_HEIGHT,
  JET_X,
  ENGINE_GLOW_DECAY,
} from '../utils/constants';
import { createStars, updateStars } from '../utils/stars';
import { createTrailParticles, createExplosionParticles, updateTrailParticles, updateExplosionParticles } from '../utils/particles';
import { isOutOfBounds, checkPipeCollision } from '../utils/collision';
import {
  drawBackground,
  drawStars,
  drawGround,
  drawJet,
  drawPipe,
  drawTrailParticles,
  drawExplosionParticles,
  drawScore,
  drawMenuOverlay,
  drawGameOverOverlay,
} from '../utils/renderers';

// ── Return type ─────────────────────────────────────────────

export interface UseGameLoopReturn {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  displayState: GameState;
  score: number;
  flap: () => void;
}

// ── Hook ────────────────────────────────────────────────────

/**
 * Encapsulates the entire FlappyJet game loop: physics, spawning,
 * collision detection, rendering, and state transitions.
 *
 * `bestScore` and `submitScore` are injected so the hook stays
 * decoupled from storage concerns.
 */
export function useGameLoop(
  bestScore: number,
  submitScore: (score: number) => void,
): UseGameLoopReturn {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ── React state (drives UI outside canvas) ────────────────
  const [displayState, setDisplayState] = useState<GameState>('menu');
  const [score, setScore] = useState(0);

  // ── Mutable game state (animation-frame loop) ─────────────
  const gameStateRef = useRef<GameState>('menu');
  const jetYRef = useRef(CANVAS_HEIGHT / 2);
  const jetVelRef = useRef(0);
  const pipesRef = useRef<Pipe[]>([]);
  const scoreRef = useRef(0);
  const frameRef = useRef(0);
  const starsRef = useRef<Star[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const explosionRef = useRef<Particle[]>([]);
  const engineGlowRef = useRef(0);
  const animFrameRef = useRef(0);
  const shakeRef = useRef(0);

  // ── Reset game state to defaults ──────────────────────────
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

  // ── Flap / tap handler (state machine) ────────────────────
  const flap = useCallback(() => {
    const state = gameStateRef.current;

    if (state === 'menu') {
      resetGame();
      gameStateRef.current = 'playing';
      setDisplayState('playing');
      jetVelRef.current = FLAP_FORCE;
      engineGlowRef.current = 1;
    } else if (state === 'playing') {
      jetVelRef.current = FLAP_FORCE;
      engineGlowRef.current = 1;
    } else if (state === 'gameover') {
      resetGame();
      gameStateRef.current = 'menu';
      setDisplayState('menu');
    }
  }, [resetGame]);

  // ── Handle collision → game over ──────────────────────────
  const handleCollision = useCallback(
    (centerX: number, centerY: number) => {
      explosionRef.current.push(...createExplosionParticles(centerX, centerY));
      shakeRef.current = 15;
      gameStateRef.current = 'gameover';
      setDisplayState('gameover');
      submitScore(scoreRef.current);
    },
    [submitScore],
  );

  // ── Main loop effect ──────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialise starfield
    starsRef.current = createStars();

    const loop = () => {
      const state = gameStateRef.current;

      // ── Update phase ──────────────────────────────────────
      updateStars(starsRef.current);

      if (state === 'playing') {
        // Physics
        jetVelRef.current += GRAVITY;
        jetYRef.current += jetVelRef.current;
        engineGlowRef.current *= ENGINE_GLOW_DECAY;
        frameRef.current++;

        // Engine trail
        particlesRef.current.push(
          ...createTrailParticles(JET_X, jetYRef.current + JET_HEIGHT / 2),
        );

        // Pipe spawning
        if (frameRef.current % PIPE_SPAWN_INTERVAL === 0) {
          const maxTop = CANVAS_HEIGHT - PIPE_GAP - PIPE_MIN_EDGE_MARGIN;
          const topHeight =
            Math.random() * (maxTop - PIPE_MIN_EDGE_MARGIN) + PIPE_MIN_EDGE_MARGIN;
          pipesRef.current.push({ x: CANVAS_WIDTH, topHeight, scored: false });
        }

        // Move pipes
        for (const pipe of pipesRef.current) {
          pipe.x -= PIPE_SPEED;
        }

        // Cull off-screen pipes
        pipesRef.current = pipesRef.current.filter((p) => p.x > -PIPE_WIDTH - 20);

        // Scoring
        for (const pipe of pipesRef.current) {
          if (!pipe.scored && pipe.x + PIPE_WIDTH < JET_X) {
            pipe.scored = true;
            scoreRef.current++;
            setScore(scoreRef.current);
          }
        }

        // Boundary collision
        if (isOutOfBounds(jetYRef.current)) {
          handleCollision(JET_X + JET_WIDTH / 2, jetYRef.current + JET_HEIGHT / 2);
        }

        // Pipe collision (only check if still playing — boundary may have ended it)
        if (gameStateRef.current === 'playing') {
          const result = checkPipeCollision(JET_X, jetYRef.current, pipesRef.current);
          if (result.collided) {
            handleCollision(result.jetCenterX, result.jetCenterY);
          }
        }
      }

      // Particles (always update so trails/explosions fade out on game-over)
      particlesRef.current = updateTrailParticles(particlesRef.current);
      explosionRef.current = updateExplosionParticles(explosionRef.current);

      if (shakeRef.current > 0) shakeRef.current--;

      // ── Render phase ──────────────────────────────────────
      ctx.save();

      if (shakeRef.current > 0) {
        const shakeX = (Math.random() - 0.5) * shakeRef.current * 1.5;
        const shakeY = (Math.random() - 0.5) * shakeRef.current * 1.5;
        ctx.translate(shakeX, shakeY);
      }

      drawBackground(ctx);
      drawStars(ctx, starsRef.current);
      drawGround(ctx);

      // Pipes
      for (const pipe of pipesRef.current) {
        drawPipe(ctx, pipe.x, pipe.topHeight, CANVAS_HEIGHT, PIPE_GAP);
      }

      // Trail particles
      drawTrailParticles(ctx, particlesRef.current);

      // Explosion particles
      drawExplosionParticles(ctx, explosionRef.current);

      // Jet (visible during menu and playing)
      if (state === 'playing' || state === 'menu') {
        const jetY =
          state === 'menu'
            ? CANVAS_HEIGHT / 2 + Math.sin(Date.now() / 400) * 15
            : jetYRef.current;
        const rotation =
          state === 'menu'
            ? Math.sin(Date.now() / 600) * 0.1
            : Math.min(Math.max(jetVelRef.current / 15, -0.5), 0.7);

        drawJet(ctx, JET_X, jetY, rotation, state === 'menu' ? 0.5 : engineGlowRef.current);
      }

      // HUD / overlays
      if (state === 'playing') {
        drawScore(ctx, scoreRef.current);
      } else if (state === 'menu') {
        drawMenuOverlay(ctx, bestScore);
      } else if (state === 'gameover') {
        drawGameOverOverlay(ctx, scoreRef.current, bestScore);
      }

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animFrameRef.current);
  }, [bestScore, handleCollision]);

  return { canvasRef, displayState, score, flap };
}
