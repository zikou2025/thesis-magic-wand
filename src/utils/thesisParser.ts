// HTML thesis parser utility
export interface ParsedThesis {
  title?: string;
  author?: string;
  abstract?: string;
  chapters: Array<{
    title: string;
    content: string;
    sections?: Array<{ 
      title: string; 
      content: string;
      subsections?: Array<{ title: string; content: string }>;
    }>;
    tables?: Array<{ title: string; html: string; caption?: string }>;
    images?: Array<{ src: string; alt: string; caption?: string }>;
  }>;
  bibliography?: string[];
  acknowledgments?: string;
  tableOfContents?: boolean;
  rawHtml?: string;
  tables?: Array<{ title: string; html: string; caption?: string }>;
  images?: Array<{ src: string; alt: string; caption?: string }>;
}

export function parseHtmlThesis(htmlContent: string): ParsedThesis {
  // Create a DOM parser
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  
  const result: ParsedThesis = {
    chapters: [],
    tables: [],
    images: []
  };

  // Extract title - look for h1, title tag, or anything that looks like a title
  const titleElement = doc.querySelector('h1') || 
                      doc.querySelector('title') ||
                      doc.querySelector('[class*="title"]') ||
                      doc.querySelector('[id*="title"]');
  
  if (titleElement) {
    result.title = cleanText(titleElement.textContent || '');
  }

  // Extract author information
  const authorElement = doc.querySelector('[class*="author"]') ||
                       doc.querySelector('[id*="author"]') ||
                       doc.querySelector('meta[name="author"]');
  
  if (authorElement) {
    result.author = cleanText(
      authorElement.getAttribute('content') || 
      authorElement.textContent || ''
    );
  }

  // Extract abstract
  const abstractElement = doc.querySelector('[class*="abstract"]') ||
                         doc.querySelector('[id*="abstract"]') ||
                         findElementByText(doc, ['abstract', 'summary']);
  
  if (abstractElement) {
    result.abstract = cleanText(abstractElement.textContent || '');
  }

  // Extract acknowledgments
  const ackElement = doc.querySelector('[class*="acknowledgment"]') ||
                    doc.querySelector('[id*="acknowledgment"]') ||
                    doc.querySelector('[class*="thanks"]');
  
  if (ackElement) {
    result.acknowledgments = cleanText(ackElement.textContent || '');
  }

  // Extract all tables first
  const tables = doc.querySelectorAll('table');
  tables.forEach((table, index) => {
    const caption = table.querySelector('caption');
    const tableData = {
      title: caption ? cleanText(caption.textContent || '') : `Table ${index + 1}`,
      html: table.outerHTML,
      caption: caption ? cleanText(caption.textContent || '') : undefined
    };
    result.tables?.push(tableData);
  });

  // Extract all images
  const images = doc.querySelectorAll('img');
  images.forEach((img) => {
    const imageData = {
      src: img.src || img.getAttribute('src') || '',
      alt: img.alt || 'Image',
      caption: img.getAttribute('title') || undefined
    };
    if (imageData.src) {
      result.images?.push(imageData);
    }
  });

  // Enhanced chapter and section extraction with academic numbering
  const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let currentChapter: any = null;
  let currentSection: any = null;
  let chapterCounter = 0;

  // Process all text content to handle academic numbering
  const bodyText = doc.body ? doc.body.textContent || '' : '';
  const lines = bodyText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  let processedLines: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    
    // Check if this line looks like an academic heading (contains Roman numerals or complex numbering)
    if (isAcademicHeading(line)) {
      // Save previous chapter if exists
      if (currentChapter) {
        if (currentSection) {
          currentChapter.sections = currentChapter.sections || [];
          currentChapter.sections.push(currentSection);
        }
        result.chapters.push(currentChapter);
      }
      
      chapterCounter++;
      currentChapter = {
        title: cleanAcademicTitle(line),
        content: '',
        sections: [],
        tables: result.tables?.filter(table => 
          table.title.toLowerCase().includes(`tableau ${chapterCounter}`) || 
          table.title.toLowerCase().includes(`table ${chapterCounter}`)
        ),
        images: result.images?.filter(img => 
          img.alt.toLowerCase().includes(`figure ${chapterCounter}`) ||
          img.caption?.toLowerCase().includes(`figure ${chapterCounter}`)
        )
      };
      currentSection = null;
      
      // Extract content following this heading
      i++;
      let chapterContent = '';
      while (i < lines.length && !isAcademicHeading(lines[i]) && !isSubHeading(lines[i])) {
        if (lines[i] && !isTableReference(lines[i])) {
          chapterContent += lines[i] + '\n\n';
        }
        i++;
      }
      currentChapter.content = chapterContent.trim();
      continue;
      
    } else if (isSubHeading(line) && currentChapter) {
      // Handle subsections
      if (currentSection) {
        currentChapter.sections = currentChapter.sections || [];
        currentChapter.sections.push(currentSection);
      }
      
      currentSection = {
        title: cleanAcademicTitle(line),
        content: ''
      };
      
      // Extract subsection content
      i++;
      let sectionContent = '';
      while (i < lines.length && !isAcademicHeading(lines[i]) && !isSubHeading(lines[i])) {
        if (lines[i] && !isTableReference(lines[i])) {
          sectionContent += lines[i] + '\n\n';
        }
        i++;
      }
      currentSection.content = sectionContent.trim();
      continue;
    }
    
    i++;
  }

  // Add the last chapter and section
  if (currentSection && currentChapter) {
    currentChapter.sections = currentChapter.sections || [];
    currentChapter.sections.push(currentSection);
  }
  if (currentChapter) {
    result.chapters.push(currentChapter);
  }

  // If no structured chapters found, create from HTML headings
  if (result.chapters.length === 0) {
    headings.forEach((heading, index) => {
      const headingText = cleanText(heading.textContent || '');
      if (headingText && headingText !== result.title) {
        const content = extractContentAfterElement(heading);
        result.chapters.push({
          title: headingText,
          content: content,
          sections: []
        });
      }
    });
  }

  // If still no chapters, create a generic content chapter
  if (result.chapters.length === 0) {
    const bodyContent = extractBodyContent(doc);
    if (bodyContent) {
      result.chapters.push({
        title: 'Main Content',
        content: bodyContent,
        sections: []
      });
    }
  }

  // Extract bibliography/references
  const bibElement = doc.querySelector('[class*="bibliograph"]') ||
                    doc.querySelector('[class*="reference"]') ||
                    doc.querySelector('[id*="bibliograph"]') ||
                    doc.querySelector('[id*="reference"]');
  
  if (bibElement) {
    const bibItems = bibElement.querySelectorAll('li, p');
    result.bibliography = Array.from(bibItems).map(item => 
      cleanText(item.textContent || '')
    ).filter(text => text.length > 10);
  }

  return result;
}

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[\n\r\t]/g, ' ')
    .trim();
}
function isAcademicHeading(line: string): boolean {
  // Check for academic numbering patterns like II.2.2.4.1, Chapter X, etc.
  const academicPatterns = [
    /^(I{1,3}V?|IV|VI{0,3}|IX|X{1,3})\.[\d\.]+/,  // Roman numerals with dots
    /^[\d]+\.[\d\.]+/,                              // Numeric with dots  
    /^Chapter\s+\d+/i,                              // Chapter X
    /^Chapitre\s+\d+/i,                             // French chapters
    /^[A-Z][a-z]*\s+\d+/,                          // Title + number
    /^[\d]+\.\s*[A-Z]/,                            // Number + space + capital letter
  ];
  
  return academicPatterns.some(pattern => pattern.test(line.trim())) && line.length < 200;
}

