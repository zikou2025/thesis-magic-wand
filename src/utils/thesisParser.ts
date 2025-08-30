// improvedHtmlParser.ts

export interface JuryMember {
  readonly role: string;
  readonly name: string;
  readonly affiliation: string;
}

export interface ThesisSection {
  readonly title: string;
  readonly content: string;
  readonly level?: number;
}

export interface ThesisChapter {
  readonly title: string;
  readonly content: string;
  readonly sections: readonly ThesisSection[];
  readonly pageNumber?: number;
}

export type AbstractLanguages = 'French' | 'English' | 'Arabic';
export type ThesisAbstracts = Partial<Record<AbstractLanguages, string>>;

export interface ThesisData {
  readonly title: string;
  readonly author: string;
  readonly university: string;
  readonly faculty: string;
  readonly department: string;
  readonly specialty: string;
  readonly submissionDate: string;
  readonly academicYear: string;
  readonly jury: readonly JuryMember[];
  readonly abstracts: ThesisAbstracts;
  readonly acknowledgments: string;
  readonly dedications: string;
  readonly listOfFigures: readonly string[];
  readonly listOfTables: readonly string[];
  readonly chapters: readonly ThesisChapter[];
  readonly bibliography: readonly string[];
  readonly metadata?: {
    readonly wordCount: number;
    readonly pageCount: number;
    readonly createdAt: Date;
    readonly lastModified?: Date;
  };
}

export type ParseResult<T> = {
  readonly success: true;
  readonly data: T;
  readonly warnings?: readonly string[];
} | {
  readonly success: false;
  readonly error: string;
  readonly partialData?: Partial<T>;
};

/**
 * HTML parsing utilities
 */
class HtmlParser {
  private parser: DOMParser;

  constructor() {
    this.parser = new DOMParser();
  }

  /**
   * Parse HTML string into DOM document
   */
  parseDocument(htmlContent: string): Document {
    return this.parser.parseFromString(htmlContent, 'text/html');
  }

  /**
   * Extract text content from element, preserving some formatting
   */
  extractTextContent(element: Element | null): string {
    if (!element) return '';
    
    // Clone the element to avoid modifying the original
    const clone = element.cloneNode(true) as Element;
    
    // Convert some HTML elements to text equivalents
    this.convertHtmlToText(clone);
    
    return clone.textContent?.trim() || '';
  }

  /**
   * Convert HTML elements to text-friendly equivalents
   */
  private convertHtmlToText(element: Element): void {
    // Convert <br> to newlines
    const brs = element.querySelectorAll('br');
    brs.forEach(br => br.replaceWith('\n'));
    
    // Convert <p> to paragraphs with double newlines
    const paragraphs = element.querySelectorAll('p');
    paragraphs.forEach(p => {
      const text = document.createTextNode('\n\n' + (p.textContent || ''));
      p.replaceWith(text);
    });
    
    // Convert lists to text
    const lists = element.querySelectorAll('ul, ol');
    lists.forEach(list => {
      const items = list.querySelectorAll('li');
      let listText = '\n';
      items.forEach((item, index) => {
        const bullet = list.tagName === 'OL' ? `${index + 1}. ` : '• ';
        listText += bullet + (item.textContent || '') + '\n';
      });
      list.replaceWith(document.createTextNode(listText));
    });
    
    // Handle tables
    const tables = element.querySelectorAll('table');
    tables.forEach(table => {
      const rows = table.querySelectorAll('tr');
      let tableText = '\n';
      rows.forEach(row => {
        const cells = row.querySelectorAll('td, th');
        const rowText = Array.from(cells).map(cell => cell.textContent || '').join(' | ');
        tableText += rowText + '\n';
      });
      table.replaceWith(document.createTextNode(tableText));
    });
  }

  /**
   * Extract all text from multiple elements
   */
  extractFromElements(elements: NodeListOf<Element>): string[] {
    return Array.from(elements).map(el => this.extractTextContent(el)).filter(text => text.length > 0);
  }
}

/**
 * Improved HTML thesis parser
 */
