import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | ImageLingo',
  description: 'Terms of Service for ImageLingo - Read our terms and conditions for using the AI-powered image translation service.',
};

export default function TermsOfService() {
  const lastUpdated = 'December 24, 2024';

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
          <h1 className="text-4xl font-bold text-white mb-4">Terms of Service</h1>
          <p className="text-[#9ca3af]">Last updated: {lastUpdated}</p>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none space-y-8">
          <section className="bg-white/5 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
            <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-[#d1d5db] leading-relaxed">
              By accessing or using ImageLingo (&quot;the Service&quot;), you agree to be bound by these Terms of Service
              (&quot;Terms&quot;). If you do not agree to these Terms, please do not use the Service.
            </p>
            <p className="text-[#d1d5db] leading-relaxed mt-4">
              These Terms apply to all visitors, users, and others who access or use the Service. We reserve the
              right to modify these Terms at any time. Your continued use of the Service following any changes
              indicates your acceptance of the new Terms.
            </p>
          </section>

          <section className="bg-white/5 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
            <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
            <p className="text-[#d1d5db] leading-relaxed">
              ImageLingo is an AI-powered image translation service that allows users to:
            </p>
            <ul className="list-disc list-inside text-[#d1d5db] space-y-2 mt-4">
              <li>Upload images containing text</li>
              <li>Extract text from images using optical character recognition (OCR)</li>
              <li>Translate extracted text into multiple languages</li>
              <li>Generate translated versions of the original images</li>
              <li>Download and manage translated images</li>
            </ul>
          </section>

          <section className="bg-white/5 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
            <h2 className="text-2xl font-semibold text-white mb-4">3. User Accounts</h2>

            <h3 className="text-xl font-medium text-white mt-6 mb-3">3.1 Account Creation</h3>
            <p className="text-[#d1d5db] leading-relaxed">
              To use certain features of the Service, you must create an account. You agree to provide accurate,
              current, and complete information during the registration process and to update such information
              as necessary.
            </p>

            <h3 className="text-xl font-medium text-white mt-6 mb-3">3.2 Account Security</h3>
            <p className="text-[#d1d5db] leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials and for all
              activities that occur under your account. You agree to notify us immediately of any unauthorized
              use of your account.
            </p>

            <h3 className="text-xl font-medium text-white mt-6 mb-3">3.3 Account Termination</h3>
            <p className="text-[#d1d5db] leading-relaxed">
              We reserve the right to suspend or terminate your account at any time for any reason, including
              violation of these Terms. You may also delete your account at any time through the Service.
            </p>
          </section>

          <section className="bg-white/5 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
            <h2 className="text-2xl font-semibold text-white mb-4">4. Credits and Payments</h2>

            <h3 className="text-xl font-medium text-white mt-6 mb-3">4.1 Credit System</h3>
            <p className="text-[#d1d5db] leading-relaxed">
              The Service operates on a credit-based system. Each image translation consumes credits based on
              the number of variations requested. New users receive complimentary credits upon registration.
            </p>

            <h3 className="text-xl font-medium text-white mt-6 mb-3">4.2 Purchasing Credits</h3>
            <p className="text-[#d1d5db] leading-relaxed">
              Additional credits may be purchased through the Service. All payments are processed securely
              through our payment providers. Prices are subject to change with notice.
            </p>

            <h3 className="text-xl font-medium text-white mt-6 mb-3">4.3 Refunds</h3>
            <p className="text-[#d1d5db] leading-relaxed">
              Credits are non-refundable except where required by law. If you experience technical issues
              that result in lost credits, please contact us for assistance.
            </p>
          </section>

          <section className="bg-white/5 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
            <h2 className="text-2xl font-semibold text-white mb-4">5. Acceptable Use</h2>
            <p className="text-[#d1d5db] leading-relaxed mb-4">
              You agree not to use the Service to:
            </p>
            <ul className="list-disc list-inside text-[#d1d5db] space-y-2">
              <li>Upload content that is illegal, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable</li>
              <li>Upload content that infringes on intellectual property rights of others</li>
              <li>Upload content containing malware, viruses, or harmful code</li>
              <li>Attempt to gain unauthorized access to the Service or its systems</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Use the Service for any illegal purpose</li>
              <li>Resell or redistribute the Service without authorization</li>
              <li>Use automated systems to access the Service in a manner that exceeds reasonable use</li>
              <li>Upload images containing sensitive personal information of others without consent</li>
            </ul>
          </section>

          <section className="bg-white/5 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
            <h2 className="text-2xl font-semibold text-white mb-4">6. Intellectual Property</h2>

            <h3 className="text-xl font-medium text-white mt-6 mb-3">6.1 Your Content</h3>
            <p className="text-[#d1d5db] leading-relaxed">
              You retain all rights to the images you upload. By uploading images, you grant us a limited,
              non-exclusive license to process, store, and display your images solely for the purpose of
              providing the Service.
            </p>

            <h3 className="text-xl font-medium text-white mt-6 mb-3">6.2 Our Content</h3>
            <p className="text-[#d1d5db] leading-relaxed">
              The Service, including its design, features, and content, is owned by ImageLingo and is protected
              by copyright, trademark, and other intellectual property laws. You may not copy, modify, or
              distribute any part of the Service without our written permission.
            </p>

            <h3 className="text-xl font-medium text-white mt-6 mb-3">6.3 Translated Content</h3>
            <p className="text-[#d1d5db] leading-relaxed">
              You own the translated images generated by the Service from your original content. We claim no
              ownership rights over the output generated from your images.
            </p>
          </section>

          <section className="bg-white/5 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
            <h2 className="text-2xl font-semibold text-white mb-4">7. AI-Generated Content</h2>
            <p className="text-[#d1d5db] leading-relaxed">
              The Service uses artificial intelligence to process and translate images. You acknowledge that:
            </p>
            <ul className="list-disc list-inside text-[#d1d5db] space-y-2 mt-4">
              <li>AI translations may not be 100% accurate and should be reviewed before use in critical applications</li>
              <li>The quality of output depends on the quality and clarity of input images</li>
              <li>We are not responsible for errors in AI-generated translations</li>
              <li>You are responsible for verifying the accuracy of translations for your intended use</li>
            </ul>
          </section>

          <section className="bg-white/5 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
            <h2 className="text-2xl font-semibold text-white mb-4">8. Disclaimer of Warranties</h2>
            <p className="text-[#d1d5db] leading-relaxed">
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS
              OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
              PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p className="text-[#d1d5db] leading-relaxed mt-4">
              We do not warrant that the Service will be uninterrupted, error-free, or secure. We do not warrant
              the accuracy or reliability of any translations or results obtained through the Service.
            </p>
          </section>

          <section className="bg-white/5 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
            <h2 className="text-2xl font-semibold text-white mb-4">9. Limitation of Liability</h2>
            <p className="text-[#d1d5db] leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, IMAGELINGO AND ITS OPERATORS SHALL NOT BE LIABLE FOR ANY
              INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR
              REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER
              INTANGIBLE LOSSES.
            </p>
            <p className="text-[#d1d5db] leading-relaxed mt-4">
              Our total liability for any claims arising from or relating to these Terms or the Service shall
              not exceed the amount you paid us in the twelve (12) months preceding the claim.
            </p>
          </section>

          <section className="bg-white/5 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
            <h2 className="text-2xl font-semibold text-white mb-4">10. Indemnification</h2>
            <p className="text-[#d1d5db] leading-relaxed">
              You agree to indemnify and hold harmless ImageLingo and its operators from any claims, damages,
              losses, liabilities, and expenses (including legal fees) arising from your use of the Service,
              your violation of these Terms, or your violation of any rights of a third party.
            </p>
          </section>

          <section className="bg-white/5 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
            <h2 className="text-2xl font-semibold text-white mb-4">11. Third-Party Services</h2>
            <p className="text-[#d1d5db] leading-relaxed">
              The Service integrates with third-party services including Google Gemini AI, Supabase, and Vercel.
              Your use of these third-party services is subject to their respective terms and privacy policies.
              We are not responsible for the practices of third-party services.
            </p>
          </section>

          <section className="bg-white/5 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
            <h2 className="text-2xl font-semibold text-white mb-4">12. Governing Law</h2>
            <p className="text-[#d1d5db] leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction
              in which the Service operator resides, without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="bg-white/5 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
            <h2 className="text-2xl font-semibold text-white mb-4">13. Dispute Resolution</h2>
            <p className="text-[#d1d5db] leading-relaxed">
              Any disputes arising from these Terms or the Service shall first be attempted to be resolved
              through good-faith negotiation. If negotiation fails, disputes shall be resolved through binding
              arbitration in accordance with applicable arbitration rules.
            </p>
          </section>

          <section className="bg-white/5 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
            <h2 className="text-2xl font-semibold text-white mb-4">14. Severability</h2>
            <p className="text-[#d1d5db] leading-relaxed">
              If any provision of these Terms is found to be unenforceable or invalid, that provision shall be
              limited or eliminated to the minimum extent necessary so that the remaining provisions of these
              Terms shall remain in full force and effect.
            </p>
          </section>

          <section className="bg-white/5 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
            <h2 className="text-2xl font-semibold text-white mb-4">15. Changes to Terms</h2>
            <p className="text-[#d1d5db] leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify users of significant changes
              by posting a notice on the Service or sending an email. Your continued use of the Service after
              changes are posted constitutes your acceptance of the modified Terms.
            </p>
          </section>

          <section className="bg-white/5 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
            <h2 className="text-2xl font-semibold text-white mb-4">16. Contact Information</h2>
            <p className="text-[#d1d5db] leading-relaxed">
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <div className="mt-4 text-[#d1d5db]">
              <p><strong>Barry</strong></p>
              <p>Email:{' '}
                <a href="mailto:lihaoz0214@gmail.com" className="text-[#00d4ff] hover:underline">
                  lihaoz0214@gmail.com
                </a>
              </p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-white/10 text-center text-[#9ca3af]">
          <p>&copy; {new Date().getFullYear()} ImageLingo. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
