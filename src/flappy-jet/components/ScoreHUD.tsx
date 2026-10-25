import { memo } from 'react';

interface ScoreHUDProps {
  score: number;
}

/**
 * HUD panel displayed below the canvas during gameplay.
 * Memoized because it only needs to re-render when `score` changes.
 */
function ScoreHUDInner({ score }: ScoreHUDProps) {
  return (
    <div className="flappy-jet-score-hud" id="score-hud">
      <span className="hud-label">ALTITUDE SCORE</span>
      <span className="hud-value">{score}</span>
    </div>
  );
}

export const ScoreHUD = memo(ScoreHUDInner);
