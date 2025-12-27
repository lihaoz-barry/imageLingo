import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin-middleware';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

/**
 * GET /api/admin/feedback
 *
 * ADMIN-ONLY ENDPOINT
 * Lists all feedback submissions.
 *
 * SECURITY & PRIVACY:
 * - Only accessible to admin email (lihaoz0214@gmail.com)
 * - Uses admin client to bypass RLS and view all feedback
 *
 * @returns 200 with list of feedback, 401/403 for unauthorized/forbidden
 */
export async function GET(req: NextRequest) {
  // SECURITY: Admin-only access control
  const { response: authError } = await requireAdmin(req);
  if (authError) return authError;

  try {
    const supabase = createSupabaseAdminClient();
    if (!supabase) {
      return Response.json(
        { error: 'Supabase admin not configured' },
        { status: 500 }
      );
    }

    // Fetch all feedback ordered by created_at DESC
    const { data: feedback, error: fetchError } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching feedback:', fetchError);
      return Response.json(
        { error: 'Failed to fetch feedback' },
        { status: 500 }
      );
    }

    // Count unread feedback
    const unreadCount = feedback?.filter(f => f.status === 'unread').length || 0;

    return Response.json(
      {
        feedback: feedback || [],
        total: feedback?.length || 0,
        unreadCount,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Admin feedback fetch error:', error);
    return Response.json(
      { error: message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/feedback
 *
 * ADMIN-ONLY ENDPOINT
 * Update feedback status (mark as read, archive, etc.)
 *
 * @returns 200 on success, 401/403 for unauthorized/forbidden
 */
export async function PATCH(req: NextRequest) {
  // SECURITY: Admin-only access control
  const { response: authError, userId } = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { feedbackId, status } = body;

    if (!feedbackId || !status) {
      return Response.json(
        { error: 'feedbackId and status are required' },
        { status: 400 }
      );
    }

    if (!['unread', 'read', 'archived'].includes(status)) {
      return Response.json(
        { error: 'Invalid status. Must be: unread, read, or archived' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();
    if (!supabase) {
      return Response.json(
        { error: 'Supabase admin not configured' },
        { status: 500 }
      );
    }

    const updateData: Record<string, unknown> = { status };

    // If marking as read, set read_at and read_by
    if (status === 'read') {
      updateData.read_at = new Date().toISOString();
      updateData.read_by = userId;
    }

    const { error: updateError } = await supabase
      .from('feedback')
      .update(updateData)
      .eq('id', feedbackId);

    if (updateError) {
      console.error('Error updating feedback:', updateError);
      return Response.json(
        { error: 'Failed to update feedback' },
        { status: 500 }
      );
    }

    return Response.json(
      { success: true, message: 'Feedback updated successfully' },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Admin feedback update error:', error);
    return Response.json(
      { error: message },
      { status: 500 }
    );
  }
}
