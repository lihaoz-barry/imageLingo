import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us | ImageLingo',
  description: 'Get in touch with ImageLingo. Contact us for support, feedback, partnership inquiries, or any questions about our AI-powered image translation service.',
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
