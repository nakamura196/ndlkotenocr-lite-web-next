/**
 * @swagger
 * /api/ocr:
 *   post:
 *     tags:
 *       - OCR
 *     summary: 画像に対してOCR処理を実行
 *     description: アップロードされた画像に対して古典籍文字認識を実行し、結果を返します
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: OCR処理を実行する画像ファイル
 *             required:
 *               - image
 *     responses:
 *       200:
 *         description: OCR処理が正常に完了
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: 不正なリクエスト
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: サーバーエラー
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   get:
 *     tags:
 *       - Documentation
 *     summary: API情報を取得
 *     description: NDL古典籍OCR APIの基本情報とエンドポイント一覧を返します
 *     responses:
 *       200:
 *         description: API情報
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "NDL古典籍OCR API"
 *                 endpoints:
 *                   type: object
 *                   additionalProperties:
 *                     type: string
 */

import { NextRequest, NextResponse } from 'next/server'
import { NDLKotenOCR } from 'ndl-koten-ocr-core'
import sharp from 'sharp'

let ocrInstance: NDLKotenOCR | null = null

async function initializeOCR() {
  if (!ocrInstance) {
    ocrInstance = new NDLKotenOCR()
  }
  
  if (!ocrInstance.initialized) {
    const { join } = await import('path')
    const publicDir = join(process.cwd(), 'public')
    
    await ocrInstance.initialize(
      join(publicDir, 'models/rtmdet-s-1280x1280.onnx'),
      {},
      join(publicDir, 'config/ndl.yaml'),
      join(publicDir, 'models/parseq-ndl-32x384-tiny-10.onnx'),
      {},
      join(publicDir, 'config/ndl.yaml'),
      (progress: number, message: string) => {
        console.log(`OCR初期化中: ${message} (${progress}%)`)
      }
    )
  }
  
  return ocrInstance
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File
    
    if (!file) {
      return NextResponse.json(
        { error: '画像ファイルが見つかりません' },
        { status: 400 }
      )
    }

    // ファイルをBufferに変換
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    try {
      // OCRインスタンスを初期化
      const ocr = await initializeOCR()
      
      // sharpを使って画像を処理し、raw pixelデータを取得
      const image = sharp(buffer)
      const metadata = await image.metadata()
      const { data, info } = await image
        .raw()
        .ensureAlpha()
        .toBuffer({ resolveWithObject: true })
      
      // ImageDataオブジェクトを作成
      const imageData = {
        data: new Uint8ClampedArray(data),
        width: info.width,
        height: info.height
      } as ImageData
      
      // OCR処理実行
      const result = await ocr.process(imageData, {
        imageName: file.name
      })
      
      return NextResponse.json({
        success: true,
        data: {
          detections: result.detections,
          xml: result.xml,
          json: result.json,
          text: result.text
        }
      })
      
    } catch (processingError) {
      throw processingError
    }
    
  } catch (error) {
    console.error('OCR処理エラー:', error)
    return NextResponse.json(
      { 
        error: 'OCR処理中にエラーが発生しました',
        details: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'NDL古典籍OCR API',
    endpoints: {
      'POST /api/ocr': '画像をアップロードしてOCR処理を実行'
    }
  })
}