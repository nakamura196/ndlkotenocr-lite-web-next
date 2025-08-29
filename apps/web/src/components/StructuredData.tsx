export default function StructuredData({ locale }: { locale: string }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nkol.vercel.app'
  
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: locale === 'ja' ? 'NDL古典籍OCR' : 'NDL Classical Text OCR',
    description: locale === 'ja' 
      ? 'AI技術を活用した高精度な古典籍文字認識システム'
      : 'High-precision classical text recognition system using AI technology',
    url: siteUrl,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'JPY'
    },
    author: {
      '@type': 'Organization',
      name: 'National Diet Library',
      url: 'https://www.ndl.go.jp/'
    },
    provider: {
      '@type': 'Organization',
      name: 'National Diet Library',
      url: 'https://www.ndl.go.jp/'
    },
    featureList: locale === 'ja'
      ? [
          '高精度な古典籍文字認識',
          'IIIF Manifest対応',
          'ブラウザ上でのOCR処理',
          'サーバーサイドOCR処理',
          '複数画像の一括処理'
        ]
      : [
          'High-precision classical text recognition',
          'IIIF Manifest support',
          'Browser-based OCR processing',
          'Server-side OCR processing',
          'Batch processing of multiple images'
        ],
    screenshot: `${siteUrl}/og-image.png`,
    inLanguage: locale === 'ja' ? 'ja-JP' : 'en-US',
    isAccessibleForFree: true,
    isFamilyFriendly: true
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}