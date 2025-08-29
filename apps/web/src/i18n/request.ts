import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  // This can either be defined statically at the top-level or based on a parameter
  let locale = await requestLocale;

  // Ensure that a valid locale is used
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = 'ja';
  }

  return {
    locale,
    messages: (await import(`@/messages/${locale}.json`)).default
  };
});