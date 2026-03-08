import { BarChart3, Database, Download, Sparkles } from "lucide-react";

interface HeaderProps {
  onScrollToAI?: () => void;
  onScrollToUpload?: () => void;
  onExport?: () => void;
  hasData?: boolean;
}

export const Header = ({ onScrollToAI, onScrollToUpload, onExport, hasData }: HeaderProps) => {
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
            <button
              onClick={onScrollToAI}
              disabled={!hasData}
              className={`flex items-center space-x-1.5 text-xs px-3 py-1.5 rounded-lg transition-all duration-200
                ${hasData ? 'text-muted-foreground hover:text-foreground hover:bg-muted/50 cursor-pointer active:scale-95' : 'text-muted-foreground/40 cursor-not-allowed'}`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Analytics</span>
            </button>
            <button
              onClick={onScrollToUpload}
              className="flex items-center space-x-1.5 text-xs text-muted-foreground px-3 py-1.5 rounded-lg
                        hover:text-foreground hover:bg-muted/50 transition-all duration-200 cursor-pointer active:scale-95"
            >
              <Database className="w-3.5 h-3.5" />
              <span>CSV / XML</span>
            </button>
            <button
              onClick={onExport}
              disabled={!hasData}
              className={`flex items-center space-x-1.5 text-xs px-3 py-1.5 rounded-lg transition-all duration-200
                ${hasData ? 'text-muted-foreground hover:text-foreground hover:bg-muted/50 cursor-pointer active:scale-95' : 'text-muted-foreground/40 cursor-not-allowed'}`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
