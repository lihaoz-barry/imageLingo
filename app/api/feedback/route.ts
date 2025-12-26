import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, feedback } = body;

    // Validate that feedback is not empty
    if (!feedback || feedback.trim() === '') {
      return NextResponse.json(
        { error: 'Feedback is required' },
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

    // Get recipient email from environment variable or use placeholder
    const recipientEmail = process.env.FEEDBACK_EMAIL || 'feedback@imagelingo.com';

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'ImageLingo Feedback <onboarding@resend.dev>',
      to: [recipientEmail],
      subject: 'New Feedback from ImageLingo',
      html: `
        <h2>New Feedback Received</h2>
        <p><strong>From:</strong> ${name || 'Anonymous'}</p>
        ${email ? `<p><strong>Email:</strong> ${email}</p>` : ''}
        <p><strong>Feedback:</strong></p>
        <p>${feedback.replace(/\n/g, '<br>')}</p>
        <hr>
        <p style="color: #888; font-size: 12px;">Sent from ImageLingo Feedback Form</p>
      `,
    });

    if (error) {
      console.error('Error sending email:', error);
      return NextResponse.json(
        { error: 'Failed to send feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: true,
        message: 'Feedback sent successfully',
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
