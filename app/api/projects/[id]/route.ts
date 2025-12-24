import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { createSupabaseServerClient } from '@/lib/supabase-server';

/**
 * GET /api/projects/[id]
 * Get a specific project by ID
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

    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('owner_id', userId)
      .single();

    if (error || !project) {
      return Response.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return Response.json({ project });
  } catch (error: any) {
    return Response.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/projects/[id]
 * Update a project
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
    const { name, description } = body;

    const updates: any = {};
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return Response.json(
          { error: 'Invalid project name' },
          { status: 400 }
        );
      }
      updates.name = name.trim();
    }
    if (description !== undefined) {
      updates.description = description;
    }

    if (Object.keys(updates).length === 0) {
      return Response.json(
        { error: 'No valid fields to update' },
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
      .update(updates)
      .eq('id', id)
      .eq('owner_id', userId)
      .select()
      .single();

    if (error || !project) {
      return Response.json(
        { error: 'Project not found or update failed' },
        { status: 404 }
      );
    }

    return Response.json({ project });
  } catch (error: any) {
    return Response.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[id]
 * Delete a project
 */
export async function DELETE(
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

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('owner_id', userId);

    if (error) {
      return Response.json(
        { error: 'Failed to delete project' },
        { status: 500 }
      );
    }

    return Response.json({ message: 'Project deleted successfully' });
  } catch (error: any) {
    return Response.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
