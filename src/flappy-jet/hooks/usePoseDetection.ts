import { useEffect, useRef, useState, useCallback } from 'react';
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

export interface MotionFlightData {
  isThrusting: boolean;
  power: number; // 0 to 1
  isLeftHandRaised: boolean;
  isRightHandRaised: boolean;
  areBothHandsRaised: boolean;
  isAnyHandRaised: boolean;
  elevation: number;
}

export interface PoseDetectionState {
  cameraActive: boolean;
  isLoadingModel: boolean;
  modelError: string | null;
  isLeftHandRaised: boolean;
  isRightHandRaised: boolean;
  areBothHandsRaised: boolean;
  isAnyHandRaised: boolean;
  elevation: number; // 0 to 1
  thrustPower: number; // 0 to 1
  handControlMode: 'either' | 'both';
  setHandControlMode: (mode: 'either' | 'both') => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  previewCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  handsRaisedRef: React.RefObject<boolean>;
  motionFlightRef: React.RefObject<MotionFlightData>;
  toggleCamera: () => void;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
}

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1/wasm';
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

export function usePoseDetection(
  onBothHandsJustRaised?: () => void,
  initialControlMode: 'either' | 'both' = 'either',
): PoseDetectionState {
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [isLoadingModel, setIsLoadingModel] = useState<boolean>(false);
  const [modelError, setModelError] = useState<string | null>(null);

  const [isLeftHandRaised, setIsLeftHandRaised] = useState<boolean>(false);
  const [isRightHandRaised, setIsRightHandRaised] = useState<boolean>(false);
  const [areBothHandsRaised, setAreBothHandsRaised] = useState<boolean>(false);
  const [isAnyHandRaised, setIsAnyHandRaised] = useState<boolean>(false);
  const [elevation, setElevation] = useState<number>(0);
  const [thrustPower, setThrustPower] = useState<number>(0);
  const [handControlMode, setHandControlModeState] = useState<'either' | 'both'>(initialControlMode);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const animFrameRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);

  // Synchronous refs for the game loop (zero-lag 60fps access)
  const handControlModeRef = useRef<'either' | 'both'>(initialControlMode);
  const setHandControlMode = useCallback((mode: 'either' | 'both') => {
    handControlModeRef.current = mode;
    setHandControlModeState(mode);
  }, []);

  const motionFlightRef = useRef<MotionFlightData>({
    isThrusting: false,
    power: 0,
    isLeftHandRaised: false,
    isRightHandRaised: false,
    areBothHandsRaised: false,
    isAnyHandRaised: false,
    elevation: 0,
  });

  const handsRaisedRef = useRef<boolean>(false);
  const prevThrustingRef = useRef<boolean>(false);
  const onJustRaisedCallbackRef = useRef(onBothHandsJustRaised);
  useEffect(() => {
    onJustRaisedCallbackRef.current = onBothHandsJustRaised;
  }, [onBothHandsJustRaised]);

  // Initialize PoseLandmarker once
  const initLandmarker = useCallback(async () => {
    if (landmarkerRef.current) return landmarkerRef.current;

    setIsLoadingModel(true);
    setModelError(null);

    try {
      const vision = await FilesetResolver.forVisionTasks(WASM_URL);
      let landmarker: PoseLandmarker;

      try {
        landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_URL,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
      } catch (gpuError) {
        console.warn('GPU delegate failed, falling back to CPU:', gpuError);
        landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_URL,
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
      }

      landmarkerRef.current = landmarker;
      setIsLoadingModel(false);
      return landmarker;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load pose tracking model';
      console.error('Error initializing PoseLandmarker:', err);
      setModelError(msg);
      setIsLoadingModel(false);
      throw err;
    }
  }, []);

  // Stop camera stream & detection loop
  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = 0;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    handsRaisedRef.current = false;
    motionFlightRef.current = {
      isThrusting: false,
      power: 0,
      isLeftHandRaised: false,
      isRightHandRaised: false,
      areBothHandsRaised: false,
      isAnyHandRaised: false,
      elevation: 0,
    };
    setCameraActive(false);
    setIsLeftHandRaised(false);
    setIsRightHandRaised(false);
    setAreBothHandsRaised(false);
    setIsAnyHandRaised(false);
    setElevation(0);
    setThrustPower(0);
  }, []);

  // Start camera stream and begin tracking
  const startCamera = useCallback(async () => {
    try {
      setModelError(null);
      await initLandmarker();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.name === 'NotAllowedError'
            ? 'Camera permission denied. Please allow camera access in your browser.'
            : err.message
          : 'Could not access front camera.';
      console.error('Camera access error:', err);
      setModelError(msg);
      setCameraActive(false);
    }
  }, [initLandmarker]);

  const toggleCamera = useCallback(() => {
    if (cameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  }, [cameraActive, startCamera, stopCamera]);

  // Main pose detection & HUD rendering loop
  useEffect(() => {
    if (!cameraActive) return;

    let isRunning = true;

    const detectLoop = () => {
      if (!isRunning) return;

      const video = videoRef.current;
      const canvas = previewCanvasRef.current;
      const landmarker = landmarkerRef.current;

      if (video && landmarker && video.readyState >= 2) {
        const currentTime = video.currentTime;
        if (currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = currentTime;
          const startTimeMs = performance.now();

          try {
            const results = landmarker.detectForVideo(video, startTimeMs);

            let leftRaised = false;
            let rightRaised = false;
            let bothRaised = false;
            let anyRaised = false;
            let currentElevation = 0;
            let isThrusting = false;
            let currentPower = 0;

            if (results.landmarks && results.landmarks.length > 0) {
              const lm = results.landmarks[0];

              // Landmark indices (standard MediaPipe Pose):
              // 11: left_shoulder, 12: right_shoulder
              // 13: left_elbow,    14: right_elbow
              // 15: left_wrist,    16: right_wrist
              // 19: left_index,    20: right_index
              // 0:  nose
              const leftShoulder = lm[11];
              const rightShoulder = lm[12];
              const leftElbow = lm[13];
              const rightElbow = lm[14];
              const leftWrist = lm[15];
              const rightWrist = lm[16];
              const leftIndex = lm[19] || leftWrist;
              const rightIndex = lm[20] || rightWrist;
              const nose = lm[0];

              if (leftShoulder && rightShoulder && leftWrist && rightWrist) {
                // In image coordinates: y=0 is top, y=1 is bottom.
                // Wrist is raised when its y is less than shoulder y.
                const leftHandY = Math.min(leftWrist.y, leftIndex.y);
                const rightHandY = Math.min(rightWrist.y, rightIndex.y);

                // Margin of 0.04 for comfortable natural posture
                leftRaised = leftHandY < leftShoulder.y + 0.04;
                rightRaised = rightHandY < rightShoulder.y + 0.04;
                bothRaised = leftRaised && rightRaised;
                anyRaised = leftRaised || rightRaised;

                // Individual hand elevation above shoulders (0 to 1)
                const leftElev = leftRaised
                  ? Math.max(0, Math.min(1, (leftShoulder.y + 0.04 - leftHandY) * 3.5))
                  : 0;
                const rightElev = rightRaised
                  ? Math.max(0, Math.min(1, (rightShoulder.y + 0.04 - rightHandY) * 3.5))
                  : 0;

                // Combined elevation: responsive to whichever hand(s) are raised
                currentElevation = bothRaised
                  ? Math.max(leftElev, rightElev)
                  : leftRaised
                    ? leftElev
                    : rightElev;

                // Thrust engagement depends on configured control mode
                isThrusting = handControlModeRef.current === 'both' ? bothRaised : anyRaised;

                // Calculate thrust output power (0 to 1):
                // Raising both hands gives maximum 100% boost with afterburner!
                // Raising single hand gives steady 70%–95% flight thrust.
                if (isThrusting) {
                  if (bothRaised) {
                    currentPower = 1.0;
                  } else {
                    currentPower = Math.max(0.70, Math.min(1.0, 0.65 + currentElevation * 0.35));
                  }
                } else {
                  currentPower = 0;
                }

                // Draw overlay skeleton on preview canvas
                if (canvas) {
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                    canvas.width = video.videoWidth || 320;
                    canvas.height = video.videoHeight || 240;
                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    const w = canvas.width;
                    const h = canvas.height;

                    // Helper to project landmark coordinates (mirrored horizontally)
                    const project = (pt: { x: number; y: number }) => ({
                      x: (1 - pt.x) * w,
                      y: pt.y * h,
                    });

                    // Draw reference shoulder threshold line
                    const pLeftShoulder = project(leftShoulder);
                    const pRightShoulder = project(rightShoulder);
                    const thresholdY = (pLeftShoulder.y + pRightShoulder.y) / 2;

                    ctx.save();
                    ctx.strokeStyle = isThrusting
                      ? 'rgba(74, 222, 128, 0.45)'
                      : 'rgba(96, 165, 250, 0.3)';
                    ctx.lineWidth = 1.5;
                    ctx.setLineDash([4, 4]);
                    ctx.beginPath();
                    ctx.moveTo(10, thresholdY);
                    ctx.lineTo(w - 10, thresholdY);
                    ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.restore();

                    // Draw upper body connections
                    const connections = [
                      [leftShoulder, rightShoulder],
                      [leftShoulder, leftElbow],
                      [leftElbow, leftWrist],
                      [leftWrist, leftIndex],
                      [rightShoulder, rightElbow],
                      [rightElbow, rightWrist],
                      [rightWrist, rightIndex],
                    ];

                    ctx.save();
                    ctx.lineWidth = 3;
                    ctx.lineCap = 'round';
                    const activeColor = bothRaised ? '#22c55e' : isThrusting ? '#4ade80' : '#38bdf8';
                    ctx.strokeStyle = activeColor;
                    ctx.shadowColor = activeColor;
                    ctx.shadowBlur = isThrusting ? 12 : 6;

                    for (const [a, b] of connections) {
                      if (a && b) {
                        const pa = project(a);
                        const pb = project(b);
                        ctx.beginPath();
                        ctx.moveTo(pa.x, pa.y);
                        ctx.lineTo(pb.x, pb.y);
                        ctx.stroke();
                      }
                    }

                    // Draw joints
                    const joints = [
                      { pt: leftShoulder, raised: leftRaised },
                      { pt: rightShoulder, raised: rightRaised },
                      { pt: leftElbow, raised: leftRaised },
                      { pt: rightElbow, raised: rightRaised },
                      { pt: leftWrist, isHand: true, raised: leftRaised },
                      { pt: rightWrist, isHand: true, raised: rightRaised },
                      ...(nose ? [{ pt: nose, isNose: true }] : []),
                    ];

                    for (const j of joints) {
                      const p = project(j.pt);
                      ctx.beginPath();
                      if (j.isHand) {
                        // Hand energy halo
                        const radius = j.raised ? 14 : 9;
                        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
                        ctx.fillStyle = j.raised
                          ? bothRaised
                            ? 'rgba(34, 197, 94, 0.95)'
                            : 'rgba(74, 222, 128, 0.9)'
                          : 'rgba(56, 189, 248, 0.7)';
                        ctx.fill();
                        ctx.strokeStyle = '#ffffff';
                        ctx.lineWidth = 2;
                        ctx.stroke();

                        if (j.raised) {
                          // Extra outer energy pulse ring
                          ctx.beginPath();
                          ctx.arc(p.x, p.y, radius + 6, 0, Math.PI * 2);
                          ctx.strokeStyle = bothRaised
                            ? 'rgba(34, 197, 94, 0.7)'
                            : 'rgba(74, 222, 128, 0.6)';
                          ctx.lineWidth = 1.5;
                          ctx.stroke();
                        }
                      } else {
                        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
                        ctx.fillStyle = '#ffffff';
                        ctx.fill();
                      }
                    }
                    ctx.restore();
                  }
                }
              }
            } else if (canvas) {
              const ctx = canvas.getContext('2d');
              ctx?.clearRect(0, 0, canvas.width, canvas.height);
            }

            // Sync state to ref for zero-latency 60fps game loop access
            motionFlightRef.current = {
              isThrusting,
              power: currentPower,
              isLeftHandRaised: leftRaised,
              isRightHandRaised: rightRaised,
              areBothHandsRaised: bothRaised,
              isAnyHandRaised: anyRaised,
              elevation: currentElevation,
            };
            handsRaisedRef.current = isThrusting;

            // Trigger flap impulse callback on transition: false -> true
            if (isThrusting && !prevThrustingRef.current) {
              onJustRaisedCallbackRef.current?.();
            }
            prevThrustingRef.current = isThrusting;

            setIsLeftHandRaised(leftRaised);
            setIsRightHandRaised(rightRaised);
            setAreBothHandsRaised(bothRaised);
            setIsAnyHandRaised(anyRaised);
            setElevation(currentElevation);
            setThrustPower(currentPower);
          } catch (err) {
            console.error('Pose frame error:', err);
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(detectLoop);
    };

    animFrameRef.current = requestAnimationFrame(detectLoop);

    return () => {
      isRunning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [cameraActive]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    cameraActive,
    isLoadingModel,
    modelError,
    isLeftHandRaised,
    isRightHandRaised,
    areBothHandsRaised,
    isAnyHandRaised,
    elevation,
    thrustPower,
    handControlMode,
    setHandControlMode,
    videoRef,
    previewCanvasRef,
    handsRaisedRef,
    motionFlightRef,
    toggleCamera,
    startCamera,
    stopCamera,
  };
}
