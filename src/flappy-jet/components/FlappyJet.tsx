import { useState, useRef, useCallback } from 'react';
import '../FlappyJet.css';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/constants';
import { type GamePhysicsConfig, DEFAULT_GAME_CONFIG } from '../utils/gameConfig';
import { useBestScore } from '../hooks/useBestScore';
import { useGameLoop } from '../hooks/useGameLoop';
import { useGameInput } from '../hooks/useGameInput';
import { usePoseDetection } from '../hooks/usePoseDetection';
import { ScoreHUD } from './ScoreHUD';
import { MotionCameraHUD } from './MotionCameraHUD';

/**
 * Root FlappyJet component.
 *
 * Controlled using front camera pose motion:
 * - Raising hand(s) powers responsive jet thrusters!
 * - Lowering hands allows gravity to glide the jet downward.
 * - Live metrics tuning for gravity, thrust, obstacle space, and speed.
 * - Keyboard (Space / Up) and touch / click preserved as instant fallback controls.
 */
export default function FlappyJet() {
  const { bestScore, submitScore } = useBestScore();

  // Active flight dynamics configuration
  const [config, setConfig] = useState<GamePhysicsConfig>(DEFAULT_GAME_CONFIG);
  const configRef = useRef<GamePhysicsConfig>(config);

  const updateConfig = useCallback((newConfig: GamePhysicsConfig) => {
    configRef.current = newConfig;
    setConfig(newConfig);
  }, []);

  // Pose detection hook for front camera motion control
  const pose = usePoseDetection(undefined, config.handControlMode);

  // Game loop connects directly to synchronous refs for 60fps responsiveness
  const { canvasRef, displayState, score, flap } = useGameLoop(
    bestScore,
    submitScore,
    pose.handsRaisedRef,
    pose.motionFlightRef,
    configRef,
  );

  // Manual fallback inputs (keyboard / mouse / touch)
  useGameInput(flap);

  return (
    <div className="flappy-jet-layout" id="flappy-jet-app">
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

      <div className="flappy-jet-motion-sidebar">
        <MotionCameraHUD
          pose={pose}
          config={config}
          onUpdateConfig={updateConfig}
        />
      </div>
    </div>
  );
}
