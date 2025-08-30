import { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { ThesisPreview } from '@/components/ThesisPreview';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, FileText, PrinterIcon } from 'lucide-react';

interface ThesisData {
  title?: string;
  author?: string;
  abstract?: string;
  chapters?: Array<{
    title: string;
    content: string;
    sections?: Array<{ title: string; content: string }>;
  }>;
  bibliography?: string[];
  rawHtml?: string;
}

const Index = () => {
  const [thesisData, setThesisData] = useState<ThesisData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleFileProcessed = (data: ThesisData) => {
    setThesisData(data);
    setShowPreview(true);
  };

  const handlePrint = () => {
    window.print();
  };

  if (showPreview && thesisData) {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="no-print bg-primary text-primary-foreground p-4 shadow-academic">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <BookOpen className="h-6 w-6" />
              <h1 className="font-interface text-xl font-semibold">Thesis Formatter</h1>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowPreview(false)}
                variant="secondary"
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                <FileText className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button 
                onClick={handlePrint}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                <PrinterIcon className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </div>
        <ThesisPreview data={thesisData} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/20 via-background to-muted/30">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-academic-strong">
        <div className="max-w-6xl mx-auto px-8 py-12">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-primary-foreground/10 p-6 rounded-full">
                <BookOpen className="h-16 w-16 text-primary-foreground" />
              </div>
            </div>
            <h1 className="font-thesis text-5xl font-bold mb-4">
              Academic Thesis Formatter
            </h1>
            <p className="font-interface text-xl text-primary-foreground/90 max-w-2xl mx-auto">
              Transform your malformatted HTML thesis into a professionally formatted, 
              print-ready doctoral document with proper academic structure.
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-8 py-16">
        <Card className="shadow-academic-strong border-0 bg-card/50 backdrop-blur-sm">
          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="thesis-subtitle">Upload Your HTML Thesis</h2>
              <p className="font-interface text-muted-foreground leading-relaxed">
                Upload your HTML file and we'll automatically extract the content, 
                structure it into proper academic format, and prepare it for printing.
              </p>
            </div>
            
            <FileUpload 
              onFileProcessed={handleFileProcessed}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
            />

            <div className="mt-12 grid md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-muted/50 rounded-lg">
                <div className="bg-primary/10 p-4 rounded-full inline-block mb-4">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-interface font-semibold mb-2">Content Extraction</h3>
                <p className="text-sm text-muted-foreground">
                  Intelligently parses your HTML and extracts titles, chapters, and content.
                </p>
              </div>

              <div className="text-center p-6 bg-muted/50 rounded-lg">
                <div className="bg-accent/10 p-4 rounded-full inline-block mb-4">
                  <BookOpen className="h-8 w-8 text-accent" />
                </div>
                <h3 className="font-interface font-semibold mb-2">Academic Structure</h3>
                <p className="text-sm text-muted-foreground">
                  Organizes content into proper thesis format with TOC, chapters, and references.
                </p>
              </div>

              <div className="text-center p-6 bg-muted/50 rounded-lg">
                <div className="bg-primary-light/10 p-4 rounded-full inline-block mb-4">
                  <PrinterIcon className="h-8 w-8 text-primary-light" />
                </div>
                <h3 className="font-interface font-semibold mb-2">Print Ready</h3>
                <p className="text-sm text-muted-foreground">
                  Professional typography and formatting optimized for printing.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Index;