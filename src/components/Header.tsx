import { BarChart3, Database, Download, Sparkles } from "lucide-react";

export const Header = () => {
  return (
    <header className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 group cursor-pointer">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl
                          transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/25">
              <BarChart3 className="w-5 h-5 text-primary-foreground transition-transform duration-300 group-hover:rotate-12" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                DataInsight
              </h1>
              <p className="text-xs text-muted-foreground">
                AI-Powered EDA Platform
              </p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-1">
            <div className="flex items-center space-x-1.5 text-xs text-muted-foreground px-3 py-1.5 rounded-lg
                          hover:text-foreground hover:bg-muted/50 transition-all duration-200 cursor-pointer">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Analytics</span>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-muted-foreground px-3 py-1.5 rounded-lg
                          hover:text-foreground hover:bg-muted/50 transition-all duration-200 cursor-pointer">
              <Database className="w-3.5 h-3.5" />
              <span>CSV / XML</span>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-muted-foreground px-3 py-1.5 rounded-lg
                          hover:text-foreground hover:bg-muted/50 transition-all duration-200 cursor-pointer">
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};
