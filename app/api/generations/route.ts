import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { createSupabaseServerClient } from '@/lib/supabase-server';

/**
 * GET /api/generations
 * List all generations for a project
 * Query params: project_id (required)
 */
export async function GET(req: NextRequest) {
  const { response: authError, userId } = await requireAuth(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('project_id');

    if (!projectId) {
      return Response.json(
        { error: 'project_id query parameter is required' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return Response.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    // Verify user owns the project
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('owner_id', userId)
      .single();

    if (!project) {
      return Response.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    const { data: generations, error } = await supabase
      .from('generations')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      return Response.json(
        { error: 'Failed to fetch generations' },
        { status: 500 }
      );
    }

    return Response.json({ generations });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return Response.json(
      { error: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/generations
 * Create a new generation task
 */
export async function POST(req: NextRequest) {
  const { response: authError, userId } = await requireAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const {
      project_id,
      type,
      prompt,
      input_image_id,
      source_language,
      target_language,
    } = body;

    if (!project_id) {
      return Response.json(
        { error: 'project_id is required' },
        { status: 400 }
      );
    }

    if (!type || !['text_extraction', 'translation', 'image_generation', 'image_edit'].includes(type)) {
      return Response.json(
        { error: 'Valid type is required (text_extraction, translation, image_generation, image_edit)' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return Response.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    // Verify user owns the project
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', project_id)
      .eq('owner_id', userId)
      .single();

    if (!project) {
      return Response.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // Create generation record
    const { data: generation, error } = await supabase
      .from('generations')
      .insert({
        project_id,
        user_id: userId,
        type,
        status: 'pending',
        prompt: prompt || null,
        input_image_id: input_image_id || null,
        source_language: source_language || null,
        target_language: target_language || null,
      })
      .select()
      .single();

    if (error) {
      return Response.json(
        { error: 'Failed to create generation' },
        { status: 500 }
      );
    }

    return Response.json({ generation }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return Response.json(
      { error: message },
      { status: 500 }
    );
  }
}
