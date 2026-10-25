import React, { useState } from 'react';
import {
  type GamePhysicsConfig,
  PHYSICS_PRESETS,
  DEFAULT_GAME_CONFIG,
} from '../utils/gameConfig';
import './MetricsTuningPanel.css';

interface MetricsTuningPanelProps {
  config: GamePhysicsConfig;
  onUpdateConfig: (newConfig: GamePhysicsConfig) => void;
  handControlMode: 'either' | 'both';
  onUpdateHandMode: (mode: 'either' | 'both') => void;
}

export const MetricsTuningPanel: React.FC<MetricsTuningPanelProps> = ({
  config,
  onUpdateConfig,
  handControlMode,
  onUpdateHandMode,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const applyPreset = (presetKey: keyof typeof PHYSICS_PRESETS) => {
    const preset = PHYSICS_PRESETS[presetKey];
    onUpdateConfig({ ...preset });
    onUpdateHandMode(preset.handControlMode);
  };

  const handleSliderChange = <K extends keyof GamePhysicsConfig>(
    key: K,
    val: GamePhysicsConfig[K],
  ) => {
    onUpdateConfig({
      ...config,
      presetId: 'custom',
      [key]: val,
    });
  };

  const handleReset = () => {
    onUpdateConfig({ ...DEFAULT_GAME_CONFIG });
    onUpdateHandMode(DEFAULT_GAME_CONFIG.handControlMode);
  };

  return (
    <div className="metrics-tuning-card">
      {/* Header Toggle */}
      <button
        type="button"
        className="metrics-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className="metrics-toggle-left">
          <span className="tuning-icon">⚙️</span>
          <span className="tuning-title">PHYSICS & METRICS</span>
          <span className="tuning-preset-badge">
            {config.presetId === 'custom' ? 'CUSTOM' : config.presetId.toUpperCase()}
          </span>
        </div>
        <span className={`tuning-chevron ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {/* Preset Pill Buttons */}
      <div className="preset-pill-row">
        <button
          type="button"
          className={`preset-pill ${config.presetId === 'body-motion' ? 'active' : ''}`}
          onClick={() => applyPreset('body-motion')}
          title="Tuned for natural hand raising and arm motions"
        >
          🚀 MOTION
        </button>
        <button
          type="button"
          className={`preset-pill ${config.presetId === 'casual' ? 'active' : ''}`}
          onClick={() => applyPreset('casual')}
          title="Extra-wide gap & relaxed speed"
        >
          🧘 CASUAL
        </button>
        <button
          type="button"
          className={`preset-pill ${config.presetId === 'ace' ? 'active' : ''}`}
          onClick={() => applyPreset('ace')}
          title="Fast cruising speed & tighter gap"
        >
          ⚡ ACE
        </button>
        <button
          type="button"
          className={`preset-pill ${config.presetId === 'classic-click' ? 'active' : ''}`}
          onClick={() => applyPreset('classic-click')}
          title="Classic arcade physics for mouse / keyboard"
        >
          🕹️ CLICK
        </button>
      </div>

      {/* Expanded Slider Controls */}
      {isOpen && (
        <div className="metrics-expanded-controls">
          <div className="metrics-group-title">OBSTACLE SPACING ("SPACE BETWEEN")</div>

          {/* Pipe Gap */}
          <div className="metric-slider-row">
            <div className="slider-label-line">
              <span className="slider-label">Vertical Gate Gap</span>
              <span className="slider-value-pill">{config.pipeGap} px</span>
            </div>
            <input
              type="range"
              min={190}
              max={320}
              step={5}
              value={config.pipeGap}
              onChange={(e) => handleSliderChange('pipeGap', Number(e.target.value))}
              className="cyber-slider"
            />
            <div className="slider-minmax">
              <span>Tight (190px)</span>
              <span>Spacious (320px)</span>
            </div>
          </div>

          {/* Pipe Speed */}
          <div className="metric-slider-row">
            <div className="slider-label-line">
              <span className="slider-label">Cruising Speed</span>
              <span className="slider-value-pill">{config.pipeSpeed.toFixed(1)} px/f</span>
            </div>
            <input
              type="range"
              min={1.2}
              max={3.0}
              step={0.1}
              value={config.pipeSpeed}
              onChange={(e) => handleSliderChange('pipeSpeed', Number(e.target.value))}
              className="cyber-slider"
            />
            <div className="slider-minmax">
              <span>Glide (1.2)</span>
              <span>Sprint (3.0)</span>
            </div>
          </div>

          {/* Pipe Spawn Interval */}
          <div className="metric-slider-row">
            <div className="slider-label-line">
              <span className="slider-label">Gate Spacing Interval</span>
              <span className="slider-value-pill">{config.pipeSpawnInterval} frames</span>
            </div>
            <input
              type="range"
              min={160}
              max={280}
              step={10}
              value={config.pipeSpawnInterval}
              onChange={(e) => handleSliderChange('pipeSpawnInterval', Number(e.target.value))}
              className="cyber-slider"
            />
            <div className="slider-minmax">
              <span>Frequent (160)</span>
              <span>Distant (280)</span>
            </div>
          </div>

          <div className="metrics-group-title">FLIGHT DYNAMICS (GRAVITY & THRUST)</div>

          {/* Thrust Force */}
          <div className="metric-slider-row">
            <div className="slider-label-line">
              <span className="slider-label">Thrust Power</span>
              <span className="slider-value-pill">{config.thrustForce.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0.20}
              max={0.60}
              step={0.02}
              value={config.thrustForce}
              onChange={(e) => handleSliderChange('thrustForce', Number(e.target.value))}
              className="cyber-slider thrust-slider"
            />
            <div className="slider-minmax">
              <span>Gentle (0.20)</span>
              <span>Boost (0.60)</span>
            </div>
          </div>

          {/* Gravity */}
          <div className="metric-slider-row">
            <div className="slider-label-line">
              <span className="slider-label">Gravity Descent</span>
              <span className="slider-value-pill">{config.gravity.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0.10}
              max={0.40}
              step={0.02}
              value={config.gravity}
              onChange={(e) => handleSliderChange('gravity', Number(e.target.value))}
              className="cyber-slider gravity-slider"
            />
            <div className="slider-minmax">
              <span>Floaty (0.10)</span>
              <span>Heavy (0.40)</span>
            </div>
          </div>

          {/* Aerodynamic Damping */}
          <div className="metric-slider-row">
            <div className="slider-label-line">
              <span className="slider-label">Air Stability (Damping)</span>
              <span className="slider-value-pill">{Math.round(config.damping * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.90}
              max={0.98}
              step={0.01}
              value={config.damping}
              onChange={(e) => handleSliderChange('damping', Number(e.target.value))}
              className="cyber-slider"
            />
            <div className="slider-minmax">
              <span>High Drag (90%)</span>
              <span>Inertial (98%)</span>
            </div>
          </div>

          {/* Hand Control Mode */}
          <div className="metric-slider-row">
            <div className="slider-label-line">
              <span className="slider-label">Hand Control Trigger</span>
            </div>
            <div className="mode-toggle-group">
              <button
                type="button"
                className={`mode-toggle-btn ${handControlMode === 'either' ? 'selected' : ''}`}
                onClick={() => {
                  onUpdateHandMode('either');
                  handleSliderChange('handControlMode', 'either');
                }}
              >
                🖐️ EITHER HAND
              </button>
              <button
                type="button"
                className={`mode-toggle-btn ${handControlMode === 'both' ? 'selected' : ''}`}
                onClick={() => {
                  onUpdateHandMode('both');
                  handleSliderChange('handControlMode', 'both');
                }}
              >
                🙌 BOTH HANDS
              </button>
            </div>
          </div>

          {/* Reset Button */}
          <button type="button" className="metrics-reset-btn" onClick={handleReset}>
            ↺ RESTORE RECOMMENDED SETTINGS
          </button>
        </div>
      )}
    </div>
  );
};
