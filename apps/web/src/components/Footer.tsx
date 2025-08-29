'use client';

import { useTranslations } from 'next-intl';

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
        ） - 
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
        ） - 
        <a
          href="https://github.com/nakamura196/ndlkotenocr-lite-web-next"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('githubRepo')}
        </a>
      </p>
    </footer>
  )
}