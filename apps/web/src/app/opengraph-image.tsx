import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'NDL古典籍OCR - AI技術を活用した高精度な古典籍文字認識システム'
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
          padding: '48px',
        }}
      >
        <div
          style={{
            fontSize: 80,
            fontWeight: 'bold',
            color: 'white',
            marginBottom: 24,
            textAlign: 'center',
            textShadow: '0 4px 8px rgba(0,0,0,0.3)',
          }}
        >
          NDL古典籍OCR
        </div>
        <div
          style={{
            fontSize: 36,
            color: 'rgba(255,255,255,0.95)',
            textAlign: 'center',
            maxWidth: '80%',
            lineHeight: 1.4,
          }}
        >
          AI技術を活用した高精度な古典籍文字認識システム
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 48,
            gap: 32,
          }}
        >
          <div
            style={{
              fontSize: 120,
              color: 'rgba(255,255,255,0.2)',
            }}
          >
            文
          </div>
          <div
            style={{
              fontSize: 120,
              color: 'rgba(255,255,255,0.2)',
            }}
          >
            字
          </div>
          <div
            style={{
              fontSize: 120,
              color: 'rgba(255,255,255,0.2)',
            }}
          >
            認
          </div>
          <div
            style={{
              fontSize: 120,
              color: 'rgba(255,255,255,0.2)',
            }}
          >
            識
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}