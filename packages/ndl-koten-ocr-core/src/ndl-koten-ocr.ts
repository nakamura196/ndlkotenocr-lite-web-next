/**
 * NDLKotenOCR Web版 - メインエントリーポイント
 *
 * このファイルは、NDLKotenOCR Web版のメインエントリーポイントです。
 * 各モジュールを統合し、ブラウザ上でのOCR処理を実行します。
 */

import { RTMDet } from './layout-detector';
import { PARSEQ } from './text-recognizer';
import {
  ReadingOrderProcessor,
  loadConfig as loadReadingOrderConfig,
} from './reading-order';
import {
  OutputGenerator,
  loadConfig as loadOutputConfig,
} from './output-generator';

/**
 * NDLKotenOCR クラス
 * 古典籍OCRの全体処理を管理するクラス
 */
export class NDLKotenOCR {
  private layoutDetector: RTMDet | null = null;
  private textRecognizer: PARSEQ | null = null;
  private readingOrderProcessor: ReadingOrderProcessor | null = null;
  private outputGenerator: OutputGenerator | null = null;
  public initialized: boolean = false;
  // private progress: number = 0; // unused variable removed
  private progressCallback: ((progress: number, message: string) => void) | null = null;
  private configPath: string | null = null;

  /**
   * 初期化処理
   * モデルのロードと初期設定を行います
   */
  async initialize(
    layoutModelPath: string,
    layoutConfig: any = {},
    layoutConfigPath: string | null = null,
    recognizerModelPath: string,
    recognizerConfig: any = {},
    recognizerConfigPath: string | null = null,
    progressCallback: ((progress: number, message: string) => void) | null = null
  ): Promise<void> {
    this.progressCallback = progressCallback;
    this.updateProgress(
      0,
      '初期化中...（初回はモデルのダウンロードに時間がかかります）'
    );
    this.configPath =
      layoutConfigPath || recognizerConfigPath || null;

    try {
      // レイアウト検出器の初期化
      this.layoutDetector = new RTMDet(
        layoutModelPath,
        layoutConfig,
        layoutConfigPath
      );
      await this.layoutDetector.initialize();
      this.updateProgress(
        10,
        'レイアウト認識モデルをロードしました'
      );
      this.updateProgress(
        10,
        '文字認識モデルのロードを開始します...'
      );

      // テキスト認識器の初期化
      this.textRecognizer = new PARSEQ(
        recognizerModelPath,
        recognizerConfig,
        recognizerConfigPath,
        '/config/NDLmoji.yaml' // 文字リストファイルパス（絶対パス）
      );
      await this.textRecognizer.initialize();
      this.updateProgress(
        15,
        '文字認識モデルをロードしました'
      );

      // 読み順処理の設定を読み込む
      const readingOrderConfig = this.configPath
        ? await loadReadingOrderConfig(this.configPath)
        : null;
      this.readingOrderProcessor =
        new ReadingOrderProcessor(readingOrderConfig || { verticalMode: false });
      this.updateProgress(
        20,
        '読み順処理の設定を読み込みました'
      );

      // 出力生成の設定を読み込む
      const outputConfig = this.configPath
        ? await loadOutputConfig(this.configPath)
        : null;
      this.outputGenerator = new OutputGenerator(
        outputConfig
      );
      this.updateProgress(
        30,
        '出力生成の設定を読み込みました'
      );

      this.initialized = true;
    } catch (error) {
      console.error('初期化エラー:', error);
      throw new Error(
        `NDLKotenOCR の初期化に失敗しました: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 進捗状況の更新
   */
  private updateProgress(progress: number, message: string, onProgressCallback?: (progress: number, message: string) => void): void {
    if (this.progressCallback) {
      this.progressCallback(progress, message);
    }
    if (onProgressCallback) {
      onProgressCallback(progress / 100, message);
    }
  }

  /**
   * 画像処理の実行
   */
  async process(imageData: ImageData | HTMLImageElement | HTMLCanvasElement, options: { imageName?: string; onProgress?: (progress: number, message: string) => void } = {}): Promise<any> {
    if (!this.initialized) {
      throw new Error(
        'NDLKotenOCR が初期化されていません。initialize() を先に呼び出してください。'
      );
    }

    this.updateProgress(40, '処理を開始します', options.onProgress);
    // UIの更新を許可するためのマイクロタスク
    await new Promise((resolve) => setTimeout(resolve, 0));

    try {
      // 1. レイアウト検出
      this.updateProgress(45, 'レイアウト検出中...', options.onProgress);
      await new Promise((resolve) =>
        setTimeout(resolve, 0)
      );

      const detections = await this.layoutDetector!.detect(
        imageData
      );
      this.updateProgress(
        50,
        `${detections.length}個のテキスト領域を検出しました`,
        options.onProgress
      );
      await new Promise((resolve) =>
        setTimeout(resolve, 0)
      );

      // 2. テキスト認識
      this.updateProgress(50, '文字認識中...', options.onProgress);
      await new Promise((resolve) =>
        setTimeout(resolve, 0)
      );

      const recognizedDetections = [];
      let count = 0;
      for (const detection of detections) {
        // 検出された領域を切り出し
        const lineImage = this.cropImage(
          imageData,
          detection.box
        );
        // テキスト認識
        const text = await this.textRecognizer!.read(
          lineImage
        );
        recognizedDetections.push({
          ...detection,
          text,
        });

        count++;
        this.updateProgress(
          50 + Math.floor((count / detections.length) * 30),
          `文字認識中... (${count}/${detections.length})`,
          options.onProgress
        );

        // UIの更新を許可するためのマイクロタスク
        await new Promise((resolve) =>
          setTimeout(resolve, 0)
        );
      }

      // 3. 読み順処理
      this.updateProgress(80, '読み順処理中...', options.onProgress);
      await new Promise((resolve) =>
        setTimeout(resolve, 0)
      );

      const orderedDetections =
        this.readingOrderProcessor!.process(
          recognizedDetections,
          'width' in imageData ? imageData.width : (imageData as HTMLImageElement).naturalWidth || (imageData as HTMLCanvasElement).width,
          'height' in imageData ? imageData.height : (imageData as HTMLImageElement).naturalHeight || (imageData as HTMLCanvasElement).height
        );

      // 4. 出力生成
      this.updateProgress(90, '結果生成中...', options.onProgress);
      await new Promise((resolve) =>
        setTimeout(resolve, 0)
      );

      const width = 'width' in imageData ? imageData.width : (imageData as HTMLImageElement).naturalWidth || (imageData as HTMLCanvasElement).width;
      const height = 'height' in imageData ? imageData.height : (imageData as HTMLImageElement).naturalHeight || (imageData as HTMLCanvasElement).height;

      const results = {
        detections: orderedDetections,
        xml: this.outputGenerator!.generateXML(
          orderedDetections,
          width,
          height,
          options.imageName || 'image'
        ),
        json: this.outputGenerator!.generateJSON(
          orderedDetections,
          width,
          height,
          options.imageName || 'image'
        ),
        text: this.outputGenerator!.generateTXT(
          orderedDetections
        ),
      };

      this.updateProgress(100, '処理完了', options.onProgress);
      await new Promise((resolve) =>
        setTimeout(resolve, 0)
      );

      return results;
    } catch (error) {
      console.error('処理エラー:', error);
      throw new Error(
        `画像処理に失敗しました: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 画像から指定された領域を切り出す
   */
  private cropImage(imageData: ImageData | HTMLImageElement | HTMLCanvasElement, box: number[]): ImageData {
    const [x1, y1, x2, y2] = box;
    const width = Math.max(1, Math.round(x2 - x1));
    const height = Math.max(1, Math.round(y2 - y1));

    // 画像のサイズを取得
    let imgWidth: number, imgHeight: number;
    if (imageData instanceof ImageData) {
      imgWidth = imageData.width;
      imgHeight = imageData.height;
    } else {
      imgWidth = (imageData as HTMLImageElement).naturalWidth || (imageData as HTMLCanvasElement).width;
      imgHeight = (imageData as HTMLImageElement).naturalHeight || (imageData as HTMLCanvasElement).height;
    }

    // 座標が画像の範囲内に収まるように調整
    const safeX1 = Math.max(
      0,
      Math.min(imgWidth - 1, Math.round(x1))
    );
    const safeY1 = Math.max(
      0,
      Math.min(imgHeight - 1, Math.round(y1))
    );
    const safeWidth = Math.min(width, imgWidth - safeX1);
    const safeHeight = Math.min(height, imgHeight - safeY1);

    // Canvas要素を作成
    const canvas = document.createElement('canvas');
    canvas.width = safeWidth;
    canvas.height = safeHeight;
    const ctx = canvas.getContext('2d')!;

    // 画像の種類に応じて適切に描画
    if (imageData instanceof ImageData) {
      // ImageDataの場合
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = imageData.width;
      tempCanvas.height = imageData.height;
      const tempCtx = tempCanvas.getContext('2d')!;
      tempCtx.putImageData(imageData, 0, 0);
      ctx.drawImage(
        tempCanvas,
        safeX1,
        safeY1,
        safeWidth,
        safeHeight,
        0,
        0,
        safeWidth,
        safeHeight
      );
    } else {
      // HTMLImageElement または HTMLCanvasElement の場合
      ctx.drawImage(
        imageData,
        safeX1,
        safeY1,
        safeWidth,
        safeHeight,
        0,
        0,
        safeWidth,
        safeHeight
      );
    }

    return ctx.getImageData(0, 0, safeWidth, safeHeight);
  }
}