export function parseHtmlThesisContent(htmlContent: string): ParseResult<ThesisData> {
  try {
    const htmlParser = new HtmlParser();
    const doc = htmlParser.parseDocument(htmlContent);
    const result = createDefaultThesisData();

    // Extract title - look for various title patterns
    const title = extractTitle(doc, htmlParser);
    if (title) {
      result.title = title;
    }

    // Extract author information
    const author = extractAuthor(doc, htmlParser);
    if (author) {
      result.author = author;
    }

    // Extract university information
    const universityInfo = extractUniversityInfo(doc, htmlParser);
    Object.assign(result, universityInfo);

    // Extract specialty and academic info
    const academicInfo = extractAcademicInfo(doc, htmlParser);
    Object.assign(result, academicInfo);

    // Extract jury information
    result.jury = extractJury(doc, htmlParser);

    // Extract main content sections
    const sections = extractContentSections(doc, htmlParser);
    Object.assign(result, sections);

    // Extract chapters
    result.chapters = extractChapters(doc, htmlParser);

    // Calculate metadata
    result.metadata = calculateMetadata(result);

    return {
      success: true,
      data: result,
      warnings: validateAndGetWarnings(result)
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown parsing error'
    };
  }
}

function createDefaultThesisData(): ThesisData {
  return {
    title: '',
    author: '',
    university: '',
    faculty: '',
    department: '',
    specialty: '',
    submissionDate: '',
    academicYear: '',
    jury: [],
    abstracts: {},
    acknowledgments: '',
    dedications: '',
    chapters: [],
    bibliography: [],
    listOfFigures: [],
    listOfTables: [],
    metadata: {
      wordCount: 0,
      pageCount: 0,
      createdAt: new Date()
    }
  };
}

function extractTitle(doc: Document, parser: HtmlParser): string {
  // Try different title extraction strategies
  const strategies = [
    // Look for specific title classes or IDs
    () => doc.querySelector('.thesis-title, #thesis-title, .title'),
    // Look for the largest heading
    () => doc.querySelector('h1'),
    // Look for title in meta
    () => doc.querySelector('title'),
    // Look for text containing "alt=" pattern (from your example)
    () => {
      const textNodes = getTextNodesContaining(doc, 'alt=');
      if (textNodes.length > 0) {
        const text = textNodes[0].textContent || '';
        const match = text.match(/alt="([^"]+)"/);
        return match ? createElementWithText(match[1]) : null;
      }
      return null;
    }
  ];

  for (const strategy of strategies) {
    const element = strategy();
    if (element) {
      const title = parser.extractTextContent(element);
      if (title && title.length > 10) { // Reasonable title length
        return cleanTitle(title);
      }
    }
  }

  return '';
}

