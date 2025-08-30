// ThesisParser.ts

// --- 1. TYPE DEFINITIONS ---

/**
 * Describes the structure of a jury member's information.
 */
export interface JuryMember {
  role: string;
  name: string;
  affiliation: string;
}

/**
 * Defines the comprehensive data structure for a parsed thesis document.
 * This interface serves as the contract between the parser and the preview component.
 */
export interface ThesisData {
  title: string;
  author: string;
  university: string;
  faculty: string;
  department: string;
  specialty: string;
  submissionDate: string;
  academicYear: string;
  jury: JuryMember[];
  abstracts: { [key: string]: string }; // For multi-language abstracts
  acknowledgments: string;
  dedications: string;
  listOfFigures: string[];
  listOfTables: string[];
  chapters: Array<{
    title: string;
    content: string;
    sections: Array<{ 
      title: string; 
      content: string;
    }>;
  }>;
  bibliography: string[];
}

// --- 2. PARSER IMPLEMENTATION ---

/**
 * Parses raw text content from a thesis document into a structured ThesisData object.
 * This version ensures that all properties on the returned object are initialized to prevent runtime errors.
 * 
 * @param textContent The complete raw text of the thesis.
 * @returns A structured and safe-to-render ThesisData object.
 */
export function parseThesisContent(textContent: string): ThesisData {
  const lines = textContent.split('\n').map(line => line.trim());

  // Initialize the data structure with default non-null values
  const result: ThesisData = {
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
  };

  type Section = 
    | 'meta' | 'acknowledgments' | 'dedications' | 'abstract-fr' | 'abstract-en' | 'abstract-ar'
    | 'listOfTables' | 'listOfFigures' | 'body' | 'bibliography';

  let currentSection: Section = 'meta';
  let contentBuffer = '';
  let currentChapter: { title: string; content: string; sections: any[] } | null = null;
  let isCapturingTitle = false;

  // --- REGEX DEFINITIONS FOR ROBUST PARSING ---
  const authorRegex = /Présentée par\s*:\s*(.*)/i;
  const specialtyRegex = /Spécialité\s*:\s*(.*)/i;
  const dateRegex = /Soutenue le\s*:\s*(.*)/i;
  const universityRegex = /UNIVERSITÉ\s+(.*)/i;
  const facultyRegex = /FACULTÉ DES\s+(.*)/i;
  const departmentRegex = /Département\s+(.*)/i;
  const academicYearRegex = /Année universitaire\s+(.*)/i;
  const juryRoleRegex = /(Présidente de jury|Examinateurs|Directrice de thèse|Co-Directrice de thèse)\s*:\s*([^,]+),?\s*(.*)/i;
  const mainSectionRegex = /^(I|V|X|II|III|IV|VI|VII|VIII|IX)\.\s*(.*)/; // e.g., I. Introduction

  for (const line of lines) {
    if (!line) continue;

    // --- SECTION SWITCHING LOGIC ---
    if (/^Remerciement/i.test(line)) { currentSection = 'acknowledgments'; isCapturingTitle = false; continue; }
    if (/^Dédicaces/i.test(line)) { currentSection = 'dedications'; isCapturingTitle = false; continue; }
    if (/^Résumé/i.test(line)) { currentSection = 'abstract-fr'; isCapturingTitle = false; continue; }
    if (/^Abstract/i.test(line)) { currentSection = 'abstract-en'; isCapturingTitle = false; continue; }
    if (/^الملخص/i.test(line)) { currentSection = 'abstract-ar'; isCapturingTitle = false; continue; }
    if (/^Liste des figures/i.test(line)) { currentSection = 'listOfFigures'; isCapturingTitle = false; continue; }
    if (/^Liste des tableaux|Table des métiers/i.test(line)) { currentSection = 'listOfTables'; isCapturingTitle = false; continue; }
    if (/^I\.\s*Introduction/i.test(line)) {
      currentSection = 'body';
      isCapturingTitle = false;
    }
    if (/^Références/i.test(line)) {
      if (currentChapter) {
         currentChapter.content = (currentChapter.content + '\n' + contentBuffer).trim();
         result.chapters.push(currentChapter);
         currentChapter = null;
         contentBuffer = '';
      }
      currentSection = 'bibliography';
      isCapturingTitle = false;
      continue;
    }
    
    if (/Intitulé|Scroll: Horizontal:/i.test(line)) {
        isCapturingTitle = true;
        const titlePart = line.replace(/Intitulé|Scroll: Horizontal:/i, "").trim();
        result.title += ' ' + titlePart;
        continue;
    }
    if (isCapturingTitle) {
        if (dateRegex.test(line)) {
            isCapturingTitle = false;
            result.title = result.title.trim();
        } else {
            result.title += ' ' + line;
            continue;
        }
    }

    switch (currentSection) {
      case 'meta':
        if (authorRegex.test(line)) result.author = line.match(authorRegex)?.[1].trim() ?? '';
        else if (specialtyRegex.test(line)) result.specialty = line.match(specialtyRegex)?.[1].trim() ?? '';
        else if (dateRegex.test(line)) result.submissionDate = line.match(dateRegex)?.[1].trim().replace(/[.:]/g, '') ?? '';
        else if (universityRegex.test(line)) result.university = line.match(universityRegex)?.[1].trim() ?? '';
        else if (facultyRegex.test(line)) result.faculty = `FACULTÉ DES ${line.match(facultyRegex)?.[1].trim() ?? ''}`;
        else if (departmentRegex.test(line)) result.department = `Département ${line.match(departmentRegex)?.[1].trim() ?? ''}`;
        else if (academicYearRegex.test(line)) result.academicYear = line.match(academicYearRegex)?.[1].trim() ?? '';
        else if (juryRoleRegex.test(line)) {
            const match = line.match(juryRoleRegex);
            if (match) {
                const affiliation = match[3].replace(/, UDL Sidi Bel Abbès|Pr, |M\.C\.A, /g, "").trim();
                result.jury.push({ role: match[1].trim(), name: match[2].trim(), affiliation: affiliation });
            }
        }
        break;
        
      case 'acknowledgments':
        result.acknowledgments += line + '\n';
        break;
      case 'dedications':
        result.dedications += line + '\n';
        break;
      case 'abstract-fr':
        result.abstracts['French'] = (result.abstracts['French'] || '') + line + '\n';
        break;
      case 'abstract-en':
        result.abstracts['English'] = (result.abstracts['English'] || '') + line + '\n';
        break;
      case 'abstract-ar':
        result.abstracts['Arabic'] = (result.abstracts['Arabic'] || '') + line + '\n';
        break;
      case 'listOfFigures':
        if(/^Figure/i.test(line)) result.listOfFigures.push(line);
        break;
      case 'listOfTables':
        if(/^Tableau/i.test(line)) result.listOfTables.push(line);
        break;
      case 'body':
        const chapterMatch = line.match(mainSectionRegex);
        
        if (chapterMatch) {
            if (currentChapter) {
                currentChapter.content = (currentChapter.content + '\n' + contentBuffer).trim();
                result.chapters.push(currentChapter);
            }
            currentChapter = { title: line, content: '', sections: [] };
            contentBuffer = '';
        } else {
            contentBuffer += line + '\n';
        }
        break;

      case 'bibliography':
        if (line.length > 20) result.bibliography.push(line);
        break;
    }
  }

  if (currentChapter) {
      currentChapter.content = (currentChapter.content + '\n' + contentBuffer).trim();
      result.chapters.push(currentChapter);
  }

  return result;
}
