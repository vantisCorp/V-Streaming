import React, { useEffect, useRef } from 'react';
import { BodyLandmark, FullBodyPose, Vector3 } from '../types/vtuber';
import './BodyTrackingPreview.css';

interface BodyTrackingPreviewProps {
  pose: FullBodyPose | null;
  width?: number;
  height?: number;
  showLandmarks?: boolean;
  showSkeleton?: boolean;
  showConfidence?: boolean;
}

/**
 * BodyTrackingPreview Component
 * 
 * Visualizes body tracking data with a skeleton overlay.
 */
export const BodyTrackingPreview: React.FC<BodyTrackingPreviewProps> = ({
  pose,
  width = 400,
  height = 600,
  showLandmarks = true,
  showSkeleton = true,
  showConfidence = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    drawGrid(ctx, width, height);

    if (!pose) {
      // Draw placeholder
      ctx.fillStyle = '#666';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No tracking data', width / 2, height / 2);
      return;
    }

    // Transform coordinates from 3D to 2D canvas
    const transformPoint = (v: Vector3): { x: number; y: number } => {
      // Scale and center the pose
      const scale = height / 2.5;
      const centerX = width / 2;
      const centerY = height * 0.1;

      return {
        x: centerX + v.x * scale,
        y: centerY + (1.8 - v.y) * scale, // Flip Y and offset
      };
    };

    // Draw skeleton connections
    if (showSkeleton) {
      drawSkeleton(ctx, pose, transformPoint);
    }

    // Draw landmarks
    if (showLandmarks) {
      drawLandmarks(ctx, pose, transformPoint);
    }

    // Draw confidence indicator
    if (showConfidence) {
      drawConfidence(ctx, pose.confidence, width, height);
    }

  }, [pose, width, height, showLandmarks, showSkeleton, showConfidence]);

  return (
    <div className="body-tracking-preview">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="tracking-canvas"
      />
      {pose && (
        <div className="pose-info">
          <span className="confidence-badge">
            {(pose.confidence * 100).toFixed(0)}% confidence
          </span>
        </div>
      )}
    </div>
  );
};

// ============ Drawing Functions ============

