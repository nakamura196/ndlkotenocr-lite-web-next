// TEI Converter utility
export interface TEIConversionData {
  title?: string;
  sourceUrl?: string;
  results?: any[];
  xml?: string;
  json?: any;
}

export class TEIConverter {
  static convert(data: any): TEIConversionData {
    return {
      xml: data.xml || '',
      json: data.json || {}
    };
  }

  convertOCRResults(data: TEIConversionData): string {
    // If we already have XML from the results, combine them
    if (data.results && data.results.length > 0) {
      const hasXml = data.results.some(r => r.xml);
      if (hasXml) {
        return this.combineTEIResults(data);
      }
    }
    
    // Fallback to default template
    return this.generateXML(data);
  }

  private combineTEIResults(data: TEIConversionData): string {
    const paragraphElements: string[] = [];
    const surfaceElements: string[] = [];
    
    data.results?.forEach((result, index) => {
      const pageNumber = index + 1;
      const imageUrl = result.imageUrl || '';
      const imageName = result.imageName || `image-${pageNumber}`;
      const imageWidth = result.imageWidth || 1000;
      const imageHeight = result.imageHeight || 1000;
      
      // Add page break element
      let pageContent = `        <pb n="${pageNumber}" facs="${imageUrl}"/>\n`;
      
      // Process detections to add line breaks with zone references
      if (result.detections && result.detections.length > 0) {
        result.detections.forEach((detection: any, detIndex: number) => {
          const lineNumber = detIndex + 1;
          const zoneId = `zone-${pageNumber}-${lineNumber}`;
          const text = detection.text || '';
          
          if (text) {
            pageContent += `        <lb n="${pageNumber}.${lineNumber}" type="line" corresp="#${zoneId}"/>\n`;
            pageContent += `        ${this._escapeXml(text)}\n`;
          }
        });
        
        // Create surface element with zones
        let surfaceXml = `    <surface sameAs="${imageUrl}" ulx="0" uly="0" lrx="${imageWidth}" lry="${imageHeight}">\n`;
        surfaceXml += `      <graphic url="${imageUrl}" width="${imageWidth}px" height="${imageHeight}px"/>\n`;
        
        result.detections.forEach((detection: any, detIndex: number) => {
          const lineNumber = detIndex + 1;
          const zoneId = `zone-${pageNumber}-${lineNumber}`;
          const bbox = detection.bbox || [0, 0, 100, 100];
          
          surfaceXml += `      <zone xml:id="${zoneId}" ulx="${Math.round(bbox[0])}" uly="${Math.round(bbox[1])}" lrx="${Math.round(bbox[2])}" lry="${Math.round(bbox[3])}"/>\n`;
        });
        
        surfaceXml += `    </surface>`;
        surfaceElements.push(surfaceXml);
      } else if (result.text) {
        // Fallback: if no detections but has text, add lines without zones
        const lines = result.text.split('\n');
        lines.forEach((line: string, lineIndex: number) => {
          if (line.trim()) {
            const lineNumber = lineIndex + 1;
            pageContent += `        <lb n="${pageNumber}.${lineNumber}" type="line"/>\n`;
            pageContent += `        ${this._escapeXml(line.trim())}\n`;
          }
        });
      }
      
      paragraphElements.push(pageContent);
    });
    
    // Build combined TEI document
    let tei = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-model href="http://www.tei-c.org/release/xml/tei/custom/schema/relaxng/tei_all.rng" type="application/xml" schematypens="http://relaxng.org/ns/structure/1.0"?>
<?xml-model href="http://www.tei-c.org/release/xml/tei/custom/schema/relaxng/tei_all.rng" type="application/xml" schematypens="http://purl.oclc.org/dsdl/schematron"?>
<TEI xmlns="http://www.tei-c.org/ns/1.0">
  <teiHeader>
    <fileDesc>
      <titleStmt>
        <title>${this._escapeXml(data.title || 'OCR処理結果')}</title>
        <respStmt>
          <resp>Automated Transcription</resp>
          <name ref="https://github.com/ndl-lab/ndlkotenocr-lite">NDL古典籍OCR-Liteアプリケーション</name>
        </respStmt>
      </titleStmt>
      <publicationStmt>
        <p>${data.sourceUrl?.startsWith('http') ? 'Converted from IIIF Manifest' : 'Converted from uploaded images'}</p>
      </publicationStmt>
      <sourceDesc>
        <p>${this._escapeXml(data.sourceUrl || 'User uploaded images')}</p>
      </sourceDesc>
    </fileDesc>
  </teiHeader>
  <text>
    <body>
      <p>
${paragraphElements.join('')}      </p>
    </body>
  </text>`;
    
    // Add facsimile section if we have surface elements
    if (surfaceElements.length > 0) {
      const facsimileAttr = data.sourceUrl?.startsWith('http') ? ` sameAs="${this._escapeXml(data.sourceUrl)}"` : '';
      tei += `
  <facsimile${facsimileAttr}>
${surfaceElements.join('\n')}
  </facsimile>`;
    }
    
    tei += '\n</TEI>';
    
    return tei;
  }
  
  private _escapeXml(text: string): string {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private generateXML(data: TEIConversionData): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<TEI xmlns="http://www.tei-c.org/ns/1.0">
  <teiHeader>
    <fileDesc>
      <titleStmt>
        <title>${data.title || 'OCR Results'}</title>
      </titleStmt>
    </fileDesc>
  </teiHeader>
  <text>
    <body>
      <!-- OCR results would be inserted here -->
    </body>
  </text>
</TEI>`;
  }
}