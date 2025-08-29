import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale })
  
  const title = t('title')
  const description = t('subtitle')
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nkol.vercel.app'
  const currentUrl = `${siteUrl}/${locale}`
  
  return {
    title: {
      default: title,
      template: `%s | ${title}`
    },
    description,
    keywords: locale === 'ja' 
      ? ['NDL', '古典籍', 'OCR', '文字認識', 'AI', '機械学習', '国立国会図書館', 'IIIF', 'デジタルアーカイブ']
      : ['NDL', 'Classical texts', 'OCR', 'Text recognition', 'AI', 'Machine learning', 'National Diet Library', 'IIIF', 'Digital archive'],
    authors: [{ name: 'National Diet Library' }],
    creator: 'National Diet Library',
    publisher: 'National Diet Library',
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: currentUrl,
      languages: {
        'ja': `${siteUrl}/ja`,
        'en': `${siteUrl}/en`
      }
    },
    openGraph: {
      type: 'website',
      locale: locale === 'ja' ? 'ja_JP' : 'en_US',
      alternateLocale: locale === 'ja' ? 'en_US' : 'ja_JP',
      title,
      description,
      url: currentUrl,
      siteName: title,
      images: [
        {
          url: `${siteUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: title
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${siteUrl}/og-image.png`],
      creator: '@NDLJP',
      site: '@NDLJP'
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1
      }
    },
    viewport: {
      width: 'device-width',
      initialScale: 1,
      maximumScale: 5
    },
    applicationName: title,
    category: 'technology',
    classification: locale === 'ja' ? 'OCR, 文字認識, デジタルアーカイブ' : 'OCR, Text Recognition, Digital Archive',
    icons: {
      icon: '/icon.png',
      shortcut: '/favicon.ico',
      apple: '/apple-icon.png',
      other: [
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '32x32',
          url: '/icon-32x32.png',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '16x16',
          url: '/icon-16x16.png',
        },
      ],
    },
    manifest: '/manifest.json'
  }
}