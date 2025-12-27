import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, feedback, userId } = body;

    // Validate that feedback is not empty
    if (!feedback || feedback.trim() === '') {
      return NextResponse.json(
        { error: 'Feedback is required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration missing');
      return NextResponse.json(
        { error: 'Database configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Store feedback in database
    const { error: dbError } = await supabase
      .from('feedback')
      .insert({
        user_id: userId || null,
        email: email || null,
        message: feedback.trim(),
        source: 'feedback_button',
        status: 'unread',
      });

    if (dbError) {
      console.error('Error storing feedback:', dbError);
      // Continue to send email even if DB fails
    }

    // Check if Resend API key is configured
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error('RESEND_API_KEY is not configured');
      // If DB succeeded but email failed, still return success
      if (!dbError) {
        return NextResponse.json(
          { success: true, message: 'Feedback saved (email notification skipped)' },
          { status: 200 }
        );
      }
      return NextResponse.json(
        { error: 'Email service is not configured' },
        { status: 500 }
      );
    }

    // Initialize Resend
    const resend = new Resend(resendApiKey);

    // Get recipient email from environment variable or use default
    const recipientEmail = process.env.NEXT_PUBLIC_FEEDBACK_EMAIL || 'feedback@imagelingo.com';

    // Get sender email from environment variable or use default
    const senderEmail = process.env.FEEDBACK_FROM_EMAIL || 'onboarding@resend.dev';

    // Simple HTML escaping to prevent XSS
    const escapeHtml = (text: string) => {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    // Send email via Resend with styled template
    const { error: emailError } = await resend.emails.send({
      from: senderEmail,
      to: [recipientEmail],
      replyTo: email || undefined,
      subject: '[Feedback] New Feedback from ImageLingo',
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
              <h1 style="color: #8b5cf6; font-size: 28px; margin: 0;">
                ImageLingo Feedback
              </h1>
              <p style="color: #9ca3af; font-size: 14px; margin-top: 8px;">
                New feedback received
              </p>
            </div>

            <!-- Content Card -->
            <div style="background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02)); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 30px;">

              <!-- Badge -->
              <div style="margin-bottom: 20px;">
                <span style="display: inline-block; background-color: rgba(139, 92, 246, 0.2); color: #8b5cf6; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 500;">
                  Feedback
                </span>
              </div>

              <!-- Sender Info -->
              <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; margin-bottom: 20px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="color: #9ca3af; font-size: 13px; padding: 4px 0; width: 80px;">From</td>
                    <td style="color: #ffffff; font-size: 14px; padding: 4px 0;">
                      ${email ? `<a href="mailto:${escapeHtml(email)}" style="color: #00d4ff; text-decoration: none;">${escapeHtml(email)}</a>` : '<span style="color: #6b7280;">Anonymous</span>'}
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Message -->
              <div style="margin-bottom: 10px;">
                <p style="color: #9ca3af; font-size: 13px; margin: 0 0 8px 0;">Feedback</p>
                <div style="background: rgba(0,0,0,0.2); border-radius: 12px; padding: 16px;">
                  <p style="color: #e5e7eb; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${escapeHtml(feedback)}</p>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                Sent from ImageLingo Feedback Button
              </p>
              <p style="color: #4b5563; font-size: 11px; margin-top: 4px;">
                View all feedback in the <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://imagelingo.vercel.app'}/admin/beta-requests" style="color: #8b5cf6;">Admin Dashboard</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (emailError) {
      console.error('Error sending email:', emailError);
      // If DB succeeded but email failed, still return success
      if (!dbError) {
        return NextResponse.json(
          { success: true, message: 'Feedback saved (email notification failed)' },
          { status: 200 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to send feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Feedback sent successfully',
      },
      { status: 200 }
    );

  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
