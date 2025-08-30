import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { parseHtmlThesisContent, ThesisData } from '@/utils/thesisParser';

interface FileUploadProps {
  onFileProcessed: (data: ThesisData & { rawHtml: string }) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

export const FileUpload = ({ onFileProcessed, isProcessing, setIsProcessing }: FileUploadProps) => {
  const { toast } = useToast();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setUploadProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 100);

      const htmlContent = await file.text();
      
      if (htmlContent.trim().length === 0) {
        throw new Error('The uploaded file is empty.');
      }
      
      // Use the improved HTML parser
      const result = parseHtmlThesisContent(htmlContent);

      if (!result.success) {
        throw new Error(result.error);
      }

      const parsedData = result.data;

      // Complete the progress
      clearInterval(progressInterval);
      setUploadProgress(100);

      const dataWithHtml: ThesisData & { rawHtml: string } = {
        ...parsedData,
        rawHtml: htmlContent,
      };

      // Show warnings if any
      if (result.warnings && result.warnings.length > 0) {
        console.warn('Parsing warnings:', result.warnings);
      }

      toast({
        title: "Success!",
        description: `Your thesis has been processed and formatted. ${
          result.warnings ? `Found ${result.warnings.length} warnings - check console for details.` : ''
        }`,
        duration: 3000,
      });

      setTimeout(() => {
        onFileProcessed(dataWithHtml);
        setIsProcessing(false);
      }, 500);

    } catch (error) {
      console.error('Error processing file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Processing Error",
        description: `Issue processing your file: ${errorMessage}. Please check that it's a valid HTML file.`,
        variant: "destructive",
        duration: 5000,
      });
      setIsProcessing(false);
      setUploadProgress(0);
    }
  }, [setIsProcessing, setUploadProgress, onFileProcessed, toast]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      if (file.type === 'text/html' || file.name.endsWith('.html') || file.name.endsWith('.htm')) {
        processFile(file);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload an HTML file (.html or .htm)",
          variant: "destructive",
          duration: 3000,
        });
      }
    }
    setDragOver(false);
  }, [toast, processFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/html': ['.html', '.htm']
    },
    maxFiles: 1,
    onDragEnter: () => setDragOver(true),
    onDragLeave: () => setDragOver(false)
  });

  if (isProcessing) {
    return (
      <div className="text-center py-12">
        <div className="bg-primary/5 p-8 rounded-lg max-w-md mx-auto">
          <div className="animate-pulse mb-4">
            <FileText className="h-16 w-16 text-primary mx-auto" />
          </div>
          <h3 className="font-interface text-lg font-medium mb-4">Processing Your Thesis</h3>
          <Progress value={uploadProgress} className="mb-4" />
          <p className="text-sm text-muted-foreground">
            Parsing HTML content and extracting thesis structure...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`upload-area cursor-pointer transition-all duration-300 ${
          isDragActive || dragOver ? 'drag-over scale-[1.02]' : ''
        }`}
      >
        <input {...getInputProps()} />
        <div className="text-center">
          <div className="bg-primary/10 p-6 rounded-full inline-block mb-6">
            <Upload className="h-12 w-12 text-primary" />
          </div>
          
          <h3 className="font-interface text-xl font-semibold mb-2">
            {isDragActive ? 'Drop your HTML file here' : 'Upload HTML Thesis'}
          </h3>
          
          <p className="text-muted-foreground mb-6 leading-relaxed">
            Drag and drop your HTML thesis file here, or click to select
          </p>
          
          <Button className="academic-button-primary">
            Select HTML File
          </Button>
          
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-accent" />
              HTML Files
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-accent" />
              Auto-formatting
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-accent" />
              Print-ready
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-accent-light/50 rounded-lg border-l-4 border-accent">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-accent-foreground mb-1">Improved HTML parsing:</p>
            <ul className="text-muted-foreground space-y-1">
              <li>• Automatically extracts clean text from HTML markup</li>
              <li>• Preserves formatting while removing display artifacts</li>
              <li>• Handles complex document structures</li>
              <li>• Better title and content extraction</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
