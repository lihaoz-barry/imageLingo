import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { createSupabaseServerClient } from '@/lib/supabase-server';

/**
 * GET /api/projects
 * List all projects for the authenticated user
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

    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return Response.json(
        { error: 'Failed to fetch projects' },
        { status: 500 }
      );
    }

    return Response.json({ projects });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return Response.json(
      { error: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects
 * Create a new project
 */
export async function POST(req: NextRequest) {
  const { response: authError, userId } = await requireAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { name, description } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return Response.json(
        { error: 'Project name is required' },
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

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        owner_id: userId,
        name: name.trim(),
        description: description || null,
      })
      .select()
      .single();

    if (error) {
      return Response.json(
        { error: 'Failed to create project' },
        { status: 500 }
      );
    }

    return Response.json({ project }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return Response.json(
      { error: message },
      { status: 500 }
    );
  }
}
