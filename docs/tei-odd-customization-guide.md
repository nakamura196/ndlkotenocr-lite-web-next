# TEI ODDファイルのカスタマイゼーション：NDL古典籍OCRの事例

## はじめに

TEI (Text Encoding Initiative) は、人文学研究におけるテキストのデジタル化と共有のための国際標準です。本記事では、NDL古典籍OCR-Liteアプリケーションの出力形式に合わせてTEI ODDファイルをカスタマイズした過程を紹介します。

ODD (One Document Does it all) は、TEIスキーマをカスタマイズするための仕組みで、必要な要素と属性だけを含む独自のスキーマを定義できます。

## 背景：NDL古典籍OCR-Liteアプリケーションの開発

NDL古典籍OCR-Liteの出力結果をTEI/XMLで出力するアプリケーションを作成しています。このアプリケーションは、日本の古典籍をOCR処理し、その結果を標準的なTEI形式で出力することを目的としています。

出力されるTEI XMLには以下の情報を含めることにしました：

- **テキスト情報**: OCRで認識した文字列
- **レイアウト情報**: 各行の座標情報（バウンディングボックス）
- **画像参照**: IIIF (International Image Interoperability Framework) 対応の画像URL
- **メタデータ**: 文書タイトル、処理情報など

このアプリケーションで使用するスキーマをODDで記述してみました。以下、そのカスタマイゼーション過程を紹介します。

## カスタマイゼーションのアプローチ

### 1. 初期アプローチ：標準モジュールの利用

最初は、TEIの標準モジュールを利用してODDを作成しました：

```xml
<schemaSpec ident="ndl_koten_ocr" start="TEI" prefix="tei_">
  <moduleRef key="tei"/>
  <moduleRef key="header" include="teiHeader fileDesc titleStmt publicationStmt sourceDesc"/>
  <moduleRef key="core" include="p title name resp respStmt lb pb graphic"/>
  <moduleRef key="textstructure" include="TEI text body"/>
  <moduleRef key="transcr" include="facsimile surface zone"/>
</schemaSpec>
```

#### include属性の重要性

`moduleRef`要素の`include`属性は、モジュールから特定の要素のみを選択的に含める重要な機能です：

```xml
<!-- headerモジュールから5つの要素のみを選択 -->
<moduleRef key="header" include="teiHeader fileDesc titleStmt publicationStmt sourceDesc"/>
```

**include属性を使用する利点：**
- 必要な要素のみを明示的に指定できる
- モジュール全体を含めるよりもスキーマサイズが小さくなる
- どの要素を使用しているかが明確になる

**include属性を使用しない場合：**
```xml
<!-- モジュール全体を含める（非推奨） -->
<moduleRef key="header"/>
```
この場合、headerモジュールの全要素（encodingDesc、profileDesc、revisionDescなど）が含まれてしまいます。

**複数要素の指定方法：**
```xml
<!-- スペース区切りで複数の要素を列挙 -->
<moduleRef key="core" include="p title name resp respStmt lb pb graphic"/>
```

**exclude属性を使った除外方法：**
```xml
<!-- 特定の要素を除外する場合 -->
<moduleRef key="core" exclude="hi del add note"/>
```
`exclude`属性は`include`属性の逆で、モジュールから特定の要素を除外します。大部分の要素が必要で、一部のみ不要な場合に有効です。

**include vs exclude の選択基準：**
- 必要な要素が少ない場合 → `include`を使用
- 不要な要素が少ない場合 → `exclude`を使用
- 明確性を重視する場合 → `include`を使用（何を使っているかが明確）

しかし、この方法でも関連するmodel classesとattribute classesが自動的に含まれるため、完全に最小化することはできませんでした。

### 2. 改善アプローチ：不要な要素の削除

次に、不要なクラスを明示的に削除しました：

```xml
<!-- 不要なmodel classesを削除 -->
<classSpec ident="model.emphLike" type="model" mode="delete"/>
<classSpec ident="model.highlighted" type="model" mode="delete"/>

<!-- 不要なattribute classesを削除 -->
<classSpec ident="att.datable" type="atts" mode="delete"/>
<classSpec ident="att.editLike" type="atts" mode="delete"/>
```

