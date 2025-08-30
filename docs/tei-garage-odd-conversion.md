# TEI GarageのAPIを使用したODDからRNG/HTMLへの変換

## はじめに

TEI（Text Encoding Initiative）のODD（One Document Does it all）ファイルから、スキーマ（RNG）やドキュメント（HTML）を生成する作業は、TEIプロジェクトにおいて重要な工程です。本記事では、Roma（TEIのODDエディタ）が内部で使用しているTEI Garage APIの仕組みを解析し、スクリプトから直接APIを呼び出してODDを変換する方法を紹介します。

## TEI Garageとは

TEI Garageは、TEIコミュニティが提供するWebサービスで、様々なフォーマット間の変換を行うことができます。特にODDファイルの処理において、以下の機能を提供しています：

- ODD → Compiled ODD への変換
- Compiled ODD → RELAX NG スキーマへの変換
- ODD → HTML ドキュメントへの変換
- その他多数のフォーマット変換

## Romaの内部動作を解析

Romaのネットワークトラフィックを観察すると、以下のような変換チェーンを使用していることがわかりました：

### HTMLドキュメント生成の場合
```
ODD → ODDC (Compiled ODD) → TEI → xHTML
```

実際のAPIエンドポイント：
```
https://teigarage.tei-c.org/ege-webservice/Conversions/ODD%3Atext%3Axml/ODDC%3Atext%3Axml/TEI%3Atext%3Axml/xhtml%3Aapplication%3Axhtml%2Bxml/conversion
```

### RNGスキーマ生成の場合
```
ODD → ODDC (Compiled ODD) → RELAXNG
```

実際のAPIエンドポイント：
```
https://teigarage.tei-c.org/ege-webservice/Conversions/ODD%3Atext%3Axml/ODDC%3Atext%3Axml/relaxng%3Aapplication%3Axml-relaxng/conversion
```

## 変換パラメータの詳細

Romaは変換時に以下のようなXML形式のプロパティを送信しています：

```xml
<conversions>
  <conversion index="0">
    <property id="oxgarage.getImages">false</property>
    <property id="oxgarage.getOnlineImages">false</property>
    <property id="oxgarage.lang">ja</property>
    <property id="oxgarage.textOnly">false</property>
    <property id="pl.psnc.dl.ege.tei.profileNames">default</property>
  </conversion>
  <conversion index="1">
    <property id="oxgarage.getImages">false</property>
    <property id="oxgarage.getOnlineImages">false</property>
    <property id="oxgarage.lang">ja</property>
    <property id="oxgarage.textOnly">true</property>
    <property id="pl.psnc.dl.ege.tei.profileNames">default</property>
  </conversion>
</conversions>
```

各プロパティの意味：
- `oxgarage.getImages`: 画像を含めるかどうか
- `oxgarage.getOnlineImages`: オンライン画像を取得するかどうか
- `oxgarage.lang`: 出力言語（ja=日本語、en=英語）
- `oxgarage.textOnly`: テキストのみの出力にするか（RNG生成時はtrue推奨）
- `pl.psnc.dl.ege.tei.profileNames`: 使用するプロファイル（通常はdefault）

## 実装：Bashスクリプトによる自動変換

以下は、TEI Garage APIを使用してODDファイルを変換するBashスクリプトです：

