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
    const facsimileElements: string[] = [];
    const surfaceElements: string[] = [];
    
    data.results?.forEach((result, index) => {
      if (result.xml) {
        // Extract surface elements from individual TEI documents
        const parser = new DOMParser();
        const doc = parser.parseFromString(result.xml, 'text/xml');
        
        // Get surface elements
        const surfaces = doc.getElementsByTagName('surface');
        if (surfaces.length > 0) {
          for (let i = 0; i < surfaces.length; i++) {
            const surface = surfaces[i];
            // Update the xml:id to make it unique across all results
            surface.setAttribute('xml:id', `surface_${index}_${i}`);
            surfaceElements.push(surface.outerHTML);
          }
        }
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
  <facsimile>
    ${surfaceElements.join('\n    ')}
  </facsimile>
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