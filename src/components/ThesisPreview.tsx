// ThesisPreview.tsx

import React from 'react';
import { Card } from '@/components/ui/card';
import { GraduationCap, BookOpen, FileText, Users } from 'lucide-react';
import { ThesisData, JuryMember } from './ThesisParser'; // Adjust the import path if necessary

// --- 1. PROP INTERFACES ---

interface ThesisPreviewProps {
  data?: ThesisData; // Make data prop optional to handle loading states
}

interface ContentPageProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ElementType;
}

interface JuryCardProps {
  jury: JuryMember[];
}

// --- 2. SUB-COMPONENTS ---

const TitlePage: React.FC<{ data: ThesisData }> = ({ data }) => (
  <div className="thesis-page page-break-after">
    <div className="min-h-screen flex flex-col justify-between items-center text-center p-8 md:p-12">
      <header className="w-full space-y-1">
        <h2 className="text-xl font-semibold text-gray-700">{data.university || 'University Name'}</h2>
        <p className="text-lg text-gray-600">{data.faculty || 'Faculty Name'}</p>
        <p className="text-md text-gray-500">{data.department || 'Department Name'}</p>
      </header>
      
      <main className="space-y-6 flex flex-col items-center my-8">
        <GraduationCap className="h-20 w-20 text-primary" />
        <p className="font-semibold text-lg text-primary">DOCTORAL THESIS</p>
        <h1 className="font-thesis text-4xl md:text-5xl font-bold text-primary leading-tight max-w-3xl">
          {data.title || 'Doctoral Thesis Title'}
        </h1>
        <div className="w-32 h-1 bg-accent mx-auto"></div>
        <p className="font-interface text-xl text-muted-foreground">
          Specialty: {data.specialty || 'Specialty'}
        </p>
      </main>

      <footer className="space-y-6 w-full">
        <div className="space-y-2">
          <p className="font-interface text-lg font-medium text-foreground">Presented by</p>
          <p className="font-thesis text-3xl font-semibold text-primary">{data.author || 'Author Name'}</p>
        </div>

        {data.jury && data.jury.length > 0 && <JuryCard jury={data.jury} />}
        
        <div className="pt-4 text-muted-foreground">
          <p className="font-interface text-lg">Submitted on: {data.submissionDate || 'Date'}</p>
          <p className="font-interface text-md">Academic Year: {data.academicYear || '2024/2025'}</p>
        </div>
      </footer>
    </div>
  </div>
);

const JuryCard: React.FC<JuryCardProps> = ({ jury }) => (
  <Card className="p-4 md:p-6 text-left max-w-2xl mx-auto bg-slate-50 shadow-md border-slate-200">
    <h3 className="font-interface font-bold text-center text-lg mb-4 text-primary flex items-center justify-center gap-2">
      <Users className="h-5 w-5" /> Honorable Jury
    </h3>
    <ul className="space-y-2 text-sm md:text-base">
      {jury.map((member, index) => (
        <li key={index} className="grid grid-cols-3 gap-4 border-b border-slate-200 pb-2 last:border-b-0">
          <span className="font-semibold text-slate-600 col-span-1">{member.role}:</span>
          <div className="col-span-2 flex flex-col">
            <span className="font-medium text-slate-800">{member.name}</span>
            <span className="text-xs text-slate-500">{member.affiliation}</span>
          </div>
        </li>
      ))}
    </ul>
  </Card>
);

const ContentPage: React.FC<ContentPageProps> = ({ title, children, icon: Icon = FileText }) => (
  <div className="thesis-page page-break-after">
    <h1 className="thesis-title flex items-center gap-3">
      <Icon className="h-7 w-7 text-primary" />
      <span>{title}</span>
    </h1>
    <div className="thesis-text whitespace-pre-line">
      {children}
    </div>
  </div>
);

// --- 3. MAIN PREVIEW COMPONENT (WITH ERROR GUARDS) ---

export const ThesisPreview = ({ data }: ThesisPreviewProps) => {
  // If data is not yet available (e.g., during loading), show a placeholder.
  // This is the primary fix for the "blank screen" error.
  if (!data) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg text-muted-foreground">Parsing thesis content...</p>
      </div>
    );
  }

  return (
    <div className="thesis-container mx-auto bg-white shadow-2xl rounded-lg overflow-hidden">
      <TitlePage data={data} />

      {data.dedications && (
        <ContentPage title="Dedications">
          <div className="italic text-center max-w-2xl mx-auto" dangerouslySetInnerHTML={{ __html: data.dedications.replace(/\n/g, '<br />') }} />
        </ContentPage>
      )}

      {data.acknowledgments && (
        <ContentPage title="Acknowledgments">
          <div dangerouslySetInnerHTML={{ __html: data.acknowledgments.replace(/\n/g, '<br />') }} />
        </ContentPage>
      )}

      {/* FIXED: Check if abstracts object exists before calling Object.entries */}
      {data.abstracts && Object.entries(data.abstracts).map(([lang, content]) => (
        <ContentPage key={lang} title={`Abstract (${lang})`}>
          <div dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }} />
        </ContentPage>
      ))}

      {/* ADDED: Defensive checks for lists */}
      {data.listOfFigures && data.listOfFigures.length > 0 && (
        <ContentPage title="List of Figures">
          <ul className="list-none space-y-2">{data.listOfFigures.map((item, index) => <li key={index}>{item}</li>)}</ul>
        </ContentPage>
      )}
      {data.listOfTables && data.listOfTables.length > 0 && (
        <ContentPage title="List of Tables">
          <ul className="list-none space-y-2">{data.listOfTables.map((item, index) => <li key={index}>{item}</li>)}</ul>
        </ContentPage>
      )}
      
      {/* ADDED: Defensive check for chapters array */}
      {data.chapters?.map((chapter, index) => (
        <div key={index} className="thesis-page page-break-before">
          <h1 className="thesis-chapter flex items-center gap-4">
            <BookOpen className="h-8 w-8 text-primary" />
            <span>{chapter.title}</span>
          </h1>
          <div className="thesis-text whitespace-pre-line mb-8" dangerouslySetInnerHTML={{ __html: chapter.content.replace(/\n/g, '<br />') }} />
        </div>
      ))}

      {/* ADDED: Defensive check for bibliography array */}
      {data.bibliography && data.bibliography.length > 0 && (
        <ContentPage title="Bibliography">
          <div className="space-y-3 text-sm">
            {data.bibliography.map((ref, index) => (
              <p key={index} className="pl-4 -indent-4">{ref}</p>
            ))}
          </div>
        </ContentPage>
      )}
    </div>
  );
};
