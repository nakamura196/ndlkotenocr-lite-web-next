'use client'

import { useEffect, useState } from 'react'
import { Link } from '@/i18n/routing'
import { useTranslations } from 'next-intl'

declare global {
  interface Window {
    SwaggerUIBundle: any;
    SwaggerUIStandalonePreset: any;
  }
}

export default function ApiDocsPage() {
  const [isLoaded, setIsLoaded] = useState(false)
  const t = useTranslations('api')

  useEffect(() => {
    // Swagger UIのCSS/JSを動的に読み込み
    const loadSwaggerUI = async () => {
      if (typeof window === 'undefined') return

      // CSS読み込み
      const cssLink = document.createElement('link')
      cssLink.rel = 'stylesheet'
      cssLink.href = 'https://unpkg.com/swagger-ui-dist@5.12.0/swagger-ui.css'
      document.head.appendChild(cssLink)

      // JS読み込み
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/swagger-ui-dist@5.12.0/swagger-ui-bundle.js'
      script.onload = () => {
        // StandalonePreset用のスクリプトも読み込む
        const presetScript = document.createElement('script')
        presetScript.src = 'https://unpkg.com/swagger-ui-dist@5.12.0/swagger-ui-standalone-preset.js'
        presetScript.onload = () => {
          if (window.SwaggerUIBundle && window.SwaggerUIStandalonePreset) {
            // Swagger UIを初期化
            window.SwaggerUIBundle({
              url: '/api/docs/openapi.json',
              dom_id: '#swagger-ui',
              deepLinking: true,
              presets: [
                window.SwaggerUIBundle.presets.apis,
                window.SwaggerUIStandalonePreset
              ],
              plugins: [
                window.SwaggerUIBundle.plugins.DownloadUrl
              ],
              layout: 'BaseLayout', // StandaloneLayoutではなくBaseLayoutを使用
              configUrl: undefined,
              onComplete: () => {
                // ダークモード対応のスタイルを適用
                const isDarkMode = document.documentElement.classList.contains('dark')
                if (isDarkMode) {
                  const swaggerUIWrapper = document.querySelector('.swagger-ui')
                  if (swaggerUIWrapper) {
                    swaggerUIWrapper.classList.add('dark-theme')
                  }
                }
              },
              defaultModelsExpandDepth: 1,
              defaultModelRendering: 'example',
              displayOperationId: false,
              displayRequestDuration: true,
              docExpansion: 'list',
              filter: true,
              showExtensions: true,
              showCommonExtensions: true,
              tryItOutEnabled: true,
            })
            setIsLoaded(true)
          }
        }
        document.head.appendChild(presetScript)
      }
      document.head.appendChild(script)
    }

    loadSwaggerUI()

    // クリーンアップ
    return () => {
      const existingScript = document.querySelector('script[src*="swagger-ui-bundle.js"]')
      const existingPreset = document.querySelector('script[src*="swagger-ui-standalone-preset.js"]')
      const existingCSS = document.querySelector('link[href*="swagger-ui.css"]')
      if (existingScript) existingScript.remove()
      if (existingPreset) existingPreset.remove()
      if (existingCSS) existingCSS.remove()
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page title */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {t('subtitle')}
          </p>
          <div className="mt-4 flex justify-center gap-4">
            <Link
              href="/"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              {t('backToApp')}
            </Link>
            <a
              href="/api/docs/openapi.json"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
            >
              {t('openApiJson')}
            </a>
          </div>
        </div>

        {/* Loading state */}
        {!isLoaded && (
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">
                {t('loading')}
              </p>
            </div>
          </div>
        )}

        {/* Swagger UI Container */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
          <div 
            id="swagger-ui" 
            className={!isLoaded ? 'hidden' : ''}
          />
        </div>
        
        {/* Dark mode styles for Swagger UI */}
        <style jsx global>{`
          .dark .swagger-ui,
          .dark-theme.swagger-ui {
            background: transparent;
          }
          
          .dark .swagger-ui .opblock.opblock-get .opblock-summary-method,
          .dark-theme.swagger-ui .opblock.opblock-get .opblock-summary-method {
            background: #10b981;
          }
          
          .dark .swagger-ui .opblock.opblock-post .opblock-summary-method,
          .dark-theme.swagger-ui .opblock.opblock-post .opblock-summary-method {
            background: #3b82f6;
          }
          
          .dark .swagger-ui .opblock-summary,
          .dark-theme.swagger-ui .opblock-summary {
            border-color: #4b5563;
            background: #374151;
          }
          
          .dark .swagger-ui .opblock-summary:hover,
          .dark-theme.swagger-ui .opblock-summary:hover {
            background: #4b5563;
          }
          
          .dark .swagger-ui .opblock,
          .dark-theme.swagger-ui .opblock {
            border-color: #4b5563;
            background: #1f2937;
          }
          
          .dark .swagger-ui .opblock-description-wrapper,
          .dark .swagger-ui .opblock-body,
          .dark-theme.swagger-ui .opblock-description-wrapper,
          .dark-theme.swagger-ui .opblock-body {
            background: #111827;
          }
          
          .dark .swagger-ui .btn,
          .dark-theme.swagger-ui .btn {
            background: #4b5563;
            color: #e5e7eb;
            border-color: #6b7280;
          }
          
          .dark .swagger-ui .btn:hover,
          .dark-theme.swagger-ui .btn:hover {
            background: #6b7280;
          }
          
          .dark .swagger-ui .btn.execute,
          .dark-theme.swagger-ui .btn.execute {
            background: #3b82f6;
            color: white;
            border-color: #2563eb;
          }
          
          .dark .swagger-ui .btn.execute:hover,
          .dark-theme.swagger-ui .btn.execute:hover {
            background: #2563eb;
          }
          
          .dark .swagger-ui select,
          .dark .swagger-ui input[type=text],
          .dark .swagger-ui input[type=password],
          .dark .swagger-ui input[type=search],
          .dark .swagger-ui input[type=email],
          .dark .swagger-ui input[type=file],
          .dark .swagger-ui textarea,
          .dark-theme.swagger-ui select,
          .dark-theme.swagger-ui input[type=text],
          .dark-theme.swagger-ui input[type=password],
          .dark-theme.swagger-ui input[type=search],
          .dark-theme.swagger-ui input[type=email],
          .dark-theme.swagger-ui input[type=file],
          .dark-theme.swagger-ui textarea {
            background: #374151;
            color: #f3f4f6;
            border-color: #4b5563;
          }
          
          .dark .swagger-ui .info .title,
          .dark .swagger-ui .scheme-container,
          .dark .swagger-ui h3,
          .dark .swagger-ui h4,
          .dark .swagger-ui h5,
          .dark .swagger-ui label,
          .dark .swagger-ui .opblock-summary-description,
          .dark .swagger-ui .opblock-summary-path,
          .dark .swagger-ui .opblock-summary-path__deprecated,
          .dark .swagger-ui .opblock-section-header h4,
          .dark .swagger-ui .parameter__name,
          .dark .swagger-ui .parameter__name.required span,
          .dark .swagger-ui .response-col_status,
          .dark .swagger-ui .response-col_description,
          .dark .swagger-ui table thead tr th,
          .dark .swagger-ui table thead tr td,
          .dark .swagger-ui .model-title,
          .dark .swagger-ui .model,
          .dark .swagger-ui .property,
          .dark-theme.swagger-ui .info .title,
          .dark-theme.swagger-ui .scheme-container,
          .dark-theme.swagger-ui h3,
          .dark-theme.swagger-ui h4,
          .dark-theme.swagger-ui h5,
          .dark-theme.swagger-ui label,
          .dark-theme.swagger-ui .opblock-summary-description,
          .dark-theme.swagger-ui .opblock-summary-path,
          .dark-theme.swagger-ui .opblock-summary-path__deprecated,
          .dark-theme.swagger-ui .opblock-section-header h4,
          .dark-theme.swagger-ui .parameter__name,
          .dark-theme.swagger-ui .parameter__name.required span,
          .dark-theme.swagger-ui .response-col_status,
          .dark-theme.swagger-ui .response-col_description,
          .dark-theme.swagger-ui table thead tr th,
          .dark-theme.swagger-ui table thead tr td,
          .dark-theme.swagger-ui .model-title,
          .dark-theme.swagger-ui .model,
          .dark-theme.swagger-ui .property {
            color: #f3f4f6;
          }
          
          .dark .swagger-ui .info .description,
          .dark .swagger-ui .info .link,
          .dark .swagger-ui .operation-filter-input,
          .dark .swagger-ui .parameter__type,
          .dark .swagger-ui .prop-type,
          .dark .swagger-ui .parameter__deprecated,
          .dark .swagger-ui .parameter__in,
          .dark .swagger-ui .validation-message,
          .dark .swagger-ui .response-col_links,
          .dark-theme.swagger-ui .info .description,
          .dark-theme.swagger-ui .info .link,
          .dark-theme.swagger-ui .operation-filter-input,
          .dark-theme.swagger-ui .parameter__type,
          .dark-theme.swagger-ui .prop-type,
          .dark-theme.swagger-ui .parameter__deprecated,
          .dark-theme.swagger-ui .parameter__in,
          .dark-theme.swagger-ui .validation-message,
          .dark-theme.swagger-ui .response-col_links {
            color: #d1d5db;
          }
          
          .dark .swagger-ui .model-box,
          .dark .swagger-ui .model-container,
          .dark-theme.swagger-ui .model-box,
          .dark-theme.swagger-ui .model-container {
            background: #1f2937;
            border-color: #4b5563;
          }
          
          .dark .swagger-ui .prop-format,
          .dark-theme.swagger-ui .prop-format {
            color: #9ca3af;
          }
          
          .dark .swagger-ui table.responses-table tbody tr td,
          .dark-theme.swagger-ui table.responses-table tbody tr td {
            border-color: #4b5563;
          }
          
          .dark .swagger-ui .response-control-media-type__accept-message,
          .dark-theme.swagger-ui .response-control-media-type__accept-message {
            color: #d1d5db;
          }
          
          .dark .swagger-ui .responses-inner,
          .dark-theme.swagger-ui .responses-inner {
            background: #111827;
            border-color: #374151;
          }
          
          .dark .swagger-ui .copy-to-clipboard,
          .dark-theme.swagger-ui .copy-to-clipboard {
            background: #4b5563;
          }
          
          .dark .swagger-ui .copy-to-clipboard button,
          .dark-theme.swagger-ui .copy-to-clipboard button {
            background: #6b7280;
            color: #f3f4f6;
          }
          
          .dark .swagger-ui .highlight-code > .microlight,
          .dark-theme.swagger-ui .highlight-code > .microlight {
            background: #1f2937 !important;
            color: #f3f4f6 !important;
          }
          
          .dark .swagger-ui .example,
          .dark .swagger-ui .response-body,
          .dark-theme.swagger-ui .example,
          .dark-theme.swagger-ui .response-body {
            background: #1f2937;
            color: #f3f4f6;
          }
          
          .dark .swagger-ui .tab li button,
          .dark-theme.swagger-ui .tab li button {
            color: #d1d5db;
            background: transparent;
          }
          
          .dark .swagger-ui .tab li button.active,
          .dark-theme.swagger-ui .tab li button.active {
            background: #374151;
            color: #f3f4f6;
          }
          
          .dark .swagger-ui .parameters-col_description,
          .dark-theme.swagger-ui .parameters-col_description {
            color: #d1d5db;
          }
          
          .dark .swagger-ui table tbody tr td,
          .dark-theme.swagger-ui table tbody tr td {
            border-color: #374151;
            color: #e5e7eb;
          }
          
          .dark .swagger-ui .response .markdown p,
          .dark .swagger-ui .response .markdown li,
          .dark-theme.swagger-ui .response .markdown p,
          .dark-theme.swagger-ui .response .markdown li {
            color: #e5e7eb;
          }
          
          .dark .swagger-ui .scheme-container .schemes > label,
          .dark-theme.swagger-ui .scheme-container .schemes > label {
            color: #d1d5db;
          }
          
          .dark .swagger-ui .loading-container,
          .dark-theme.swagger-ui .loading-container {
            background: #111827;
          }
          
          .dark .swagger-ui .loading-container .loading:before,
          .dark-theme.swagger-ui .loading-container .loading:before {
            border-color: #4b5563 #374151 #374151;
          }
          
          .dark .swagger-ui .filter .operation-filter-input,
          .dark-theme.swagger-ui .filter .operation-filter-input {
            background: #374151;
            color: #f3f4f6;
            border-color: #4b5563;
          }
          
          .dark .swagger-ui .download-contents,
          .dark-theme.swagger-ui .download-contents {
            background: #374151;
            color: #f3f4f6;
          }
          
          .dark .swagger-ui .keyframe,
          .dark .swagger-ui .renderedMarkdown code,
          .dark-theme.swagger-ui .keyframe,
          .dark-theme.swagger-ui .renderedMarkdown code {
            background: #374151;
            color: #f3f4f6;
          }
        `}</style>
      </div>
    </div>
  )
}