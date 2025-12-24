'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

/**
 * Generation record from the API
 */
export interface Generation {
  id: string;
  project_id: string;
  user_id: string;
  type: 'text_extraction' | 'translation' | 'image_generation' | 'image_edit';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  prompt: string | null;
  input_image_id: string | null;
  output_image_id: string | null;
  output_text: string | null;
  source_language: string | null;
  target_language: string | null;
  error_message: string | null;
  model_used: string | null;
  tokens_used: number | null;
  processing_ms: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Result from the generation polling hook
 */
export interface GenerationPollingResult {
  generation: Generation | null;
  inputUrl: string | null;
  outputUrl: string | null;
  isPolling: boolean;
  error: string | null;
  progress: number;
  refetch: () => Promise<Generation | null | undefined>;
}

/**
 * Configuration for the polling hook
 */
interface UseGenerationPollingOptions {
  /** Polling interval in milliseconds (default: 2000) */
  pollInterval?: number;
  /** Maximum polling duration in milliseconds (default: 300000 = 5 minutes) */
  maxDuration?: number;
  /** Callback when generation completes */
  onComplete?: (generation: Generation, outputUrl: string | null) => void;
  /** Callback when generation fails */
  onError?: (error: string) => void;
}

const DEFAULT_POLL_INTERVAL = 2000; // 2 seconds
const DEFAULT_MAX_DURATION = 300000; // 5 minutes

/**
 * Hook to poll a generation's status until completion
 *
 * @param generationId - The ID of the generation to poll, or null to not poll
 * @param options - Configuration options
 * @returns Polling result with generation data and status
 *
 * @example
 * ```tsx
 * const { generation, isPolling, progress, outputUrl } = useGenerationPolling(generationId, {
 *   onComplete: (gen, url) => {
 *     console.log('Translation complete!', url);
 *   },
 *   onError: (error) => {
 *     console.error('Translation failed:', error);
 *   },
 * });
 * ```
 */
export function useGenerationPolling(
  generationId: string | null,
  options: UseGenerationPollingOptions = {}
): GenerationPollingResult {
  const {
    pollInterval = DEFAULT_POLL_INTERVAL,
    maxDuration = DEFAULT_MAX_DURATION,
    onComplete,
    onError,
  } = options;

  const [generation, setGeneration] = useState<Generation | null>(null);
  const [inputUrl, setInputUrl] = useState<string | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track start time to enforce max duration
  const startTimeRef = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate progress based on status
  const progress = !generation
    ? 0
    : generation.status === 'pending'
    ? 10
    : generation.status === 'processing'
    ? 50
    : generation.status === 'completed'
    ? 100
    : generation.status === 'failed'
    ? 100
    : 0;

  const fetchGeneration = useCallback(async () => {
    if (!generationId) return;

    try {
      const response = await fetch(`/api/generations/${generationId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch generation');
      }

      const gen = data.generation as Generation;
      setGeneration(gen);

      // Store URLs if available
      if (data.input_url) setInputUrl(data.input_url);
      if (data.output_url) setOutputUrl(data.output_url);

      // Handle completion
      if (gen.status === 'completed') {
        setIsPolling(false);
        onComplete?.(gen, data.output_url || null);
      }

      // Handle failure
      if (gen.status === 'failed') {
        setIsPolling(false);
        const errorMsg = gen.error_message || 'Translation failed';
        setError(errorMsg);
        onError?.(errorMsg);
      }

      return gen;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      onError?.(errorMsg);
      return null;
    }
  }, [generationId, onComplete, onError]);

  // Start/stop polling when generationId changes
  useEffect(() => {
    if (!generationId) {
      // Reset state when no generation ID
      setGeneration(null);
      setInputUrl(null);
      setOutputUrl(null);
      setIsPolling(false);
      setError(null);
      startTimeRef.current = null;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // Start polling
    setIsPolling(true);
    setError(null);
    startTimeRef.current = Date.now();

    const poll = async () => {
      // Check max duration
      if (startTimeRef.current && Date.now() - startTimeRef.current > maxDuration) {
        setIsPolling(false);
        setError('Translation timed out');
        onError?.('Translation timed out');
        return;
      }

      const gen = await fetchGeneration();

      // Continue polling if still pending or processing
      if (gen && (gen.status === 'pending' || gen.status === 'processing')) {
        timeoutRef.current = setTimeout(poll, pollInterval);
      }
    };

    // Initial fetch
    poll();

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [generationId, pollInterval, maxDuration, fetchGeneration, onError]);

  return {
    generation,
    inputUrl,
    outputUrl,
    isPolling,
    error,
    progress,
    refetch: fetchGeneration,
  };
}

/**
 * Hook to poll multiple generations simultaneously
 * Note: This is a placeholder - full implementation would use
 * individual polling instances or batch API for each generation ID.
 */
export function useMultipleGenerationsPolling(
  generationIds: string[],
  _options: UseGenerationPollingOptions = {}
): Map<string, GenerationPollingResult> {
  // Create initial results map based on generation IDs
  // For production, this would set up individual polling for each ID
  const results = useMemo(() => {
    const map = new Map<string, GenerationPollingResult>();
    generationIds.forEach((id) => {
      map.set(id, {
        generation: null,
        inputUrl: null,
        outputUrl: null,
        isPolling: true,
        error: null,
        progress: 0,
        refetch: async () => null,
      });
    });
    return map;
  }, [generationIds]);

  return results;
}
