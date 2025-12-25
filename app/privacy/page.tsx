import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | ImageLingo',
  description: 'Privacy Policy for ImageLingo - Learn how we collect, use, and protect your personal information.',
};

export default function PrivacyPolicy() {
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
          <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-[#9ca3af]">Last updated: {lastUpdated}</p>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none space-y-8">
          <section className="bg-white/5 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
            <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
            <p className="text-[#d1d5db] leading-relaxed">
              Welcome to ImageLingo (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your privacy
              and ensuring the security of your personal information. This Privacy Policy explains how we collect,
              use, disclose, and safeguard your information when you use our AI-powered image translation service.
            </p>
            <p className="text-[#d1d5db] leading-relaxed mt-4">
              By using ImageLingo, you agree to the collection and use of information in accordance with this policy.
            </p>
          </section>

          <section className="bg-white/5 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
            <h2 className="text-2xl font-semibold text-white mb-4">2. Information We Collect</h2>

            <h3 className="text-xl font-medium text-white mt-6 mb-3">2.1 Information You Provide</h3>
            <ul className="list-disc list-inside text-[#d1d5db] space-y-2">
              <li><strong>Account Information:</strong> Email address and authentication credentials when you create an account</li>
              <li><strong>Images:</strong> Images you upload for translation processing</li>
              <li><strong>Preferences:</strong> Language preferences and translation settings</li>
              <li><strong>Communications:</strong> Information you provide when contacting us for support</li>
            </ul>

            <h3 className="text-xl font-medium text-white mt-6 mb-3">2.2 Automatically Collected Information</h3>
            <ul className="list-disc list-inside text-[#d1d5db] space-y-2">
              <li><strong>Usage Data:</strong> Information about how you interact with our service</li>
              <li><strong>Device Information:</strong> Browser type, operating system, and device identifiers</li>
              <li><strong>Log Data:</strong> IP address, access times, and pages viewed</li>
              <li><strong>Cookies:</strong> Session cookies for authentication and preferences</li>
            </ul>
          </section>

          <section className="bg-white/5 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
            <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
            <p className="text-[#d1d5db] leading-relaxed mb-4">We use the collected information for the following purposes:</p>
            <ul className="list-disc list-inside text-[#d1d5db] space-y-2">
              <li>To provide and maintain our image translation service</li>
              <li>To process your images using AI technology for text extraction and translation</li>
              <li>To manage your account and provide customer support</li>
              <li>To save your preferences and improve your user experience</li>
              <li>To send service-related notifications and updates</li>
              <li>To analyze usage patterns and improve our service</li>
              <li>To detect, prevent, and address technical issues or fraud</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section className="bg-white/5 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
            <h2 className="text-2xl font-semibold text-white mb-4">4. Image Processing and Storage</h2>
            <p className="text-[#d1d5db] leading-relaxed mb-4">
              When you upload images to ImageLingo:
            </p>
            <ul className="list-disc list-inside text-[#d1d5db] space-y-2">
              <li>Images are processed using Google&apos;s Gemini AI for text extraction and translation</li>
              <li>Uploaded images are stored securely in Supabase cloud storage</li>
              <li>Translated images are associated with your account for history access</li>
              <li>You can delete your images and translation history at any time</li>
              <li>We do not use your images to train AI models without explicit consent</li>
            </ul>
          </section>

          <section className="bg-white/5 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
            <h2 className="text-2xl font-semibold text-white mb-4">5. Data Sharing and Disclosure</h2>
            <p className="text-[#d1d5db] leading-relaxed mb-4">
              We do not sell your personal information. We may share your information only in the following circumstances:
            </p>
            <ul className="list-disc list-inside text-[#d1d5db] space-y-2">
              <li><strong>Service Providers:</strong> With third-party services that help us operate (Supabase for database/storage, Google for AI processing, Vercel for hosting)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              <li><strong>With Your Consent:</strong> When you have given us explicit permission</li>
            </ul>
          </section>

          <section className="bg-white/5 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
            <h2 className="text-2xl font-semibold text-white mb-4">6. Data Security</h2>
            <p className="text-[#d1d5db] leading-relaxed">
              We implement industry-standard security measures to protect your information, including:
            </p>
            <ul className="list-disc list-inside text-[#d1d5db] space-y-2 mt-4">
              <li>Encryption of data in transit using HTTPS/TLS</li>
              <li>Secure authentication through Supabase Auth</li>
              <li>Row-level security policies for database access</li>
              <li>Regular security audits and monitoring</li>
            </ul>
            <p className="text-[#d1d5db] leading-relaxed mt-4">
              However, no method of transmission over the Internet is 100% secure. While we strive to protect your
              personal information, we cannot guarantee its absolute security.
            </p>
          </section>

          <section className="bg-white/5 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
            <h2 className="text-2xl font-semibold text-white mb-4">7. Your Rights and Choices</h2>
            <p className="text-[#d1d5db] leading-relaxed mb-4">You have the following rights regarding your personal information:</p>
            <ul className="list-disc list-inside text-[#d1d5db] space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Request correction of inaccurate data</li>
              <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
              <li><strong>Export:</strong> Request a portable copy of your data</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
            </ul>
            <p className="text-[#d1d5db] leading-relaxed mt-4">
              To exercise these rights, please contact us at{' '}
              <a href="mailto:lihaoz0214@gmail.com" className="text-[#00d4ff] hover:underline">
                lihaoz0214@gmail.com
              </a>
            </p>
          </section>

          <section className="bg-white/5 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
            <h2 className="text-2xl font-semibold text-white mb-4">8. Cookies and Tracking</h2>
            <p className="text-[#d1d5db] leading-relaxed">
              We use essential cookies for authentication and maintaining your session. These cookies are necessary
              for the service to function properly. We do not use third-party tracking cookies for advertising purposes.
            </p>
          </section>

          <section className="bg-white/5 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
            <h2 className="text-2xl font-semibold text-white mb-4">9. Children&apos;s Privacy</h2>
            <p className="text-[#d1d5db] leading-relaxed">
              ImageLingo is not intended for children under 13 years of age. We do not knowingly collect personal
              information from children under 13. If you are a parent or guardian and believe your child has provided
              us with personal information, please contact us immediately.
            </p>
          </section>

          <section className="bg-white/5 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
            <h2 className="text-2xl font-semibold text-white mb-4">10. International Data Transfers</h2>
            <p className="text-[#d1d5db] leading-relaxed">
              Your information may be transferred to and processed in countries other than your country of residence.
              These countries may have different data protection laws. By using our service, you consent to the
              transfer of your information to these countries.
            </p>
          </section>

          <section className="bg-white/5 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
            <h2 className="text-2xl font-semibold text-white mb-4">11. Changes to This Policy</h2>
            <p className="text-[#d1d5db] leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the
              new Privacy Policy on this page and updating the &quot;Last updated&quot; date. You are advised to review this
              Privacy Policy periodically for any changes.
            </p>
          </section>

          <section className="bg-white/5 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
            <h2 className="text-2xl font-semibold text-white mb-4">12. Contact Us</h2>
            <p className="text-[#d1d5db] leading-relaxed">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
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
