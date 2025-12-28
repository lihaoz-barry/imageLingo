import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin-middleware';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

/**
 * POST /api/admin/beta-refill
 * 
 * ADMIN-ONLY ENDPOINT
 * Refills tokens for users who have already been approved.
 * 
 * Request body:
 * {
 *   "requestId": "uuid",
 *   "creditsToRefill": number
 * }
 * 
 * SECURITY & PRIVACY:
 * - Only accessible to admin email (lihaoz0214@gmail.com)
 * - Uses admin client to bypass RLS and update requests
 * - Validates input and sanitizes data
 * - Only works on already approved requests
 * - Logs refill action with admin email and timestamp
 * - Updates user's subscription credits
 * 
 * @returns 200 on success, 400 for invalid input, 401/403 for unauthorized, 404 if not found
 */
export async function POST(req: NextRequest) {
  // SECURITY: Admin-only access control
  const { response: authError, email: adminEmail } = await requireAdmin(req);
  if (authError) return authError;

  try {
    // Parse and validate request body
    let requestId: string;
    let creditsToRefill: number;

    try {
      const body = await req.json();
      requestId = body.requestId;
      creditsToRefill = body.creditsToRefill;

      // INPUT VALIDATION
      if (!requestId || typeof requestId !== 'string') {
        return Response.json(
          { error: 'Invalid request ID' },
          { status: 400 }
        );
      }

      if (typeof creditsToRefill !== 'number' || creditsToRefill <= 0 || creditsToRefill > 10000) {
        return Response.json(
          { error: 'Credits must be a positive number between 1 and 10000' },
          { status: 400 }
        );
      }
    } catch {
      return Response.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Use admin client to bypass RLS
    const supabase = createSupabaseAdminClient();
    if (!supabase) {
      return Response.json(
        { error: 'Supabase admin not configured' },
        { status: 500 }
      );
    }

    // Fetch the beta request
    const { data: betaRequest, error: fetchError } = await supabase
      .from('beta_requests')
      .select('id, user_id, email, status, credits_granted')
      .eq('id', requestId)
      .single();

    if (fetchError || !betaRequest) {
      console.error('Error fetching beta request:', fetchError);
      return Response.json(
        { error: 'Beta request not found' },
        { status: 404 }
      );
    }

    // Check if request has been approved (refill only works for approved requests)
    if (betaRequest.status !== 'approved') {
      return Response.json(
        { error: 'Can only refill tokens for approved requests' },
        { status: 400 }
      );
    }

    // Get user subscription
    const { data: subscription, error: fetchSubError } = await supabase
      .from('subscriptions')
      .select('id, generations_limit')
      .eq('user_id', betaRequest.user_id)
      .single();

    if (fetchSubError || !subscription) {
      console.error('Error fetching subscription:', fetchSubError);
      return Response.json(
        { 
          error: 'Cannot refill: User subscription not found.',
        },
        { status: 400 }
      );
    }

    // Calculate new credit limit
    const newLimit = subscription.generations_limit + creditsToRefill;

    // Update the subscription to add more credits
    const { error: updateSubError } = await supabase
      .from('subscriptions')
      .update({
        generations_limit: newLimit,
      })
      .eq('user_id', betaRequest.user_id);

    if (updateSubError) {
      console.error('Error updating subscription:', updateSubError);
      return Response.json(
        { error: 'Failed to refill credits' },
        { status: 500 }
      );
    }

    // Update the beta request to track total credits granted
    const totalCreditsGranted = betaRequest.credits_granted + creditsToRefill;
    const { error: updateRequestError } = await supabase
      .from('beta_requests')
      .update({
        credits_granted: totalCreditsGranted,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (updateRequestError) {
      console.error('Error updating beta request:', updateRequestError);
      // Credits were granted but tracking wasn't updated - not critical
      console.warn(`Credits granted but failed to update request tracking for ${requestId}`);
    }

    // Log the admin action
    console.log(`[ADMIN ACTION] ${adminEmail} refilled ${creditsToRefill} credits for user ${betaRequest.email} (request ${requestId}), total granted: ${totalCreditsGranted}`);

    return Response.json(
      {
        message: 'Credits refilled successfully',
        creditsRefilled: creditsToRefill,
        totalCreditsGranted: totalCreditsGranted,
        newCreditLimit: newLimit,
        refilledBy: adminEmail,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Admin beta refill error:', error);
    return Response.json(
      { error: message },
      { status: 500 }
    );
  }
}
