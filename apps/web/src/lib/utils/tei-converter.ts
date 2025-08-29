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

  convertOCRResults(data: TEIConversionData): TEIConversionData {
    return {
      ...data,
      xml: this.generateXML(data),
      json: data.json || data.results
    };
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