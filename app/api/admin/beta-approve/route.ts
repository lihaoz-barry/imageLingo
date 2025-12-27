import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin-middleware';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

/**
 * POST /api/admin/beta-approve
 * 
 * ADMIN-ONLY ENDPOINT
 * Approves a beta token request and grants credits to the user.
 * 
 * Request body:
 * {
 *   "requestId": "uuid",
 *   "creditsToGrant": number (default: 100)
 * }
 * 
 * SECURITY & PRIVACY:
 * - Only accessible to admin email (lihaoz0214@gmail.com)
 * - Uses admin client to bypass RLS and update requests
 * - Validates input and sanitizes data
 * - Logs approval action with admin email and timestamp
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
    let creditsToGrant: number;

    try {
      const body = await req.json();
      requestId = body.requestId;
      creditsToGrant = body.creditsToGrant || 100; // Default 100 credits

      // INPUT VALIDATION
      if (!requestId || typeof requestId !== 'string') {
        return Response.json(
          { error: 'Invalid request ID' },
          { status: 400 }
        );
      }

      if (typeof creditsToGrant !== 'number' || creditsToGrant <= 0 || creditsToGrant > 10000) {
        return Response.json(
          { error: 'Credits must be a positive number between 1 and 10000' },
          { status: 400 }
        );
      }
    } catch (error) {
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
      .select('id, user_id, email, status')
      .eq('id', requestId)
      .single();

    if (fetchError || !betaRequest) {
      console.error('Error fetching beta request:', fetchError);
      return Response.json(
        { error: 'Beta request not found' },
        { status: 404 }
      );
    }

    // Check if already approved
    if (betaRequest.status === 'approved') {
      return Response.json(
        { error: 'Request already approved' },
        { status: 400 }
      );
    }

    // Update the beta request to approved status
    const { error: updateRequestError } = await supabase
      .from('beta_requests')
      .update({
        status: 'approved',
        credits_granted: creditsToGrant,
        approved_at: new Date().toISOString(),
        approved_by: adminEmail,
      })
      .eq('id', requestId);

    if (updateRequestError) {
      console.error('Error updating beta request:', updateRequestError);
      return Response.json(
        { error: 'Failed to approve request' },
        { status: 500 }
      );
    }

    // Grant credits to the user by updating their subscription
    const { data: subscription, error: fetchSubError } = await supabase
      .from('subscriptions')
      .select('id, generations_limit')
      .eq('user_id', betaRequest.user_id)
      .single();

    if (fetchSubError || !subscription) {
      console.error('Error fetching subscription:', fetchSubError);
      // Log this but don't fail - the request is marked approved
      console.warn(`Could not find subscription for user ${betaRequest.user_id}`);
      return Response.json(
        { 
          message: 'Request approved but failed to grant credits',
          warning: 'User subscription not found',
        },
        { status: 200 }
      );
    }

    // Add credits to user's limit
    const newLimit = subscription.generations_limit + creditsToGrant;
    const { error: updateSubError } = await supabase
      .from('subscriptions')
      .update({
        generations_limit: newLimit,
      })
      .eq('user_id', betaRequest.user_id);

    if (updateSubError) {
      console.error('Error updating subscription:', updateSubError);
      return Response.json(
        { 
          message: 'Request approved but failed to grant credits',
          error: 'Failed to update user subscription',
        },
        { status: 200 }
      );
    }

    // Log the admin action
    console.log(`[ADMIN ACTION] ${adminEmail} approved beta request ${requestId} for user ${betaRequest.email}, granted ${creditsToGrant} credits`);

    return Response.json(
      {
        message: 'Beta request approved successfully',
        creditsGranted: creditsToGrant,
        newCreditLimit: newLimit,
        approvedBy: adminEmail,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Admin beta approval error:', error);
    return Response.json(
      { error: message },
      { status: 500 }
    );
  }
}
