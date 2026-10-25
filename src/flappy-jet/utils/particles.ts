import type { Particle } from '../types/game';
import { PARTICLE_COUNT, EXPLOSION_PARTICLE_COUNT } from './constants';

// ── Explosion Colors ────────────────────────────────────────
const EXPLOSION_COLORS = [
  '#ff4444',
  '#ff8833',
  '#ffcc44',
  '#ffffff',
  '#ff6622',
  '#ffaa00',
] as const;

// ── Trail Particles ─────────────────────────────────────────

/**
 * Creates engine-trail particles behind the jet.
 * Returns a new array of particles to be appended to the existing pool.
 */
export function createTrailParticles(x: number, y: number): Particle[] {
  const result: Particle[] = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    result.push({
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
  return result;
}

// ── Explosion Particles ─────────────────────────────────────

/**
 * Creates a burst of explosion particles radiating from (x, y).
 */
export function createExplosionParticles(x: number, y: number): Particle[] {
  const result: Particle[] = [];
  for (let i = 0; i < EXPLOSION_PARTICLE_COUNT; i++) {
    const angle = (Math.PI * 2 * i) / EXPLOSION_PARTICLE_COUNT + Math.random() * 0.3;
    const speed = Math.random() * 6 + 2;
    result.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      maxLife: 1,
      size: Math.random() * 5 + 2,
      color: EXPLOSION_COLORS[Math.floor(Math.random() * EXPLOSION_COLORS.length)],
    });
  }
  return result;
}

// ── Particle Update ─────────────────────────────────────────

const TRAIL_DECAY = 0.04;
const EXPLOSION_DRAG = 0.97;
const EXPLOSION_GRAVITY = 0.08;
const EXPLOSION_DECAY = 0.02;

/**
 * Steps all trail particles forward one frame and removes dead ones.
 * Mutates the array in-place for performance.
 */
export function updateTrailParticles(particles: Particle[]): Particle[] {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= TRAIL_DECAY;
  }
  return particles.filter((p) => p.life > 0);
}

/**
 * Steps all explosion particles forward one frame with drag + gravity.
 * Mutates the array in-place for performance.
 */
export function updateExplosionParticles(particles: Particle[]): Particle[] {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= EXPLOSION_DRAG;
    p.vy *= EXPLOSION_DRAG;
    p.vy += EXPLOSION_GRAVITY;
    p.life -= EXPLOSION_DECAY;
  }
  return particles.filter((p) => p.life > 0);
}
