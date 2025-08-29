/**
 * NDLKotenOCR Web版 - 出力生成モジュール
 *
 * このファイルは、OCR結果を様々な形式（XML, JSON, TXT）で出力するモジュールです。
 * 元のPythonコードのsrc/ndl_parser.pyを参考に実装しています。
 */

import * as yaml from 'js-yaml';

/**
 * 出力生成の設定
 */
const defaultConfig = {
  // XML出力の設定
  xml: {
    includeConfidence: true, // 信頼度スコアを含める
    prettyPrint: true, // 整形出力
    encoding: 'UTF-8', // 文字エンコーディング
  },
  // JSON出力の設定
  json: {
    includeConfidence: true, // 信頼度スコアを含める
    prettyPrint: true, // 整形出力
    includeMetadata: true, // メタデータを含める
  },
  // テキスト出力の設定
  txt: {
    separator: '\n', // 行区切り文字
    includeBoundingBox: false, // バウンディングボックス情報を含める
  },
};

/**
 * 設定ファイルを読み込む
 *
 * @param {string} configPath 設定ファイルのパス
 * @returns {Promise<Object>} 読み込まれた設定
 */
export async function loadConfig(configPath: string | null) {
  const config = { ...defaultConfig };

  if (!configPath) {
    console.log(
      '出力生成: 設定ファイルのパスが指定されていません。デフォルト設定を使用します。'
    );
    return config;
  }

  try {
    // 設定ファイルを取得
    const response = await fetch(configPath);
    if (!response.ok) {
      throw new Error(
        `設定ファイルの取得に失敗しました: ${response.statusText}`
      );
    }

    const yamlText = await response.text();
    const yamlConfig = yaml.load(yamlText) as any;

    // 出力生成設定を取得
    if (yamlConfig && yamlConfig.output_generation) {
      const outputConfig = yamlConfig.output_generation;

      // XML設定を更新
      if (outputConfig.xml) {
        config.xml = { ...config.xml, ...outputConfig.xml };
      }

      // JSON設定を更新
      if (outputConfig.json) {
        config.json = {
          ...config.json,
          ...outputConfig.json,
        };
      }

      // テキスト設定を更新
      if (outputConfig.txt) {
        config.txt = { ...config.txt, ...outputConfig.txt };
      }
    }

    console.log(
      '出力生成: 設定ファイルを読み込みました:',
      config
    );
    return config;
  } catch (error) {
    console.warn(
      `出力生成: 設定ファイルの読み込みに失敗しました: ${(error as Error).message}。デフォルト設定を使用します。`
    );
    return config;
  }
}

/**
 * 出力生成クラス
 * OCR結果を様々な形式で出力するクラス
 */
interface TextElement {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  confidence?: number;
}

interface JSONOutput {
  document: {
    image: {
      name: string;
      width: number;
      height: number;
      text: TextElement[];
    };
  };
  metadata?: {
    timestamp: string;
    version: string;
    engine: string;
    fileCount?: number;
  };
}

interface OutputConfig {
  xml: {
    includeConfidence: boolean;
    prettyPrint: boolean;
    encoding: string;
  };
  json: {
    includeConfidence: boolean;
    prettyPrint: boolean;
    includeMetadata: boolean;
  };
  txt: {
    separator: string;
    includeBoundingBox: boolean;
  };
}

export class OutputGenerator {
  private config: OutputConfig;

  /**
   * コンストラクタ
   *
   * @param {Object} config 設定オブジェクト
   */
  constructor(config: OutputConfig | null = null) {
    this.config = config || { ...defaultConfig };
    console.log(
      '出力生成: 設定を適用しました:',
      this.config
    );
  }

  /**
   * XML形式で出力を生成
   *
   * @param {Array} detections 検出結果の配列
   * @param {number} imageWidth 画像の幅
   * @param {number} imageHeight 画像の高さ
   * @param {string} imageName 画像名
   * @returns {string} XML形式の出力
   */
  generateXML(
    detections: any[],
    _imageWidth: number,
    _imageHeight: number,
    _imageName = 'image',
    imageUrl: string | null = null
  ) {
    console.log(
      `出力生成: XML形式で出力を生成します (${
        detections ? detections.length : 0
      }件)`
    );

    // 検出結果が空の場合は空のXMLを返す
    if (!detections || detections.length === 0) {
      return `<?xml version="1.0" encoding="${this.config.xml.encoding}"?>
<text>
  <body>
    <p>
      ${imageUrl ? `<pb n="1" facs="${imageUrl}"/>` : ''}
    </p>
  </body>
</text>`;
    }

    // XMLヘッダー
    let xml = `<?xml version="1.0" encoding="${this.config.xml.encoding}"?>
<text>
  <body>
    <p>
`;

    // ページブレーク要素を追加
    if (imageUrl) {
      xml += `      <pb n="1" facs="${imageUrl}"/>\n`;
    }

    // 各検出結果のテキストを追加
    for (let i = 0; i < detections.length; i++) {
      const detection = detections[i];
      const text = this._escapeXml(detection.text || '');
      
      if (text) {
        xml += `      ${text}\n`;
      }
    }

    // XMLフッター
    xml += `    </p>
  </body>
</text>`;

    return xml;
  }

