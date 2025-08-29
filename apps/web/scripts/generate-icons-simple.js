const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const publicDir = path.join(__dirname, '..', 'public');
const svgPath = path.join(publicDir, 'icon.svg');

// SVGファイルを読み込み
const svgBuffer = fs.readFileSync(svgPath);

// 各サイズのPNGアイコンを生成
const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'icon-16x16.png', size: 16 },
  { name: 'icon-32x32.png', size: 32 },
  { name: 'icon.png', size: 32 },
  { name: 'apple-icon.png', size: 180 },
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-512x512.png', size: 512 },
];

async function generateIcons() {
  for (const { name, size } of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(publicDir, name));
    console.log(`Generated ${name}`);
  }

  // favicon.icoの代わりに、小さなPNGを使用（多くのブラウザはPNGのfaviconをサポート）
  // 実際のICOファイルが必要な場合は、別のツールを使用する必要があります
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('Generated favicon.png (use as favicon)');

  // OGP画像用のSVG
  const ogSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#gradient)"/>
  <text x="600" y="200" font-family="sans-serif" font-size="72" font-weight="bold" text-anchor="middle" fill="white">NDL古典籍OCR Lite</text>
  <text x="600" y="280" font-family="sans-serif" font-size="48" text-anchor="middle" fill="rgba(255,255,255,0.95)">Next.js版</text>
  <text x="600" y="380" font-family="sans-serif" font-size="32" text-anchor="middle" fill="rgba(255,255,255,0.9)">本アプリは NDL古典籍OCR-lite のNext.js移植版です。</text>
  <g opacity="0.15">
    <text x="300" y="520" font-family="sans-serif" font-size="100" font-weight="bold" text-anchor="middle" fill="white">文</text>
    <text x="500" y="520" font-family="sans-serif" font-size="100" font-weight="bold" text-anchor="middle" fill="white">字</text>
    <text x="700" y="520" font-family="sans-serif" font-size="100" font-weight="bold" text-anchor="middle" fill="white">認</text>
    <text x="900" y="520" font-family="sans-serif" font-size="100" font-weight="bold" text-anchor="middle" fill="white">識</text>
  </g>
</svg>`;

  // OGP画像の生成
  await sharp(Buffer.from(ogSvg))
    .resize(1200, 630)
    .png()
    .toFile(path.join(publicDir, 'og-image.png'));
  console.log('Generated og-image.png');

  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);