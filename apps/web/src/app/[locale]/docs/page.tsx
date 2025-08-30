'use client';

import { useTranslations } from 'next-intl';

export default function DocsPage() {
  const t = useTranslations('docs');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl p-8 shadow-lg">
          <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
          <p className="text-xl opacity-95">{t('subtitle')}</p>
          <p className="text-lg opacity-90 mt-2">{t('description')}</p>
        </div>


        {/* Introduction */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <span className="mr-3">📚</span>
            {t('overview.title')}
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {t('overview.description')}
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* TEI Schema Files */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-l-4 border-purple-500 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">📋</span>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{t('teiSchema.title')}</h3>
              <span className="ml-3 px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs rounded-full">
                {t('teiSchema.badge')}
              </span>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm leading-relaxed">
              {t('teiSchema.description')}
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href="/ndl-koten-ocr.odd"
                className="inline-flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-purple-800 text-purple-700 dark:text-purple-300 rounded-lg text-sm transition-colors"
                download
              >
                <span className="mr-2">📄</span>
                {t('teiSchema.oddFile')}
              </a>
              <a
                href="/ndl-koten-ocr.rng"
                className="inline-flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-purple-800 text-purple-700 dark:text-purple-300 rounded-lg text-sm transition-colors"
                download
              >
                <span className="mr-2">🔗</span>
                {t('teiSchema.relaxngSchema')}
              </a>
            </div>
          </div>

          {/* HTML Documentation */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-l-4 border-blue-500 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">🌐</span>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{t('htmlDocs.title')}</h3>
              <span className="ml-3 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                {t('htmlDocs.badge')}
              </span>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm leading-relaxed">
              {t('htmlDocs.description')}
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href="/ndl-koten-ocr.html"
                className="inline-flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-lg text-sm transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="mr-2">🔗</span>
                {t('htmlDocs.schemaReference')}
              </a>
            </div>
          </div>


        </div>

        {/* Technical Information */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <span className="mr-3">🔧</span>
            {t('technicalSpecs.title')}
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{t('technicalSpecs.teiVersion.title')}</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm">{t('technicalSpecs.teiVersion.description')}</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{t('technicalSpecs.schemaFormats.title')}</h3>
              <ul className="text-gray-700 dark:text-gray-300 text-sm space-y-1">
                <li><strong>ODD</strong>: {t('technicalSpecs.schemaFormats.odd')}</li>
                <li><strong>RelaxNG</strong>: {t('technicalSpecs.schemaFormats.relaxng')}</li>
                <li><strong>HTML</strong>: {t('technicalSpecs.schemaFormats.html')}</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{t('technicalSpecs.browserSupport.title')}</h3>
              <ul className="text-gray-700 dark:text-gray-300 text-sm space-y-1">
                <li>{t('technicalSpecs.browserSupport.chrome')}</li>
                <li>{t('technicalSpecs.browserSupport.firefox')}</li>
                <li>{t('technicalSpecs.browserSupport.safari')}</li>
                <li>{t('technicalSpecs.browserSupport.mobile')}</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}