// ── Game Entity Types ───────────────────────────────────────

export interface Pipe {
  x: number;
  topHeight: number;
  gap?: number;
  scored: boolean;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export type GameState = 'menu' | 'playing' | 'gameover';

// ── Game State Snapshot (used by renderers) ─────────────────

export interface GameSnapshot {
  state: GameState;
  jetY: number;
  jetVel: number;
  pipes: readonly Pipe[];
  stars: readonly Star[];
  particles: readonly Particle[];
  explosionParticles: readonly Particle[];
  engineGlow: number;
  shake: number;
  score: number;
  bestScore: number;
}
