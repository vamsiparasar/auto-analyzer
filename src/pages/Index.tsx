import { useState } from "react";
import { Header } from "@/components/Header";
import { FileUpload } from "@/components/FileUpload";
import { DataPreview } from "@/components/DataPreview";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { Toaster } from "@/components/ui/sonner";

const Index = () => {
  const [uploadedData, setUploadedData] = useState<any>(null);
  const [fileName, setFileName] = useState<string>("");

  const handleFileUpload = (data: any, name: string) => {
    setUploadedData(data);
    setFileName(name);
  };

  const handleReset = () => {
    setUploadedData(null);
    setFileName("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-6 py-8">
        {!uploadedData ? (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Automated Data Analysis & Visualization
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Upload your CSV or XML file and get instant insights with automated exploratory data analysis and beautiful visualizations.
              </p>
            </div>
            <FileUpload onFileUpload={handleFileUpload} />
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Analysis Results</h1>
                <p className="text-muted-foreground">File: {fileName}</p>
              </div>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
              >
                Upload New File
              </button>
            </div>
            
            <DataPreview data={uploadedData} />
            <AnalyticsDashboard data={uploadedData} />
          </div>
        )}
      </main>
      <Toaster />
    </div>
  );
};

export default Index;