function isSubHeading(line: string): boolean {
  // Check for subheading patterns
  const subPatterns = [
    /^[\d]+\.[\d\.]+\.[\d\.]+/,     // Multiple level numbering
    /^[a-z]\)/,                     // a), b), c)
    /^[A-Z]\./,                     // A. B. C.
    /^·\s/,                         // Bullet points with ·
    /^-\s/,                         // Dash bullet points
  ];
  
  return subPatterns.some(pattern => pattern.test(line.trim())) && 
         line.length > 10 && line.length < 150;
}

function isTableReference(line: string): boolean {
  const tablePatterns = [
    /Le tableau\s+\d+/i,
    /Table\s+\d+/i,
    /Tableau\s+\d+/i,
    /Figure\s+\d+/i,
  ];
  
  return tablePatterns.some(pattern => pattern.test(line));
}

function cleanAcademicTitle(title: string): string {
  return title
    .replace(/^[\d\.\s]+/, '')          // Remove leading numbers
    .replace(/^[IVX\.\s]+/, '')         // Remove Roman numerals
    .replace(/^[a-z]\)\s*/, '')         // Remove a), b), etc.
    .replace(/^[A-Z]\.\s*/, '')         // Remove A., B., etc.
    .replace(/^·\s*/, '')               // Remove bullet points
    .replace(/^-\s*/, '')               // Remove dashes
    .trim();
}

function extractContentAfterElement(element: Element): string {
  let content = '';
  let currentElement = element.nextElementSibling;
  
  while (currentElement) {
    // Stop if we hit another heading of same or higher level
    const currentTag = currentElement.tagName.toLowerCase();
    const elementTag = element.tagName.toLowerCase();
    
    if (currentTag.match(/^h[1-6]$/)) {
      const currentLevel = parseInt(currentTag.charAt(1));
      const elementLevel = parseInt(elementTag.charAt(1));
      
      if (currentLevel <= elementLevel) {
        break;
      }
    }
    
    // Add content from paragraphs, divs, and other text containers
    if (currentTag === 'p' || currentTag === 'div' || currentTag === 'section') {
      const text = cleanText(currentElement.textContent || '');
      if (text) {
        content += text + '\n\n';
      }
    }
    
    currentElement = currentElement.nextElementSibling;
  }
  
  return content.trim();
}

// Helper function to find elements containing specific text
function findElementByText(doc: Document, searchTerms: string[]): Element | null {
  const allElements = doc.querySelectorAll('*');
  
  for (const element of allElements) {
    const text = element.textContent?.toLowerCase() || '';
    const tagName = element.tagName.toLowerCase();
    
    // Skip script, style, and other non-content elements
    if (['script', 'style', 'meta', 'link', 'head'].includes(tagName)) {
      continue;
    }
    
    for (const term of searchTerms) {
      if (text.includes(term.toLowerCase()) && text.length < 2000) {
        return element;
      }
    }
  }
  
  return null;
}

function extractBodyContent(doc: Document): string {
  const body = doc.body;
  if (!body) return '';
  
  // Create a copy to avoid modifying the original
  const bodyClone = body.cloneNode(true) as Element;
  
  // Remove script and style elements
  const scripts = bodyClone.querySelectorAll('script, style, meta, link');
  scripts.forEach(el => el.remove());
  
  // Get all paragraphs and text content
  const paragraphs = bodyClone.querySelectorAll('p, div, section, article');
  let content = '';
  
  paragraphs.forEach(p => {
    const text = cleanText(p.textContent || '');
    if (text && text.length > 20) { // Only include substantial text
      content += text + '\n\n';
    }
  });
  
  return content.trim();
}