  /**
   * JSON形式で出力を生成
   *
   * @param {Array} detections 検出結果の配列
   * @param {number} imageWidth 画像の幅
   * @param {number} imageHeight 画像の高さ
   * @param {string} imageName 画像名
   * @returns {Object} JSON形式の出力
   */
  generateJSON(
    detections: any[],
    imageWidth: number,
    imageHeight: number,
    imageName = 'image'
  ) {
    console.log(
      `出力生成: JSON形式で出力を生成します (${
        detections ? detections.length : 0
      }件)`
    );

    // 検出結果が空の場合は空のJSONを返す
    if (!detections || detections.length === 0) {
      return {
        document: {
          image: {
            name: imageName,
            width: imageWidth,
            height: imageHeight,
            text: [],
          },
        },
      };
    }

    // 各検出結果をJSON要素として追加
    const textElements = [];
    for (let i = 0; i < detections.length; i++) {
      const detection = detections[i];
      const [x1, y1, x2, y2] = detection.box;

      const textElement: TextElement = {
        id: i + 1,
        x: Math.round(x1),
        y: Math.round(y1),
        width: Math.round(x2 - x1),
        height: Math.round(y2 - y1),
        text: detection.text || '',
      };

      // 信頼度スコアを含める場合
      if (
        this.config.json.includeConfidence &&
        detection.score !== undefined
      ) {
        textElement.confidence = parseFloat(
          detection.score.toFixed(4)
        );
      }

      textElements.push(textElement);
    }

    // JSON構造を作成
    const jsonOutput: JSONOutput = {
      document: {
        image: {
          name: imageName,
          width: imageWidth,
          height: imageHeight,
          text: textElements,
        },
      },
    };

    // メタデータを含める場合
    if (this.config.json.includeMetadata) {
      jsonOutput.metadata = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        engine: 'NDLKotenOCR Web',
      };
    }

