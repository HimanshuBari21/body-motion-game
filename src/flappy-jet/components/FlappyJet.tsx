import '../FlappyJet.css';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/constants';
import { useBestScore } from '../hooks/useBestScore';
import { useGameLoop } from '../hooks/useGameLoop';
import { useGameInput } from '../hooks/useGameInput';
import { ScoreHUD } from './ScoreHUD';

/**
 * Root FlappyJet component.
 *
 * Wires together the game loop, input handling, and score persistence.
 * All heavy logic lives in hooks/utils — this component is a thin shell.
 */
export default function FlappyJet() {
  const { bestScore, submitScore } = useBestScore();
  const { canvasRef, displayState, score, flap } = useGameLoop(bestScore, submitScore);

  useGameInput(flap);

  return (
    <div className="flappy-jet-container" id="flappy-jet-game">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="flappy-jet-canvas"
        onClick={flap}
        onTouchStart={(e) => {
          e.preventDefault();
          flap();
        }}
      />
      <div className="flappy-jet-info">
        {displayState === 'playing' && <ScoreHUD score={score} />}
      </div>
    </div>
  );
}
