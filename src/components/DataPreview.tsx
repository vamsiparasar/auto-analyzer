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
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <Database className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Data Preview</h3>
            <p className="text-sm text-muted-foreground">
              {data.length} rows × {columns.length} columns
            </p>
          </div>
        </div>
      </div>

      {/* Column Types */}
      <div className="mb-6">
        <h4 className="text-sm font-medium mb-3">Column Types</h4>
        <div className="flex flex-wrap gap-2">
          {columns.map((column) => {
            const type = getColumnType(column);
            return (
              <Badge 
                key={column} 
                variant="secondary" 
                className={`${getTypeColor(type)} border-0`}
              >
                {getTypeIcon(type)}
                <span className="ml-1">{column}</span>
                <span className="ml-1 text-xs opacity-70">({type})</span>
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Data Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              {columns.map((column) => (
                <TableHead key={column} className="font-semibold">
                  {column}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {previewRows.map((row, index) => (
              <TableRow key={index}>
                {columns.map((column) => (
                  <TableCell key={column} className="font-mono text-sm">
                    {row[column] || <span className="text-muted-foreground">—</span>}
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