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
            <div className="text-center mb-12 animate-fade-in">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-primary 
                           bg-clip-text text-transparent animate-float leading-tight">
                Automated Data Analysis & Visualization
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-slide-up leading-relaxed">
                Upload your CSV or XML file and get instant insights with automated exploratory data analysis and beautiful visualizations.
              </p>
              <div className="mt-8 flex justify-center space-x-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                  <span>No coding required</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                  <span>Instant insights</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-accent rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                  <span>Beautiful visualizations</span>
                </div>
              </div>
            </div>
            <FileUpload onFileUpload={handleFileUpload} />
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center justify-between animate-fade-in">
              <div className="group">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent
                             transition-all duration-300 group-hover:scale-105">
                  Analysis Results
                </h1>
                <p className="text-muted-foreground transition-all duration-300 group-hover:text-foreground/80">
                  File: <span className="font-medium text-foreground">{fileName}</span>
                </p>
              </div>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg 
                         hover:bg-secondary/80 transition-all duration-300 hover:scale-105 hover:shadow-md
                         active:scale-95 group"
              >
                <span className="transition-all duration-300 group-hover:scale-105">Upload New File</span>
              </button>
            </div>
            
            <div className="space-y-8">
              <DataPreview data={uploadedData} />
              <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <AnalyticsDashboard data={uploadedData} />
              </div>
            </div>
          </div>
        )}
      </main>
      <Toaster />
    </div>
  );
};

export default Index;