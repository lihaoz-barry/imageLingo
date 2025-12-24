import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { translateImage, GeminiError } from '@/lib/gemini';
import { getTranslationPrompt, PROMPT_VERSION, PROMPT_VARIANTS, getLanguageName } from '@/lib/prompts';

/**
 * POST /api/translate
 * Process an image translation using Gemini API
 *
 * Request body: { generation_id: string }
 *
 * Flow:
 * 1. Authenticate + verify ownership
 * 2. Fetch generation (must be 'pending')
 * 3. Update status → 'processing'
 * 4. Fetch input image from Supabase Storage
 * 5. Call Gemini API with image + prompt
 * 6. Upload output image to Storage
 * 7. Create output image record
 * 8. Update generation: status='completed', output_image_id
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

    // Call Gemini API
    const result = await translateImage(imageBuffer, mimeType, prompt);

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
      })
      .eq('id', generationId)
      .select()
      .single();

    if (updateError) {
      throw new Error('Failed to update generation record');
    }

    // Get signed URLs for input and output images
    const [inputUrlResult, outputUrlResult] = await Promise.all([
      supabase.storage.from('images').createSignedUrl(inputImage.storage_path, 3600),
      supabase.storage.from('images').createSignedUrl(outputPath, 3600),
    ]);

    return Response.json({
      generation: updatedGeneration,
      input_url: inputUrlResult.data?.signedUrl || null,
      output_url: outputUrlResult.data?.signedUrl || null,
    });
  } catch (error: unknown) {
    console.error('Translation error:', error);

    // Update generation with failure status
    if (generationId && supabase) {
      const errorMessage = error instanceof GeminiError
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Unknown error occurred';

      await supabase
        .from('generations')
        .update({
          status: 'failed',
          error_message: errorMessage,
          processing_ms: Date.now() - startTime,
        })
        .eq('id', generationId);
    }

    // Determine appropriate status code
    let statusCode = 500;
    let retryable = false;

    if (error instanceof GeminiError) {
      if (error.code === 'RATE_LIMIT') {
        statusCode = 429;
        retryable = true;
      } else if (error.code === 'CONFIG_ERROR') {
        statusCode = 500;
      }
    }

    const message = error instanceof Error ? error.message : 'Internal server error';

    return Response.json(
      {
        error: message,
        retryable,
      },
      { status: statusCode }
    );
  }
}
