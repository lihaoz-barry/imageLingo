import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ImageLingo - AI-Powered OCR & Image Translation',
    short_name: 'ImageLingo',
    description: 'Extract and translate text from images instantly with AI-powered OCR',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#667eea',
    icons: [
      {
        src: '/icon',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}
