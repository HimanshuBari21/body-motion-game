import type { Pipe } from '../types/game';
import {
  CANVAS_HEIGHT,
  JET_WIDTH,
  JET_HEIGHT,
  PIPE_WIDTH,
  PIPE_GAP,
  PIPE_COLLISION_INSET_X,
  PIPE_COLLISION_INSET_Y,
} from './constants';

// ── Collision Result ────────────────────────────────────────

export interface CollisionResult {
  collided: boolean;
  /** Center of the jet at the time of collision (for spawning explosion). */
  jetCenterX: number;
  jetCenterY: number;
}

// ── Boundary Check ──────────────────────────────────────────

/**
 * Returns true if the jet is outside the vertical bounds of the canvas.
 */
export function isOutOfBounds(jetY: number): boolean {
  return jetY < 0 || jetY + JET_HEIGHT > CANVAS_HEIGHT;
}

// ── Pipe Collision ──────────────────────────────────────────

/**
 * Tests whether the jet AABB overlaps any pipe opening.
 * Uses inset margins to give a slightly forgiving hitbox.
 */
export function checkPipeCollision(
  jetX: number,
  jetY: number,
  pipes: readonly Pipe[],
): CollisionResult {
  const jetRight = jetX + JET_WIDTH;
  const jetBottom = jetY + JET_HEIGHT;
  const centerX = jetX + JET_WIDTH / 2;
  const centerY = jetY + JET_HEIGHT / 2;

  for (const pipe of pipes) {
    const pipeRight = pipe.x + PIPE_WIDTH;

    // Horizontal overlap (with forgiving inset)
    if (jetRight > pipe.x + PIPE_COLLISION_INSET_X && jetX < pipeRight - PIPE_COLLISION_INSET_X) {
      // Vertical check: jet must be inside the gap
      if (
        jetY < pipe.topHeight - PIPE_COLLISION_INSET_Y ||
        jetBottom > pipe.topHeight + PIPE_GAP + PIPE_COLLISION_INSET_Y
      ) {
        return { collided: true, jetCenterX: centerX, jetCenterY: centerY };
      }
    }
  }

  return { collided: false, jetCenterX: centerX, jetCenterY: centerY };
}