```bash
#!/bin/bash

# TEI Garage APIを使用したODD変換スクリプト
# Usage: ./convert-odd.sh <odd-file> <output-type>
# output-type: html or rng

ODD_FILE="$1"
OUTPUT_TYPE="$2"

if [ -z "$ODD_FILE" ] || [ -z "$OUTPUT_TYPE" ]; then
    echo "Usage: $0 <odd-file> <output-type>"
    echo "  output-type: html or rng"
    exit 1
fi

BASE_NAME=$(basename "$ODD_FILE" .odd)
DIR_NAME=$(dirname "$ODD_FILE")

# HTML変換
if [ "$OUTPUT_TYPE" = "html" ]; then
    echo "Converting ODD to HTML documentation..."
    
    # 変換プロパティ（HTML用）
    PROPERTIES='<conversions><conversion index="0"><property id="oxgarage.getImages">false</property><property id="oxgarage.getOnlineImages">false</property><property id="oxgarage.lang">ja</property><property id="oxgarage.textOnly">false</property><property id="pl.psnc.dl.ege.tei.profileNames">default</property></conversion><conversion index="1"><property id="oxgarage.getImages">false</property><property id="oxgarage.getOnlineImages">false</property><property id="oxgarage.lang">ja</property><property id="oxgarage.textOnly">false</property><property id="pl.psnc.dl.ege.tei.profileNames">default</property></conversion></conversions>'
    
    # APIエンドポイント（ODD → ODDC → TEI → xHTML）
    API_URL="https://teigarage.tei-c.org/ege-webservice/Conversions/ODD%3Atext%3Axml/ODDC%3Atext%3Axml/TEI%3Atext%3Axml/xhtml%3Aapplication%3Axhtml%2Bxml/conversion"
    
    # cURLでファイルをアップロードして変換
    curl -s -o "${DIR_NAME}/${BASE_NAME}.html" \
        -F upload=@"$ODD_FILE" \
        "${API_URL}?properties=${PROPERTIES}"
    
    echo "HTML documentation saved to ${DIR_NAME}/${BASE_NAME}.html"

# RNG変換
elif [ "$OUTPUT_TYPE" = "rng" ]; then
    echo "Converting ODD to RNG schema..."
    
    # 変換プロパティ（RNG用 - textOnlyをtrueに）
    PROPERTIES='<conversions><conversion index="0"><property id="oxgarage.getImages">false</property><property id="oxgarage.getOnlineImages">false</property><property id="oxgarage.lang">ja</property><property id="oxgarage.textOnly">true</property><property id="pl.psnc.dl.ege.tei.profileNames">default</property></conversion><conversion index="1"><property id="oxgarage.getImages">false</property><property id="oxgarage.getOnlineImages">false</property><property id="oxgarage.lang">ja</property><property id="oxgarage.textOnly">true</property><property id="pl.psnc.dl.ege.tei.profileNames">default</property></conversion></conversions>'
    
    # APIエンドポイント（ODD → ODDC → RELAXNG）
    API_URL="https://teigarage.tei-c.org/ege-webservice/Conversions/ODD%3Atext%3Axml/ODDC%3Atext%3Axml/relaxng%3Aapplication%3Axml-relaxng/conversion"
    
    # cURLでファイルをアップロードして変換
    curl -s -o "${DIR_NAME}/${BASE_NAME}.rng" \
        -F upload=@"$ODD_FILE" \
        "${API_URL}?properties=${PROPERTIES}"
    
    echo "RNG schema saved to ${DIR_NAME}/${BASE_NAME}.rng"
fi
```

## Pythonによる実装例

より柔軟な処理が必要な場合は、Pythonを使用することもできます：

```python
#!/usr/bin/env python3

import sys
import requests
from pathlib import Path
from urllib.parse import quote

def convert_odd(odd_file, output_type='html'):
    """
    TEI Garage APIを使用してODDファイルを変換
    
    Args:
        odd_file: ODDファイルのパス
        output_type: 'html' または 'rng'
    """
    
    # 変換プロパティをXML形式で準備
    text_only = 'true' if output_type == 'rng' else 'false'
    properties = f'''<conversions>
        <conversion index="0">
            <property id="oxgarage.getImages">false</property>
            <property id="oxgarage.getOnlineImages">false</property>
            <property id="oxgarage.lang">ja</property>
            <property id="oxgarage.textOnly">{text_only}</property>
            <property id="pl.psnc.dl.ege.tei.profileNames">default</property>
        </conversion>
        <conversion index="1">
            <property id="oxgarage.getImages">false</property>
            <property id="oxgarage.getOnlineImages">false</property>
            <property id="oxgarage.lang">ja</property>
            <property id="oxgarage.textOnly">{text_only}</property>
            <property id="pl.psnc.dl.ege.tei.profileNames">default</property>
        </conversion>
    </conversions>'''
    
    # APIエンドポイントを設定
    if output_type == 'html':
        endpoint = 'ODD%3Atext%3Axml/ODDC%3Atext%3Axml/TEI%3Atext%3Axml/xhtml%3Aapplication%3Axhtml%2Bxml'
        ext = '.html'
    else:  # rng
        endpoint = 'ODD%3Atext%3Axml/ODDC%3Atext%3Axml/relaxng%3Aapplication%3Axml-relaxng'
        ext = '.rng'
    
    api_url = f'https://teigarage.tei-c.org/ege-webservice/Conversions/{endpoint}/conversion'
    
    # ファイルをアップロードして変換
    with open(odd_file, 'rb') as f:
        files = {'upload': f}
        params = {'properties': properties}
        
        print(f"Converting {odd_file} to {output_type.upper()}...")
        response = requests.post(api_url, files=files, params=params)
        
        if response.status_code == 200:
            # 出力ファイルを保存
            output_file = Path(odd_file).with_suffix(ext)
            output_file.write_bytes(response.content)
            print(f"Successfully saved to {output_file}")
            return output_file
        else:
            print(f"Error: {response.status_code}")
            print(response.text)
            return None

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python convert_odd.py <odd-file> <output-type>")
        print("  output-type: html or rng")
        sys.exit(1)
    
    odd_file = sys.argv[1]
    output_type = sys.argv[2]
    
    if output_type not in ['html', 'rng']:
        print("Output type must be 'html' or 'rng'")
        sys.exit(1)
    
    convert_odd(odd_file, output_type)
```

