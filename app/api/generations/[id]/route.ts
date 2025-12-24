import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { createSupabaseServerClient } from '@/lib/supabase-server';

/**
 * GET /api/generations/[id]
 * Get a specific generation by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response: authError, userId } = await requireAuth(req);
  if (authError) return authError;

  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return Response.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    const { data: generation, error } = await supabase
      .from('generations')
      .select('*, projects!inner(owner_id)')
      .eq('id', id)
      .single();

    if (error || !generation) {
      return Response.json(
        { error: 'Generation not found' },
        { status: 404 }
      );
    }

    // Verify user owns the project
    if (generation.projects.owner_id !== userId) {
      return Response.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return Response.json({ generation });
  } catch (error: any) {
    return Response.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/generations/[id]
 * Update a generation (typically used to update status/results)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response: authError, userId } = await requireAuth(req);
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await req.json();
    const {
      status,
      output_text,
      output_image_id,
      error_message,
      model_used,
      tokens_used,
      processing_ms,
    } = body;

    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return Response.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from('generations')
      .select('*, projects!inner(owner_id)')
      .eq('id', id)
      .single();

    if (!existing || existing.projects.owner_id !== userId) {
      return Response.json(
        { error: 'Generation not found or access denied' },
        { status: 404 }
      );
    }

    // Build update object
    const updates: any = {};
    if (status !== undefined) updates.status = status;
    if (output_text !== undefined) updates.output_text = output_text;
    if (output_image_id !== undefined) updates.output_image_id = output_image_id;
    if (error_message !== undefined) updates.error_message = error_message;
    if (model_used !== undefined) updates.model_used = model_used;
    if (tokens_used !== undefined) updates.tokens_used = tokens_used;
    if (processing_ms !== undefined) updates.processing_ms = processing_ms;

    if (Object.keys(updates).length === 0) {
      return Response.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const { data: generation, error } = await supabase
      .from('generations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return Response.json(
        { error: 'Failed to update generation' },
        { status: 500 }
      );
    }

    return Response.json({ generation });
  } catch (error: any) {
    return Response.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