function extractAuthor(doc: Document, parser: HtmlParser): string {
  const patterns = [
    /présentée?\s+par\s*:?\s*([^,\n]+)/i,
    /author\s*:?\s*([^,\n]+)/i,
    /candidat\s*:?\s*([^,\n]+)/i
  ];

  // Search in text content
  const bodyText = parser.extractTextContent(doc.body);
  for (const pattern of patterns) {
    const match = bodyText.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return '';
}

function extractUniversityInfo(doc: Document, parser: HtmlParser) {
  const result = { university: '', faculty: '', department: '' };
  const bodyText = parser.extractTextContent(doc.body);

  const patterns = {
    university: /université\s+([^,\n]+)/i,
    faculty: /faculté\s+des?\s+([^,\n]+)/i,
    department: /département\s+([^,\n]+)/i
  };

  for (const [key, pattern] of Object.entries(patterns)) {
    const match = bodyText.match(pattern);
    if (match && match[1]) {
      result[key as keyof typeof result] = match[1].trim();
    }
  }

  return result;
}

function extractAcademicInfo(doc: Document, parser: HtmlParser) {
  const result = { specialty: '', submissionDate: '', academicYear: '' };
  const bodyText = parser.extractTextContent(doc.body);

  const patterns = {
    specialty: /spécialité\s*:?\s*([^,\n]+)/i,
    submissionDate: /soutenue?\s+le\s*:?\s*([^,\n]+)/i,
    academicYear: /année\s+universitaire\s*:?\s*([^,\n]+)/i
  };

  for (const [key, pattern] of Object.entries(patterns)) {
    const match = bodyText.match(pattern);
    if (match && match[1]) {
      result[key as keyof typeof result] = match[1].trim();
    }
  }

  return result;
}

function extractJury(doc: Document, parser: HtmlParser): JuryMember[] {
  const jury: JuryMember[] = [];
  const bodyText = parser.extractTextContent(doc.body);

  const juryPattern = /(président|examinateur|directeur|co-directeur)\s*:?\s*([^,\n]+),?\s*([^,\n]*)/gi;
  let match;

  while ((match = juryPattern.exec(bodyText)) !== null) {
    const [, role, name, affiliation] = match;
    if (name && name.trim()) {
      jury.push({
        role: role.trim(),
        name: name.trim(),
        affiliation: affiliation ? affiliation.trim() : 'Not specified'
      });
    }
  }

  return jury;
}

function extractContentSections(doc: Document, parser: HtmlParser) {
  const sections = {
    acknowledgments: '',
    dedications: '',
    abstracts: {} as ThesisAbstracts,
    listOfFigures: [] as string[],
    listOfTables: [] as string[],
    bibliography: [] as string[]
  };

  const bodyText = parser.extractTextContent(doc.body);

  // Extract acknowledgments
  const ackMatch = bodyText.match(/remerciements?\s*:?\s*(.*?)(?=\n\n|\n[A-Z]|$)/is);
  if (ackMatch && ackMatch[1]) {
    sections.acknowledgments = ackMatch[1].trim();
  }

  // Extract dedications
  const dedMatch = bodyText.match(/dédicaces?\s*:?\s*(.*?)(?=\n\n|\n[A-Z]|$)/is);
  if (dedMatch && dedMatch[1]) {
    sections.dedications = dedMatch[1].trim();
  }

  // Extract French abstract
  const frAbstractMatch = bodyText.match(/résumé\s*:?\s*(.*?)(?=abstract|mots[- ]clés|$)/is);
  if (frAbstractMatch && frAbstractMatch[1]) {
    sections.abstracts.French = frAbstractMatch[1].trim();
  }

  // Extract English abstract
  const enAbstractMatch = bodyText.match(/abstract\s*:?\s*(.*?)(?=keywords|résumé|$)/is);
  if (enAbstractMatch && enAbstractMatch[1]) {
    sections.abstracts.English = enAbstractMatch[1].trim();
  }

  return sections;
}

function extractChapters(doc: Document, parser: HtmlParser): ThesisChapter[] {
  const chapters: ThesisChapter[] = [];
  const bodyText = parser.extractTextContent(doc.body);

  // Look for chapter patterns (Roman numerals, etc.)
  const chapterPattern = /^(I{1,3}|IV|V|VI{1,3}|IX|X{1,3})\.\s*(.*?)$/gm;
  let match;
  const chapterMatches = [];

  while ((match = chapterPattern.exec(bodyText)) !== null) {
    chapterMatches.push({
      index: match.index,
      title: match[0],
      number: match[1]
    });
  }

  // Extract content between chapters
  for (let i = 0; i < chapterMatches.length; i++) {
    const currentChapter = chapterMatches[i];
    const nextChapter = chapterMatches[i + 1];
    
    const startIndex = currentChapter.index;
    const endIndex = nextChapter ? nextChapter.index : bodyText.length;
    
    const content = bodyText.substring(startIndex, endIndex);
    
    chapters.push({
      title: currentChapter.title,
      content: content.trim(),
      sections: []
    });
  }

  return chapters;
}

function calculateMetadata(data: ThesisData) {
  const allText = [
    data.title,
    data.acknowledgments,
    data.dedications,
    ...Object.values(data.abstracts),
    ...data.chapters.map(ch => ch.content),
    ...data.bibliography
  ].join(' ');

  const wordCount = allText.split(/\s+/).filter(word => word.length > 0).length;

  return {
    wordCount,
    pageCount: Math.max(1, Math.ceil(wordCount / 250)),
    createdAt: new Date()
  };
}

function validateAndGetWarnings(data: ThesisData): string[] {
  const warnings: string[] = [];

  if (!data.title) warnings.push('No title found');
  if (!data.author) warnings.push('No author found');
  if (!data.university) warnings.push('No university found');
  if (data.chapters.length === 0) warnings.push('No chapters found');

  return warnings;
}

// Utility functions
function getTextNodesContaining(doc: Document, searchText: string): Text[] {
  const textNodes: Text[] = [];
  const walker = document.createTreeWalker(
    doc.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node: Text) => {
        return node.textContent?.includes(searchText) 
          ? NodeFilter.FILTER_ACCEPT 
          : NodeFilter.FILTER_REJECT;
      }
    }
  );

  let node;
  while ((node = walker.nextNode()) !== null) {
    textNodes.push(node as Text);
  }

  return textNodes;
}

function createElementWithText(text: string): HTMLElement {
  const div = document.createElement('div');
  div.textContent = text;
  return div;
}

function cleanTitle(title: string): string {
  return title
    .replace(/^alt="|"$/g, '') // Remove alt=" and trailing "
    .replace(/><\/span><span[^>]*>/g, ' ') // Replace span breaks with spaces
    .replace(/<[^>]+>/g, '') // Remove any remaining HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}