## エラーハンドリングと注意点

### 1. APIレスポンスの検証

変換が失敗した場合、TEI GarageはHTMLエラーページを返すことがあります。必ず応答を検証してください：

```bash
# エラーチェックの例
if grep -q "HTTP Status" "${OUTPUT_FILE}"; then
    echo "Error occurred during conversion"
    cat "${OUTPUT_FILE}"
    exit 1
fi
```

### 2. ファイルサイズの制限

TEI Garage APIには、アップロードファイルサイズの制限があります（通常は数MB程度）。大きなODDファイルの場合は、ローカルでの変換ツール（Saxon-HEなど）の使用を検討してください。

### 3. ネットワークタイムアウト

変換処理には時間がかかることがあるため、適切なタイムアウト設定が必要です：

```bash
# cURLのタイムアウト設定例
curl --max-time 300 -s -o output.html ...
```

## 複数ファイルの一括変換

複数のODDファイルを一括変換する場合のスクリプト例：

```bash
#!/bin/bash

# すべてのODDファイルを変換
for odd_file in *.odd; do
    echo "Processing $odd_file..."
    
    # HTMLとRNGの両方を生成
    ./convert-odd.sh "$odd_file" html
    ./convert-odd.sh "$odd_file" rng
    
    echo "Completed $odd_file"
    echo "---"
done
```

## APIエンドポイントのURL構造

TEI GarageのAPIエンドポイントは、以下の構造を持っています：

```
https://teigarage.tei-c.org/ege-webservice/Conversions/{入力形式}/{中間形式1}/{中間形式2}/{出力形式}/conversion
```

各部分はURLエンコードされた形式で指定します：
- `ODD%3Atext%3Axml` = `ODD:text:xml`
- `ODDC%3Atext%3Axml` = `ODDC:text:xml`（Compiled ODD）
- `TEI%3Atext%3Axml` = `TEI:text:xml`
- `xhtml%3Aapplication%3Axhtml%2Bxml` = `xhtml:application:xhtml+xml`
- `relaxng%3Aapplication%3Axml-relaxng` = `relaxng:application:xml-relaxng`

## 他の変換オプション

TEI Garageは他にも様々な変換をサポートしています：

### ODD → XSD (XML Schema)
```bash
API_URL="https://teigarage.tei-c.org/ege-webservice/Conversions/ODD%3Atext%3Axml/ODDC%3Atext%3Axml/xsd%3Aapplication%3Axml-xsd/conversion"
```

### ODD → DTD
```bash
API_URL="https://teigarage.tei-c.org/ege-webservice/Conversions/ODD%3Atext%3Axml/ODDC%3Atext%3Axml/dtd%3Aapplication%3Axml-dtd/conversion"
```

### ODD → Schematron
```bash
API_URL="https://teigarage.tei-c.org/ege-webservice/Conversions/ODD%3Atext%3Axml/ODDC%3Atext%3Axml/sch%3Atext%3Axml/conversion"
```

## まとめ

TEI Garage APIを直接使用することで、Romaを経由せずにODDファイルの変換を自動化できます。この方法のメリット：

1. **自動化**: CI/CDパイプラインに組み込み可能
2. **バッチ処理**: 複数ファイルの一括変換が容易
3. **カスタマイズ**: 変換パラメータを細かく制御可能
4. **言語非依存**: curlが使える環境ならどこでも実行可能

特に、ODDファイルのバージョン管理と自動ビルドを組み合わせることで、スキーマとドキュメントの一貫性を保ちながら、効率的な開発フローを構築できます。

## 参考資料

- [TEI Garage](https://teigarage.tei-c.org/)
- [Roma: generating customizations for the TEI](https://roma.tei-c.org/)
- [TEI Guidelines: ODD](https://www.tei-c.org/release/doc/tei-p5-doc/en/html/TD.html)
- [RELAX NG](https://relaxng.org/)

## 関連記事

- [TEI ODDファイルのカスタマイゼーション：NDL古典籍OCRの事例](./tei-odd-customization-guide.md)