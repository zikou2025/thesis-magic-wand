// HTML thesis parser utility
export interface ParsedThesis {
  title?: string;
  author?: string;
  abstract?: string;
  chapters: Array<{
    title: string;
    content: string;
    sections?: Array<{ title: string; content: string }>;
  }>;
  bibliography?: string[];
  acknowledgments?: string;
  tableOfContents?: boolean;
  rawHtml?: string;
}

export function parseHtmlThesis(htmlContent: string): ParsedThesis {
  // Create a DOM parser
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  
  const result: ParsedThesis = {
    chapters: []
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

  // Extract chapters and sections
  const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let currentChapter: any = null;
  let chapterCounter = 0;

  headings.forEach((heading, index) => {
    const tagName = heading.tagName.toLowerCase();
    const headingText = cleanText(heading.textContent || '');
    
    if (!headingText || headingText === result.title) return;

    // H1 and H2 are treated as chapter headings
    if (tagName === 'h1' || tagName === 'h2') {
      // Save previous chapter if exists
      if (currentChapter) {
        result.chapters.push(currentChapter);
      }
      
      chapterCounter++;
      currentChapter = {
        title: headingText,
        content: '',
        sections: []
      };
      
      // Extract content following this heading
      const content = extractContentAfterElement(heading);
      currentChapter.content = content;
      
    } else if (tagName === 'h3' || tagName === 'h4') {
      // H3 and H4 are treated as sections within chapters
      if (currentChapter) {
        const sectionContent = extractContentAfterElement(heading);
        currentChapter.sections = currentChapter.sections || [];
        currentChapter.sections.push({
          title: headingText,
          content: sectionContent
        });
      }
    }
  });

  // Add the last chapter
  if (currentChapter) {
    result.chapters.push(currentChapter);
  }

  // If no structured chapters found, create a generic content chapter
  if (result.chapters.length === 0) {
    const bodyContent = extractBodyContent(doc);
    if (bodyContent) {
      result.chapters.push({
        title: 'Main Content',
        content: bodyContent
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