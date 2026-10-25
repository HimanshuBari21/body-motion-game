import React from 'react';
import type { PoseDetectionState } from '../hooks/usePoseDetection';
import type { GamePhysicsConfig } from '../utils/gameConfig';
import { MetricsTuningPanel } from './MetricsTuningPanel';
import './MotionCameraHUD.css';

interface MotionCameraHUDProps {
  pose: PoseDetectionState;
  config: GamePhysicsConfig;
  onUpdateConfig: (newConfig: GamePhysicsConfig) => void;
}

export const MotionCameraHUD: React.FC<MotionCameraHUDProps> = ({
  pose,
  config,
  onUpdateConfig,
}) => {
  const {
    cameraActive,
    isLoadingModel,
    modelError,
    isLeftHandRaised,
    isRightHandRaised,
    areBothHandsRaised,
    isAnyHandRaised,
    thrustPower,
    handControlMode,
    setHandControlMode,
    videoRef,
    previewCanvasRef,
    toggleCamera,
    startCamera,
  } = pose;

  const isThrustActive = thrustPower > 0;

  return (
    <div className={`motion-hud-panel ${isThrustActive ? 'thrusting' : ''}`}>
      {/* Header Bar */}
      <div className="motion-hud-header">
        <div className="motion-hud-title">
          <span className={`status-dot ${cameraActive ? 'online' : isLoadingModel ? 'loading' : 'offline'}`} />
          <span className="title-text">MOTION RADAR</span>
        </div>

        <button
          type="button"
          className={`camera-toggle-btn ${cameraActive ? 'btn-active' : 'btn-inactive'}`}
          onClick={toggleCamera}
          disabled={isLoadingModel}
        >
          {isLoadingModel ? 'LOADING AI...' : cameraActive ? 'CAMERA ON' : 'START CAMERA'}
        </button>
      </div>

      {/* Video & Skeleton Viewport */}
      <div className="motion-hud-viewport">
        <video
          ref={videoRef}
          playsInline
          muted
          className={`motion-hud-video ${cameraActive ? 'visible' : 'hidden'}`}
        />
        <canvas
          ref={previewCanvasRef}
          className={`motion-hud-canvas ${cameraActive ? 'visible' : 'hidden'}`}
        />

        {!cameraActive && (
          <div className="camera-standby-overlay">
            {isLoadingModel ? (
              <div className="standby-content">
                <div className="cyber-spinner" />
                <p className="standby-title">PREPARING VISION MODEL</p>
                <p className="standby-sub">Google MediaPipe Tasks Vision</p>
              </div>
            ) : modelError ? (
              <div className="standby-content error-content">
                <span className="error-icon">⚠️</span>
                <p className="standby-title error-text">CAMERA ERROR</p>
                <p className="standby-sub error-desc">{modelError}</p>
                <button type="button" className="retry-btn" onClick={startCamera}>
                  RETRY CAMERA
                </button>
              </div>
            ) : (
              <div className="standby-content">
                <div className="motion-hand-icon">🙌</div>
                <p className="standby-title">BODY MOTION CONTROL</p>
                <p className="standby-sub">
                  Raise {handControlMode === 'both' ? 'both hands' : 'your hand'} to fly up
                </p>
                <button type="button" className="activate-motion-btn" onClick={startCamera}>
                  ENABLE CAMERA
                </button>
              </div>
            )}
          </div>
        )}

        {/* Live Tracking Crosshair & Watermark */}
        {cameraActive && (
          <div className="viewport-overlay">
            <div className="corner-bracket top-left" />
            <div className="corner-bracket top-right" />
            <div className="corner-bracket bottom-left" />
            <div className="corner-bracket bottom-right" />
            <div className="flight-status-badge">
              {areBothHandsRaised
                ? '🚀 DUAL BOOST ACTIVE'
                : isThrustActive
                  ? '🚀 THRUST ACTIVE'
                  : '⬇️ GLIDING'}
            </div>
          </div>
        )}
      </div>

      {/* Real-time Hand Indicators & Telemetry */}
      <div className="motion-hud-telemetry">
        {/* Left Hand Indicator */}
        <div className={`hand-badge ${isLeftHandRaised ? 'raised' : 'lowered'}`}>
          <div className="hand-badge-icon">{isLeftHandRaised ? '🖐️' : '✋'}</div>
          <div className="hand-badge-info">
            <span className="hand-name">LEFT HAND</span>
            <span className="hand-state">{isLeftHandRaised ? 'UP (ENGAGED)' : 'DOWN'}</span>
          </div>
          <div className={`signal-light ${isLeftHandRaised ? 'active' : ''}`} />
        </div>

        {/* Right Hand Indicator */}
        <div className={`hand-badge ${isRightHandRaised ? 'raised' : 'lowered'}`}>
          <div className="hand-badge-icon">{isRightHandRaised ? '🖐️' : '✋'}</div>
          <div className="hand-badge-info">
            <span className="hand-name">RIGHT HAND</span>
            <span className="hand-state">{isRightHandRaised ? 'UP (ENGAGED)' : 'DOWN'}</span>
          </div>
          <div className={`signal-light ${isRightHandRaised ? 'active' : ''}`} />
        </div>
      </div>

      {/* Thruster Output Bar */}
      <div className="thrust-power-container">
        <div className="thrust-power-header">
          <span className="thrust-power-label">THRUST OUTPUT</span>
          <span className="thrust-power-pct">
            {isThrustActive ? `${Math.round(thrustPower * 100)}%` : '0%'}
          </span>
        </div>
        <div className="thrust-power-track">
          <div
            className={`thrust-power-fill ${isThrustActive ? 'thrust-active' : ''}`}
            style={{ width: `${Math.round(thrustPower * 100)}%` }}
          />
        </div>
      </div>

      {/* Instruction Tip */}
      <div className="motion-hud-footer">
        <span className="hud-guide-text">
          {isThrustActive
            ? '🔥 THRUST ENGAGED — LOWER HAND TO GLIDE'
            : handControlMode === 'both'
              ? '💡 RAISE BOTH HANDS ABOVE SHOULDERS TO CLIMB'
              : '💡 RAISE HAND ABOVE SHOULDER TO CLIMB'}
        </span>
      </div>

      {/* Physics & Metrics Tuning Panel */}
      <MetricsTuningPanel
        config={config}
        onUpdateConfig={onUpdateConfig}
        handControlMode={handControlMode}
        onUpdateHandMode={setHandControlMode}
      />
    </div>
  );
};
