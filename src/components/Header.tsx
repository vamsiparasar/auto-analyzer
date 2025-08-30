import { BarChart3, Database, Download } from "lucide-react";

export const Header = () => {
  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
              <BarChart3 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">DataInsight</h1>
              <p className="text-sm text-muted-foreground">Automated EDA Platform</p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Database className="w-4 h-4" />
              <span>CSV/XML Support</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Download className="w-4 h-4" />
              <span>Export Reports</span>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};