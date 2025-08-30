// ThesisPreview.tsx

import React, { useMemo, memo, useCallback, useState } from 'react';
import { Card } from '@/components/ui/card';
import { 
  GraduationCap, 
  BookOpen, 
  FileText, 
  Users, 
  Clock,
  University,
  User,
  Calendar,
  FileCheck,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Printer,
  Download
} from 'lucide-react';
import { 
  ThesisData, 
  JuryMember, 
  ThesisChapter, 
  AbstractLanguages 
} from './ThesisParser';

// --- 1. ENHANCED PROP INTERFACES ---

interface ThesisPreviewProps {
  data?: ThesisData | null;
  loading?: boolean;
  error?: string;
  onError?: (error: string) => void;
  className?: string;
  showMetadata?: boolean;
  printMode?: boolean;
}

interface ContentPageProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

interface JuryCardProps {
  jury: readonly JuryMember[];
  className?: string;
}

interface MetadataCardProps {
  data: ThesisData;
  className?: string;
}

interface ChapterNavigationProps {
  chapters: readonly ThesisChapter[];
  onChapterClick: (index: number) => void;
  activeChapter?: number;
}

interface AbstractSelectorProps {
  abstracts: Partial<Record<AbstractLanguages, string>>;
}

// --- 2. ENHANCED SUB-COMPONENTS ---

