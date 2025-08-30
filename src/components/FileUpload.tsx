import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import Papa from "papaparse";

interface FileUploadProps {
  onFileUpload: (data: any[], fileName: string) => void;
}

export const FileUpload = ({ onFileUpload }: FileUploadProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const processCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          toast.error("Error parsing CSV file");
          return;
        }
        onFileUpload(results.data, file.name);
        toast.success(`Successfully uploaded ${file.name}`);
        setIsProcessing(false);
      },
      error: (error) => {
        toast.error("Failed to parse CSV file");
        setIsProcessing(false);
      }
    });
  };

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    accept: {
      'text/csv': ['.csv'],
      'application/xml': ['.xml'],
      'text/xml': ['.xml']
    },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024, // 100MB
    onDrop: (files) => {
      if (files.length > 0) {
        setIsProcessing(true);
        const file = files[0];
        
        if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
          processCSV(file);
        } else {
          toast.error("XML processing coming soon! Please use CSV files.");
          setIsProcessing(false);
        }
      }
    }
  });

  return (
    <div className="space-y-6">
      <Card className="p-8 animate-scale-in shadow-xl overflow-hidden relative">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 group ${
            isDragActive 
              ? "border-primary bg-primary/10 scale-105" 
              : "border-border hover:border-primary/50 hover:bg-primary/5"
          }`}
        >
          <input {...getInputProps()} />
          
          <div className="space-y-4 relative z-10">
            <div className="flex justify-center">
              {isProcessing ? (
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center animate-pulse-glow">
                  <Upload className="w-8 h-8 text-primary animate-bounce" />
                </div>
              ) : (
                <div className={`w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center 
                              transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20
                              group-hover:shadow-lg group-hover:shadow-primary/25`}>
                  <Upload className={`w-8 h-8 text-primary transition-all duration-300 
                                    ${isDragActive ? 'scale-110 animate-bounce-subtle' : 'group-hover:scale-110'}`} />
                </div>
              )}
            </div>
            
            <div className="space-y-2 transition-all duration-300 group-hover:scale-105">
              <h3 className="text-xl font-semibold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                {isProcessing ? "Processing your file..." : "Upload your dataset"}
              </h3>
              <p className="text-muted-foreground transition-colors duration-300 group-hover:text-foreground/80">
                {isDragActive 
                  ? "Drop your file here..."
                  : "Drag & drop your CSV or XML file, or click to browse"
                }
              </p>
            </div>
            
            <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground 
                          transition-all duration-300 group-hover:text-muted-foreground/90">
              <div className="flex items-center space-x-1 group/item hover:scale-105 transition-transform duration-300">
                <FileText className="w-4 h-4 transition-transform duration-300 group-hover/item:scale-110" />
                <span>CSV, XML</span>
              </div>
              <span>•</span>
              <span>Max 100MB</span>
            </div>
          </div>
          
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 
                          opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-xl"></div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 animate-fade-in hover:shadow-lg transition-all duration-300 hover:scale-105 group cursor-pointer">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center
                          transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20
                          group-hover:shadow-lg group-hover:shadow-primary/25">
              <Upload className="w-4 h-4 text-primary transition-transform duration-300 group-hover:scale-110" />
            </div>
            <div className="transition-all duration-300 group-hover:scale-105">
              <h4 className="font-semibold mb-1 text-foreground/90 group-hover:text-foreground">1. Upload</h4>
              <p className="text-sm text-muted-foreground group-hover:text-muted-foreground/90">
                Upload your CSV or XML file securely
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 animate-fade-in hover:shadow-lg transition-all duration-300 hover:scale-105 group cursor-pointer"
              style={{ animationDelay: '0.1s' }}>
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center
                          transition-all duration-300 group-hover:scale-110 group-hover:bg-accent/20
                          group-hover:shadow-lg group-hover:shadow-accent/25">
              <AlertCircle className="w-4 h-4 text-accent transition-transform duration-300 group-hover:scale-110" />
            </div>
            <div className="transition-all duration-300 group-hover:scale-105">
              <h4 className="font-semibold mb-1 text-foreground/90 group-hover:text-foreground">2. Analyze</h4>
              <p className="text-sm text-muted-foreground group-hover:text-muted-foreground/90">
                Automated EDA with statistics and insights
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 animate-fade-in hover:shadow-lg transition-all duration-300 hover:scale-105 group cursor-pointer"
              style={{ animationDelay: '0.2s' }}>
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center
                          transition-all duration-300 group-hover:scale-110 group-hover:bg-success/20
                          group-hover:shadow-lg group-hover:shadow-success/25">
              <CheckCircle className="w-4 h-4 text-success transition-transform duration-300 group-hover:scale-110" />
            </div>
            <div className="transition-all duration-300 group-hover:scale-105">
              <h4 className="font-semibold mb-1 text-foreground/90 group-hover:text-foreground">3. Visualize</h4>
              <p className="text-sm text-muted-foreground group-hover:text-muted-foreground/90">
                Interactive charts and exportable reports
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};