    return jsonOutput;
  }

  /**
   * テキスト形式で出力を生成
   *
   * @param {Array} detections 検出結果の配列
   * @returns {string} テキスト形式の出力
   */
  generateTXT(detections: any[]) {
    console.log(
      `出力生成: テキスト形式で出力を生成します (${
        detections ? detections.length : 0
      }件)`
    );

    // 検出結果が空の場合は空の文字列を返す
    if (!detections || detections.length === 0) {
      return '';
    }

    // 各検出結果のテキストを結合
    let text = '';
    for (let i = 0; i < detections.length; i++) {
      const detection = detections[i];
      if (detection.text) {
        // バウンディングボックス情報を含める場合
        if (this.config.txt.includeBoundingBox) {
          const [x1, y1, x2, y2] = detection.box;
          text += `[${i + 1}] (${Math.round(
            x1
          )},${Math.round(y1)},${Math.round(
            x2
          )},${Math.round(y2)}): `;
        }

        text += detection.text;
        // 実際の改行文字を追加
        if (i < detections.length - 1) {
          text += '\n';
        }
      }
    }

    return text;
  }

  /**
   * 全ての検出結果を統合したXML形式で出力を生成
   *
   * @param {Array} resultsArray 複数の処理結果の配列
   * @param {Array} imageNames 画像名の配列
   * @returns {string} 統合されたXML形式の出力
   */
  generateCombinedXML(resultsArray: any[], imageNames: string[] = []): string {
    console.log(
      `出力生成: 統合XML形式で出力を生成します (${resultsArray.length}ファイル)`
    );

    // 検出結果が空の場合は空のXMLを返す
    if (!resultsArray || resultsArray.length === 0) {
      return `<?xml version="1.0" encoding="${this.config.xml.encoding}"?>
<document>
</document>`;
    }

    // XMLヘッダー
    let xml = `<?xml version="1.0" encoding="${this.config.xml.encoding}"?>
<document>
`;

    // 各画像の結果をXML要素として追加
    for (let i = 0; i < resultsArray.length; i++) {
      const result = resultsArray[i];
      const imageName = imageNames[i] || `image_${i + 1}`;

      // 画像情報
      xml += `  <image name="${imageName}" width="${result.json.document.image.width}" height="${result.json.document.image.height}">\n`;

      // 各検出結果をXML要素として追加
      for (let j = 0; j < result.detections.length; j++) {
        const detection = result.detections[j];
        const [x1, y1, x2, y2] = detection.box;
        const text = this._escapeXml(detection.text || '');

        let attributes = `id="${j + 1}" x="${Math.round(
          x1
        )}" y="${Math.round(y1)}" width="${Math.round(
          x2 - x1
        )}" height="${Math.round(y2 - y1)}"`;

        // 信頼度スコアを含める場合
        if (
          this.config.xml.includeConfidence &&
          detection.score !== undefined
        ) {
          attributes += ` confidence="${detection.score.toFixed(
            4
          )}"`;
        }

        xml += `    <text ${attributes}>${text}</text>\n`;
      }

      // 画像要素を閉じる
      xml += `  </image>\n`;
    }

    // XMLフッター
    xml += `</document>`;

    return xml;
  }

  /**
   * 全ての検出結果を統合したJSON形式で出力を生成
   *
   * @param {Array} resultsArray 複数の処理結果の配列
   * @param {Array} imageNames 画像名の配列
   * @returns {Object} 統合されたJSON形式の出力
   */
  generateCombinedJSON(resultsArray: any[], imageNames: string[] = []): any {
    console.log(
      `出力生成: 統合JSON形式で出力を生成します (${resultsArray.length}ファイル)`
    );

    // 検出結果が空の場合は空のJSONを返す
    if (!resultsArray || resultsArray.length === 0) {
      return {
        document: {
          images: [],
        },
      };
    }

    // 各画像の結果をJSON要素として追加
    const images = [];
    for (let i = 0; i < resultsArray.length; i++) {
      const result = resultsArray[i];
      const imageName = imageNames[i] || `image_${i + 1}`;

      // 画像情報とテキスト要素を取得
      const imageData = result.json.document.image;
      imageData.name = imageName; // 画像名を更新

      images.push(imageData);
    }

    // JSON構造を作成
    const jsonOutput: any = {
      document: {
        images: images,
      },
    };

    // メタデータを含める場合
    if (this.config.json.includeMetadata) {
      jsonOutput.metadata = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        engine: 'NDLKotenOCR Web',
        fileCount: resultsArray.length,
      };
    }

    return jsonOutput;
  }

  /**
   * 全ての検出結果を統合したテキスト形式で出力を生成
   *
   * @param {Array} resultsArray 複数の処理結果の配列
   * @param {Array} imageNames 画像名の配列
   * @returns {string} 統合されたテキスト形式の出力
   */
  generateCombinedTXT(resultsArray: any[], imageNames: string[] = []): string {
    console.log(
      `出力生成: 統合テキスト形式で出力を生成します (${resultsArray.length}ファイル)`
    );

    // 検出結果が空の場合は空の文字列を返す
    if (!resultsArray || resultsArray.length === 0) {
      return '';
    }

    // 各画像の結果のテキストを結合
    let combinedText = '';
    for (let i = 0; i < resultsArray.length; i++) {
      const result = resultsArray[i];
      const imageName = imageNames[i] || `image_${i + 1}`;

      // 画像名をヘッダーとして追加
      combinedText += `===== ${imageName} =====\n`;

      // テキスト結果を追加
      combinedText += result.text;

      // 画像間の区切り
      if (i < resultsArray.length - 1) {
        combinedText += '\n\n';
      }
    }

    return combinedText;
  }

  /**
   * XMLで使用される特殊文字をエスケープ
   *
   * @param {string} str エスケープする文字列
   * @returns {string} エスケープされた文字列
   * @private
   */
  _escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

/**
 * 後方互換性のための関数
 */
export function generateXML(
  detections: any[],
  imageWidth: number,
  imageHeight: number,
  imageName: string = 'image'
): string {
  const generator = new OutputGenerator();
  return generator.generateXML(
    detections,
    imageWidth,
    imageHeight,
    imageName
  );
}

export function generateJSON(
  detections: any[],
  imageWidth: number,
  imageHeight: number,
  imageName: string = 'image'
): any {
  const generator = new OutputGenerator();
  return generator.generateJSON(
    detections,
    imageWidth,
    imageHeight,
    imageName
  );
}

export function generateTXT(detections: any[]): string {
  const generator = new OutputGenerator();
  return generator.generateTXT(detections);
}
