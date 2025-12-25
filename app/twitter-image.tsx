import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'ImageLingo - AI-Powered OCR & Image Translation'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '24px',
            padding: '60px 80px',
            backdropFilter: 'blur(10px)',
          }}
        >
          <h1
            style={{
              fontSize: '72px',
              fontWeight: 'bold',
              color: 'white',
              margin: 0,
              marginBottom: '24px',
              textAlign: 'center',
            }}
          >
            ImageLingo
          </h1>
          <p
            style={{
              fontSize: '36px',
              color: 'rgba(255, 255, 255, 0.9)',
              margin: 0,
              textAlign: 'center',
              maxWidth: '900px',
            }}
          >
            AI-Powered OCR & Image Translation
          </p>
          <p
            style={{
              fontSize: '28px',
              color: 'rgba(255, 255, 255, 0.8)',
              margin: 0,
              marginTop: '24px',
              textAlign: 'center',
            }}
          >
            Extract & Translate Text from Images
          </p>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}

