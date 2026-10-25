import type { Particle, Star } from '../types/game';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PIPE_WIDTH,
  JET_WIDTH,
  JET_HEIGHT,
} from './constants';

// ─────────────────────────────────────────────────────────────
// Background Rendering
// ─────────────────────────────────────────────────────────────

/**
 * Draws the dark sky gradient + nebula effect.
 */
export function drawBackground(ctx: CanvasRenderingContext2D): void {
  // Sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  skyGrad.addColorStop(0, '#050a18');
  skyGrad.addColorStop(0.3, '#0a1628');
  skyGrad.addColorStop(0.6, '#0f2238');
  skyGrad.addColorStop(1, '#132a42');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Distant nebula
  const nebulaGrad = ctx.createRadialGradient(
    CANVAS_WIDTH * 0.7,
    CANVAS_HEIGHT * 0.3,
    0,
    CANVAS_WIDTH * 0.7,
    CANVAS_HEIGHT * 0.3,
    200,
  );
  nebulaGrad.addColorStop(0, 'rgba(80, 40, 120, 0.15)');
  nebulaGrad.addColorStop(0.5, 'rgba(40, 20, 80, 0.08)');
  nebulaGrad.addColorStop(1, 'rgba(20, 10, 40, 0)');
  ctx.fillStyle = nebulaGrad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

/**
 * Draws twinkle-animated stars.
 */
export function drawStars(ctx: CanvasRenderingContext2D, stars: readonly Star[]): void {
  const now = Date.now();
  for (const star of stars) {
    const twinkle = Math.sin(now / 500 + star.x) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * twinkle})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Draws the ground line with a glow effect.
 */
export function drawGround(ctx: CanvasRenderingContext2D): void {
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
}

// ─────────────────────────────────────────────────────────────
// Jet Rendering
// ─────────────────────────────────────────────────────────────

/**
 * Draws the fighter jet at (x, y) with given rotation and engine glow.
 */
export function drawJet(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rotation: number,
  engineGlow: number,
): void {
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

// ─────────────────────────────────────────────────────────────
// Building (Skyscraper) Rendering
// ─────────────────────────────────────────────────────────────

// Window grid config
const WIN_COLS = 5;
const WIN_W = 7;
const WIN_H = 9;
const WIN_PAD_X = 6; // horizontal gap between windows
const WIN_PAD_Y = 5; // vertical gap between windows
const FLOOR_HEIGHT = WIN_H + WIN_PAD_Y; // height of one floor row

// Observation-deck / ledge heights
const LEDGE_H = 14;
const ANTENNA_H = 22;

// Warm window colours (some lit, some dark)
const WIN_LIT_COLORS = [
  'rgba(255, 220, 130, 0.85)',
  'rgba(255, 200, 100, 0.75)',
  'rgba(255, 240, 180, 0.65)',
  'rgba(200, 230, 255, 0.50)', // cool-white office light
] as const;
const WIN_DARK = 'rgba(15, 25, 45, 0.9)';

/**
 * Cheap deterministic pseudo-random from two integers.
 * Produces a float in [0, 1). Stays the same across frames because
 * the inputs (column, row derived from the pipe's x) don't change.
 */
function seededRand(a: number, b: number): number {
  let h = (a * 2654435761) ^ (b * 2246822519);
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/**
 * Draws a pair of skyscrapers (top hanging + bottom rising) with glass
 * facades, lit/unlit windows, ledges, antennas, and aircraft warning lights.
 *
 * Keeps the same signature as the old `drawPipe` so callers don't change.
 */
export function drawPipe(
  ctx: CanvasRenderingContext2D,
  x: number,
  topHeight: number,
  canvasHeight: number,
  gap: number,
): void {
  const now = Date.now();
  // Seed derived from the obstacle's spawn x (stays constant per pipe)
  const seed = Math.round(x * 7);

  // ── Top building (hangs from ceiling, "inverted") ─────────
  drawBuilding(ctx, x, 0, topHeight, seed, 'top', now);

  // ── Bottom building (rises from ground) ───────────────────
  const bottomY = topHeight + gap;
  const bottomH = canvasHeight - bottomY;
  drawBuilding(ctx, x, bottomY, bottomH, seed + 9999, 'bottom', now);
}

/**
 * Draws one skyscraper.
 *
 * @param originY  Top-left Y of the building rect.
 * @param height   Total pixel height of the building rect.
 * @param orient   'top' = ledge/antenna at the bottom edge (hanging building);
 *                 'bottom' = ledge/antenna at the top edge (rising building).
 */
function drawBuilding(
  ctx: CanvasRenderingContext2D,
  x: number,
  originY: number,
  height: number,
  seed: number,
  orient: 'top' | 'bottom',
  now: number,
): void {
  if (height <= 0) return;

  const w = PIPE_WIDTH;

  // ── Facade body ───────────────────────────────────────────
  const bodyGrad = ctx.createLinearGradient(x, 0, x + w, 0);
  bodyGrad.addColorStop(0, '#0c1a2c');
  bodyGrad.addColorStop(0.15, '#152940');
  bodyGrad.addColorStop(0.5, '#1c3350');
  bodyGrad.addColorStop(0.85, '#152940');
  bodyGrad.addColorStop(1, '#0c1a2c');
  ctx.fillStyle = bodyGrad;
  ctx.fillRect(x, originY, w, height);

  // ── 3-D side edge highlight (left) ────────────────────────
  const edgeGrad = ctx.createLinearGradient(x, 0, x + 5, 0);
  edgeGrad.addColorStop(0, 'rgba(100, 180, 230, 0.12)');
  edgeGrad.addColorStop(1, 'rgba(100, 180, 230, 0)');
  ctx.fillStyle = edgeGrad;
  ctx.fillRect(x, originY, 5, height);

  // ── Observation-deck ledge ────────────────────────────────
  const ledgeY = orient === 'bottom' ? originY : originY + height - LEDGE_H;
  const ledgeGrad = ctx.createLinearGradient(x - 6, 0, x + w + 6, 0);
  ledgeGrad.addColorStop(0, '#08131f');
  ledgeGrad.addColorStop(0.3, '#16303f');
  ledgeGrad.addColorStop(0.5, '#1e4050');
  ledgeGrad.addColorStop(0.7, '#16303f');
  ledgeGrad.addColorStop(1, '#08131f');
  ctx.fillStyle = ledgeGrad;
  ctx.fillRect(x - 6, ledgeY, w + 12, LEDGE_H);

  // Ledge top/bottom accent line
  ctx.strokeStyle = 'rgba(100, 210, 255, 0.35)';
  ctx.lineWidth = 1;
  const accentLineY = orient === 'bottom' ? ledgeY : ledgeY + LEDGE_H;
  ctx.beginPath();
  ctx.moveTo(x - 6, accentLineY);
  ctx.lineTo(x + w + 6, accentLineY);
  ctx.stroke();

  // ── Antenna + aircraft warning light ──────────────────────
  const antennaCx = x + w / 2;
  let antennaBaseY: number;
  let antennaTipY: number;
  if (orient === 'bottom') {
    antennaBaseY = originY;
    antennaTipY = originY - ANTENNA_H;
  } else {
    antennaBaseY = originY + height;
    antennaTipY = originY + height + ANTENNA_H;
  }

  // Antenna pole
  ctx.strokeStyle = 'rgba(160, 200, 220, 0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(antennaCx, antennaBaseY);
  ctx.lineTo(antennaCx, antennaTipY);
  ctx.stroke();

  // Cross-bars
  ctx.lineWidth = 1;
  const crossY1 = antennaBaseY + (antennaTipY - antennaBaseY) * 0.4;
  const crossY2 = antennaBaseY + (antennaTipY - antennaBaseY) * 0.7;
  for (const cy of [crossY1, crossY2]) {
    ctx.beginPath();
    ctx.moveTo(antennaCx - 5, cy);
    ctx.lineTo(antennaCx + 5, cy);
    ctx.stroke();
  }

  // Blinking aircraft warning light
  drawAircraftLight(ctx, antennaCx, antennaTipY, now, orient === 'top' ? Math.PI : 0);

  // ── Window grid ───────────────────────────────────────────
  // Calculate the drawable zone (inside the ledge)
  let winZoneTop: number;
  let winZoneBottom: number;
  if (orient === 'bottom') {
    winZoneTop = originY + LEDGE_H + 4;
    winZoneBottom = originY + height;
  } else {
    winZoneTop = originY;
    winZoneBottom = originY + height - LEDGE_H - 4;
  }

  const totalGridW = WIN_COLS * WIN_W + (WIN_COLS - 1) * WIN_PAD_X;
  const gridOffsetX = x + (w - totalGridW) / 2;

  let rowIndex = 0;
  for (
    let wy = winZoneTop + WIN_PAD_Y;
    wy + WIN_H <= winZoneBottom;
    wy += FLOOR_HEIGHT
  ) {
    // Thin floor-divider line
    ctx.strokeStyle = 'rgba(80, 140, 180, 0.10)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(x + 3, wy - 2);
    ctx.lineTo(x + w - 3, wy - 2);
    ctx.stroke();

    for (let col = 0; col < WIN_COLS; col++) {
      const wx = gridOffsetX + col * (WIN_W + WIN_PAD_X);
      const r = seededRand(seed + col, rowIndex);
      const isLit = r > 0.35; // ~65 % of windows are lit

      if (isLit) {
        const colorIdx = Math.floor(seededRand(seed + col + 77, rowIndex + 33) * WIN_LIT_COLORS.length);
        ctx.fillStyle = WIN_LIT_COLORS[colorIdx];
        ctx.fillRect(wx, wy, WIN_W, WIN_H);

        // Subtle warm glow spill
        ctx.fillStyle = 'rgba(255, 210, 120, 0.06)';
        ctx.fillRect(wx - 2, wy - 1, WIN_W + 4, WIN_H + 2);
      } else {
        ctx.fillStyle = WIN_DARK;
        ctx.fillRect(wx, wy, WIN_W, WIN_H);
      }
    }
    rowIndex++;
  }

  // ── Outer border ──────────────────────────────────────────
  ctx.strokeStyle = 'rgba(80, 170, 220, 0.18)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, originY, w, height);
}

/**
 * Draws a blinking red aircraft warning light with glow.
 */
function drawAircraftLight(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  now: number,
  phaseOffset: number,
): void {
  const pulse = Math.sin(now / 300 + phaseOffset);

  ctx.fillStyle = `rgba(255, 60, 60, ${0.6 + pulse * 0.4})`;
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fill();

  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 12);
  glow.addColorStop(0, `rgba(255, 60, 60, ${0.35 + pulse * 0.25})`);
  glow.addColorStop(1, 'rgba(255, 60, 60, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, 12, 0, Math.PI * 2);
  ctx.fill();
}

// ─────────────────────────────────────────────────────────────
// Particle Rendering
// ─────────────────────────────────────────────────────────────

/**
 * Renders trail particles.
 */
export function drawTrailParticles(
  ctx: CanvasRenderingContext2D,
  particles: readonly Particle[],
): void {
  for (const p of particles) {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/**
 * Renders explosion particles with glow.
 */
export function drawExplosionParticles(
  ctx: CanvasRenderingContext2D,
  particles: readonly Particle[],
): void {
  for (const p of particles) {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();

    // Glow around each particle
    const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
    glow.addColorStop(0, p.color.replace(')', ', 0.3)').replace('rgb', 'rgba'));
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ─────────────────────────────────────────────────────────────
// HUD / Overlay Rendering
// ─────────────────────────────────────────────────────────────

/**
 * Draws the in-game score at the top of the canvas.
 */
export function drawScore(ctx: CanvasRenderingContext2D, score: number): void {
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = 'bold 48px "Orbitron", "Segoe UI", monospace';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(100, 200, 255, 0.5)';
  ctx.shadowBlur = 15;
  ctx.fillText(String(score), CANVAS_WIDTH / 2, 70);
  ctx.restore();
}

/**
 * Draws the main menu overlay (title, subtitle, best score, CTA).
 */
export function drawMenuOverlay(ctx: CanvasRenderingContext2D, bestScore: number): void {
  const cx = CANVAS_WIDTH / 2;
  const cy = CANVAS_HEIGHT / 2;

  // Title
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.font = 'bold 42px "Orbitron", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(100, 200, 255, 0.6)';
  ctx.shadowBlur = 20;
  ctx.fillText('FLAPPY JET', cx, cy - 100);
  ctx.restore();

  // Subtitle
  ctx.fillStyle = 'rgba(150, 220, 255, 0.7)';
  ctx.font = '18px "Orbitron", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('TACTICAL FLIGHT SIMULATOR', cx, cy - 65);

  // Best score
  if (bestScore > 0) {
    ctx.fillStyle = 'rgba(255, 200, 100, 0.8)';
    ctx.font = '16px "Orbitron", "Segoe UI", sans-serif';
    ctx.fillText(`BEST: ${bestScore}`, cx, cy - 30);
  }

  // Start instruction (pulsing)
  const pulse = Math.sin(Date.now() / 500) * 0.3 + 0.7;
  ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
  ctx.font = '20px "Orbitron", "Segoe UI", sans-serif';
  ctx.fillText('TAP OR PRESS SPACE', cx, cy + 120);

  ctx.fillStyle = 'rgba(150, 200, 255, 0.5)';
  ctx.font = '14px "Orbitron", "Segoe UI", sans-serif';
  ctx.fillText('TO ENGAGE THRUSTERS', cx, cy + 148);
}

/**
 * Draws the game-over overlay (dim, panel, scores, CTA).
 */
export function drawGameOverOverlay(
  ctx: CanvasRenderingContext2D,
  score: number,
  bestScore: number,
): void {
  const cx = CANVAS_WIDTH / 2;

  // Dim overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Panel
  const panelX = cx - 140;
  const panelY = CANVAS_HEIGHT / 2 - 110;
  const panelW = 280;
  const panelH = 220;
  ctx.fillStyle = 'rgba(10, 20, 40, 0.85)';
  ctx.beginPath();
  ctx.roundRect(panelX, panelY, panelW, panelH, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(100, 200, 255, 0.3)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Title
  ctx.save();
  ctx.fillStyle = '#ff5555';
  ctx.font = 'bold 32px "Orbitron", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(255, 50, 50, 0.5)';
  ctx.shadowBlur = 15;
  ctx.fillText('MISSION FAILED', cx, panelY + 50);
  ctx.restore();

  // Score
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = '18px "Orbitron", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`SCORE: ${score}`, cx, panelY + 95);

  // Best
  ctx.fillStyle = 'rgba(255, 200, 100, 0.8)';
  ctx.font = '16px "Orbitron", "Segoe UI", sans-serif';
  ctx.fillText(`BEST: ${Math.max(score, bestScore)}`, cx, panelY + 125);

  // New record badge
  if (score > 0 && score >= bestScore) {
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 14px "Orbitron", "Segoe UI", sans-serif';
    ctx.fillText('★ NEW RECORD ★', cx, panelY + 155);
  }

  // Restart instruction (pulsing)
  const pulse = Math.sin(Date.now() / 500) * 0.3 + 0.7;
  ctx.fillStyle = `rgba(150, 220, 255, ${pulse})`;
  ctx.font = '15px "Orbitron", "Segoe UI", sans-serif';
  ctx.fillText('TAP TO RETURN TO BASE', cx, panelY + 195);
}
