# Scripts Directory

## ODD変換スクリプト

### convert-odd-roma-style.sh

TEI Garage APIを使用してODDファイルをRNGスキーマまたはHTMLドキュメントに変換するスクリプトです。

**使用方法:**
```bash
./scripts/convert-odd-roma-style.sh <odd-file> <output-type>
```

**パラメータ:**
- `odd-file`: 変換するODDファイルのパス
- `output-type`: 出力形式（`html` または `rng`）

**例:**
```bash
# HTMLドキュメントを生成
./scripts/convert-odd-roma-style.sh apps/web/public/ndl-koten-ocr.odd html

# RNGスキーマを生成
./scripts/convert-odd-roma-style.sh apps/web/public/ndl-koten-ocr.odd rng
```

**生成されるファイル:**
- `*.html`: スキーマのHTMLドキュメント（要素と属性の仕様書）
- `*.rng`: RELAX NGスキーマファイル（XMLバリデーション用）

**内部動作:**
Romaと同じ変換チェーンを使用：
- HTML: ODD → ODDC → TEI → xHTML
- RNG: ODD → ODDC → RELAXNG

詳細は[技術ブログ記事](../docs/tei-garage-odd-conversion.md)を参照してください。