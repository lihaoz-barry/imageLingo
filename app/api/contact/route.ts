import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, subject, message } = body;

    // Validate required fields
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!email || email.trim() === '') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!subject || subject.trim() === '') {
      return NextResponse.json(
        { error: 'Subject is required' },
        { status: 400 }
      );
    }

    if (!message || message.trim() === '') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Check if Resend API key is configured
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error('RESEND_API_KEY is not configured');
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

    // Get subject category color
    const getSubjectColor = (subj: string) => {
      const colors: Record<string, string> = {
        'General Inquiry': '#667eea',
        'Technical Support': '#f59e0b',
        'Billing Question': '#10b981',
        'Feature Request': '#8b5cf6',
        'Bug Report': '#ef4444',
        'Partnership': '#06b6d4',
        'Other': '#6b7280',
      };
      return colors[subj] || '#667eea';
    };

    // Send email via Resend with Contact-specific template
    const { data, error } = await resend.emails.send({
      from: senderEmail,
      to: [recipientEmail],
      replyTo: email,
      subject: `[Contact] ${subject}: ${name}`,
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
              <h1 style="color: #00d4ff; font-size: 28px; margin: 0;">
                ImageLingo Contact
              </h1>
              <p style="color: #9ca3af; font-size: 14px; margin-top: 8px;">
                New message from Contact Form
              </p>
            </div>

            <!-- Content Card -->
            <div style="background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02)); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 30px;">

              <!-- Subject Badge -->
              <div style="margin-bottom: 20px;">
                <span style="display: inline-block; background-color: ${getSubjectColor(subject)}20; color: ${getSubjectColor(subject)}; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 500;">
                  ${escapeHtml(subject)}
                </span>
              </div>

              <!-- Sender Info -->
              <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; margin-bottom: 20px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="color: #9ca3af; font-size: 13px; padding: 4px 0; width: 80px;">Name</td>
                    <td style="color: #ffffff; font-size: 14px; padding: 4px 0;">${escapeHtml(name)}</td>
                  </tr>
                  <tr>
                    <td style="color: #9ca3af; font-size: 13px; padding: 4px 0;">Email</td>
                    <td style="color: #00d4ff; font-size: 14px; padding: 4px 0;">
                      <a href="mailto:${escapeHtml(email)}" style="color: #00d4ff; text-decoration: none;">${escapeHtml(email)}</a>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Message -->
              <div style="margin-bottom: 10px;">
                <p style="color: #9ca3af; font-size: 13px; margin: 0 0 8px 0;">Message</p>
                <div style="background: rgba(0,0,0,0.2); border-radius: 12px; padding: 16px;">
                  <p style="color: #e5e7eb; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${escapeHtml(message)}</p>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                Sent from ImageLingo Contact Form
              </p>
              <p style="color: #4b5563; font-size: 11px; margin-top: 4px;">
                Reply directly to this email to respond to ${escapeHtml(name)}
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending contact email:', error);
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Message sent successfully',
        id: data?.id
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
