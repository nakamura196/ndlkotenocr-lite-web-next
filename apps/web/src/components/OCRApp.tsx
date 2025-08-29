'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { NDLKotenOCR } from 'ndl-koten-ocr-core'
import { convertPresentation2 } from "@iiif/parser/presentation-2"
import { TEIConverter, type TEIConversionData } from '@/lib/utils/tei-converter'

interface ProcessedResult {
  detections: any[]
  xml: string
  json: any
  text: string
  tei?: string
  imageName?: string
  imageWidth?: number
  imageHeight?: number
}

interface ImageInfo {
  element: HTMLDivElement
  dataUrl: string
  file: File
  width?: number
  height?: number
}

interface IIIFImageInfo {
  canvasId: string
  imageUrl: string
  thumbnailUrl?: string
  label: string
  index: number
}

export default function OCRApp() {
  const [selectedImages, setSelectedImages] = useState<ImageInfo[]>([])
  const [processedResults, setProcessedResults] = useState<ProcessedResult[]>([])
  const [currentResultIndex, setCurrentResultIndex] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [imageProgress, setImageProgress] = useState(0)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [totalImages, setTotalImages] = useState(0)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [shouldStop, setShouldStop] = useState(false)
  const [activeTab, setActiveTab] = useState('text')
  const [isDragging, setIsDragging] = useState(false)
  const [copiedTab, setCopiedTab] = useState<string | null>(null)
  const [iiifUrl, setIiifUrl] = useState('')
  const [iiifManifest, setIiifManifest] = useState<any>(null)
  const [iiifImages, setIiifImages] = useState<IIIFImageInfo[]>([])
  const [iiifLoading, setIiifLoading] = useState(false)
  const [inputMode, setInputMode] = useState<'file' | 'iiif'>('iiif')
  const [selectedImageCount, setSelectedImageCount] = useState<number>(10)
  const [selectedIiifImages, setSelectedIiifImages] = useState<IIIFImageInfo[]>([])
  const [imageProgressMessages, setImageProgressMessages] = useState<{ [key: number]: string }>({})
  
  const imageUploadRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ocrRef = useRef<NDLKotenOCR | null>(null)
  const uploadSectionRef = useRef<HTMLDivElement>(null)

  // OCRインスタンスの初期化
  const initializeOCR = useCallback(async () => {
    if (!ocrRef.current) {
      ocrRef.current = new NDLKotenOCR()
    }
    
    if (!ocrRef.current.initialized) {
      const updateProgress = (progress: number, message: string) => {
        setProgress(progress)
        setLoadingMessage(message)
      }

      await ocrRef.current.initialize(
        '/models/rtmdet-s-1280x1280.onnx',
        {},
        '/config/ndl.yaml',
        '/models/parseq-ndl-32x384-tiny-10.onnx',
        {},
        '/config/ndl.yaml',
        updateProgress
      )
    }
  }, [])

  // サムネイル生成
  const createThumbnail = useCallback((file: File, index: number): Promise<ImageInfo> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = function (event) {
        const thumbnailWrapper = document.createElement('div')
        thumbnailWrapper.className = 'relative group cursor-pointer transition-all duration-300 hover:scale-105'

        const thumbnail = document.createElement('img')
        thumbnail.className = 'w-full h-32 object-cover rounded-lg shadow-md group-hover:shadow-xl transition-shadow duration-300'
        thumbnail.src = event.target?.result as string
        thumbnail.alt = `画像 ${index + 1}`
        
        // 実際の画像サイズを取得
        thumbnail.onload = () => {
          const label = document.createElement('div')
          label.className = 'mt-2 text-xs text-center text-gray-600 dark:text-gray-400 truncate px-1'
          label.textContent = file.name.length > 15
            ? file.name.substring(0, 12) + '...'
            : file.name

          thumbnailWrapper.appendChild(thumbnail)
          thumbnailWrapper.appendChild(label)

          resolve({
            element: thumbnailWrapper,
            dataUrl: event.target?.result as string,
            file: file,
            width: thumbnail.naturalWidth,
            height: thumbnail.naturalHeight
          })
        }
      }
      reader.readAsDataURL(file)
    })
  }, [])

  // 画像選択処理
  const handleImageSelect = useCallback(async (files: FileList) => {
    const imageFiles = Array.from(files).filter(file => file.type.match('image.*'))
    if (imageFiles.length === 0) return

    const thumbnailPromises = imageFiles.map((file, index) => createThumbnail(file, index))
    const thumbnails = await Promise.all(thumbnailPromises)
    setSelectedImages(thumbnails)
    setShowResults(false)
    setProcessedResults([])
    // IIIFの結果もクリア
    setSelectedIiifImages([])
    setIiifManifest(null)
  }, [createThumbnail])

  // ドラッグ＆ドロップ処理
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleImageSelect(e.dataTransfer.files)
  }, [handleImageSelect])

  // IIIF マニフェスト処理
  const fetchAndConvertIiifManifest = useCallback(async (manifestUrl: string) => {
    setIiifLoading(true)
    // 前の結果をクリア
    setShowResults(false)
    setProcessedResults([])
    setSelectedImages([])
    try {
      const response = await fetch(manifestUrl)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const manifestJson = await response.json()
      
      // v2の場合はv3に変換
      let convertedManifest = manifestJson
      if (manifestJson['@context']?.includes('iiif.io/api/presentation/2/context.json')) {
        convertedManifest = convertPresentation2(manifestJson)
      }
      
      setIiifManifest(convertedManifest)
      
      // マニフェストから画像情報を抽出してリスト作成（ダウンロードはしない）
      if (convertedManifest?.items) {
        const imageInfos: IIIFImageInfo[] = []
        
        convertedManifest.items.forEach((canvas: any, canvasIndex: number) => {
          
          // サムネイルURLの取得
          let thumbnailUrl: string | undefined
          if (canvas.thumbnail) {
            // v3形式のサムネイル
            if (Array.isArray(canvas.thumbnail) && canvas.thumbnail[0]) {
              thumbnailUrl = canvas.thumbnail[0].id || canvas.thumbnail[0]
            } else if (typeof canvas.thumbnail === 'string') {
              thumbnailUrl = canvas.thumbnail
            } else if (canvas.thumbnail.id) {
              thumbnailUrl = canvas.thumbnail.id
            }
          }
          
          if (canvas.items?.[0]?.items) {
            canvas.items[0].items.forEach((annotation: any) => {
              if (annotation.body?.id) {
                const imageUrl = annotation.body.id
                const label = canvas.label?.ja?.[0] || canvas.label?.en?.[0] || canvas.label?.none?.[0] || `Page ${canvasIndex + 1}`
                
                // サムネイルが無い場合は、画像URLを小さいサイズで要求
                if (!thumbnailUrl && imageUrl.includes('/full/full/')) {
                  thumbnailUrl = imageUrl.replace('/full/full/', '/full/200,/') 
                } else if (!thumbnailUrl) {
                  thumbnailUrl = imageUrl
                }
                
                imageInfos.push({
                  canvasId: canvas.id,
                  imageUrl: imageUrl,
                  thumbnailUrl: thumbnailUrl,
                  label: label,
                  index: canvasIndex
                })
              }
            })
          }
        })
        
        setIiifImages(imageInfos)
        
        // 初期選択：最初のN枚を自動選択
        const initialSelection = imageInfos.slice(0, Math.min(selectedImageCount, imageInfos.length))
        setSelectedIiifImages(initialSelection)
        
        // ファイルアップロードの結果もクリア
        setSelectedImages([])
        setShowResults(false)
        setProcessedResults([])
        
        if (imageInfos.length === 0) {
          alert('このマニフェストには画像が見つかりませんでした')
        }
      } else {
        alert('マニフェストにアイテムが見つかりませんでした')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`IIIFマニフェストの取得または変換に失敗しました: ${errorMessage}`)
    } finally {
      setIiifLoading(false)
    }
  }, [selectedImageCount])

  const handleIiifSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (iiifUrl.trim()) {
      fetchAndConvertIiifManifest(iiifUrl.trim())
    } else {
      alert('URLを入力してください')
    }
  }, [iiifUrl, fetchAndConvertIiifManifest])

  // クライアントサイド画像処理
  const processImagesOnClient = useCallback(async () => {
    if (selectedImages.length === 0) return

    setIsProcessing(true)
    setProgress(0)
    setImageProgressMessages({})
    setLoadingMessage('クライアントでOCRエンジンを初期化中...')

    try {
      await initializeOCR()

      const results: ProcessedResult[] = []
      for (let i = 0; i < selectedImages.length; i++) {
        setCurrentImageIndex(i + 1)
        setTotalImages(selectedImages.length)
        setImageProgress(0)
        setLoadingMessage(`画像 ${i + 1}/${selectedImages.length} をクライアントで処理中...`)
        
        const image = new window.Image()
        await new Promise((resolve, reject) => {
          image.onload = () => {
            // Ensure naturalWidth/naturalHeight are available
            if (image.naturalWidth === 0 || image.naturalHeight === 0) {
              reject(new Error('Image dimensions not available'))
            } else {
              resolve(undefined)
            }
          }
          image.onerror = reject
          image.src = selectedImages[i].dataUrl
        })


        const result = await ocrRef.current!.process(image, {
          imageName: selectedImages[i].file.name,
          onProgress: (prog: number, message: string) => {
            setImageProgress(prog * 100)
            setImageProgressMessages(prev => ({
              ...prev,
              [i]: message
            }))
          }
        })
        
        
        results.push(result)
        setProgress(((i + 1) / selectedImages.length) * 100)
      }

      setProcessedResults(results)
      setShowResults(true)
      setCurrentResultIndex(0)
      setActiveTab('text')
    } catch (error) {
      alert('画像処理中にエラーが発生しました')
    } finally {
      setIsProcessing(false)
    }
  }, [selectedImages, initializeOCR])

  // IIIF画像のOCR処理
  const processIiifImages = useCallback(async () => {
    if (selectedIiifImages.length === 0) return

    setIsProcessing(true)
    setProgress(0)
    setImageProgressMessages({})
    setLoadingMessage('IIIF画像をダウンロード中...')

    try {
      // まず選択された画像をダウンロードしてImageInfo配列を作成
      const thumbnails: ImageInfo[] = []
      for (let i = 0; i < selectedIiifImages.length; i++) {
        const imageInfo = selectedIiifImages[i]
        setLoadingMessage(`画像 ${i + 1}/${selectedIiifImages.length} をダウンロード中...`)
        setProgress((i / selectedIiifImages.length) * 40) // 40%まではダウンロード

        const response = await fetch(imageInfo.imageUrl)
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`)
        }
        
        const blob = await response.blob()
        const file = new File([blob], `${imageInfo.label}.jpg`, { type: blob.type || 'image/jpeg' })
        const thumbnail = await createThumbnail(file, i)
        thumbnails.push(thumbnail)
      }
      
      setSelectedImages(thumbnails)
      setProgress(40)
      
      // クライアント処理
      setLoadingMessage('クライアントでOCRエンジンを初期化中...')
      await initializeOCR()
      
      const results: ProcessedResult[] = []
      setShouldStop(false)
      
      for (let i = 0; i < thumbnails.length; i++) {
        if (shouldStop) {
          setLoadingMessage('処理を中止しました')
          break
        }
        setCurrentImageIndex(i + 1)
        setTotalImages(thumbnails.length)
        setImageProgress(0)
        setLoadingMessage(`画像 ${i + 1}/${thumbnails.length} をクライアントで処理中...`)
        setProgress(40 + ((i + 1) / thumbnails.length) * 60) // 40%から100%まで
        
        const image = new window.Image()
        await new Promise((resolve, reject) => {
          image.onload = () => {
            // Ensure naturalWidth/naturalHeight are available
            if (image.naturalWidth === 0 || image.naturalHeight === 0) {
              reject(new Error('Image dimensions not available'))
            } else {
              resolve(undefined)
            }
          }
          image.onerror = reject
          image.src = thumbnails[i].dataUrl
        })
        
        
        const result = await ocrRef.current!.process(image, {
          imageName: thumbnails[i].file.name,
          onProgress: (prog: number, message: string) => {
            setImageProgress(prog * 100)
            setImageProgressMessages(prev => ({
              ...prev,
              [i]: message
            }))
          }
        })
        
        results.push(result)
        setProcessedResults([...results]) // リアルタイム更新
        setShowResults(true)
      }
      
      setProcessedResults(results)
      setShowResults(true)
      setCurrentResultIndex(0)
      setActiveTab('text')

    } catch (error) {
      alert(`IIIF画像の処理中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
    } finally {
      setIsProcessing(false)
    }
  }, [selectedIiifImages, initializeOCR, createThumbnail, shouldStop])

  // 統合処理関数
  const processImages = useCallback(async () => {
    await processImagesOnClient()
  }, [processImagesOnClient])

  // 結果の描画
  const drawDetections = useCallback((imageIndex: number) => {
    if (!canvasRef.current || !selectedImages[imageIndex] || !processedResults[imageIndex]) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new window.Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      // 検出された領域を描画
      const detections = processedResults[imageIndex].detections
      detections.forEach((detection: any, index: number) => {
        const [x1, y1, x2, y2] = detection.box
        
        // ボックスを描画
        ctx.strokeStyle = `hsl(${(index * 30) % 360}, 70%, 50%)`
        ctx.lineWidth = 2
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1)

        // テキストを描画
        ctx.fillStyle = 'white'
        ctx.fillRect(x1, y1 - 20, ctx.measureText(detection.text).width + 10, 20)
        ctx.fillStyle = 'black'
        ctx.font = '14px sans-serif'
        ctx.fillText(detection.text, x1 + 5, y1 - 5)
      })
    }
    img.src = selectedImages[imageIndex].dataUrl
  }, [selectedImages, processedResults])

  useEffect(() => {
    if (showResults) {
      drawDetections(currentResultIndex)
    }
  }, [showResults, currentResultIndex, drawDetections])

  // TEI XML生成
  const generateTEIXML = useCallback(() => {
    if (!processedResults.length) return ''

    const teiConverter = new TEIConverter()
    const conversionData: TEIConversionData = {
      title: iiifManifest?.label ? 
        (typeof iiifManifest.label === 'string' ? iiifManifest.label : 
         iiifManifest.label.ja?.[0] || iiifManifest.label.en?.[0] || 'OCR処理結果') : 
        'OCR処理結果',
      sourceUrl: iiifUrl || 'User uploaded images',
      results: processedResults.map((result, index) => ({
        ...result,
        imageName: selectedImages[index]?.file.name || `image-${index + 1}`,
        imageWidth: selectedImages[index]?.width || 1000,
        imageHeight: selectedImages[index]?.height || 1000,
        imageUrl: inputMode === 'iiif' && selectedIiifImages[index] ? selectedIiifImages[index].imageUrl : undefined
      }))
    }

    return teiConverter.convertOCRResults(conversionData)
  }, [processedResults, selectedImages, iiifManifest, iiifUrl, inputMode, selectedIiifImages])

  // コピー機能
  const handleCopy = useCallback((content: string, tabName: string) => {
    navigator.clipboard.writeText(content)
    setCopiedTab(tabName)
    setTimeout(() => setCopiedTab(null), 2000)
  }, [])

  // ダウンロード機能
  const handleDownload = useCallback((format: 'text' | 'json' | 'xml' | 'tei') => {
    if (!processedResults[currentResultIndex] && format !== 'tei') return

    // タイムスタンプを生成
    const now = new Date()
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5) // YYYY-MM-DDTHH-MM-SS

    let content = ''
    let mimeType = ''
    let extension = ''
    let fileName = ''

    if (format === 'tei') {
      // TEIは全結果を含むため、プロジェクト名を使用
      content = generateTEIXML()
      mimeType = 'application/xml;charset=utf-8'
      extension = '.xml'
      fileName = `ocr_results_tei_${timestamp}`
    } else {
      const result = processedResults[currentResultIndex]
      const baseName = selectedImages[currentResultIndex].file.name.replace(/\.[^/.]+$/, '')
      
      switch (format) {
        case 'text':
          content = result.text
          mimeType = 'text/plain;charset=utf-8'
          extension = '.txt'
          break
        case 'json':
          content = JSON.stringify(result.json, null, 2)
          mimeType = 'application/json'
          extension = '.json'
          break
        case 'xml':
          content = result.xml
          mimeType = 'application/xml'
          extension = '.xml'
          break
      }
      fileName = `${baseName}_ocr_${timestamp}${extension}`
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
  }, [processedResults, currentResultIndex, selectedImages, generateTEIXML])

  const tabClasses = (isActive: boolean) => `
    px-6 py-3 rounded-t-xl font-semibold transition-all duration-200
    ${isActive 
      ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-t-4 border-t-blue-700 dark:border-t-blue-500 shadow-lg transform -translate-y-1' 
      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-800 dark:hover:text-gray-100'}
  `

  return (
    <main className="min-h-screen p-8 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        
        {/* Hero Section - Top page only */}
        <div className="text-center mb-12 animate-slide-up">
          <h1 className="text-5xl font-bold mb-4">
            <span className="text-gradient">NDL古典籍OCR Next.js版</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 text-balance">
            本アプリは <a href="https://github.com/ndl-lab/ndlkotenocr-lite" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">NDL古典籍OCR-lite</a> のNext.js移植版です。
          </p>
        </div>

        {/* Input Mode Toggle */}
        <div className="card p-6 mb-6 animate-slide-up">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 text-center">入力方法</h3>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  setInputMode('file')
                  // IIIFの結果をクリア
                  setSelectedIiifImages([])
                  setIiifManifest(null)
                  setShowResults(false)
                  setProcessedResults([])
                }}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                  inputMode === 'file'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                ファイルアップロード
              </button>
              <button
                onClick={() => {
                  setInputMode('iiif')
                  // ファイルアップロードの結果をクリア
                  setSelectedImages([])
                  setShowResults(false)
                  setProcessedResults([])
                }}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                  inputMode === 'iiif'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                IIIFマニフェスト
              </button>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 text-center">処理方法</h3>
            <div className="flex justify-center gap-4">
              <button
                disabled
                className="px-6 py-3 rounded-lg font-semibold bg-green-600 text-white shadow-lg"
              >
                クライアント処理
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
              ブラウザ上でOCR処理を実行（プライベート、初回読み込み時間あり）
            </p>
          </div>
        </div>

        {/* IIIF Input Section */}
        {inputMode === 'iiif' && (
          <div className="card p-8 mb-8 animate-slide-up">
            <form onSubmit={handleIiifSubmit} className="space-y-4">
              <div>
                <label htmlFor="iiif-url" className="block text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  IIIF Manifest URL (v2/v3対応)
                </label>
                <div className="relative">
                  <input
                    id="iiif-url"
                    type="url"
                    value={iiifUrl}
                    onChange={(e) => setIiifUrl(e.target.value)}
                    placeholder="https://catalog.lib.kyushu-u.ac.jp/image/manifest/1/820/411193.json"
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl 
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent
                             placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIiifUrl('https://catalog.lib.kyushu-u.ac.jp/image/manifest/1/820/411193.json')}
                    className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 
                             text-gray-700 dark:text-gray-300 rounded-lg transition-colors duration-200"
                  >
                    例を入力
                  </button>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    九州大学附属図書館のサンプル
                  </span>
                </div>
              </div>
              <button
                type="submit"
                disabled={iiifLoading || !iiifUrl.trim()}
                className="w-full px-6 py-4 text-lg font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 
                         hover:from-blue-700 hover:to-blue-800 rounded-xl shadow-lg hover:shadow-xl 
                         transform hover:scale-105 transition-all duration-200 disabled:opacity-50 
                         disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
              >
                {iiifLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    マニフェストを読み込み中...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                    マニフェストを読み込む
                  </span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* IIIF Image List */}
        {inputMode === 'iiif' && iiifImages.length > 0 && (
          <div className="card p-8 mb-8 animate-slide-up">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
              マニフェストから {iiifImages.length} 枚の画像を検出
            </h3>
            
            {/* Image count selector */}
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  処理する画像数を選択:
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max={Math.min(iiifImages.length, 100)}
                    value={selectedImageCount}
                    onChange={(e) => {
                      const count = parseInt(e.target.value)
                      setSelectedImageCount(count)
                      setSelectedIiifImages(iiifImages.slice(0, count))
                    }}
                    className="w-48"
                  />
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400 min-w-[3rem] text-right">
                    {selectedImageCount}枚
                  </span>
                </div>
              </div>
              <div className="mt-2 flex gap-2">
                {[5, 10, 20, 50, 100].map(count => (
                  count <= iiifImages.length && (
                    <button
                      key={count}
                      onClick={() => {
                        setSelectedImageCount(count)
                        setSelectedIiifImages(iiifImages.slice(0, count))
                      }}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        selectedImageCount === count
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {count}枚
                    </button>
                  )
                ))}
                <button
                  onClick={() => {
                    setSelectedImageCount(iiifImages.length)
                    setSelectedIiifImages(iiifImages)
                  }}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    selectedImageCount === iiifImages.length
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  全て ({iiifImages.length}枚)
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6 max-h-96 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              {iiifImages.map((imageInfo, index) => {
                const isSelected = index < selectedImageCount
                return (
                <div 
                  key={imageInfo.canvasId} 
                  className={`rounded-lg p-2 text-center transition-all ${
                    isSelected 
                      ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500' 
                      : 'bg-gray-100 dark:bg-gray-700 opacity-50'
                  }`}
                >
                  {imageInfo.thumbnailUrl ? (
                    <img 
                      src={imageInfo.thumbnailUrl} 
                      alt={imageInfo.label || `Page ${index + 1}`}
                      className="w-full h-32 object-contain rounded mb-2"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gray-200 dark:bg-gray-600 rounded mb-2 flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                    {imageInfo.label || `Page ${index + 1}`}
                  </p>
                  {isSelected && (
                    <div className="mt-1">
                      <span className="inline-block px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                        {index + 1}
                      </span>
                    </div>
                  )}
                </div>
                )
              })}
            </div>
            
            {/* Process Button for IIIF */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => processIiifImages()}
                disabled={isProcessing}
                className="px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-green-600 to-green-700 
                         hover:from-green-700 hover:to-green-800 rounded-xl shadow-lg hover:shadow-xl 
                         transform hover:scale-105 transition-all duration-200 disabled:opacity-50 
                         disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    OCR処理中...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    選択した{selectedImageCount}枚の画像をOCR処理
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* File Upload Section */}
        {inputMode === 'file' && (
          <div className="card p-8 mb-8 animate-slide-up">
          <div
            ref={uploadSectionRef}
            className={`
              border-2 border-dashed rounded-2xl p-12 text-center
              transition-all duration-300 cursor-pointer
              ${isDragging 
                ? 'border-blue-600 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20 scale-105' 
                : 'border-gray-300 bg-gray-50 hover:border-blue-600 hover:bg-blue-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-blue-400 dark:hover:bg-blue-900/20'}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => imageUploadRef.current?.click()}
          >
            <div className="mb-6">
              <svg className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              画像をドラッグ＆ドロップまたはクリックして選択
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              対応形式: PNG, JPEG, GIF, WebP
            </p>
            <input
              ref={imageUploadRef}
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => e.target.files && handleImageSelect(e.target.files)}
              className="hidden"
            />
          </div>

          {/* Thumbnails */}
          {selectedImages.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                選択された画像 ({selectedImages.length}枚)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {selectedImages.map((img, index) => (
                  <div
                    key={index}
                    dangerouslySetInnerHTML={{ __html: img.element.outerHTML }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Process Button */}
          {selectedImages.length > 0 && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={processImages}
                disabled={isProcessing}
                className="px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-green-600 to-green-700 
                         hover:from-green-700 hover:to-green-800 rounded-xl shadow-lg hover:shadow-xl 
                         transform hover:scale-105 transition-all duration-200 disabled:opacity-50 
                         disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    OCR処理中...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    OCR処理を開始
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
        )}

        {/* Progress Bar with Stop Button */}
        {(isProcessing || iiifLoading) && (
          <div className="card p-6 mb-8 animate-slide-up">
            <div className="mb-4">
              {/* Overall Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span className="text-gray-600 dark:text-gray-300 font-semibold">
                    全体の進捗: {currentImageIndex > 0 ? `${currentImageIndex}/${totalImages}枚` : ''}
                  </span>
                  <span className="text-gray-600 dark:text-gray-300">{Math.round(progress)}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              
              {/* Current Image Progress */}
              {currentImageIndex > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span className="text-gray-600 dark:text-gray-300">
                      {imageProgressMessages[currentImageIndex - 1] || loadingMessage}
                    </span>
                    <span className="text-gray-600 dark:text-gray-300">{Math.round(imageProgress)}%</span>
                  </div>
                  <div className="progress-bar h-2">
                    <div 
                      className="progress-fill"
                      style={{ width: `${imageProgress}%` }}
                    />
                  </div>
                </div>
              )}
              
              {/* Stop Button */}
              <div className="flex justify-center mt-4">
                <button
                  onClick={() => setShouldStop(true)}
                  className="px-6 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 
                           rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 
                           transition-all duration-200"
                >
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    処理を中止
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Live Results Section - Vertical Display */}
        {(showResults || isProcessing) && selectedImages.length > 0 && (
          <div className="card p-8 animate-slide-up">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">
              OCR処理結果
            </h2>

            {/* Vertical Image and Result List */}
            <div className="space-y-8">
              {selectedImages.map((image, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Image Thumbnail */}
                    <div className="flex justify-center">
                      <div dangerouslySetInnerHTML={{ __html: image.element.outerHTML }} />
                    </div>
                    
                    {/* OCR Result */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        画像 {index + 1}: {image.file.name}
                      </h3>
                      
                      {processedResults[index] ? (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono max-h-40 overflow-y-auto">
                            {processedResults[index].text || '(テキストが検出されませんでした)'}
                          </pre>
                        </div>
                      ) : (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          {isProcessing && currentImageIndex - 1 === index ? (
                            <div className="flex items-center">
                              <svg className="animate-spin h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span className="text-gray-600 dark:text-gray-400">処理中...</span>
                            </div>
                          ) : isProcessing && currentImageIndex - 1 < index ? (
                            <span className="text-gray-500 dark:text-gray-400">待機中</span>
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400">未処理</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Download All Results Button */}
            {processedResults.length > 0 && (
              <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">全結果をダウンロード</h3>
                <div className="flex flex-wrap justify-center gap-4">
                  <button
                    onClick={() => {
                      const now = new Date()
                      const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5)
                      const allText = processedResults.map((r, i) => 
                        `=== 画像${i + 1}: ${selectedImages[i].file.name} ===\n${r.text}\n`
                      ).join('\n')
                      const blob = new Blob([allText], { type: 'text/plain' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `all_results_${timestamp}.txt`
                      a.click()
                      URL.revokeObjectURL(url)
                    }}
                    className="px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 
                             hover:from-blue-700 hover:to-blue-800 rounded-xl shadow-lg hover:shadow-xl 
                             transform hover:scale-105 transition-all duration-200 flex items-center gap-2 min-w-[200px] justify-center"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    テキストでダウンロード
                  </button>
                  <button
                    onClick={() => handleDownload('tei')}
                    className="px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-purple-700 
                             hover:from-purple-700 hover:to-purple-800 rounded-xl shadow-lg hover:shadow-xl 
                             transform hover:scale-105 transition-all duration-200 flex items-center gap-2 min-w-[200px] justify-center"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    TEI/XMLでダウンロード
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
      </div>
      
    </main>
  )
}