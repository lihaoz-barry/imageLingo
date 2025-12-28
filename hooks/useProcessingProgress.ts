'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { useGenerationRealtime, fetchGenerationResult } from './useGenerationRealtime';
import type { GenerationUpdate } from './useGenerationRealtime';

/**
 * Hook for managing processing progress with fake progress bar + real-time updates
 *
 * Features:
 * - Fake progress bar based on average processing time
 * - Real-time update detection
 * - Automatic result fetching on completion
 * - Progress synchronization across multiple images
 */
export interface ProcessingProgressOptions {
  /** Average processing time in ms from statistics */
  averageProcessingTime: number | null;
  /** Current user ID */
  userId: string | null;
  /** Generation IDs to track */
  generationIds: string[];
  /** Called when a generation completes with result URL */
  onGenerationComplete?: (generationId: string, result: {
    generation: GenerationUpdate;
    inputUrl: string | null;
    outputUrl: string | null;
  }) => void;
  /** Called when a generation fails */
  onGenerationFailed?: (generationId: string, error: string) => void;
  /** Called when real-time update is received */
  onRealtimeUpdate?: (generation: GenerationUpdate) => void;
}

export interface ProcessingProgressState {
  /** Current progress percentage (0-100) */
  progress: number;
  /** Estimated time remaining in seconds */
  estimatedTimeLeft: number | null;
  /** Is currently processing */
  isProcessing: boolean;
  /** Number of completed operations */
  completedCount: number;
  /** Total operations */
  totalCount: number;
}

/**
 * Manages progress display and real-time updates for image processing
 *
 * The hook provides:
 * 1. Fake progress bar animation (smooth, based on average time)
 * 2. Real-time update detection
 * 3. Automatic result fetching on completion
 * 4. Progress state management
 *
 * Multiple images with same average time will show:
 * - Same progress % at same elapsed time
 * - Different progress curves (smooth variation)
 * - Results displayed immediately on real-time update
 */
export function useProcessingProgress({
  averageProcessingTime,
  userId,
  generationIds,
  onGenerationComplete,
  onGenerationFailed,
  onRealtimeUpdate,
}: ProcessingProgressOptions) {
  const [progressState, setProgressState] = useState<ProcessingProgressState>({
    progress: 0,
    estimatedTimeLeft: null,
    isProcessing: generationIds.length > 0,
    completedCount: 0,
    totalCount: generationIds.length,
  });

  const startTimeRef = useRef<Map<string, number>>(new Map());
  const completedRef = useRef<Set<string>>(new Set());
  const fakeProgressRef = useRef<Map<string, number>>(new Map());

  // Track start times for each generation
  useEffect(() => {
    if (generationIds.length > 0) {
      generationIds.forEach(id => {
        if (!startTimeRef.current.has(id)) {
          startTimeRef.current.set(id, Date.now());
          fakeProgressRef.current.set(id, 0);
        }
      });

      // Update total count
      setProgressState(prev => ({
        ...prev,
        totalCount: generationIds.length,
      }));
    }
  }, [generationIds]);

  // Update fake progress bar
  useEffect(() => {
    if (!averageProcessingTime || generationIds.length === 0) {
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      let totalProgress = 0;
      let completed = 0;

      generationIds.forEach(id => {
        const startTime = startTimeRef.current.get(id) || now;
        const isCompleted = completedRef.current.has(id);

        if (!isCompleted) {
          const elapsed = now - startTime;
          const phase = elapsed / averageProcessingTime;

          let progress: number;
          if (phase <= 1) {
            // 0 to averageTime: 0 to 95% (smooth curve)
            progress = Math.min(95, phase * 95);
          } else {
            // Beyond averageTime: crawl from 95 to 100%
            const overPhase = Math.min(phase - 1, 1);
            progress = 95 + overPhase * 5;
          }

          fakeProgressRef.current.set(id, progress);
          totalProgress += progress;
        } else {
          fakeProgressRef.current.set(id, 100);
          totalProgress += 100;
          completed++;
        }
      });

      // Calculate average progress and estimated time
      const avgProgress = generationIds.length > 0 ? totalProgress / generationIds.length : 0;
      const progressFraction = Math.min(avgProgress, 98) / 98;
      const elapsedEstimate = progressFraction * averageProcessingTime;
      const remainingMs = averageProcessingTime - elapsedEstimate;
      const remainingSeconds = Math.ceil(remainingMs / 1000);

      setProgressState(prev => ({
        ...prev,
        progress: Math.round(avgProgress),
        estimatedTimeLeft: avgProgress < 98 && remainingSeconds > 0 ? remainingSeconds : null,
        completedCount: completed,
        isProcessing: generationIds.length > 0 && completed < generationIds.length,
      }));
    }, 100); // Update every 100ms for smooth animation

    return () => clearInterval(interval);
  }, [generationIds, averageProcessingTime]);

  // Handle real-time completion
  const handleGenerationComplete = useCallback(
    async (generation: GenerationUpdate) => {
      // Update progress to 100%
      completedRef.current.add(generation.id);
      fakeProgressRef.current.set(generation.id, 100);

      // Notify real-time update
      onRealtimeUpdate?.(generation);

      // Fetch result with signed URL
      const result = await fetchGenerationResult(generation.id);
      if (result) {
        onGenerationComplete?.(generation.id, result);
      } else {
        console.warn('Failed to fetch result for generation:', generation.id);
      }

      // Update state
      setProgressState(prev => ({
        ...prev,
        completedCount: completedRef.current.size,
      }));
    },
    [onGenerationComplete, onRealtimeUpdate]
  );

  const handleGenerationFailed = useCallback(
    (generation: GenerationUpdate) => {
      completedRef.current.add(generation.id);
      onRealtimeUpdate?.(generation);
      onGenerationFailed?.(generation.id, generation.error_message || 'Unknown error');

      setProgressState(prev => ({
        ...prev,
        completedCount: completedRef.current.size,
      }));
    },
    [onGenerationFailed, onRealtimeUpdate]
  );

  // Subscribe to real-time updates
  useGenerationRealtime({
    userId,
    generationIds,
    onComplete: handleGenerationComplete,
    onFailed: handleGenerationFailed,
  });

  // Reset when generations clear
  useEffect(() => {
    if (generationIds.length === 0) {
      startTimeRef.current.clear();
      completedRef.current.clear();
      fakeProgressRef.current.clear();
      setProgressState(prev => ({
        ...prev,
        progress: 0,
        estimatedTimeLeft: null,
        isProcessing: false,
        completedCount: 0,
        totalCount: 0,
      }));
    }
  }, [generationIds.length]);

  return progressState;
}

/**
 * Alternative hook for single image processing with detailed progress
 */
export interface SingleImageProgressOptions {
  generationId: string | null;
  averageProcessingTime: number | null;
  userId: string | null;
  onComplete?: (result: {
    generation: GenerationUpdate;
    inputUrl: string | null;
    outputUrl: string | null;
  }) => void;
  onFailed?: (error: string) => void;
}

export function useSingleImageProgress({
  generationId,
  averageProcessingTime,
  userId,
  onComplete,
  onFailed,
}: SingleImageProgressOptions) {
  return useProcessingProgress({
    averageProcessingTime,
    userId,
    generationIds: generationId ? [generationId] : [],
    onGenerationComplete: (_, result) => onComplete?.(result),
    onGenerationFailed: (_, error) => onFailed?.(error),
  });
}
