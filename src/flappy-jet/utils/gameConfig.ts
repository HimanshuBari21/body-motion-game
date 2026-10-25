// ── Flight & Obstacle Physics Configuration ─────────────────

export interface GamePhysicsConfig {
  /** Preset identifier. */
  presetId: 'body-motion' | 'casual' | 'ace' | 'classic-click' | 'custom';
  name: string;

  // ── Vertical Motion Physics ───────────────────────────────
  /** Downward gravity acceleration per frame. */
  gravity: number;
  /** Base upward acceleration per frame when hand is raised. */
  thrustForce: number;
  /** Terminal upward climb speed clamp (absolute value). */
  maxClimbSpeed: number;
  /** Terminal downward fall speed clamp (absolute value). */
  maxFallSpeed: number;
  /** Aerodynamic damping factor per frame (0.90 - 0.99). Prevents inertia runaway. */
  damping: number;
  /** Instantaneous velocity impulse applied on tap/click/Space. */
  tapFlapForce: number;

  // ── Obstacle Spacing & Speed ("space between") ────────────
  /** Vertical gap opening between upper and lower buildings (pixels). */
  pipeGap: number;
  /** Horizontal scroll speed of buildings (pixels per frame). */
  pipeSpeed: number;
  /** Number of frames between consecutive pipe obstacle spawns. */
  pipeSpawnInterval: number;
  /** Minimum pixel clearance from canvas top/bottom edge. */
  pipeMinEdgeMargin: number;

  // ── Hitbox Forgiveness ────────────────────────────────────
  /** Inset pixels on pipe horizontal edges (larger = more forgiving). */
  collisionInsetX: number;
  /** Inset pixels on pipe vertical opening edges (larger = more forgiving). */
  collisionInsetY: number;

  // ── Motion Input Settings ─────────────────────────────────
  /** Require either single hand or strictly both hands. */
  handControlMode: 'either' | 'both';
  /** Modulate thrust acceleration based on hand elevation above shoulder. */
  proportionalThrust: boolean;
}

// ── Built-in Presets ────────────────────────────────────────

export const PHYSICS_PRESETS: Record<
  'body-motion' | 'casual' | 'ace' | 'classic-click',
  GamePhysicsConfig
> = {
  'body-motion': {
    presetId: 'body-motion',
    name: 'Body Motion (Comfort & Flow)',
    gravity: 0.20,
    thrustForce: 0.38,
    maxClimbSpeed: 3.8,
    maxFallSpeed: 3.4,
    damping: 0.95,
    tapFlapForce: -3.8,
    pipeGap: 260, // +24% wider than classic for arm motion reaction
    pipeSpeed: 1.9, // Smooth cruising pace
    pipeSpawnInterval: 220, // Ample breathing room between gates
    pipeMinEdgeMargin: 60,
    collisionInsetX: 12,
    collisionInsetY: 8,
    handControlMode: 'either',
    proportionalThrust: true,
  },

  casual: {
    presetId: 'casual',
    name: 'Casual Flight (Wide Space)',
    gravity: 0.16,
    thrustForce: 0.35,
    maxClimbSpeed: 3.4,
    maxFallSpeed: 3.0,
    damping: 0.94,
    tapFlapForce: -3.5,
    pipeGap: 290, // Extra-wide gate
    pipeSpeed: 1.6, // Relaxed speed
    pipeSpawnInterval: 240,
    pipeMinEdgeMargin: 50,
    collisionInsetX: 14,
    collisionInsetY: 10,
    handControlMode: 'either',
    proportionalThrust: true,
  },

  ace: {
    presetId: 'ace',
    name: 'Ace Pilot (Fast & Tight)',
    gravity: 0.25,
    thrustForce: 0.45,
    maxClimbSpeed: 4.5,
    maxFallSpeed: 4.2,
    damping: 0.96,
    tapFlapForce: -4.2,
    pipeGap: 230,
    pipeSpeed: 2.3,
    pipeSpawnInterval: 195,
    pipeMinEdgeMargin: 60,
    collisionInsetX: 10,
    collisionInsetY: 6,
    handControlMode: 'either',
    proportionalThrust: true,
  },

  'classic-click': {
    presetId: 'classic-click',
    name: 'Arcade Tap / Click',
    gravity: 0.28,
    thrustForce: 0.50,
    maxClimbSpeed: 5.5,
    maxFallSpeed: 5.5,
    damping: 0.98,
    tapFlapForce: -4.4,
    pipeGap: 210, // Classic narrow gap
    pipeSpeed: 2.4, // Classic fast speed
    pipeSpawnInterval: 200,
    pipeMinEdgeMargin: 60,
    collisionInsetX: 8,
    collisionInsetY: 4,
    handControlMode: 'both',
    proportionalThrust: false,
  },
};

export const DEFAULT_GAME_CONFIG: GamePhysicsConfig = PHYSICS_PRESETS['body-motion'];
