import { routing } from '@/i18n/routing';
import OCRApp from '@/components/OCRApp';

// SSG対応 - 静的パラメータの生成
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default function Home() {
  return <OCRApp />;
}