import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface ThesisData {
  title?: string;
  author?: string;
  abstract?: string;
  acknowledgments?: string;
  chapters?: Array<{
    title: string;
    content: string;
    sections?: Array<{ title: string; content: string }>;
  }>;
  bibliography?: string[];
}

interface ThesisPreviewProps {
  data: ThesisData;
}

export const ThesisPreview = ({ data }: ThesisPreviewProps) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long'
  });

  return (
    <div className="thesis-container mx-auto">
      {/* Title Page */}
      <div className="thesis-page page-break-after">
        <div className="min-h-screen flex flex-col justify-center items-center text-center">
          <div className="space-y-12">
            <div>
              <h1 className="font-thesis text-5xl font-bold text-primary leading-tight mb-8">
                {data.title || 'Doctoral Thesis Title'}
              </h1>
              <div className="w-24 h-1 bg-accent mx-auto mb-8"></div>
            </div>
            
            <div className="space-y-6">
              <p className="font-interface text-xl text-muted-foreground">
                A thesis submitted to the faculty in partial fulfillment<br />
                of the requirements for the degree of Doctor of Philosophy
              </p>
              
              <div className="space-y-4">
                <p className="font-interface text-lg font-medium text-foreground">
                  by
                </p>
                <p className="font-thesis text-2xl font-semibold text-primary">
                  {data.author || 'Author Name'}
                </p>
              </div>
            </div>
            
            <div className="mt-16">
              <p className="font-interface text-lg text-muted-foreground">
                {currentDate}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table of Contents */}
      <div className="thesis-page page-break-after">
        <h1 className="thesis-title">Table of Contents</h1>
        <div className="space-y-3">
          {data.abstract && (
            <div className="flex justify-between border-b border-border pb-1">
              <span className="font-interface">Abstract</span>
              <span className="font-interface text-muted-foreground">iii</span>
            </div>
          )}
          {data.acknowledgments && (
            <div className="flex justify-between border-b border-border pb-1">
              <span className="font-interface">Acknowledgments</span>
              <span className="font-interface text-muted-foreground">iv</span>
            </div>
          )}
          {data.chapters?.map((chapter, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between border-b border-border pb-1">
                <span className="font-interface font-medium">
                  Chapter {index + 1}: {chapter.title}
                </span>
                <span className="font-interface text-muted-foreground">{index + 1}</span>
              </div>
              {chapter.sections?.map((section, sectionIndex) => (
                <div key={sectionIndex} className="flex justify-between ml-6">
                  <span className="font-interface text-muted-foreground">
                    {section.title}
                  </span>
                  <span className="font-interface text-muted-foreground">
                    {index + 1}.{sectionIndex + 1}
                  </span>
                </div>
              ))}
            </div>
          ))}
          {data.bibliography && (
            <div className="flex justify-between border-b border-border pb-1">
              <span className="font-interface">Bibliography</span>
              <span className="font-interface text-muted-foreground">
                {(data.chapters?.length || 0) + 2}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Abstract */}
      {data.abstract && (
        <div className="thesis-page page-break-after">
          <h1 className="thesis-title">Abstract</h1>
          <div className="thesis-text whitespace-pre-line">
            {data.abstract}
          </div>
        </div>
      )}

      {/* Acknowledgments */}
      {data.acknowledgments && (
        <div className="thesis-page page-break-after">
          <h1 className="thesis-title">Acknowledgments</h1>
          <div className="thesis-text whitespace-pre-line">
            {data.acknowledgments}
          </div>
        </div>
      )}

      {/* Chapters */}
      {data.chapters?.map((chapter, index) => (
        <div key={index} className="thesis-page page-break-before">
          <h1 className="thesis-chapter">
            Chapter {index + 1}: {chapter.title}
          </h1>
          
          {chapter.content && (
            <div className="thesis-text whitespace-pre-line mb-8">
              {chapter.content}
            </div>
          )}

          {chapter.sections?.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-8">
              <h2 className="thesis-section">
                {index + 1}.{sectionIndex + 1} {section.title}
              </h2>
              <div className="thesis-text whitespace-pre-line">
                {section.content}
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* Bibliography */}
      {data.bibliography && data.bibliography.length > 0 && (
        <div className="thesis-page page-break-before">
          <h1 className="thesis-title">Bibliography</h1>
          <div className="space-y-4">
            {data.bibliography.map((ref, index) => (
              <div key={index} className="thesis-text border-l-2 border-accent/30 pl-4">
                {ref}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};