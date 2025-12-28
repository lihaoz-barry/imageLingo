/**
 * Fake Progress Bar Utility
 *
 * Creates realistic progress animations based on average processing time.
 * Multiple users processing similar images will reach the same percentage at the same elapsed time,
 * but with smooth and varied animation paths.
 */

/**
 * Configuration for progress bar animation
 */
export interface ProgressBarConfig {
  /** Average processing time in milliseconds */
  averageTime: number;
  /** Target percentage to reach by averageTime (default: 95) */
  targetPercentage?: number;
  /** Random seed for consistent behavior across sessions (optional) */
  seed?: string;
}

/**
 * Progress state at a given time
 */
export interface ProgressState {
  percentage: number;
  elapsed: number;
  isComplete: boolean;
}

/**
 * Creates a progress bar controller that generates progress percentages
 * based on elapsed time and average processing time.
 *
 * Key properties:
 * - Multiple users with same averageTime reach same % at same elapsed time
 * - Progress is smooth and curved (not linear)
 * - Variation in progress curve based on seed/hash
 * - Reaches targetPercentage (default 95%) at averageTime
 * - Then slowly crawls to 100% during actual processing
 */
export function createProgressBarController(config: ProgressBarConfig) {
  const {
    averageTime,
    targetPercentage = 95,
    seed = '',
  } = config;

  // Create a deterministic random function based on seed
  // Same seed produces same sequence, different seeds produce different sequences
  const seededRandom = createSeededRandom(seed);

  // Generate control points for the progress curve
  // This creates a smooth, curved path that varies based on seed
  const controlPoints = generateControlPoints(seededRandom, targetPercentage);

  /**
   * Get progress percentage at a given elapsed time
   */
  const getProgress = (elapsed: number): ProgressState => {
    // Clamp elapsed to reasonable values
    if (elapsed < 0) {
      return { percentage: 0, elapsed: 0, isComplete: false };
    }

    // Determine progress phase
    const phase = elapsed / averageTime; // 0 to infinity

    let percentage: number;

    if (phase <= 1) {
      // Phase 1: 0 to averageTime - reach targetPercentage
      // Use curve interpolation for smooth, non-linear progress
      percentage = interpolateProgress(phase, controlPoints, targetPercentage);
    } else {
      // Phase 2: Beyond averageTime - crawl slowly toward 100%
      // Each additional second of averageTime gets 1-2% more
      const overagePhase = phase - 1;
      const remainingPercent = 100 - targetPercentage;
      const crawlProgress = Math.min(remainingPercent, remainingPercent * Math.sqrt(overagePhase) * 0.3);
      percentage = targetPercentage + crawlProgress;
    }

    return {
      percentage: Math.min(100, percentage),
      elapsed,
      isComplete: elapsed > averageTime * 3, // Consider complete after 3x average time
    };
  };

  return { getProgress, averageTime, targetPercentage };
}

/**
 * Seeded random number generator
 * Produces deterministic pseudo-random numbers
 */
function createSeededRandom(seed: string) {
  // Simple hash function for seed
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Linear congruential generator
  let state = Math.abs(hash) || 12345;

  return function random() {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

/**
 * Generate control points for progress curve interpolation
 * Creates a path from 0% to targetPercentage over the interval [0, 1]
 */
function generateControlPoints(random: () => number, targetPercentage: number) {
  // Create 3-4 control points between 0 and 1
  const points: Array<{ x: number; y: number }> = [
    { x: 0, y: 0 },
  ];

  // Add intermediate control points
  const numPoints = Math.floor(random() * 2) + 2; // 2 or 3 intermediate points
  for (let i = 1; i < numPoints; i++) {
    const x = i / numPoints;
    // Y should be somewhat random but generally increasing
    const randomFactor = 0.3 + random() * 0.4; // 0.3 to 0.7
    const y = (x * targetPercentage * randomFactor) + (x * targetPercentage * (1 - randomFactor) * 0.5);
    points.push({ x, y: Math.min(targetPercentage - 5, y) });
  }

  points.push({ x: 1, y: targetPercentage });

  return points;
}

/**
 * Interpolate progress using Catmull-Rom spline
 * Creates smooth, curved interpolation between control points
 */
function interpolateProgress(
  t: number,
  points: Array<{ x: number; y: number }>,
  targetPercentage: number
): number {
  // Clamp t to [0, 1]
  const ct = Math.max(0, Math.min(1, t));

  // Find the two points we're between
  let idx = 0;
  while (idx < points.length - 1 && points[idx + 1].x < ct) {
    idx++;
  }

  // Local t between points[idx] and points[idx + 1]
  const p0 = points[Math.max(0, idx - 1)];
  const p1 = points[idx];
  const p2 = points[Math.min(points.length - 1, idx + 1)];
  const p3 = points[Math.min(points.length - 1, idx + 2)];

  const localT = (ct - p1.x) / (p2.x - p1.x);

  // Catmull-Rom interpolation
  const t2 = localT * localT;
  const t3 = t2 * localT;

  const q = 0.5 * (
    2 * p1.y +
    (-p0.y + p2.y) * localT +
    (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
    (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
  );

  return Math.max(0, Math.min(targetPercentage, q));
}

/**
 * Animation frame helper to update progress over time
 *
 * @param onProgress Callback with current progress (0-100)
 * @param config Progress bar configuration
 * @returns Cleanup function to stop animation
 */
export function animateProgress(
  onProgress: (progress: number) => void,
  config: ProgressBarConfig & { onComplete?: () => void }
): () => void {
  const controller = createProgressBarController(config);
  const startTime = Date.now();
  let animationId: number | null = null;
  let completed = false;

  const update = () => {
    const elapsed = Date.now() - startTime;
    const state = controller.getProgress(elapsed);

    onProgress(state.percentage);

    if (state.percentage >= 100 && !completed) {
      completed = true;
      config.onComplete?.();
    } else if (state.percentage < 100) {
      // Continue animation
      animationId = requestAnimationFrame(update);
    }
  };

  animationId = requestAnimationFrame(update);

  // Return cleanup function
  return () => {
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
    }
  };
}

/**
 * Synchronize progress bars across multiple images/users
 *
 * All images with the same average processing time will reach
 * the same percentage at the same wall-clock time.
 */
export function createSynchronizedProgressTracker(averageTime: number) {
  let startTime = Date.now();

  return {
    getProgress: () => {
      const elapsed = Date.now() - startTime;
      // Return percentage based on elapsed time
      // This ensures consistency across all users
      const phase = elapsed / averageTime;
      if (phase <= 1) {
        // 0 to averageTime: 0 to ~95%
        return Math.min(95, phase * 95);
      } else {
        // Beyond averageTime: crawl from 95 to 100%
        const overPhase = Math.min(phase - 1, 1);
        return 95 + overPhase * 5;
      }
    },
    reset: () => {
      // Reset start time
      startTime = Date.now();
    },
  };
}
