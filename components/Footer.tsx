'use client';

import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full py-6 pb-24 lg:pb-6 px-4 border-t border-white/10 bg-black/20 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-4">
        {/* Logo and Copyright */}
        <div className="flex flex-col sm:flex-row items-center gap-2 text-center">
          <Link href="/" className="text-lg font-semibold bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent hover:opacity-80 transition-opacity">
            ImageLingo
          </Link>
          <span className="text-[#9ca3af] text-sm">
            &copy; {currentYear} All rights reserved.
          </span>
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-[#9ca3af]">
          <Link
            href="/privacy"
            className="hover:text-white transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="hover:text-white transition-colors"
          >
            Terms of Service
          </Link>
          <Link
            href="/contact"
            className="hover:text-white transition-colors"
          >
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}

