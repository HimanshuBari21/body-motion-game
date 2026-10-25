import type { Star } from '../types/game';
import { CANVAS_WIDTH, CANVAS_HEIGHT, STAR_COUNT } from './constants';

/**
 * Creates the initial starfield.
 */
export function createStars(): Star[] {
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
  return stars;
}

/**
 * Advances stars one frame to the left, wrapping around.
 * Mutates in-place for performance.
 */
export function updateStars(stars: Star[]): void {
  for (const star of stars) {
    star.x -= star.speed;
    if (star.x < 0) {
      star.x = CANVAS_WIDTH;
      star.y = Math.random() * CANVAS_HEIGHT;
    }
  }
}
