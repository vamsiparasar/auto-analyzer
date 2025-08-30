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
      <Card className="p-8">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ${
            isDragActive 
              ? "border-primary bg-primary/5 scale-[1.02]" 
              : "border-border hover:border-primary/50 hover:bg-muted/30"
          }`}
        >
          <input {...getInputProps()} />
          
          <div className="space-y-4">
            <div className="flex justify-center">
              {isProcessing ? (
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                  <Upload className="w-8 h-8 text-primary animate-bounce" />
                </div>
              ) : (
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">
                {isProcessing ? "Processing your file..." : "Upload your dataset"}
              </h3>
              <p className="text-muted-foreground">
                {isDragActive 
                  ? "Drop your file here..."
                  : "Drag & drop your CSV or XML file, or click to browse"
                }
              </p>
            </div>
            
            <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <FileText className="w-4 h-4" />
                <span>CSV, XML</span>
              </div>
              <span>•</span>
              <span>Max 100MB</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Upload className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold mb-1">1. Upload</h4>
              <p className="text-sm text-muted-foreground">
                Upload your CSV or XML file securely
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h4 className="font-semibold mb-1">2. Analyze</h4>
              <p className="text-sm text-muted-foreground">
                Automated EDA with statistics and insights
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-success" />
            </div>
            <div>
              <h4 className="font-semibold mb-1">3. Visualize</h4>
              <p className="text-sm text-muted-foreground">
                Interactive charts and exportable reports
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};