function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;

  // Vertical lines
  for (let x = 0; x <= width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Horizontal lines
  for (let y = 0; y <= height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  pose: FullBodyPose,
  transform: (v: Vector3) => { x: number; y: number }
): void {
  // Define skeleton connections
  const connections = [
    // Face
    [BodyLandmark.LEFT_EYE, BodyLandmark.RIGHT_EYE],
    [BodyLandmark.NOSE, BodyLandmark.LEFT_EYE],
    [BodyLandmark.NOSE, BodyLandmark.RIGHT_EYE],
    [BodyLandmark.LEFT_EYE, BodyLandmark.LEFT_EAR],
    [BodyLandmark.RIGHT_EYE, BodyLandmark.RIGHT_EAR],

    // Torso
    [BodyLandmark.LEFT_SHOULDER, BodyLandmark.RIGHT_SHOULDER],
    [BodyLandmark.LEFT_SHOULDER, BodyLandmark.LEFT_HIP],
    [BodyLandmark.RIGHT_SHOULDER, BodyLandmark.RIGHT_HIP],
    [BodyLandmark.LEFT_HIP, BodyLandmark.RIGHT_HIP],

    // Left arm
    [BodyLandmark.LEFT_SHOULDER, BodyLandmark.LEFT_ELBOW],
    [BodyLandmark.LEFT_ELBOW, BodyLandmark.LEFT_WRIST],
    [BodyLandmark.LEFT_WRIST, BodyLandmark.LEFT_THUMB],
    [BodyLandmark.LEFT_WRIST, BodyLandmark.LEFT_INDEX],
    [BodyLandmark.LEFT_WRIST, BodyLandmark.LEFT_PINKY],

    // Right arm
    [BodyLandmark.RIGHT_SHOULDER, BodyLandmark.RIGHT_ELBOW],
    [BodyLandmark.RIGHT_ELBOW, BodyLandmark.RIGHT_WRIST],
    [BodyLandmark.RIGHT_WRIST, BodyLandmark.RIGHT_THUMB],
    [BodyLandmark.RIGHT_WRIST, BodyLandmark.RIGHT_INDEX],
    [BodyLandmark.RIGHT_WRIST, BodyLandmark.RIGHT_PINKY],

    // Left leg
    [BodyLandmark.LEFT_HIP, BodyLandmark.LEFT_KNEE],
    [BodyLandmark.LEFT_KNEE, BodyLandmark.LEFT_ANKLE],
    [BodyLandmark.LEFT_ANKLE, BodyLandmark.LEFT_HEEL],
    [BodyLandmark.LEFT_ANKLE, BodyLandmark.LEFT_FOOT_INDEX],

    // Right leg
    [BodyLandmark.RIGHT_HIP, BodyLandmark.RIGHT_KNEE],
    [BodyLandmark.RIGHT_KNEE, BodyLandmark.RIGHT_ANKLE],
    [BodyLandmark.RIGHT_ANKLE, BodyLandmark.RIGHT_HEEL],
    [BodyLandmark.RIGHT_ANKLE, BodyLandmark.RIGHT_FOOT_INDEX],
  ];

  ctx.strokeStyle = '#ff6b9d';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';

  for (const [start, end] of connections) {
    const startPos = pose.landmarks.get(start);
    const endPos = pose.landmarks.get(end);

    if (startPos && endPos) {
      const startScreen = transform(startPos);
      const endScreen = transform(endPos);

      // Get visibility for this connection
      const startVisibility = pose.visibility.get(start) || 0;
      const endVisibility = pose.visibility.get(end) || 0;
      const avgVisibility = (startVisibility + endVisibility) / 2;

      ctx.globalAlpha = avgVisibility;
      ctx.beginPath();
      ctx.moveTo(startScreen.x, startScreen.y);
      ctx.lineTo(endScreen.x, endScreen.y);
      ctx.stroke();
    }
  }

  ctx.globalAlpha = 1;
}

function drawLandmarks(
  ctx: CanvasRenderingContext2D,
  pose: FullBodyPose,
  transform: (v: Vector3) => { x: number; y: number }
): void {
  const importantLandmarks = [
    BodyLandmark.NOSE,
    BodyLandmark.LEFT_SHOULDER,
    BodyLandmark.RIGHT_SHOULDER,
    BodyLandmark.LEFT_ELBOW,
    BodyLandmark.RIGHT_ELBOW,
    BodyLandmark.LEFT_WRIST,
    BodyLandmark.RIGHT_WRIST,
    BodyLandmark.LEFT_HIP,
    BodyLandmark.RIGHT_HIP,
    BodyLandmark.LEFT_KNEE,
    BodyLandmark.RIGHT_KNEE,
    BodyLandmark.LEFT_ANKLE,
    BodyLandmark.RIGHT_ANKLE,
  ];

  // Draw all landmarks
  for (const [landmark, pos] of pose.landmarks) {
    const visibility = pose.visibility.get(landmark) || 0;
    if (visibility < 0.5) continue;

    const screen = transform(pos);
    const isImportant = importantLandmarks.includes(landmark);

    ctx.beginPath();
    ctx.arc(screen.x, screen.y, isImportant ? 6 : 4, 0, Math.PI * 2);
    ctx.fillStyle = isImportant ? '#ff6b9d' : 'rgba(255, 107, 157, 0.6)';
    ctx.globalAlpha = visibility;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawConfidence(
  ctx: CanvasRenderingContext2D,
  confidence: number,
  width: number,
  height: number
): void {
  // Draw confidence bar
  const barWidth = 100;
  const barHeight = 6;
  const x = width - barWidth - 10;
  const y = height - barHeight - 10;

  // Background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fillRect(x, y, barWidth, barHeight);

  // Fill
  const color = confidence > 0.8 ? '#4caf50' : confidence > 0.5 ? '#ffc107' : '#f44336';
  ctx.fillStyle = color;
  ctx.fillRect(x, y, barWidth * confidence, barHeight);
}

export default BodyTrackingPreview;