### 3. 最終アプローチ：最小構成での定義

最終的に、必要な要素と属性のみを明示的に定義する方法を採用しました：

```xml
<schemaSpec ident="ndl_koten_ocr_minimal" start="TEI" prefix="tei_" docLang="ja">
  <!-- 必要な属性クラスのみを定義 -->
  <classSpec ident="att.global" type="atts" mode="add">
    <attList>
      <attDef ident="xml:id" mode="add">
        <desc xml:lang="ja">一意識別子</desc>
        <datatype><dataRef key="ID"/></datatype>
      </attDef>
      <attDef ident="xml:lang" mode="add">
        <desc xml:lang="ja">言語コード</desc>
        <datatype><dataRef key="teidata.language"/></datatype>
      </attDef>
    </attList>
  </classSpec>
</schemaSpec>
```

## 実装の詳細

### 座標情報の管理

OCRの座標情報を管理するため、専用の属性クラスを定義：

```xml
<classSpec ident="att.coordinated" type="atts" mode="add">
  <desc xml:lang="ja">座標属性</desc>
  <attList>
    <attDef ident="ulx" mode="add">
      <desc xml:lang="ja">左上X座標</desc>
      <datatype><dataRef key="teidata.numeric"/></datatype>
    </attDef>
    <attDef ident="uly" mode="add">
      <desc xml:lang="ja">左上Y座標</desc>
      <datatype><dataRef key="teidata.numeric"/></datatype>
    </attDef>
    <attDef ident="lrx" mode="add">
      <desc xml:lang="ja">右下X座標</desc>
      <datatype><dataRef key="teidata.numeric"/></datatype>
    </attDef>
    <attDef ident="lry" mode="add">
      <desc xml:lang="ja">右下Y座標</desc>
      <datatype><dataRef key="teidata.numeric"/></datatype>
    </attDef>
  </attList>
</classSpec>
```

### IIIF対応の実装

IIIFマニフェストとの連携のため、`sameAs`属性を追加：

```xml
<elementSpec ident="facsimile" mode="add">
  <desc xml:lang="ja">ファクシミリ</desc>
  <attList>
    <attDef ident="sameAs" mode="add">
      <desc xml:lang="ja">IIIFマニフェストURL</desc>
      <datatype><dataRef key="teidata.pointer"/></datatype>
    </attDef>
  </attList>
</elementSpec>
```

### 行番号の形式制約

Schematronを使用して、行番号の形式を制約：

```xml
<constraintSpec ident="page-numbering" scheme="schematron">
  <constraint>
    <sch:rule context="tei:lb[@n]">
      <sch:assert test="matches(@n, '^\d+\.\d+$')">
        行番号は次の形式である必要があります: ページ.行 (例: 1.1, 2.3)
      </sch:assert>
    </sch:rule>
  </constraint>
</constraintSpec>
```

## 例（Example）の記述方法

### exemplumとegXMLの基本構造

ODDでは、`exemplum`要素と`egXML`要素を使って使用例を記述します：

```xml
<elementSpec ident="pb" mode="change">
  <desc xml:lang="ja">ページ区切り</desc>
  <exemplum>
    <egXML xmlns="http://www.tei-c.org/ns/Examples">
      <pb n="1" facs="https://catalog.lib.kyushu-u.ac.jp/image/iiif/1/820/411193/368828.tiff/full/max/0/default.jpg"/>
    </egXML>
  </exemplum>
</elementSpec>
```

### 複雑な例の記述

複数の要素を含む例を示す場合：

