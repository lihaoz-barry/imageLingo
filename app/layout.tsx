import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { FeedbackButton } from "@/components/FeedbackButton";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ImageLingo - AI-Powered OCR & Image Translation Tool | Extract & Translate Text from Images",
  description: "Extract and translate text from images instantly with ImageLingo. AI-powered OCR and translation tool supporting 10+ languages. Free image text extraction, document translation, and multilingual image processing.",
  keywords: [
    "ImageLingo",
    "image translation",
    "OCR",
    "optical character recognition",
    "text extraction",
    "image to text",
    "translate images",
    "multilingual OCR",
    "document translation",
    "image text translator",
    "AI translation",
    "photo translator",
    "extract text from image",
    "image localization",
    "translate pictures",
  ],
  authors: [{ name: "ImageLingo Team" }],
  creator: "ImageLingo",
  publisher: "ImageLingo",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://imagelingo.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: "ImageLingo - AI-Powered OCR & Image Translation",
    description: "Extract and translate text from images instantly. AI-powered OCR supporting 10+ languages for free.",
    siteName: "ImageLingo",
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'ImageLingo - AI-Powered Image Translation',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "ImageLingo - AI-Powered OCR & Image Translation",
    description: "Extract and translate text from images instantly. AI-powered OCR supporting 10+ languages.",
    images: ['/twitter-image'],
    creator: '@imagelingo',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification codes when available
    // google: 'google-site-verification-code',
    // yandex: 'yandex-verification-code',
    // bing: 'bing-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'ImageLingo',
    description: 'AI-powered OCR and image translation tool supporting 10+ languages',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://imagelingo.vercel.app',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Image text extraction (OCR)',
      'Multi-language translation',
      'Support for 10+ languages',
      'AI-powered processing',
      'Instant results',
    ],
    screenshot: '/opengraph-image',
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          {children}
          <FeedbackButton />
        </AuthProvider>
        <Toaster position="top-center" richColors />
        <Analytics />
      </body>
    </html>
  );
}
