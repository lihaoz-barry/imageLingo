import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { createSupabaseServerClient } from '@/lib/supabase-server';

/**
 * GET /api/subscriptions
 * Get the current user's subscription
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

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !subscription) {
      return Response.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    return Response.json({ subscription });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return Response.json(
      { error: message },
      { status: 500 }
    );
  }
}