```xml
<elementSpec ident="teiHeader" mode="change">
  <exemplum>
    <egXML xmlns="http://www.tei-c.org/ns/Examples">
      <teiHeader>
        <fileDesc>
          <titleStmt>
            <title>OCR処理結果</title>
            <respStmt>
              <resp>Automated Transcription</resp>
              <name ref="https://github.com/ndl-lab/ndlkotenocr-lite">
                NDL古典籍OCR-Liteアプリケーション
              </name>
            </respStmt>
          </titleStmt>
          <publicationStmt>
            <p>Converted from IIIF Manifest</p>
          </publicationStmt>
          <sourceDesc>
            <p>https://catalog.lib.kyushu-u.ac.jp/image/manifest/1/820/411193.json</p>
          </sourceDesc>
        </fileDesc>
      </teiHeader>
    </egXML>
  </exemplum>
</elementSpec>
```

### 名前空間の問題と解決策

#### 問題：TEI要素が認識されない

egXML内でTEI要素（特にルート要素）を使用する際、名前空間の問題が発生することがあります：

```xml
<!-- エラーが発生する例 -->
<exemplum>
  <egXML xmlns="http://www.tei-c.org/ns/Examples">
    <TEI xmlns="http://www.tei-c.org/ns/1.0">  <!-- エラー：TEI要素が認識されない -->
      <teiHeader>...</teiHeader>
    </TEI>
  </egXML>
</exemplum>
```

#### 解決策1：名前空間プレフィックスを使用

```xml
<exemplum>
  <egXML xmlns="http://www.tei-c.org/ns/Examples" xmlns:tei="http://www.tei-c.org/ns/1.0">
    <tei:TEI>
      <tei:teiHeader>...</tei:teiHeader>
      <tei:text>...</tei:text>
    </tei:TEI>
  </egXML>
</exemplum>
```

#### 解決策2：コメントで簡略化

```xml
<exemplum>
  <egXML xmlns="http://www.tei-c.org/ns/Examples">
    <!-- TEI root element with header, text, and facsimile -->
  </egXML>
</exemplum>
```

#### 解決策3：例を省略

検証エラーを避けるため、問題のある例を完全に省略することも選択肢です。

### 言語別の例の提供

多言語対応の例を提供する場合：

```xml
<elementSpec ident="zone" mode="change">
  <!-- 日本語の例 -->
  <exemplum xml:lang="ja">
    <egXML xmlns="http://www.tei-c.org/ns/Examples">
      <zone xml:id="zone-1-1" ulx="453" uly="55" lrx="492" lry="744"/>
      <!-- 日本語のテキスト領域の座標 -->
    </egXML>
  </exemplum>
  
  <!-- 英語の例 -->
  <exemplum xml:lang="en">
    <egXML xmlns="http://www.tei-c.org/ns/Examples">
      <zone xml:id="zone-1-1" ulx="100" uly="100" lrx="500" lry="200"/>
      <!-- English text zone coordinates -->
    </egXML>
  </exemplum>
</elementSpec>
```

### 属性の使用例を示す

属性の様々な値を示す場合：

```xml
<elementSpec ident="lb" mode="change">
  <exemplum>
    <egXML xmlns="http://www.tei-c.org/ns/Examples">
      <!-- 基本的な使用例 -->
      <lb n="1.1" type="line" corresp="#zone-1-1"/>
      
      <!-- 別のページの例 -->
      <lb n="2.5" type="line" corresp="#zone-2-5"/>
      
      <!-- 特殊な行の例 -->
      <lb n="3.10" type="line" corresp="#zone-3-10"/>
    </egXML>
  </exemplum>
</elementSpec>
```

### Romaでの表示

これらの例は、Romaツールで生成されるHTMLドキュメントに自動的に含まれます。例があることで：
- 要素の使用方法が明確になる
- 属性の実際の値がわかる
- スキーマの利用者が実装しやすくなる

## 日本語対応

### 多言語対応の記述

ODDファイル内で日英両言語の説明を提供：

```xml
<elementSpec ident="TEI" mode="change">
  <desc xml:lang="ja">NDL古典籍OCR TEIドキュメントのルート要素</desc>
  <desc xml:lang="en">Root element for NDL Koten OCR TEI documents</desc>
</elementSpec>
```

### ドキュメント言語の設定

Romaツールで日本語インターフェースを使用するため：

```xml
<schemaSpec ident="ndl_koten_ocr" start="TEI" prefix="tei_" docLang="ja">
```

## 実際の出力例

