// ── Canvas ──────────────────────────────────────────────────
export const CANVAS_WIDTH = 480;
export const CANVAS_HEIGHT = 720;

// ── Physics ─────────────────────────────────────────────────
export const GRAVITY = 0.20;
export const THRUST_FORCE = 0.38;
export const FLAP_FORCE = -3.8;
export const MAX_CLIMB_SPEED = 3.8;
export const MAX_FALL_SPEED = 3.4;
export const DAMPING = 0.95;

// ── Pipes ───────────────────────────────────────────────────
export const PIPE_WIDTH = 70;
export const PIPE_GAP = 260; // Generous clearance for body motion
export const PIPE_SPEED = 1.9; // Smooth cruising pace
export const PIPE_SPAWN_INTERVAL = 220; // frames

/** Minimum distance from top/bottom edge for pipe opening. */
export const PIPE_MIN_EDGE_MARGIN = 60;

// ── Jet ─────────────────────────────────────────────────────
export const JET_WIDTH = 50;
export const JET_HEIGHT = 35;
export const JET_X = CANVAS_WIDTH / 4;

// ── Visual FX ───────────────────────────────────────────────
export const STAR_COUNT = 60;
export const PARTICLE_COUNT = 5;
export const EXPLOSION_PARTICLE_COUNT = 40;

/** Engine glow decay factor per frame (0–1 range, lower = faster fade). */
export const ENGINE_GLOW_DECAY = 0.92;

// ── Collision Margins ───────────────────────────────────────
/** Inset pixels on pipe X edges to be slightly forgiving. */
export const PIPE_COLLISION_INSET_X = 12;
/** Inset pixels on pipe Y edges to be slightly forgiving. */
export const PIPE_COLLISION_INSET_Y = 8;

// ── LocalStorage Keys ───────────────────────────────────────
export const BEST_SCORE_KEY = 'flappyjet-best';
