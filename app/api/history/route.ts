import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { createSupabaseServerClient } from '@/lib/supabase-server';

/**
 * GET /api/history
 * Get the user's translation history with signed image URLs
 */
export async function GET(req: NextRequest) {
  const { response: authError, userId } = await requireAuth(req);
  if (authError) return authError;

  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return Response.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    // Fetch completed generations for the user
    const { data: generations, error } = await supabase
      .from('generations')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching history:', error);
      return Response.json(
        { error: 'Failed to fetch history' },
        { status: 500 }
      );
    }

    // Generate signed URLs for all images
    const historyWithUrls = await Promise.all(
      (generations || []).map(async (gen) => {
        let inputUrl = null;
        let outputUrl = null;
        let inputImage = null;
        let outputImage = null;

        // Fetch input image if exists
        if (gen.input_image_id) {
          const { data: inputImg } = await supabase
            .from('images')
            .select('id, storage_path, original_filename')
            .eq('id', gen.input_image_id)
            .single();

          if (inputImg?.storage_path) {
            const { data } = await supabase.storage
              .from('images')
              .createSignedUrl(inputImg.storage_path, 3600);
            inputUrl = data?.signedUrl || null;
            inputImage = inputImg;
          }
        }

        // Fetch output image if exists
        if (gen.output_image_id) {
          const { data: outputImg } = await supabase
            .from('images')
            .select('id, storage_path, original_filename')
            .eq('id', gen.output_image_id)
            .single();

          if (outputImg?.storage_path) {
            const { data } = await supabase.storage
              .from('images')
              .createSignedUrl(outputImg.storage_path, 3600);
            outputUrl = data?.signedUrl || null;
            outputImage = outputImg;
          }
        }

        return {
          id: gen.id,
          type: gen.type,
          status: gen.status,
          source_language: gen.source_language,
          target_language: gen.target_language,
          tokens_used: gen.tokens_used || 1,
          processing_ms: gen.processing_ms,
          created_at: gen.created_at,
          input_image: inputImage ? {
            id: inputImage.id,
            original_filename: inputImage.original_filename,
            url: inputUrl,
          } : null,
          output_image: outputImage ? {
            id: outputImage.id,
            original_filename: outputImage.original_filename,
            url: outputUrl,
          } : null,
        };
      })
    );

    return Response.json({ history: historyWithUrls });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return Response.json(
      { error: message },
      { status: 500 }
    );
  }
}