このODDから生成されるTEI XMLの例：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<TEI xmlns="http://www.tei-c.org/ns/1.0">
  <teiHeader>
    <fileDesc>
      <titleStmt>
        <title>OCR処理結果</title>
        <respStmt>
          <resp>Automated Transcription</resp>
          <name ref="https://github.com/ndl-lab/ndlkotenocr-lite">
            NDL古典籍OCR-Liteアプリケーション
          </name>
        </respStmt>
      </titleStmt>
      <publicationStmt>
        <p>Converted from IIIF Manifest</p>
      </publicationStmt>
      <sourceDesc>
        <p>https://catalog.lib.kyushu-u.ac.jp/image/manifest/1/820/411193.json</p>
      </sourceDesc>
    </fileDesc>
  </teiHeader>
  <text>
    <body>
      <p>
        <pb n="1" facs="https://example.com/image1.jpg"/>
        <lb n="1.1" type="line" corresp="#zone-1-1"/>
        いつれの御時により女御更花あまたさふらひ給ける
        <lb n="1.2" type="line" corresp="#zone-1-2"/>
        中に。いとやんことなきはにはあらぬか。すくれ
      </p>
    </body>
  </text>
  <facsimile sameAs="https://catalog.lib.kyushu-u.ac.jp/image/manifest/1/820/411193.json">
    <surface sameAs="https://example.com/image1.jpg" ulx="0" uly="0" lrx="563" lry="790">
      <graphic url="https://example.com/image1.jpg" width="563px" height="790px"/>
      <zone xml:id="zone-1-1" ulx="453" uly="55" lrx="492" lry="744"/>
      <zone xml:id="zone-1-2" ulx="412" uly="56" lrx="447" lry="733"/>
    </surface>
  </facsimile>
</TEI>
```

## Romaツールでの利用

### ODDファイルの読み込み

1. [Roma](https://roma.tei-c.org/) にアクセス
2. "Upload ODD" から作成したODDファイルをアップロード
3. 必要に応じて追加のカスタマイズを実施

### スキーマの生成

Romaから以下の形式でスキーマを生成可能：
- RelaxNG Schema
- W3C Schema (XSD)
- DTD
- Schematron

### HTMLドキュメントの生成

Romaの "Documentation" タブから、HTMLドキュメントを生成できます。最小構成版では、実際に使用する要素と属性のみが文書化されます。

## トラブルシューティング

### よくある問題と解決方法

1. **egXML内でのTEI要素のエラー**
   - 問題：`<egXML>`内で`<TEI>`要素がエラーになる
   - 解決：名前空間プレフィックスを使用するか、例を簡略化

2. **mode="keep"が無効**
   - 問題：`attDef`で`mode="keep"`が認識されない
   - 解決：`mode="change"`を使用

3. **不要なクラスが多すぎる**
   - 問題：標準モジュールを使うと不要なクラスが含まれる
   - 解決：`mode="add"`で必要なものだけを定義

## まとめ

TEI ODDのカスタマイゼーションには複数のアプローチがあります：

1. **標準モジュール利用**: 簡単だが不要な要素が多い
2. **削除方式**: 標準から不要なものを削除
3. **追加方式**: 必要なものだけを明示的に追加（推奨）

プロジェクトの要件に応じて適切な方法を選択することが重要です。NDL古典籍OCRの場合、最小構成での定義により、明確で管理しやすいスキーマを実現できました。

## 参考資料

- [TEI Guidelines](https://www.tei-c.org/guidelines/)
- [ODD: One Document Does it all](https://www.tei-c.org/guidelines/customization/getting-started-with-p5-odds/)
- [Roma: ODD customization tool](https://roma.tei-c.org/)
- [NDL古典籍OCR](https://github.com/ndl-lab/ndlkotenocr)
- [IIIF (International Image Interoperability Framework)](https://iiif.io/)

## ライセンス

このODDファイルは[Creative Commons Attribution 4.0 International License](https://creativecommons.org/licenses/by/4.0/)の下で提供されています。

---

*著者: 中村覚*  
*最終更新: 2024年*