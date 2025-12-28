'use client';

import { useEffect, useState } from 'react';
import { animateProgress } from '@/lib/progress-bar-utils';
import { Loader } from 'lucide-react';

interface ProcessingProgressBarProps {
  /** Average processing time in milliseconds from statistics */
  averageProcessingTime: number | null;
  /** Is currently processing */
  isProcessing: boolean;
  /** Current operation count (for display) */
  currentOperation?: number;
  /** Total operations (for display) */
  totalOperations?: number;
  /** Callback when fake progress reaches 100% */
  onProgressComplete?: () => void;
  /** Custom class name */
  className?: string;
  /** Show percentage text */
  showPercentage?: boolean;
  /** Show operation count text */
  showOperationCount?: boolean;
}

export default function ProcessingProgressBar({
  averageProcessingTime,
  isProcessing,
  currentOperation,
  totalOperations,
  onProgressComplete,
  className = '',
  showPercentage = true,
  showOperationCount = true,
}: ProcessingProgressBarProps) {
  const [progress, setProgress] = useState(0);

  // Calculate estimated time remaining (computed value, not state)
  let estimatedTimeLeft: string | null = null;
  if (averageProcessingTime && progress < 98) {
    const progressFraction = progress / 98;
    const elapsedEstimate = progressFraction * averageProcessingTime;
    const remainingMs = averageProcessingTime - elapsedEstimate;
    const remainingSeconds = Math.ceil(remainingMs / 1000);

    if (remainingSeconds > 0) {
      estimatedTimeLeft = `~${remainingSeconds}s left`;
    } else {
      estimatedTimeLeft = 'Almost done...';
    }
  }

  // Animate progress based on average time
  // Note: setState is called in requestAnimationFrame callback (async), not directly in effect
  useEffect(() => {
    if (!isProcessing || !averageProcessingTime) {
      return;
    }

    // Use a deterministic seed based on current time/session
    // Different users will get different curves but same sync points
    const seed = new Date().toISOString().split('T')[0]; // Same seed per day

    const cleanup = animateProgress(
      (progress) => {
        setProgress(Math.round(progress));
      },
      {
        averageTime: averageProcessingTime,
        targetPercentage: 95,
        seed,
        onComplete: () => {
          setProgress(100);
          onProgressComplete?.();
        },
      }
    );

    return cleanup;
  }, [isProcessing, averageProcessingTime, onProgressComplete]);

  // Reset progress when not processing
  useEffect(() => {
    if (!isProcessing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProgress(0);
    }
  }, [isProcessing]);

  if (!isProcessing || !averageProcessingTime) {
    return null;
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Progress bar container */}
      <div className="flex items-center gap-3">
        {/* Spinner icon */}
        <Loader className="w-4 h-4 animate-spin text-[#00d4ff]" />

        {/* Progress bar and info */}
        <div className="flex-1">
          {/* Header with percentage and time estimate */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#9ca3af]">
              {showOperationCount && currentOperation && totalOperations
                ? `Image ${currentOperation} of ${totalOperations}`
                : 'Processing...'}
            </span>
            <div className="flex items-center gap-2">
              {showPercentage && (
                <span className="text-sm font-semibold text-[#00d4ff]">{progress}%</span>
              )}
              {estimatedTimeLeft && (
                <span className="text-xs text-[#9ca3af]">{estimatedTimeLeft}</span>
              )}
            </div>
          </div>

          {/* Progress bar background */}
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
            {/* Progress bar fill with gradient */}
            <div
              className="h-full bg-gradient-to-r from-[#00d4ff] to-[#8b5cf6] transition-all duration-300 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Optional: progress text below */}
          {progress > 50 && progress < 95 && (
            <p className="text-xs text-[#9ca3af] mt-1">
              {progress < 30 && 'Starting...'}
              {progress >= 30 && progress < 60 && 'Processing...'}
              {progress >= 60 && progress < 90 && 'Almost there...'}
              {progress >= 90 && 'Finalizing...'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Alternative minimal progress bar for compact display
 */
export function MinimalProgressBar({
  progress,
  isProcessing,
  className = '',
}: {
  progress: number;
  isProcessing: boolean;
  className?: string;
}) {
  if (!isProcessing || progress === 0) {
    return null;
  }

  return (
    <div className={`h-1 w-full bg-white/10 rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full bg-gradient-to-r from-[#00d4ff] to-[#8b5cf6] transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
