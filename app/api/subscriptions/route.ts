import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { createSupabaseServerClient } from '@/lib/supabase-server';

const DEFAULT_CREDITS = 20;

/**
 * GET /api/subscriptions
 * Get the current user's subscription (creates one if it doesn't exist)
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

    const { data: existingSubscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    let subscription = existingSubscription;

    // If no subscription exists, create one with default credits
    if (fetchError || !subscription) {
      const { data: newSubscription, error: createError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan: 'free',
          status: 'active',
          generations_limit: DEFAULT_CREDITS,
          generations_used: 0,
        })
        .select()
        .single();

      if (createError || !newSubscription) {
        return Response.json(
          { error: 'Failed to create subscription' },
          { status: 500 }
        );
      }

      subscription = newSubscription;
    }

    // Calculate credits balance
    const creditsBalance = subscription.generations_limit - subscription.generations_used;

    return Response.json({
      subscription,
      credits_balance: creditsBalance,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return Response.json(
      { error: message },
      { status: 500 }
    );
  }
}
