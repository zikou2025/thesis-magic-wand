// ThesisParser.ts

// --- 1. TYPE DEFINITIONS ---

/**
 * Describes the structure of a jury member's information.
 */
export interface JuryMember {
  readonly role: string;
  readonly name: string;
  readonly affiliation: string;
}

/**
 * Represents a section within a chapter.
 */
export interface ThesisSection {
  readonly title: string;
  readonly content: string;
  readonly level?: number; // For hierarchical sections (1, 2, 3, etc.)
}

/**
 * Represents a chapter in the thesis.
 */
export interface ThesisChapter {
  readonly title: string;
  readonly content: string;
  readonly sections: readonly ThesisSection[];
  readonly pageNumber?: number;
}

/**
 * Multi-language abstracts with proper typing.
 */
export type AbstractLanguages = 'French' | 'English' | 'Arabic';
export type ThesisAbstracts = Partial<Record<AbstractLanguages, string>>;

/**
 * Defines the comprehensive data structure for a parsed thesis document.
 * This interface serves as the contract between the parser and the preview component.
 */
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

/**
 * Configuration options for the parser.
 */
export interface ParserConfig {
  readonly preserveFormatting?: boolean;
  readonly extractMetadata?: boolean;
  readonly strictMode?: boolean;
  readonly languageDetection?: boolean;
}

/**
 * Result type for parsing operations with error handling.
 */
export type ParseResult<T> = {
  readonly success: true;
  readonly data: T;
  readonly warnings?: readonly string[];
} | {
  readonly success: false;
  readonly error: string;
  readonly partialData?: Partial<T>;
};

// --- 2. CONSTANTS AND UTILITIES ---

/**
 * Regular expressions for parsing different sections of the thesis.
 */
const PARSING_PATTERNS = {
  // Metadata patterns
  author: /Présentée\s+par\s*:\s*(.*?)(?:\n|$)/i,
  specialty: /Spécialité\s*:\s*(.*?)(?:\n|$)/i,
  submissionDate: /Soutenue\s+le\s*:\s*(.*?)(?:\n|$)/i,
  university: /UNIVERSITÉ\s+(.*?)(?:\n|$)/i,
  faculty: /FACULTÉ\s+DES\s+(.*?)(?:\n|$)/i,
  department: /Département\s+(.*?)(?:\n|$)/i,
  academicYear: /Année\s+universitaire\s+(.*?)(?:\n|$)/i,
  
  // Jury patterns
  juryRole: /(Présidente?\s+de\s+jury|Examinateurs?|Directrice?\s+de\s+thèse|Co-Directrice?\s+de\s+thèse)\s*:\s*([^,\n]+),?\s*(.*?)(?:\n|$)/i,
  
  // Chapter patterns
  mainChapter: /^(I{1,3}|IV|V|VI{1,3}|IX|X{1,3})\.\s*(.*?)$/,
  subSection: /^(\d+\.\d+)\s*(.*?)$/,
  subSubSection: /^(\d+\.\d+\.\d+)\s*(.*?)$/,
  
  // List patterns
  figure: /^Figure\s+\d+/i,
  table: /^Tableau\s+\d+/i,
  
  // Section headers
  sections: {
    acknowledgments: /^Remerciements?/i,
    dedications: /^Dédicaces?/i,
    abstractFr: /^Résumé/i,
    abstractEn: /^Abstract/i,
    abstractAr: /^الملخص/i,
    listOfFigures: /^Liste\s+des\s+figures/i,
    listOfTables: /^Liste\s+des\s+tableaux|Table\s+des\s+matières/i,
    bibliography: /^(Références?|Bibliographie)/i,
    introduction: /^I\.\s*Introduction/i
  }
} as const;

/**
 * Utility functions for text processing.
 */
const TextUtils = {
  /**
   * Cleans and normalizes text by removing extra whitespace and special characters.
   */
  normalize: (text: string): string => 
    text.trim().replace(/\s+/g, ' ').replace(/[^\w\s\p{L}\p{N}\p{P}]/gu, ''),

  /**
   * Safely extracts text from regex match.
   */
  extractMatch: (text: string, pattern: RegExp, index = 1): string => {
    const match = text.match(pattern);
    return match?.[index]?.trim() ?? '';
  },

  /**
   * Counts words in text (supports multiple languages).
   */
  countWords: (text: string): number => {
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    return words.length;
  },

  /**
   * Removes common artifacts from OCR or PDF extraction.
   */
  cleanOcrArtifacts: (text: string): string => 
    text
      .replace(/Scroll:\s*Horizontal:/gi, '')
      .replace(/[.:]{2,}/g, '')
      .replace(/\s+/g, ' ')
      .trim()
} as const;

// --- 3. ENHANCED PARSER IMPLEMENTATION ---

/**
 * Internal state for the parser to track context during parsing.
 */
interface ParserState {
  currentSection: string;
  contentBuffer: string;
  currentChapter: Partial<ThesisChapter> | null;
  isCapturingTitle: boolean;
  warnings: string[];
  lineNumber: number;
}

