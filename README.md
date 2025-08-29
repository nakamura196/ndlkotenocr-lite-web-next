# NDLKotenOCR Lite Web (Next.js版)

NDLKotenOCR Lite Webは、国立国会図書館が開発した古典籍OCRアプリケーション [ndlkotenocr-lite](https://github.com/ndl-lab/ndlkotenocr-lite) のNext.js版Webアプリケーションです。ONNX Runtime Webを使用して、ブラウザ上で古典籍の文字認識を行うことができます。

## デモ

[こちら](https://ndlkotenocr-lite-web-next-web.vercel.app/)で利用可能です。
初回実行時はモデルのダウンロードが必要のため、実行に時間がかかります。

## 機能

- 📚 画像内のテキスト領域の検出（レイアウト認識）
- 🔤 検出されたテキスト領域内の文字認識
- 📖 日本語の古典籍に適した読み順処理
- 🌏 IIIF Manifest対応（複数画像の一括処理）
- 📝 結果のTEI/XML/JSON/TXT形式での出力
- 🌐 多言語対応（日本語/英語）
- 🎨 ダークモード対応
- 📱 レスポンシブデザイン
- 🔌 RESTful API提供

## 技術スタック

- **Next.js 15**: Reactフレームワーク
- **TypeScript**: 型安全な開発
- **ONNX Runtime Web**: モデル推論エンジン
- **Turbo**: モノレポ管理ツール
- **pnpm**: 高速なパッケージマネージャー
- **Tailwind CSS**: CSSフレームワーク
- **Shadcn/ui**: UIコンポーネントライブラリ

## 必要条件

- Node.js 18.x以上
- pnpm 10.x以上

## インストール

```bash
# リポジトリのクローン
git clone https://github.com/nakamura196/ndlkotenocr-lite-web-next.git
cd ndlkotenocr-lite-web

# 依存パッケージのインストール（pnpmを使用）
pnpm install
```

## 使用方法

### 開発サーバーの起動

```bash
pnpm dev
```

これにより、開発サーバーが起動し、http://localhost:3000 でアプリケーションにアクセスできます。

### ビルド

```bash
pnpm build
```

### 本番環境での実行

```bash
pnpm build
pnpm start
```

### その他のコマンド

```bash
# Lintの実行
pnpm lint

# 型チェック
pnpm typecheck

# クリーンビルド
pnpm clean
```

## モデルファイル

このアプリケーションは、以下のONNXモデルファイルを使用します：

- `apps/web/public/models/rtmdet-s-1280x1280.onnx`: レイアウト認識モデル
- `apps/web/public/models/parseq-ndl-32x384-tiny-10.onnx`: 文字認識モデル

## プロジェクト構造

```
ndlkotenocr-lite-web/
├── apps/
│   └── web/                        # Next.jsアプリケーション
│       ├── src/
│       │   ├── app/                # App Router
│       │   │   ├── [locale]/       # 国際化対応ページ
│       │   │   └── api/            # APIエンドポイント
│       │   ├── components/         # UIコンポーネント
│       │   ├── i18n/               # 国際化設定
│       │   └── lib/                # ユーティリティ
│       └── public/
│           ├── models/             # ONNXモデルファイル
│           └── config/             # 設定ファイル
├── packages/
│   └── ndl-koten-ocr-core/        # OCRコアパッケージ
│       └── src/
│           ├── layout-detector.ts  # レイアウト認識
│           ├── text-recognizer.ts  # 文字認識
│           ├── reading-order.ts    # 読み順処理
│           └── output-generator.ts # 出力生成
├── turbo.json                      # Turbo設定
└── package.json                    # ルートパッケージ
```

## API

### OCR処理エンドポイント

```bash
POST /api/ocr
Content-Type: multipart/form-data

# リクエストボディ
image: 画像ファイル

# レスポンス
{
  "success": true,
  "data": {
    "detections": [...],
    "xml": "...",
    "json": {...},
    "text": "..."
  }
}
```

### API仕様書

アプリケーション内の `/api-docs` ページでSwagger UIによるAPI仕様書を確認できます。

## デプロイ

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/nakamura196/ndlkotenocr-lite-web-next)

### Docker

```bash
# イメージのビルド
docker build -t ndlkotenocr-web .

# コンテナの実行
docker run -p 3000:3000 ndlkotenocr-web
```

## ライセンス

このプロジェクトは [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/deed.en)の下で公開されています。

## 謝辞

- このプロジェクトは、国立国会図書館が開発した [ndlkotenocr-lite](https://github.com/ndl-lab/ndlkotenocr-lite) を基にしています。
- Web版の開発は、橋本雄太氏（[@yuta1984](https://x.com/yuta1984)、国立歴史民俗博物館）による [ndlkotenocr-lite-web](https://github.com/yuta1984/ndlkotenocr-lite-web) を参考にしています。
- Next.js版の開発：中村覚（[@nakamura196](https://x.com/nakamura196)、東京大学）
