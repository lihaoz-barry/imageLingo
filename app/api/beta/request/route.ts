import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { createSupabaseServerClient } from '@/lib/supabase-server';

/**
 * POST /api/beta/request
 * 
 * Allows authenticated users to request beta tokens.
 * 
 * SECURITY & VALIDATION:
 * - User must be authenticated
 * - Each user can only request ONCE (enforced by unique constraint in DB)
 * - Email is validated and sanitized
 * - Request status is set to "pending" by default
 * - Admin will review and approve via admin dashboard
 * 
 * @returns 201 on success, 400 for duplicate requests, 401 for unauthorized, 500 for errors
 */
export async function POST(req: NextRequest) {
  // SECURITY: Require authentication
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

    // Get user's email for the request
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user || !userData.user.email) {
      return Response.json(
        { error: 'Failed to get user information' },
        { status: 400 }
      );
    }

    const userEmail = userData.user.email;

    // Parse optional message from request body
    let message: string | undefined;
    try {
      const body = await req.json();
      message = body.message?.trim();
    } catch {
      // No body or invalid JSON is fine, message is optional
    }

    // SANITIZATION: Email is already validated by Supabase Auth
    // Create the beta request with status "pending"
    // The database unique constraint will prevent duplicate requests
    const { data: newRequest, error: insertError } = await supabase
      .from('beta_requests')
      .insert({
        user_id: userId,
        email: userEmail,
        message: message || null,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      // Handle unique constraint violation
      if (insertError.code === '23505') {
        return Response.json(
          { error: 'You have already submitted a beta token request' },
          { status: 400 }
        );
      }
      
      console.error('Error creating beta request:', insertError);
      return Response.json(
        { error: 'Failed to create beta token request' },
        { status: 500 }
      );
    }

    return Response.json(
      {
        message: 'Beta token request submitted successfully',
        request: {
          id: newRequest.id,
          status: newRequest.status,
          created_at: newRequest.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Beta request error:', error);
    return Response.json(
      { error: message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/beta/request
 * 
 * Get the current user's beta token request status.
 * 
 * SECURITY:
 * - User must be authenticated
 * - Users can only view their own request (enforced by RLS)
 * 
 * @returns 200 with request data, 404 if no request, 401 for unauthorized
 */
export async function GET(req: NextRequest) {
  // SECURITY: Require authentication
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

    // Get user's beta request (RLS ensures they can only see their own)
    const { data: request, error: fetchError } = await supabase
      .from('beta_requests')
      .select('id, status, created_at, updated_at, credits_granted, approved_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching beta request:', fetchError);
      return Response.json(
        { error: 'Failed to fetch beta request' },
        { status: 500 }
      );
    }

    if (!request) {
      return Response.json(
        { 
          message: 'No beta token request found',
          hasRequest: false,
        },
        { status: 200 }
      );
    }

    return Response.json(
      {
        hasRequest: true,
        request,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Beta request fetch error:', error);
    return Response.json(
      { error: message },
      { status: 500 }
    );
  }
}
