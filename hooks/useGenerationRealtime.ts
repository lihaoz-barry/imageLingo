'use client';

import { useEffect, useRef, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Demo mode check
const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

/**
 * Generation record from realtime updates
 */
export interface GenerationUpdate {
    id: string;
    project_id: string;
    user_id: string;
    type: 'text_extraction' | 'translation' | 'image_generation' | 'image_edit';
    status: 'pending' | 'processing' | 'completed' | 'failed';
    input_image_id: string | null;
    output_image_id: string | null;
    source_language: string | null;
    target_language: string | null;
    error_message: string | null;
    tokens_used: number | null;
    processing_ms: number | null;
    created_at: string;
    updated_at: string;
}

/**
 * Callbacks for generation status changes
 */
interface UseGenerationRealtimeOptions {
    /** User ID to filter updates for */
    userId: string | null;
    /** Generation IDs to track (only updates for these IDs will trigger callbacks) */
    generationIds: string[];
    /** Called when a generation completes */
    onComplete?: (generation: GenerationUpdate) => void;
    /** Called when a generation fails */
    onFailed?: (generation: GenerationUpdate) => void;
    /** Called when status changes to processing */
    onProcessing?: (generation: GenerationUpdate) => void;
}

/**
 * Hook to subscribe to realtime updates for generations
 * 
 * @param options - Configuration options including userId and generationIds to track
 * 
 * @example
 * ```tsx
 * useGenerationRealtime({
 *   userId: user?.id || null,
 *   generationIds: pendingIds,
 *   onComplete: (gen) => {
 *     // Fetch signed URL and update results
 *     fetchAndAddResult(gen.id);
 *   },
 *   onFailed: (gen) => {
 *     // Show error
 *     console.error('Failed:', gen.error_message);
 *   },
 * });
 * ```
 */
export function useGenerationRealtime({
    userId,
    generationIds,
    onComplete,
    onFailed,
    onProcessing,
}: UseGenerationRealtimeOptions): void {
    const channelRef = useRef<RealtimeChannel | null>(null);
    const generationIdsRef = useRef<Set<string>>(new Set());

    // Keep the set of tracked IDs up to date
    useEffect(() => {
        generationIdsRef.current = new Set(generationIds);
    }, [generationIds]);

    // Stable callback refs to avoid re-subscribing
    const onCompleteRef = useRef(onComplete);
    const onFailedRef = useRef(onFailed);
    const onProcessingRef = useRef(onProcessing);

    useEffect(() => {
        onCompleteRef.current = onComplete;
        onFailedRef.current = onFailed;
        onProcessingRef.current = onProcessing;
    }, [onComplete, onFailed, onProcessing]);

    const handleUpdate = useCallback((payload: { new: GenerationUpdate }) => {
        const generation = payload.new;

        // Only process updates for tracked generation IDs
        if (!generationIdsRef.current.has(generation.id)) {
            return;
        }

        switch (generation.status) {
            case 'completed':
                onCompleteRef.current?.(generation);
                break;
            case 'failed':
                onFailedRef.current?.(generation);
                break;
            case 'processing':
                onProcessingRef.current?.(generation);
                break;
        }
    }, []);

    useEffect(() => {
        // Skip in demo mode or if no user
        if (isDemoMode || !userId || generationIds.length === 0) {
            console.log('[Realtime] Skipping subscription:', { isDemoMode, userId: !!userId, generationIdsCount: generationIds.length });
            return;
        }

        const supabase = getSupabaseClient();
        if (!supabase) {
            console.warn('Supabase client not available for realtime');
            return;
        }

        // Create a unique channel name based on generation IDs
        const channelName = `generations-${userId}-${generationIds.join('-').slice(0, 50)}-${Date.now()}`;
        console.log('[Realtime] Creating subscription for', generationIds.length, 'generations');

        // Subscribe to updates on the generations table for this user
        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'generations',
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    console.log('[Realtime] Received update:', payload.new?.id, payload.new?.status);
                    handleUpdate(payload as unknown as { new: GenerationUpdate });
                }
            )
            .subscribe((status) => {
                console.log('[Realtime] Subscription status:', status);
                if (status === 'SUBSCRIBED') {
                    console.log('Realtime subscription active for generations');
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('Realtime channel error');
                }
            });

        channelRef.current = channel;

        return () => {
            console.log('[Realtime] Cleaning up subscription');
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
        // Use a stable key derived from generationIds to trigger re-subscription
    }, [userId, generationIds.join(','), handleUpdate]);
}

/**
 * Fetch generation details including signed URLs
 */
export async function fetchGenerationResult(generationId: string): Promise<{
    generation: GenerationUpdate;
    inputUrl: string | null;
    outputUrl: string | null;
} | null> {
    try {
        const response = await fetch(`/api/generations/${generationId}`);
        if (!response.ok) {
            console.error('Failed to fetch generation:', generationId);
            return null;
        }
        const data = await response.json();
        return {
            generation: data.generation,
            inputUrl: data.input_url || null,
            outputUrl: data.output_url || null,
        };
    } catch (error) {
        console.error('Error fetching generation result:', error);
        return null;
    }
}