/**
 * Creates an initial parser state.
 */
function createInitialState(): ParserState {
  return {
    currentSection: 'meta',
    contentBuffer: '',
    currentChapter: null,
    isCapturingTitle: false,
    warnings: [],
    lineNumber: 0
  };
}

/**
 * Creates a default thesis data structure with all required fields initialized.
 */
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

/**
 * Parses jury member information from a line of text.
 */
function parseJuryMember(line: string, state: ParserState): JuryMember | null {
  const match = line.match(PARSING_PATTERNS.juryRole);
  if (!match) return null;

  const [, role, name, rawAffiliation] = match;
  
  // Clean affiliation by removing common prefixes/suffixes
  const affiliation = rawAffiliation
    .replace(/, UDL Sidi Bel Abbès|Pr,?\s*|M\.C\.A,?\s*/g, '')
    .trim();

  if (!name.trim()) {
    state.warnings.push(`Empty jury member name at line ${state.lineNumber}`);
    return null;
  }

  return {
    role: role.trim(),
    name: name.trim(),
    affiliation: affiliation || 'Unknown Affiliation'
  };
}

/**
 * Processes a line based on the current parser state.
 */
function processLine(line: string, state: ParserState, result: ThesisData): void {
  const trimmedLine = line.trim();
  if (!trimmedLine) return;

  state.lineNumber++;

  // Handle title capturing across multiple lines
  if (/Intitulé|Scroll:\s*Horizontal:/i.test(trimmedLine)) {
    state.isCapturingTitle = true;
    const titlePart = trimmedLine.replace(/Intitulé|Scroll:\s*Horizontal:/i, '').trim();
    if (titlePart) {
      result.title = result.title ? `${result.title} ${titlePart}` : titlePart;
    }
    return;
  }

  if (state.isCapturingTitle) {
    if (PARSING_PATTERNS.submissionDate.test(trimmedLine)) {
      state.isCapturingTitle = false;
      result.title = TextUtils.cleanOcrArtifacts(result.title);
    } else {
      result.title = result.title ? `${result.title} ${trimmedLine}` : trimmedLine;
      return;
    }
  }

  // Section detection and switching
  for (const [sectionName, pattern] of Object.entries(PARSING_PATTERNS.sections)) {
    if (pattern.test(trimmedLine)) {
      if (state.currentChapter && state.currentSection === 'body') {
        finalizeCurrentChapter(state, result);
      }
      state.currentSection = sectionName;
      state.isCapturingTitle = false;
      return;
    }
  }

  // Process content based on current section
  switch (state.currentSection) {
    case 'meta':
      parseMetadataLine(trimmedLine, result, state);
      break;
    case 'acknowledgments':
      result.acknowledgments = appendContent(result.acknowledgments, trimmedLine);
      break;
    case 'dedications':
      result.dedications = appendContent(result.dedications, trimmedLine);
      break;
    case 'abstractFr':
      result.abstracts = { ...result.abstracts, French: appendContent(result.abstracts.French || '', trimmedLine) };
      break;
    case 'abstractEn':
      result.abstracts = { ...result.abstracts, English: appendContent(result.abstracts.English || '', trimmedLine) };
      break;
    case 'abstractAr':
      result.abstracts = { ...result.abstracts, Arabic: appendContent(result.abstracts.Arabic || '', trimmedLine) };
      break;
    case 'listOfFigures':
      if (PARSING_PATTERNS.figure.test(trimmedLine)) {
        result.listOfFigures = [...result.listOfFigures, trimmedLine];
      }
      break;
    case 'listOfTables':
      if (PARSING_PATTERNS.table.test(trimmedLine)) {
        result.listOfTables = [...result.listOfTables, trimmedLine];
      }
      break;
    case 'body':
      processBodyContent(trimmedLine, state, result);
      break;
    case 'bibliography':
      if (trimmedLine.length > 20) { // Filter out short lines that might be artifacts
        result.bibliography = [...result.bibliography, trimmedLine];
      }
      break;
    default:
      state.warnings.push(`Unknown section "${state.currentSection}" at line ${state.lineNumber}`);
  }
}

/**
 * Parses metadata from a line of text.
 */
function parseMetadataLine(line: string, result: ThesisData, state: ParserState): void {
  const patterns = [
    { pattern: PARSING_PATTERNS.author, field: 'author' as const },
    { pattern: PARSING_PATTERNS.specialty, field: 'specialty' as const },
    { pattern: PARSING_PATTERNS.submissionDate, field: 'submissionDate' as const, transform: (text: string) => text.replace(/[.:]/g, '') },
    { pattern: PARSING_PATTERNS.university, field: 'university' as const },
    { pattern: PARSING_PATTERNS.faculty, field: 'faculty' as const, transform: (text: string) => `FACULTÉ DES ${text}` },
    { pattern: PARSING_PATTERNS.department, field: 'department' as const, transform: (text: string) => `Département ${text}` },
    { pattern: PARSING_PATTERNS.academicYear, field: 'academicYear' as const }
  ];

  for (const { pattern, field, transform } of patterns) {
    if (pattern.test(line)) {
      const value = TextUtils.extractMatch(line, pattern);
      if (value) {
        (result as any)[field] = transform ? transform(value) : value;
        return;
      }
    }
  }

  // Handle jury member parsing
  const juryMember = parseJuryMember(line, state);
  if (juryMember) {
    result.jury = [...result.jury, juryMember];
  }
}

