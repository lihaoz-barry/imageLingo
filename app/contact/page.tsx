'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Create mailto link with form data
      const subject = encodeURIComponent(`[ImageLingo] ${formData.subject}: ${formData.name}`);
      const body = encodeURIComponent(
        `Name: ${formData.name}\nEmail: ${formData.email}\nSubject: ${formData.subject}\n\nMessage:\n${formData.message}`
      );

      window.location.href = `mailto:lihaoz0214@gmail.com?subject=${subject}&body=${body}`;

      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch {
      setError('Failed to open email client. Please email us directly at lihaoz0214@gmail.com');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen circuit-pattern">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#9ca3af] hover:text-white transition-colors mb-8"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-white mb-4">Contact Us</h1>
          <p className="text-[#9ca3af] text-lg">
            Have questions, feedback, or need support? We&apos;d love to hear from you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div className="bg-white/5 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
            <h2 className="text-2xl font-semibold text-white mb-6">Send us a Message</h2>

            {submitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-white mb-2">Email Client Opened!</h3>
                <p className="text-[#9ca3af] mb-6">
                  Your default email client should have opened with your message. If not, please email us directly.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-[#d1d5db] mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent transition-all"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[#d1d5db] mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent transition-all"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-[#d1d5db] mb-2">
                    Subject
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent transition-all"
                  >
                    <option value="" className="bg-[#1a1a2e]">Select a topic</option>
                    <option value="General Inquiry" className="bg-[#1a1a2e]">General Inquiry</option>
                    <option value="Technical Support" className="bg-[#1a1a2e]">Technical Support</option>
                    <option value="Billing Question" className="bg-[#1a1a2e]">Billing Question</option>
                    <option value="Feature Request" className="bg-[#1a1a2e]">Feature Request</option>
                    <option value="Bug Report" className="bg-[#1a1a2e]">Bug Report</option>
                    <option value="Partnership" className="bg-[#1a1a2e]">Partnership</option>
                    <option value="Other" className="bg-[#1a1a2e]">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-[#d1d5db] mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent transition-all resize-none"
                    placeholder="How can we help you?"
                  />
                </div>

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-6 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:from-[#7a8ff0] hover:to-[#8a5db5] text-white font-medium rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Opening Email...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Send Message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            <div className="bg-white/5 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
              <h2 className="text-2xl font-semibold text-white mb-6">Get in Touch</h2>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#667eea]/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-[#667eea]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-1">Email</h3>
                    <a
                      href="mailto:lihaoz0214@gmail.com"
                      className="text-[#00d4ff] hover:underline"
                    >
                      lihaoz0214@gmail.com
                    </a>
                    <p className="text-[#9ca3af] text-sm mt-1">
                      We typically respond within 24-48 hours
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#764ba2]/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-[#764ba2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-1">Creator</h3>
                    <p className="text-[#d1d5db]">Barry</p>
                    <p className="text-[#9ca3af] text-sm mt-1">
                      Founder & Developer
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
              <h2 className="text-2xl font-semibold text-white mb-4">FAQ</h2>
              <p className="text-[#9ca3af] mb-6">
                Before reaching out, check if your question is answered below:
              </p>

              <div className="space-y-4">
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer text-white font-medium py-2">
                    How do credits work?
                    <svg className="w-5 h-5 text-[#9ca3af] group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <p className="text-[#9ca3af] text-sm pt-2 pb-4">
                    Each image translation uses 1 credit per variation. New users receive 20 free credits upon signup.
                  </p>
                </details>

                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer text-white font-medium py-2">
                    What image formats are supported?
                    <svg className="w-5 h-5 text-[#9ca3af] group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <p className="text-[#9ca3af] text-sm pt-2 pb-4">
                    We support PNG, JPG, JPEG, GIF, and WebP formats. Maximum file size is 10MB per image.
                  </p>
                </details>

                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer text-white font-medium py-2">
                    How accurate are the translations?
                    <svg className="w-5 h-5 text-[#9ca3af] group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <p className="text-[#9ca3af] text-sm pt-2 pb-4">
                    We use Google&apos;s Gemini AI for translations, which provides high accuracy for most languages. We recommend reviewing translations for critical use cases.
                  </p>
                </details>

                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer text-white font-medium py-2">
                    Is my data secure?
                    <svg className="w-5 h-5 text-[#9ca3af] group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <p className="text-[#9ca3af] text-sm pt-2 pb-4">
                    Yes! We use industry-standard encryption and security practices. Your images are stored securely and you can delete them at any time. See our{' '}
                    <Link href="/privacy" className="text-[#00d4ff] hover:underline">Privacy Policy</Link> for details.
                  </p>
                </details>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-white/10 text-center text-[#9ca3af]">
          <p>&copy; {new Date().getFullYear()} ImageLingo. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
