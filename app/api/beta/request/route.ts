import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { Resend } from 'resend';
import { BETA_CREDITS_PER_REQUEST } from '@/lib/config';

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

    // Send email notification (don't fail if email fails)
    try {
      const resendApiKey = process.env.RESEND_API_KEY;
      if (resendApiKey) {
        const resend = new Resend(resendApiKey);
        const recipientEmail = process.env.NEXT_PUBLIC_FEEDBACK_EMAIL || 'feedback@imagelingo.com';
        const senderEmail = process.env.FEEDBACK_FROM_EMAIL || 'onboarding@resend.dev';

        // Simple HTML escaping
        const escapeHtml = (text: string) => {
          return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
        };

        await resend.emails.send({
          from: senderEmail,
          to: [recipientEmail],
          subject: `[Beta Request] New request from ${userEmail}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; background-color: #0d0d2b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #f59e0b; font-size: 28px; margin: 0;">
                    Beta Token Request
                  </h1>
                  <p style="color: #9ca3af; font-size: 14px; margin-top: 8px;">
                    New request pending approval
                  </p>
                </div>

                <!-- Content Card -->
                <div style="background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02)); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 30px;">

                  <!-- Badge -->
                  <div style="margin-bottom: 20px;">
                    <span style="display: inline-block; background-color: rgba(245, 158, 11, 0.2); color: #f59e0b; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 500;">
                      Pending Review
                    </span>
                  </div>

                  <!-- User Info -->
                  <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; margin-bottom: 20px;">
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="color: #9ca3af; font-size: 13px; padding: 4px 0; width: 100px;">Email</td>
                        <td style="color: #00d4ff; font-size: 14px; padding: 4px 0;">
                          <a href="mailto:${escapeHtml(userEmail)}" style="color: #00d4ff; text-decoration: none;">${escapeHtml(userEmail)}</a>
                        </td>
                      </tr>
                      <tr>
                        <td style="color: #9ca3af; font-size: 13px; padding: 4px 0;">Credits</td>
                        <td style="color: #10b981; font-size: 14px; padding: 4px 0; font-weight: 600;">${BETA_CREDITS_PER_REQUEST} tokens</td>
                      </tr>
                    </table>
                  </div>

                  ${message ? `
                  <!-- Message -->
                  <div style="margin-bottom: 10px;">
                    <p style="color: #9ca3af; font-size: 13px; margin: 0 0 8px 0;">Message</p>
                    <div style="background: rgba(0,0,0,0.2); border-radius: 12px; padding: 16px;">
                      <p style="color: #e5e7eb; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${escapeHtml(message)}</p>
                    </div>
                  </div>
                  ` : ''}

                  <!-- Action Button -->
                  <div style="text-align: center; margin-top: 20px;">
                    <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://imagelingo.vercel.app'}/admin/beta-requests"
                       style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #c026d3); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">
                      Review in Dashboard
                    </a>
                  </div>
                </div>

                <!-- Footer -->
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
                  <p style="color: #6b7280; font-size: 12px; margin: 0;">
                    Sent from ImageLingo Beta System
                  </p>
                </div>
              </div>
            </body>
            </html>
          `,
        });
      }
    } catch (emailError) {
      // Log but don't fail the request
      console.error('Failed to send beta request email notification:', emailError);
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
