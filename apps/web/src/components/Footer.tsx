'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

export default function Footer() {
  const t = useTranslations('footer');

  return (
    <footer className="mt-8 text-center p-5 text-gray-600 dark:text-gray-400 text-sm border-t border-gray-200 dark:border-gray-700">
      <p>
        {t('description')}
        <a
          href="https://github.com/ndl-lab/ndlkotenocr-lite"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('ndlOcrLink')}
        </a>
        {t('webVersion')}
      </p>
      <p>
        {t('developer')} 
        <a
          href="https://x.com/yuta1984"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('twitter')}
        </a>
        ） -&nbsp;
        <a
          href="https://github.com/yuta1984/ndlkotenocr-lite-web"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('githubRepo')}
        </a>
      </p>
      <p>
        {t('nextjsDeveloper')} 
        <a
          href="https://x.com/nakamura196"
          target="_blank"
          rel="noopener noreferrer"
        >
          @nakamura196
        </a>
        ） -&nbsp;
        <a
          href="https://github.com/nakamura196/ndlkotenocr-lite-web-next"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('githubRepo')}
        </a>
      </p>
      <p className="mt-3">
        <Link
          href="/docs"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          📚 ドキュメント・スキーマファイル
        </Link>
      </p>
    </footer>
  )
}