# NDL Koten OCR Core

Core OCR library for ancient Japanese text recognition, powered by ONNX Runtime.

## Installation

```bash
npm install ndl-koten-ocr-core
```

## Usage

```typescript
import { NDLKotenOCR } from 'ndl-koten-ocr-core';

// Initialize the OCR engine
const ocr = new NDLKotenOCR();
await ocr.initialize(
  'path/to/layout-model.onnx',
  layoutConfig,
  'path/to/layout-config.yaml',
  'path/to/recognizer-model.onnx',
  recognizerConfig,
  'path/to/recognizer-config.yaml'
);

// Process an image
const result = await ocr.process(imageData, {
  imageName: 'document.jpg'
});

// Access results
console.log(result.text); // Plain text output
console.log(result.json); // JSON format
console.log(result.xml);  // XML format
```

## Features

- **Layout Detection**: RTMDet-based text region detection
- **Text Recognition**: PARSEQ-based character recognition
- **Reading Order Processing**: Automatic text ordering for vertical/horizontal layouts
- **Multiple Output Formats**: XML, JSON, and plain text
- **Browser Compatible**: Runs entirely in the browser using WebAssembly

## API

### NDLKotenOCR

Main OCR class for processing images.

#### Methods

- `initialize(layoutModelPath, layoutConfig, layoutConfigPath, recognizerModelPath, recognizerConfig, recognizerConfigPath, progressCallback?)`: Initialize the OCR engine with models
- `process(imageData, options?)`: Process an image and return OCR results

### RTMDet

Layout detection module for identifying text regions.

### PARSEQ

Text recognition module for extracting characters from text regions.

### ReadingOrderProcessor

Module for determining the correct reading order of detected text.

### OutputGenerator

Module for generating various output formats.

## License

MIT