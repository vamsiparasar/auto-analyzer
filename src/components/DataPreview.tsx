import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Database, Hash, Type, Calendar } from "lucide-react";

interface DataPreviewProps {
  data: any[];
}

export const DataPreview = ({ data }: DataPreviewProps) => {
  if (!data || data.length === 0) return null;

  const columns = Object.keys(data[0]);
  const previewRows = data.slice(0, 5);
  
  // Simple type detection
  const getColumnType = (column: string) => {
    const sample = data.slice(0, 10).map(row => row[column]).filter(val => val != null && val !== '');
    if (sample.length === 0) return 'text';
    
    const numericCount = sample.filter(val => !isNaN(Number(val))).length;
    const dateCount = sample.filter(val => !isNaN(Date.parse(val))).length;
    
    if (numericCount > sample.length * 0.8) return 'numeric';
    if (dateCount > sample.length * 0.6) return 'date';
    return 'text';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'numeric': return <Hash className="w-3 h-3" />;
      case 'date': return <Calendar className="w-3 h-3" />;
      default: return <Type className="w-3 h-3" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'numeric': return 'bg-chart-1/10 text-chart-1';
      case 'date': return 'bg-chart-2/10 text-chart-2';
      default: return 'bg-chart-3/10 text-chart-3';
    }
  };

  return (
    <Card className="p-6 animate-slide-up shadow-lg hover:shadow-xl transition-all duration-300 
                   bg-gradient-to-br from-card via-card to-card/95 border-0 
                   hover:scale-[1.02] group overflow-hidden relative">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3 group/header">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center
                          transition-all duration-300 group-hover/header:scale-110 group-hover/header:bg-primary/20
                          group-hover/header:shadow-lg group-hover/header:shadow-primary/25">
            <Database className="w-4 h-4 text-primary transition-all duration-300 group-hover/header:scale-110" />
          </div>
          <div className="transition-all duration-300 group-hover/header:scale-105">
            <h3 className="text-lg font-semibold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Data Preview
            </h3>
            <p className="text-sm text-muted-foreground transition-colors duration-300 group-hover/header:text-muted-foreground/90">
              {data.length} rows × {columns.length} columns
            </p>
          </div>
        </div>
      </div>
      
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 
                      opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

      {/* Column Types */}
      <div className="mb-6 relative z-10">
        <h4 className="text-sm font-medium mb-3 text-foreground/90">Column Types</h4>
        <div className="flex flex-wrap gap-2">
          {columns.map((column, index) => {
            const type = getColumnType(column);
            return (
              <Badge 
                key={column} 
                variant="secondary" 
                className={`${getTypeColor(type)} border-0 transition-all duration-300 hover:scale-105 
                          hover:shadow-md animate-fade-in cursor-pointer group/badge`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <span className="transition-transform duration-300 group-hover/badge:scale-110">
                  {getTypeIcon(type)}
                </span>
                <span className="ml-1 transition-all duration-300 group-hover/badge:font-medium">{column}</span>
                <span className="ml-1 text-xs opacity-70 transition-opacity duration-300 group-hover/badge:opacity-100">({type})</span>
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Data Table */}
      <div className="border rounded-lg overflow-hidden relative z-10 bg-white/50 backdrop-blur-sm 
                      shadow-inner transition-all duration-300 hover:shadow-md">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-muted/40 to-muted/20 hover:from-muted/50 hover:to-muted/30 
                               transition-all duration-300">
              {columns.map((column, index) => (
                <TableHead 
                  key={column} 
                  className="font-semibold transition-all duration-300 hover:text-primary hover:scale-105 cursor-pointer
                           animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {column}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {previewRows.map((row, rowIndex) => (
              <TableRow 
                key={rowIndex} 
                className="hover:bg-primary/5 transition-all duration-300 group/row animate-fade-in"
                style={{ animationDelay: `${(rowIndex + columns.length) * 0.05}s` }}
              >
                {columns.map((column, colIndex) => (
                  <TableCell 
                    key={column} 
                    className="font-mono text-sm transition-all duration-300 group-hover/row:text-foreground/90"
                  >
                    <span className="transition-all duration-300 group-hover/row:scale-105 inline-block">
                      {row[column] || <span className="text-muted-foreground">—</span>}
                    </span>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {data.length > 5 && (
        <p className="text-sm text-muted-foreground mt-3 text-center">
          Showing first 5 rows of {data.length} total rows
        </p>
      )}
    </Card>
  );
};