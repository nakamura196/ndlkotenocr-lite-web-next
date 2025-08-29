const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// アイコンサイズの定義
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

// publicディレクトリのパス
const publicDir = path.join(__dirname, '..', 'public');

// 各サイズのアイコンを生成
sizes.forEach(({ name, size }) => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // グラデーション背景
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#667eea');
  gradient.addColorStop(1, '#764ba2');
  ctx.fillStyle = gradient;
  
  // 角丸の四角形を描画
  const radius = size * 0.2;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fill();

  // 文字を描画
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size * 0.5}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('文', size / 2, size / 2);

  // PNGファイルとして保存
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(publicDir, name), buffer);
  console.log(`Generated ${name}`);
});

// OGP画像の生成 (1200x630)
const ogCanvas = createCanvas(1200, 630);
const ogCtx = ogCanvas.getContext('2d');

// グラデーション背景
const ogGradient = ogCtx.createLinearGradient(0, 0, 1200, 630);
ogGradient.addColorStop(0, '#667eea');
ogGradient.addColorStop(1, '#764ba2');
ogCtx.fillStyle = ogGradient;
ogCtx.fillRect(0, 0, 1200, 630);

// タイトルテキスト
ogCtx.fillStyle = 'white';
ogCtx.font = 'bold 80px sans-serif';
ogCtx.textAlign = 'center';
ogCtx.textBaseline = 'middle';
ogCtx.fillText('NDL古典籍OCR', 600, 250);

// サブタイトル
ogCtx.font = '36px sans-serif';
ogCtx.fillText('AI技術を活用した高精度な古典籍文字認識システム', 600, 350);

// 装飾文字
ogCtx.fillStyle = 'rgba(255, 255, 255, 0.2)';
ogCtx.font = 'bold 120px sans-serif';
const chars = ['文', '字', '認', '識'];
chars.forEach((char, i) => {
  ogCtx.fillText(char, 300 + i * 200, 480);
});

// OGP画像を保存
const ogBuffer = ogCanvas.toBuffer('image/png');
fs.writeFileSync(path.join(publicDir, 'og-image.png'), ogBuffer);
console.log('Generated og-image.png');

console.log('All icons generated successfully!');