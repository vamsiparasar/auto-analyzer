import { BarChart3, Database, Download } from "lucide-react";

export const Header = () => {
  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50 animate-fade-in">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 group">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg
                          transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/25">
              <BarChart3 className="w-6 h-6 text-primary-foreground transition-transform duration-300 group-hover:rotate-12" />
            </div>
            <div className="transition-all duration-300 group-hover:scale-105">
              <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                DataInsight
              </h1>
              <p className="text-sm text-muted-foreground transition-colors duration-300 group-hover:text-muted-foreground/90">
                Automated EDA Platform
              </p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground transition-all duration-300 
                          hover:text-foreground hover:scale-105 cursor-pointer group/nav">
              <Database className="w-4 h-4 transition-transform duration-300 group-hover/nav:scale-110" />
              <span>CSV/XML Support</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground transition-all duration-300 
                          hover:text-foreground hover:scale-105 cursor-pointer group/nav">
              <Download className="w-4 h-4 transition-transform duration-300 group-hover/nav:scale-110" />
              <span>Export Reports</span>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};