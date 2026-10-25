import { useEffect, useRef, useCallback, useState } from 'react';
import type { GameState, Pipe, Star, Particle } from '../types/game';
import type { MotionFlightData } from './usePoseDetection';
import {
  type GamePhysicsConfig,
  DEFAULT_GAME_CONFIG,
} from '../utils/gameConfig';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PIPE_WIDTH,
  JET_WIDTH,
  JET_HEIGHT,
  JET_X,
  ENGINE_GLOW_DECAY,
} from '../utils/constants';
import { createStars, updateStars } from '../utils/stars';
import {
  createTrailParticles,
  createExplosionParticles,
  updateTrailParticles,
  updateExplosionParticles,
} from '../utils/particles';
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
 * Encapsulates the FlappyJet game loop:
 * - Damped aerodynamic flight physics tailored for body motion
 * - Velocity damping and terminal speed clamping (no runaway climbs/falls)
 * - Proportional thrust based on arm elevation
 * - Dynamic pipe gap and spacing
 * - Rendering and state transitions
 */
export function useGameLoop(
  bestScore: number,
  submitScore: (score: number) => void,
  handsRaisedRef?: React.RefObject<boolean>,
  motionFlightRef?: React.RefObject<MotionFlightData>,
  configRef?: React.RefObject<GamePhysicsConfig>,
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
  const gameOverTimeRef = useRef(0);

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
    const config = configRef?.current ?? DEFAULT_GAME_CONFIG;

    if (state === 'menu') {
      resetGame();
      gameStateRef.current = 'playing';
      setDisplayState('playing');
      jetVelRef.current = config.tapFlapForce;
      engineGlowRef.current = 1;
    } else if (state === 'playing') {
      jetVelRef.current = config.tapFlapForce;
      engineGlowRef.current = 1;
    } else if (state === 'gameover') {
      if (performance.now() - gameOverTimeRef.current < 600) return;
      resetGame();
      gameStateRef.current = 'menu';
      setDisplayState('menu');
    }
  }, [resetGame, configRef]);

  // ── Handle collision → game over ──────────────────────────
  const handleCollision = useCallback(
    (centerX: number, centerY: number) => {
      gameOverTimeRef.current = performance.now();
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
      const config = configRef?.current ?? DEFAULT_GAME_CONFIG;

      // Real-time zero-lag motion inputs
      const motion = motionFlightRef?.current;
      const isThrusting = motion ? motion.isThrusting : (handsRaisedRef?.current ?? false);
      const thrustPower = motion ? motion.power : (isThrusting ? 1.0 : 0);
      const areBothHands = motion ? motion.areBothHandsRaised : false;

      // Handle motion start/restart triggers
      if (state === 'menu' && isThrusting) {
        resetGame();
        gameStateRef.current = 'playing';
        setDisplayState('playing');
        jetVelRef.current = config.tapFlapForce;
        engineGlowRef.current = 1;
      }

      if (state === 'gameover' && isThrusting) {
        if (performance.now() - gameOverTimeRef.current >= 900) {
          resetGame();
          gameStateRef.current = 'playing';
          setDisplayState('playing');
          jetVelRef.current = config.tapFlapForce;
          engineGlowRef.current = 1;
        }
      }

      // ── Update phase ──────────────────────────────────────
      updateStars(starsRef.current);

      if (state === 'playing') {
        // Natural Body Motion Flight Dynamics
        if (isThrusting) {
          // Raising hand(s): thrust accelerates jet upward smoothly
          const powerMult = config.proportionalThrust
            ? 0.75 + thrustPower * 0.45
            : 1.0;
          const accel = config.thrustForce * powerMult;

          // Upward acceleration, clamped at maximum climb speed
          jetVelRef.current = Math.max(jetVelRef.current - accel, -config.maxClimbSpeed);

          // Aerodynamic damping stabilizes climb and prevents wild overshoots
          jetVelRef.current *= config.damping;

          engineGlowRef.current = Math.min(1.0, engineGlowRef.current + 0.25);
        } else {
          // Lowered hands: gravity glides jet down gently
          jetVelRef.current += config.gravity;

          // Aerodynamic damping prevents uncontrolled free-fall runaway
          jetVelRef.current *= config.damping;

          // Terminal fall speed clamp (keeps downward trajectory readable and controllable)
          if (jetVelRef.current > config.maxFallSpeed) {
            jetVelRef.current = config.maxFallSpeed;
          }

          engineGlowRef.current *= ENGINE_GLOW_DECAY;
        }

        jetYRef.current += jetVelRef.current;
        frameRef.current++;

        // Engine trail particles
        particlesRef.current.push(
          ...createTrailParticles(JET_X, jetYRef.current + JET_HEIGHT / 2),
        );
        if (isThrusting) {
          particlesRef.current.push(
            ...createTrailParticles(JET_X - 4, jetYRef.current + JET_HEIGHT / 2),
          );
          if (areBothHands) {
            particlesRef.current.push(
              ...createTrailParticles(JET_X - 8, jetYRef.current + JET_HEIGHT / 2),
            );
          }
        }

        // Pipe spawning with configured interval and gate opening
        if (frameRef.current % config.pipeSpawnInterval === 0) {
          const currentGap = config.pipeGap;
          const maxTop = CANVAS_HEIGHT - currentGap - config.pipeMinEdgeMargin;
          const topHeight =
            Math.random() * (maxTop - config.pipeMinEdgeMargin) + config.pipeMinEdgeMargin;
          pipesRef.current.push({ x: CANVAS_WIDTH, topHeight, gap: currentGap, scored: false });
        }

        // Move pipes at cruising speed
        for (const pipe of pipesRef.current) {
          pipe.x -= config.pipeSpeed;
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

        // Pipe collision (using active gap and forgiving insets)
        if (gameStateRef.current === 'playing') {
          const result = checkPipeCollision(
            JET_X,
            jetYRef.current,
            pipesRef.current,
            config.pipeGap,
            config.collisionInsetX,
            config.collisionInsetY,
          );
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

      // Pipes with dynamic per-pipe gap
      for (const pipe of pipesRef.current) {
        drawPipe(ctx, pipe.x, pipe.topHeight, CANVAS_HEIGHT, pipe.gap ?? config.pipeGap);
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
  }, [bestScore, handleCollision, handsRaisedRef, motionFlightRef, configRef, resetGame]);

  return { canvasRef, displayState, score, flap };
}