const ErrorBoundary: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => {
  const [hasError, setHasError] = useState(false);

  React.useEffect(() => {
    const errorHandler = (error: ErrorEvent) => {
      console.error('Thesis Preview Error:', error);
      setHasError(true);
    };

    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);

  if (hasError) {
    return (
      <div className="error-fallback p-8 text-center">
        {fallback || (
          <>
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-700 mb-2">Something went wrong</h2>
            <p className="text-gray-600">Unable to render the thesis preview. Please try again.</p>
            <button 
              onClick={() => setHasError(false)}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </>
        )}
      </div>
    );
  }

  return <>{children}</>;
};

const LoadingSpinner: React.FC<{ message?: string }> = memo(({ message = "Loading..." }) => (
  <div className="flex flex-col justify-center items-center h-screen space-y-4">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    <p className="text-lg text-muted-foreground animate-pulse">{message}</p>
  </div>
));

const TitlePage: React.FC<{ data: ThesisData; showMetadata?: boolean }> = memo(({ data, showMetadata = false }) => {
  const formattedDate = useMemo(() => {
    if (!data.submissionDate) return 'Date not specified';
    try {
      return new Date(data.submissionDate).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return data.submissionDate;
    }
  }, [data.submissionDate]);

  return (
    <div className="thesis-page page-break-after">
      <div className="min-h-screen flex flex-col justify-between items-center text-center p-8 md:p-12 bg-gradient-to-br from-slate-50 to-white">
        <header className="w-full space-y-2 mb-8">
          <div className="flex items-center justify-center mb-4">
            <University className="h-8 w-8 text-primary mr-3" />
            <h2 className="text-xl font-semibold text-gray-700">
              {data.university || 'University Name'}
            </h2>
          </div>
          <p className="text-lg text-gray-600 font-medium">{data.faculty || 'Faculty Name'}</p>
          <p className="text-md text-gray-500">{data.department || 'Department Name'}</p>
        </header>
        
        <main className="space-y-8 flex flex-col items-center my-8 flex-grow justify-center">
          <div className="relative">
            <GraduationCap className="h-24 w-24 text-primary drop-shadow-lg" />
            <div className="absolute -inset-4 bg-primary/10 rounded-full blur-xl"></div>
          </div>
          
          <div className="space-y-4">
            <p className="font-semibold text-lg text-primary uppercase tracking-wider">
              Doctoral Thesis
            </p>
            <h1 className="font-thesis text-3xl md:text-4xl lg:text-5xl font-bold text-primary leading-tight max-w-4xl px-4">
              {data.title || 'Doctoral Thesis Title'}
            </h1>
            <div className="w-32 h-1 bg-accent mx-auto rounded-full shadow-sm"></div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-6 shadow-lg border border-slate-200">
            <p className="font-interface text-lg text-muted-foreground">
              <span className="font-semibold">Specialty:</span> {data.specialty || 'Not specified'}
            </p>
          </div>
        </main>

        <footer className="space-y-8 w-full">
          <div className="space-y-3">
            <div className="flex items-center justify-center">
              <User className="h-5 w-5 text-primary mr-2" />
              <p className="font-interface text-lg font-medium text-foreground">Presented by</p>
            </div>
            <p className="font-thesis text-2xl md:text-3xl font-semibold text-primary">
              {data.author || 'Author Name'}
            </p>
          </div>

          {data.jury && data.jury.length > 0 && (
            <JuryCard jury={data.jury} className="mb-6" />
          )}
          
          <div className="pt-4 text-muted-foreground space-y-2">
            <div className="flex items-center justify-center">
              <Calendar className="h-4 w-4 mr-2" />
              <p className="font-interface text-lg">Submitted on: {formattedDate}</p>
            </div>
            <p className="font-interface text-md">
              Academic Year: {data.academicYear || '2024/2025'}
            </p>
            
            {showMetadata && data.metadata && (
              <MetadataCard data={data} className="mt-4" />
            )}
          </div>
        </footer>
      </div>
    </div>
  );
});

const JuryCard: React.FC<JuryCardProps> = memo(({ jury, className = "" }) => {
  if (jury.length === 0) return null;

  return (
    <Card className={`p-6 text-left max-w-3xl mx-auto bg-gradient-to-r from-slate-50 to-blue-50 shadow-lg border-slate-200 ${className}`}>
      <h3 className="font-interface font-bold text-center text-xl mb-6 text-primary flex items-center justify-center gap-3">
        <Users className="h-6 w-6" /> 
        Honorable Jury
      </h3>
      <div className="grid gap-4">
        {jury.map((member, index) => (
          <div 
            key={`${member.name}-${index}`} 
            className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-white/70 backdrop-blur-sm rounded-lg border border-slate-200 hover:shadow-md transition-shadow"
          >
            <div className="md:col-span-1">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-primary/10 text-primary">
                {member.role}
              </span>
            </div>
            <div className="md:col-span-2 space-y-1">
              <h4 className="font-medium text-slate-800 text-lg">{member.name}</h4>
              <p className="text-sm text-slate-600 flex items-center">
                <University className="h-3 w-3 mr-1" />
                {member.affiliation}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
});

const MetadataCard: React.FC<MetadataCardProps> = memo(({ data, className = "" }) => {
  if (!data.metadata) return null;

  const { wordCount, pageCount, createdAt } = data.metadata;

  return (
    <Card className={`p-4 bg-slate-50 border-slate-200 ${className}`}>
      <h4 className="font-semibold text-sm text-slate-600 mb-2 flex items-center">
        <FileCheck className="h-4 w-4 mr-2" />
        Document Statistics
      </h4>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="space-y-1">
          <p className="text-lg font-semibold text-primary">{wordCount.toLocaleString()}</p>
          <p className="text-xs text-slate-500">Words</p>
        </div>
        <div className="space-y-1">
          <p className="text-lg font-semibold text-primary">{pageCount}</p>
          <p className="text-xs text-slate-500">Est. Pages</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-primary">
            {createdAt.toLocaleDateString()}
          </p>
          <p className="text-xs text-slate-500">Parsed</p>
        </div>
      </div>
    </Card>
  );
});

const ContentPage: React.FC<ContentPageProps> = memo(({ 
  title, 
  children, 
  icon: Icon = FileText, 
  className = "",
  collapsible = false,
  defaultExpanded = true 
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpansion = useCallback(() => {
    if (collapsible) {
      setIsExpanded(prev => !prev);
    }
  }, [collapsible]);

  return (
    <div className={`thesis-page page-break-after ${className}`}>
      <div 
        className={`thesis-title flex items-center justify-between cursor-pointer ${collapsible ? 'hover:bg-slate-50 p-2 rounded-lg transition-colors' : ''}`}
        onClick={toggleExpansion}
        role={collapsible ? 'button' : undefined}
        tabIndex={collapsible ? 0 : undefined}
        onKeyDown={collapsible ? (e) => e.key === 'Enter' && toggleExpansion() : undefined}
      >
        <div className="flex items-center gap-3">
          <Icon className="h-7 w-7 text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold text-primary">{title}</h1>
        </div>
        {collapsible && (
          <div className="ml-4">
            {isExpanded ? (
              <ChevronDown className="h-6 w-6 text-slate-400" />
            ) : (
              <ChevronRight className="h-6 w-6 text-slate-400" />
            )}
          </div>
        )}
      </div>
      
      {isExpanded && (
        <div className="thesis-text mt-6 leading-relaxed text-slate-700">
          {children}
        </div>
      )}
    </div>
  );
});

const AbstractSelector: React.FC<AbstractSelectorProps> = memo(({ abstracts }) => {
  const [activeLanguage, setActiveLanguage] = useState<AbstractLanguages | null>(null);
  
  const availableLanguages = useMemo(() => 
    Object.keys(abstracts).filter(lang => abstracts[lang as AbstractLanguages]) as AbstractLanguages[],
    [abstracts]
  );

  React.useEffect(() => {
    if (availableLanguages.length > 0 && !activeLanguage) {
      setActiveLanguage(availableLanguages[0]);
    }
  }, [availableLanguages, activeLanguage]);

  if (availableLanguages.length === 0) return null;

  const languageLabels: Record<AbstractLanguages, string> = {
    French: 'Français',
    English: 'English', 
    Arabic: 'العربية'
  };

  return (
    <div className="space-y-4">
      {availableLanguages.length > 1 && (
        <div className="flex justify-center mb-6">
          <div className="inline-flex bg-slate-100 rounded-lg p-1">
            {availableLanguages.map((lang) => (
              <button
                key={lang}
                onClick={() => setActiveLanguage(lang)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeLanguage === lang 
                    ? 'bg-white text-primary shadow-sm' 
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                {languageLabels[lang]}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {activeLanguage && abstracts[activeLanguage] && (
        <div 
          className={`prose max-w-none ${activeLanguage === 'Arabic' ? 'text-right' : 'text-left'}`}
          dir={activeLanguage === 'Arabic' ? 'rtl' : 'ltr'}
          dangerouslySetInnerHTML={{ 
            __html: abstracts[activeLanguage]!.replace(/\n/g, '<br />') 
          }} 
        />
      )}
    </div>
  );
});

const ChapterNavigation: React.FC<ChapterNavigationProps> = memo(({ 
  chapters, 
  onChapterClick, 
  activeChapter 
}) => {
  if (chapters.length === 0) return null;

  return (
    <div className="sticky top-4 bg-white/95 backdrop-blur-sm border rounded-lg p-4 shadow-sm mb-6">
      <h3 className="font-semibold text-sm text-slate-600 mb-3 flex items-center">
        <BookOpen className="h-4 w-4 mr-2" />
        Table of Contents
      </h3>
      <nav className="space-y-2">
        {chapters.map((chapter, index) => (
          <button
            key={index}
            onClick={() => onChapterClick(index)}
            className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
              activeChapter === index 
                ? 'bg-primary text-white' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="truncate block">{chapter.title}</span>
          </button>
        ))}
      </nav>
    </div>
  );
});

const PrintActions: React.FC<{ onPrint?: () => void; onDownload?: () => void }> = memo(({ 
  onPrint, 
  onDownload 
}) => (
  <div className="fixed top-4 right-4 flex gap-2 print:hidden">
    {onPrint && (
      <button
        onClick={onPrint}
        className="p-2 bg-white shadow-lg rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
        title="Print document"
      >
        <Printer className="h-5 w-5 text-slate-600" />
      </button>
    )}
    {onDownload && (
      <button
        onClick={onDownload}
        className="p-2 bg-white shadow-lg rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
        title="Download PDF"
      >
        <Download className="h-5 w-5 text-slate-600" />
      </button>
    )}
  </div>
));

// --- 3. MAIN PREVIEW COMPONENT WITH COMPREHENSIVE ERROR HANDLING ---

export const ThesisPreview: React.FC<ThesisPreviewProps> = memo(({ 
  data, 
  loading = false,
  error,
  onError,
  className = "",
  showMetadata = false,
  printMode = false
}) => {
  const [activeChapter, setActiveChapter] = useState<number>(0);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleDownload = useCallback(() => {
    // This would typically integrate with a PDF generation service
    console.log('Download functionality would be implemented here');
  }, []);

  const scrollToChapter = useCallback((index: number) => {
    setActiveChapter(index);
    const element = document.getElementById(`chapter-${index}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Error handling
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen space-y-4">
        <AlertCircle className="h-16 w-16 text-red-500" />
        <h2 className="text-2xl font-semibold text-red-700">Error Loading Thesis</h2>
        <p className="text-gray-600 max-w-md text-center">{error}</p>
        {onError && (
          <button 
            onClick={() => onError(error)}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Report Error
          </button>
        )}
      </div>
    );
  }

  // Loading state
  if (loading) {
    return <LoadingSpinner message="Parsing thesis content..." />;
  }

  // No data state
  if (!data) {
    return (
      <div className="flex flex-col justify-center items-center h-screen space-y-4">
        <FileText className="h-16 w-16 text-gray-400" />
        <h2 className="text-2xl font-semibold text-gray-600">No Thesis Data</h2>
        <p className="text-gray-500">Please upload a thesis document to preview.</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={`thesis-container mx-auto bg-white shadow-2xl rounded-lg overflow-hidden relative ${className}`}>
        {!printMode && (
          <PrintActions onPrint={handlePrint} onDownload={handleDownload} />
        )}
        
        <TitlePage data={data} showMetadata={showMetadata} />

        {!printMode && data.chapters.length > 0 && (
          <div className="px-6 py-4 bg-slate-50 border-b">
            <ChapterNavigation 
              chapters={data.chapters}
              onChapterClick={scrollToChapter}
              activeChapter={activeChapter}
            />
          </div>
        )}

        {data.dedications && (
          <ContentPage 
            title="Dedications" 
            icon={FileText}
            collapsible={!printMode}
          >
            <div 
              className="italic text-center max-w-2xl mx-auto prose prose-lg"
              dangerouslySetInnerHTML={{ __html: data.dedications.replace(/\n/g, '<br />') }} 
            />
          </ContentPage>
        )}

        {data.acknowledgments && (
          <ContentPage 
            title="Acknowledgments" 
            icon={FileText}
            collapsible={!printMode}
          >
            <div 
              className="prose max-w-none prose-lg"
              dangerouslySetInnerHTML={{ __html: data.acknowledgments.replace(/\n/g, '<br />') }} 
            />
          </ContentPage>
        )}

        {Object.keys(data.abstracts).length > 0 && (
          <ContentPage 
            title="Abstract" 
            icon={FileText}
            collapsible={!printMode}
          >
            <AbstractSelector abstracts={data.abstracts} />
          </ContentPage>
        )}

        {data.listOfFigures && data.listOfFigures.length > 0 && (
          <ContentPage 
            title="List of Figures" 
            icon={FileText}
            collapsible={!printMode}
            defaultExpanded={false}
          >
            <ul className="list-none space-y-3">
              {data.listOfFigures.map((item, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-semibold">
                    {index + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </ContentPage>
        )}

        {data.listOfTables && data.listOfTables.length > 0 && (
          <ContentPage 
            title="List of Tables" 
            icon={FileText}
            collapsible={!printMode}
            defaultExpanded={false}
          >
            <ul className="list-none space-y-3">
              {data.listOfTables.map((item, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-semibold">
                    {index + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </ContentPage>
        )}
        
        {data.chapters?.map((chapter, index) => (
          <div 
            key={index} 
            id={`chapter-${index}`}
            className="thesis-page page-break-before scroll-mt-20"
          >
            <h1 className="thesis-chapter flex items-center gap-4 text-3xl md:text-4xl font-bold text-primary mb-8 pb-4 border-b border-slate-200">
              <BookOpen className="h-8 w-8 text-primary flex-shrink-0" />
              <span>{chapter.title}</span>
            </h1>
            {chapter.content && (
              <div 
                className="thesis-text prose max-w-none prose-lg leading-relaxed mb-12"
                dangerouslySetInnerHTML={{ __html: chapter.content.replace(/\n/g, '<br />') }} 
              />
            )}
          </div>
        ))}

        {data.bibliography && data.bibliography.length > 0 && (
          <ContentPage 
            title="Bibliography" 
            icon={FileText}
            collapsible={!printMode}
          >
            <div className="space-y-4">
              {data.bibliography.map((ref, index) => (
                <div key={index} className="group">
                  <p className="pl-6 -indent-4 text-sm leading-relaxed hover:bg-slate-50 p-2 rounded transition-colors">
                    <span className="font-semibold text-primary">[{index + 1}]</span> {ref}
                  </p>
                </div>
              ))}
            </div>
          </ContentPage>
        )}
      </div>
    </ErrorBoundary>
  );
});

// Set display names for better debugging
TitlePage.displayName = 'TitlePage';
JuryCard.displayName = 'JuryCard';
MetadataCard.displayName = 'MetadataCard';
ContentPage.displayName = 'ContentPage';
AbstractSelector.displayName = 'AbstractSelector';
ChapterNavigation.displayName = 'ChapterNavigation';
PrintActions.displayName = 'PrintActions';
ThesisPreview.displayName = 'ThesisPreview';

export default ThesisPreview;
