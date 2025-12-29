import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { translateImage, GeminiError } from '@/lib/gemini';
import { PROMPT_VERSION, PROMPT_VARIANTS, getLanguageName } from '@/lib/prompts';

const CREDITS_PER_TRANSLATION = 1;

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 2,                                    // 0-indexed: attempts 0, 1, 2 (total 3 attempts)
  transientDelay: 2000,                             // 2 seconds base delay
  backoffMultiplier: 2,                             // 2s, then 4s
  retryableErrors: ['RATE_LIMIT', 'TIMEOUT', 'DEADLINE_EXCEEDED'],
};

// Helper: Log error attempt to database
async function logErrorAttempt(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  generationId: string,
  userId: string,
  errorCode: string,
  errorMessage: string,
  attemptNumber: number
) {
  try {
    await supabase
      .from('error_logs')
      .insert({
        generation_id: generationId,
        user_id: userId,
        error_code: errorCode,
        error_message: errorMessage,
        attempt_number: attemptNumber,
      });
  } catch (logError) {
    console.error('Failed to log error attempt:', logError);
    // Don't throw - continue processing even if logging fails
  }
}

// Helper: Sleep for specified milliseconds
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * POST /api/translate
 * Process an image translation using Gemini API
 *
 * Request body: { generation_id: string }
 *
 * Flow:
 * 1. Authenticate + verify ownership
 * 2. Check if user has enough credits
 * 3. Fetch generation (must be 'pending')
 * 4. Update status → 'processing'
 * 5. Fetch input image from Supabase Storage
 * 6. Call Gemini API with image + prompt
 * 7. Upload output image to Storage
 * 8. Create output image record
 * 9. Update generation: status='completed', output_image_id
 * 10. Deduct credits from user's subscription
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const { response: authError, userId } = await requireAuth(req);
  if (authError) return authError;

  let generationId: string | undefined;
  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>> | null = null;

  try {
    const body = await req.json();
    generationId = body.generation_id;

    if (!generationId) {
      return Response.json(
        { error: 'generation_id is required' },
        { status: 400 }
      );
    }

    supabase = await createSupabaseServerClient();
    if (!supabase) {
      return Response.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    // Check user's credits before processing
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (subError || !subscription) {
      return Response.json(
        { error: 'Subscription not found. Please refresh the page.' },
        { status: 402 }
      );
    }

    const creditsBalance = subscription.generations_limit - subscription.generations_used;
    if (creditsBalance < CREDITS_PER_TRANSLATION) {
      return Response.json(
        { error: `Insufficient credits. You have ${creditsBalance} credits but need ${CREDITS_PER_TRANSLATION}.` },
        { status: 402 }
      );
    }

    // Fetch generation with project and image info
    const { data: generation, error: fetchError } = await supabase
      .from('generations')
      .select('*, projects!inner(owner_id), images!input_image_id(*)')
      .eq('id', generationId)
      .single();

    if (fetchError || !generation) {
      return Response.json(
        { error: 'Generation not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (generation.projects.owner_id !== userId) {
      return Response.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check status - must be pending
    if (generation.status !== 'pending') {
      return Response.json(
        { error: `Generation is already ${generation.status}` },
        { status: 400 }
      );
    }

    // Check if input image exists
    if (!generation.images) {
      return Response.json(
        { error: 'Input image not found' },
        { status: 400 }
      );
    }

    const inputImage = generation.images;

    // Update status to processing
    await supabase
      .from('generations')
      .update({ status: 'processing' })
      .eq('id', generationId);

    // Download input image from storage
    const { data: imageBlob, error: downloadError } = await supabase.storage
      .from('images')
      .download(inputImage.storage_path);

    if (downloadError || !imageBlob) {
      throw new Error('Failed to download input image from storage');
    }

    // Convert blob to buffer
    const imageBuffer = Buffer.from(await imageBlob.arrayBuffer());
    const mimeType = inputImage.mime_type || 'image/png';

    // Build translation prompt using the detailed variant for higher quality results
    const prompt = PROMPT_VARIANTS.detailed(
      getLanguageName(generation.source_language || 'auto'),
      getLanguageName(generation.target_language || 'en')
    );

    // Translate with retry logic
    let result;
    let lastError: GeminiError | null = null;

    for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
      try {
        // Call Gemini API
        result = await translateImage(imageBuffer, mimeType, prompt);

        // Success - break out of retry loop
        if (attempt > 0) {
          // Update generation to track retries
          await supabase
            .from('generations')
            .update({
              retry_count: attempt,
              last_retry_at: new Date().toISOString(),
            })
            .eq('id', generationId);
        }
        break;

      } catch (error: unknown) {
        lastError = error as GeminiError;
        const isGeminiError = error instanceof GeminiError;
        const errorCode = isGeminiError ? (error as GeminiError).code : 'API_ERROR';
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Log this error attempt
        await logErrorAttempt(supabase!, generationId, userId, errorCode, errorMessage, attempt + 1);

        // Check if we should retry
        const isTransientError = RETRY_CONFIG.retryableErrors.includes(errorCode);
        const canRetry = isTransientError && attempt < RETRY_CONFIG.maxRetries;

        if (!canRetry) {
          // No more retries - throw to outer catch
          throw error;
        }

        // Calculate backoff delay
        const delayMs = RETRY_CONFIG.transientDelay *
                       Math.pow(RETRY_CONFIG.backoffMultiplier, attempt);

        // Update generation status to show retrying
        await supabase
          .from('generations')
          .update({
            status: 'retrying',
            error_code: errorCode,
            error_message: errorMessage,
            first_error_at: attempt === 0 ? new Date().toISOString() : undefined,
            last_retry_at: new Date().toISOString(),
          })
          .eq('id', generationId);

        // Wait before next retry
        await sleep(delayMs);
      }
    }

    // If we got here without result, throw the last error
    if (!result) {
      throw lastError || new Error('Translation failed after retries');
    }

    // Generate storage path for output image
    const fileExt = result.mimeType.split('/')[1] || 'png';
    const outputPath = `${userId}/${generation.project_id}/translated_${Date.now()}.${fileExt}`;

    // Upload output image to storage
    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(outputPath, result.imageBuffer, {
        contentType: result.mimeType,
        upsert: false,
      });

    if (uploadError) {
      throw new Error('Failed to upload translated image to storage');
    }

    // Create output image record
    const { data: outputImage, error: imageInsertError } = await supabase
      .from('images')
      .insert({
        project_id: generation.project_id,
        uploaded_by: userId,
        storage_path: outputPath,
        original_filename: `translated_${inputImage.original_filename || 'image'}`,
        mime_type: result.mimeType,
        file_size_bytes: result.imageBuffer.length,
      })
      .select()
      .single();

    if (imageInsertError || !outputImage) {
      // Cleanup: remove uploaded file if DB insert fails
      await supabase.storage.from('images').remove([outputPath]);
      throw new Error('Failed to create output image record');
    }

    // Calculate processing time
    const processingMs = Date.now() - startTime;

    // Update generation with success
    const { data: updatedGeneration, error: updateError } = await supabase
      .from('generations')
      .update({
        status: 'completed',
        output_image_id: outputImage.id,
        model_used: `gemini-3-pro-image-preview (prompt v${PROMPT_VERSION})`,
        processing_ms: processingMs,
        tokens_used: CREDITS_PER_TRANSLATION,
      })
      .eq('id', generationId)
      .select()
      .single();

    if (updateError) {
      throw new Error('Failed to update generation record');
    }

    // Deduct credits from user's subscription
    const { error: creditError } = await supabase
      .from('subscriptions')
      .update({
        generations_used: subscription.generations_used + CREDITS_PER_TRANSLATION,
      })
      .eq('user_id', userId);

    if (creditError) {
      console.error('Failed to deduct credits:', creditError);
      // Don't fail the request since the translation succeeded
    }

    // Get signed URLs for input and output images
    const [inputUrlResult, outputUrlResult] = await Promise.all([
      supabase.storage.from('images').createSignedUrl(inputImage.storage_path, 3600),
      supabase.storage.from('images').createSignedUrl(outputPath, 3600),
    ]);

    // Calculate new credits balance
    const newCreditsBalance = subscription.generations_limit - subscription.generations_used - CREDITS_PER_TRANSLATION;

    return Response.json({
      generation: updatedGeneration,
      input_url: inputUrlResult.data?.signedUrl || null,
      output_url: outputUrlResult.data?.signedUrl || null,
      credits_balance: newCreditsBalance,
    });
  } catch (error: unknown) {
    console.error('Translation error:', error);

    // Determine error details
    const isGeminiError = error instanceof GeminiError;
    const errorCode = isGeminiError ? (error as GeminiError).code : 'API_ERROR';
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const isRetryable = RETRY_CONFIG.retryableErrors.includes(errorCode);

    // Update generation with failure status
    if (generationId && supabase) {
      await supabase
        .from('generations')
        .update({
          status: 'failed',
          error_message: errorMessage,
          error_code: errorCode,
          is_retryable: isRetryable,
          processing_ms: Date.now() - startTime,
        })
        .eq('id', generationId);
    }

    // Determine appropriate status code
    let statusCode = 500;

    if (isGeminiError) {
      if (errorCode === 'RATE_LIMIT') {
        statusCode = 429;
      } else if (errorCode === 'CONFIG_ERROR') {
        statusCode = 500;
      }
    }

    return Response.json(
      {
        error: errorMessage,
        error_code: errorCode,
        retryable: isRetryable,
      },
      { status: statusCode }
    );
  }
}
