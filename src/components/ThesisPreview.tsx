import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Table2, ImageIcon } from 'lucide-react';

interface ThesisData {
  title?: string;
  author?: string;
  abstract?: string;
  acknowledgments?: string;
  chapters?: Array<{
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
  tables?: Array<{ title: string; html: string; caption?: string }>;
  images?: Array<{ src: string; alt: string; caption?: string }>;
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

          {/* Chapter Tables */}
          {chapter.tables && chapter.tables.length > 0 && (
            <div className="mb-8">
              {chapter.tables.map((table, tableIndex) => (
                <div key={tableIndex} className="mb-6">
                  <h3 className="font-interface text-center font-semibold mb-4 text-primary">
                    {table.title}
                  </h3>
                  <div 
                    className="overflow-x-auto border rounded-lg shadow-academic-subtle"
                    dangerouslySetInnerHTML={{ __html: table.html }}
                  />
                  {table.caption && (
                    <p className="thesis-citation text-center mt-2 italic">
                      {table.caption}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Chapter Images */}
          {chapter.images && chapter.images.length > 0 && (
            <div className="mb-8">
              {chapter.images.map((image, imageIndex) => (
                <div key={imageIndex} className="mb-6 text-center">
                  <img 
                    src={image.src} 
                    alt={image.alt}
                    className="max-w-full h-auto mx-auto border rounded-lg shadow-academic-subtle"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <div className="hidden bg-muted/50 p-8 rounded-lg border-2 border-dashed border-muted-foreground/30">
                    <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground text-sm">
                      Image not available: {image.alt}
                    </p>
                  </div>
                  {image.caption && (
                    <p className="thesis-citation mt-2 italic">
                      Figure {index + 1}.{imageIndex + 1}: {image.caption}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Sections */}
          {chapter.sections?.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-8">
              <h2 className="thesis-section">
                {index + 1}.{sectionIndex + 1} {section.title}
              </h2>
              <div className="thesis-text whitespace-pre-line">
                {section.content}
              </div>
              
              {/* Handle table references in content */}
              {(section.content.includes('tableau') || section.content.includes('Table')) && (
                <div className="bg-accent-light/30 border-l-4 border-accent p-4 rounded-r-lg mt-4">
                  <div className="flex items-center gap-2 text-accent mb-2">
                    <Table2 className="h-4 w-4" />
                    <span className="font-interface font-medium text-sm">Table Reference Found</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This section references tables that may be missing from the original HTML. 
                    Please include table data in your source document.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}

      {/* Global Tables Section (if any tables not assigned to chapters) */}
      {data.tables && data.tables.length > 0 && (
        <div className="thesis-page page-break-before">
          <h1 className="thesis-title">Tables and Figures</h1>
          <div className="space-y-8">
            {data.tables.map((table, index) => (
              <div key={index} className="mb-8">
                <h3 className="font-interface text-center font-semibold mb-4 text-primary">
                  {table.title}
                </h3>
                <div 
                  className="overflow-x-auto border rounded-lg shadow-academic-subtle"
                  dangerouslySetInnerHTML={{ __html: table.html }}
                />
                {table.caption && (
                  <p className="thesis-citation text-center mt-2 italic">
                    {table.caption}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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