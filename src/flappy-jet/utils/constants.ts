// ── Canvas ──────────────────────────────────────────────────
export const CANVAS_WIDTH = 480;
export const CANVAS_HEIGHT = 720;

// ── Physics ─────────────────────────────────────────────────
export const GRAVITY = 0.1;
export const FLAP_FORCE = -4.2;

// ── Pipes ───────────────────────────────────────────────────
export const PIPE_WIDTH = 70;
export const PIPE_GAP = 210;
export const PIPE_SPEED = 2.4;
export const PIPE_SPAWN_INTERVAL = 200; // frames

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
export const PIPE_COLLISION_INSET_X = 8;
/** Inset pixels on pipe Y edges to be slightly forgiving. */
export const PIPE_COLLISION_INSET_Y = 4;

// ── LocalStorage Keys ───────────────────────────────────────
export const BEST_SCORE_KEY = 'flappyjet-best';