/**
 * Processes content in the main body of the thesis.
 */
function processBodyContent(line: string, state: ParserState, result: ThesisData): void {
  const chapterMatch = line.match(PARSING_PATTERNS.mainChapter);
  
  if (chapterMatch) {
    if (state.currentChapter) {
      finalizeCurrentChapter(state, result);
    }
    
    state.currentChapter = {
      title: line,
      content: '',
      sections: []
    };
    state.contentBuffer = '';
  } else {
    state.contentBuffer = appendContent(state.contentBuffer, line);
  }
}

/**
 * Finalizes the current chapter and adds it to the result.
 */
function finalizeCurrentChapter(state: ParserState, result: ThesisData): void {
  if (state.currentChapter) {
    const chapter: ThesisChapter = {
      title: state.currentChapter.title || '',
      content: TextUtils.normalize(state.contentBuffer),
      sections: state.currentChapter.sections || []
    };
    
    result.chapters = [...result.chapters, chapter];
    state.currentChapter = null;
    state.contentBuffer = '';
  }
}

/**
 * Safely appends content with proper line breaks.
 */
function appendContent(existing: string, newContent: string): string {
  return existing ? `${existing}\n${newContent}` : newContent;
}

/**
 * Calculates metadata for the parsed thesis.
 */
function calculateMetadata(result: ThesisData): ThesisData['metadata'] {
  const allContent = [
    result.title,
    result.acknowledgments,
    result.dedications,
    ...Object.values(result.abstracts),
    ...result.chapters.map(ch => ch.content),
    ...result.bibliography
  ].join(' ');

  return {
    wordCount: TextUtils.countWords(allContent),
    pageCount: Math.max(1, Math.ceil(TextUtils.countWords(allContent) / 250)), // Assume ~250 words per page
    createdAt: new Date()
  };
}

/**
 * Validates the parsed thesis data for completeness and consistency.
 */
function validateThesisData(data: ThesisData): string[] {
  const errors: string[] = [];

  if (!data.title) errors.push('Missing thesis title');
  if (!data.author) errors.push('Missing author name');
  if (!data.university) errors.push('Missing university name');
  if (data.chapters.length === 0) errors.push('No chapters found in the document');
  if (data.jury.length === 0) errors.push('No jury members found');

  return errors;
}

// --- 4. MAIN PARSER FUNCTION ---

/**
 * Parses raw text content from a thesis document into a structured ThesisData object.
 * Enhanced with comprehensive error handling, validation, and metadata extraction.
 * 
 * @param textContent The complete raw text of the thesis.
 * @param config Optional configuration for parsing behavior.
 * @returns A ParseResult containing either the structured data or error information.
 */
export function parseThesisContent(
  textContent: string, 
  config: ParserConfig = {}
): ParseResult<ThesisData> {
  try {
    if (!textContent || textContent.trim().length === 0) {
      return {
        success: false,
        error: 'Empty or invalid text content provided'
      };
    }

    const lines = textContent.split('\n').map(line => line.trim());
    const result = createDefaultThesisData();
    const state = createInitialState();

    // Process each line
    for (const line of lines) {
      try {
        processLine(line, state, result);
      } catch (lineError) {
        state.warnings.push(
          `Error processing line ${state.lineNumber}: ${lineError instanceof Error ? lineError.message : 'Unknown error'}`
        );
      }
    }

    // Finalize any remaining chapter
    if (state.currentChapter) {
      finalizeCurrentChapter(state, result);
    }

    // Calculate metadata if requested
    if (config.extractMetadata !== false) {
      result.metadata = calculateMetadata(result);
    }

    // Validate the result
    const validationErrors = validateThesisData(result);
    if (validationErrors.length > 0 && config.strictMode) {
      return {
        success: false,
        error: `Validation failed: ${validationErrors.join(', ')}`,
        partialData: result
      };
    }

    return {
      success: true,
      data: result,
      warnings: state.warnings.length > 0 ? state.warnings : undefined
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown parsing error occurred'
    };
  }
}

/**
 * Legacy function for backward compatibility.
 * @deprecated Use parseThesisContent with proper error handling instead.
 */
export function parseThesisContentLegacy(textContent: string): ThesisData {
  const result = parseThesisContent(textContent);
  if (result.success) {
    return result.data;
  } else {
    console.warn('Parsing failed, returning partial data:', result.error);
    return result.partialData || createDefaultThesisData();
  }
}
