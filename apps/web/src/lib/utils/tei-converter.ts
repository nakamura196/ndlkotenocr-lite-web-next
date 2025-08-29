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
    const textElements: string[] = [];
    
    data.results?.forEach((result, index) => {
      if (result.xml) {
        // Parse the XML to extract text content
        try {
          // XMLをパースして、テキスト要素を抽出
          const parser = new DOMParser();
          const doc = parser.parseFromString(result.xml, 'text/xml');
          
          // テキスト内容を取得
          const textBody = doc.getElementsByTagName('body')[0];
          if (textBody) {
            // pタグの内容を抽出
            const paragraphs = textBody.getElementsByTagName('p');
            for (let i = 0; i < paragraphs.length; i++) {
              const para = paragraphs[i];
              // テキストノードのみを抽出（pb要素は除外）
              const textContent = Array.from(para.childNodes)
                .filter(node => node.nodeType === Node.TEXT_NODE)
                .map(node => node.textContent?.trim())
                .filter(text => text && text.length > 0)
                .join('\n      ');
              
              if (textContent) {
                const imageName = result.imageName || `image-${index + 1}`;
                textElements.push(`    <!-- ${imageName} -->\n    <div>\n      ${textContent}\n    </div>`);
              }
            }
          }
        } catch (error) {
          console.error('Error parsing XML:', error);
          // XMLパースエラーの場合、テキストのみを使用
          if (result.text) {
            const imageName = result.imageName || `image-${index + 1}`;
            textElements.push(`    <!-- ${imageName} -->\n    <div>\n      ${result.text}\n    </div>`);
          }
        }
      } else if (result.text) {
        // XMLがない場合はテキストを直接使用
        const imageName = result.imageName || `image-${index + 1}`;
        textElements.push(`    <!-- ${imageName} -->\n    <div>\n      ${result.text}\n    </div>`);
      }
    });
    
    // Build combined TEI document
    return `<?xml version="1.0" encoding="UTF-8"?>
<TEI xmlns="http://www.tei-c.org/ns/1.0">
  <teiHeader>
    <fileDesc>
      <titleStmt>
        <title>${data.title || 'OCR処理結果'}</title>
      </titleStmt>
      <sourceDesc>
        <p>${data.sourceUrl || 'User uploaded images'}</p>
      </sourceDesc>
    </fileDesc>
  </teiHeader>
  <text>
    <body>
${textElements.join('\n')}
    </body>
  </text>
</TEI>`;
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