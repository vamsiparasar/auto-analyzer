import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  AlertTriangle,
  Download,
  BarChart3,
  PieChart,
  Activity,
  Hash,
  Calendar,
  Eye
} from "lucide-react";

interface EDASummaryProps {
  data: any[];
}

export const EDASummary = ({ data }: EDASummaryProps) => {
  if (!data || data.length === 0) return null;

  const columns = Object.keys(data[0]);
  
  // Enhanced column analysis
  const analyzeColumns = () => {
    return columns.map(column => {
      const values = data.map(row => row[column]).filter(val => val != null && val !== '');
      const uniqueValues = new Set(values);
      const missingCount = data.length - values.length;
      
      // Determine column type
      let columnType = 'text';
      let stats: any = {};
      
      // Check if numeric
      const numericValues = values.filter(val => !isNaN(Number(val))).map(val => Number(val));
      if (numericValues.length > values.length * 0.8 && numericValues.length > 0) {
        columnType = 'numeric';
        const sorted = numericValues.sort((a, b) => a - b);
        const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
        stats = {
          min: Math.min(...numericValues),
          max: Math.max(...numericValues),
          mean: mean,
          median: sorted[Math.floor(sorted.length / 2)],
          std: Math.sqrt(numericValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numericValues.length)
        };
      }
      
      // Check if date
      const dateValues = values.filter(val => !isNaN(Date.parse(val)));
      if (dateValues.length > values.length * 0.8 && dateValues.length > 0) {
        columnType = 'date';
        const dates = dateValues.map(val => new Date(val));
        stats = {
          earliest: new Date(Math.min(...dates.map(d => d.getTime()))),
          latest: new Date(Math.max(...dates.map(d => d.getTime()))),
          range: Math.max(...dates.map(d => d.getTime())) - Math.min(...dates.map(d => d.getTime()))
        };
      }
      
      // Check if categorical
      if (uniqueValues.size <= 20 && uniqueValues.size > 1 && columnType === 'text') {
        columnType = 'categorical';
        const frequency = values.reduce((acc, val) => {
          acc[val] = (acc[val] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        stats = {
          topValues: Object.entries(frequency)
            .sort(([,a], [,b]) => Number(b) - Number(a))
            .slice(0, 3)
            .map(([value, count]) => ({ value, count, percentage: (Number(count) / values.length) * 100 }))
        };
      }
      
      return {
        column,
        type: columnType,
        uniqueCount: uniqueValues.size,
        missingCount,
        completeness: ((values.length / data.length) * 100),
        stats
      };
    });
  };

  const columnAnalysis = analyzeColumns();
  
  // Data quality assessment
  const dataQuality = {
    totalRows: data.length,
    totalColumns: columns.length,
    completeness: (columnAnalysis.reduce((sum, col) => sum + col.completeness, 0) / columns.length),
    numericColumns: columnAnalysis.filter(col => col.type === 'numeric').length,
    categoricalColumns: columnAnalysis.filter(col => col.type === 'categorical').length,
    dateColumns: columnAnalysis.filter(col => col.type === 'date').length,
    textColumns: columnAnalysis.filter(col => col.type === 'text').length,
    duplicateRows: data.length - new Set(data.map(row => JSON.stringify(row))).size
  };

  const getQualityColor = (score: number) => {
    if (score >= 90) return 'success';
    if (score >= 70) return 'warning';
    return 'destructive';
  };

  const qualityColor = getQualityColor(dataQuality.completeness);

  return (
    <div className="space-y-6">
      {/* Data Quality Overview */}
      <Card className="p-6 animate-scale-in shadow-lg hover:shadow-xl transition-all duration-300 
                     bg-gradient-to-br from-card via-card to-card/95 hover:scale-[1.01] group overflow-hidden relative">
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center space-x-3 group/header">
            <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center
                          transition-all duration-300 group-hover/header:scale-110 group-hover/header:bg-accent/20
                          group-hover/header:shadow-lg group-hover/header:shadow-accent/25">
              <TrendingUp className="w-4 h-4 text-accent transition-transform duration-300 group-hover/header:scale-110" />
            </div>
            <div className="transition-all duration-300 group-hover/header:scale-105">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Exploratory Data Analysis
              </h3>
              <p className="text-sm text-muted-foreground transition-colors duration-300 group-hover/header:text-muted-foreground/90">
                Comprehensive dataset insights and statistics
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="transition-all duration-300 hover:scale-105 hover:shadow-md group/btn">
            <Download className="w-4 h-4 mr-2 transition-transform duration-300 group-hover/btn:scale-110" />
            Export Analysis
          </Button>
        </div>
        
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-primary/5 
                        opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 relative z-10">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-4 animate-fade-in 
                        hover:shadow-md transition-all duration-300 hover:scale-105 group cursor-pointer border border-primary/10">
            <div className="text-2xl font-bold text-primary transition-all duration-300 group-hover:scale-110">
              {dataQuality.totalRows.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground group-hover:text-muted-foreground/90 transition-colors duration-300">
              Total Rows
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-chart-2/10 to-chart-2/5 rounded-lg p-4 animate-fade-in 
                        hover:shadow-md transition-all duration-300 hover:scale-105 group cursor-pointer border border-chart-2/10"
               style={{ animationDelay: '0.1s' }}>
            <div className="text-2xl font-bold text-chart-2 transition-all duration-300 group-hover:scale-110">
              {dataQuality.totalColumns}
            </div>
            <div className="text-sm text-muted-foreground group-hover:text-muted-foreground/90 transition-colors duration-300">
              Columns
            </div>
          </div>

          <div className={`bg-gradient-to-br from-${qualityColor}/10 to-${qualityColor}/5 rounded-lg p-4 animate-fade-in 
                        hover:shadow-md transition-all duration-300 hover:scale-105 group cursor-pointer border border-${qualityColor}/10`}
               style={{ animationDelay: '0.2s' }}>
            <div className={`text-2xl font-bold text-${qualityColor} transition-all duration-300 group-hover:scale-110`}>
              {dataQuality.completeness.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground group-hover:text-muted-foreground/90 transition-colors duration-300">
              Data Quality
            </div>
          </div>

          <div className="bg-gradient-to-br from-chart-3/10 to-chart-3/5 rounded-lg p-4 animate-fade-in 
                        hover:shadow-md transition-all duration-300 hover:scale-105 group cursor-pointer border border-chart-3/10"
               style={{ animationDelay: '0.3s' }}>
            <div className="text-2xl font-bold text-chart-3 transition-all duration-300 group-hover:scale-110">
              {dataQuality.numericColumns}
            </div>
            <div className="text-sm text-muted-foreground group-hover:text-muted-foreground/90 transition-colors duration-300">
              Numeric
            </div>
          </div>

          <div className="bg-gradient-to-br from-chart-4/10 to-chart-4/5 rounded-lg p-4 animate-fade-in 
                        hover:shadow-md transition-all duration-300 hover:scale-105 group cursor-pointer border border-chart-4/10"
               style={{ animationDelay: '0.4s' }}>
            <div className="text-2xl font-bold text-chart-4 transition-all duration-300 group-hover:scale-110">
              {dataQuality.categoricalColumns}
            </div>
            <div className="text-sm text-muted-foreground group-hover:text-muted-foreground/90 transition-colors duration-300">
              Categorical
            </div>
          </div>

          <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg p-4 animate-fade-in 
                        hover:shadow-md transition-all duration-300 hover:scale-105 group cursor-pointer border border-accent/10"
               style={{ animationDelay: '0.5s' }}>
            <div className="text-2xl font-bold text-accent transition-all duration-300 group-hover:scale-110">
              {dataQuality.duplicateRows}
            </div>
            <div className="text-sm text-muted-foreground group-hover:text-muted-foreground/90 transition-colors duration-300">
              Duplicates
            </div>
          </div>
        </div>

        {dataQuality.completeness < 90 && (
          <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-lg flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <span className="text-sm">
              Data quality could be improved. Consider cleaning missing values and duplicates.
            </span>
          </div>
        )}
      </Card>

      {/* Detailed Column Analysis */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-chart-4/10 rounded-lg flex items-center justify-center">
            <Hash className="w-4 h-4 text-chart-4" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Advanced Column Analysis</h3>
            <p className="text-sm text-muted-foreground">Detailed statistical breakdown of each column</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {columnAnalysis.map((column) => {
            const getTypeIcon = (type: string) => {
              switch (type) {
                case 'numeric': return <BarChart3 className="w-4 h-4" />;
                case 'categorical': return <PieChart className="w-4 h-4" />;
                case 'date': return <Calendar className="w-4 h-4" />;
                default: return <Hash className="w-4 h-4" />;
              }
            };

            const getTypeColor = (type: string) => {
              switch (type) {
                case 'numeric': return 'chart-1';
                case 'categorical': return 'chart-2';
                case 'date': return 'chart-3';
                default: return 'muted-foreground';
              }
            };

            return (
              <div key={column.column} className="border rounded-lg p-4 hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className={`w-6 h-6 bg-${getTypeColor(column.type)}/10 rounded flex items-center justify-center`}>
                      {getTypeIcon(column.type)}
                    </div>
                    <h4 className="font-medium truncate">{column.column}</h4>
                  </div>
                  <Badge variant={column.type === 'numeric' ? "default" : "secondary"} className="text-xs">
                    {column.type}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Unique:</span>
                      <span>{column.uniqueCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Missing:</span>
                      <span className={column.missingCount > 0 ? "text-destructive" : ""}>{column.missingCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Complete:</span>
                      <span>{column.completeness.toFixed(1)}%</span>
                    </div>
                  </div>

                  {/* Type-specific statistics */}
                  {column.type === 'numeric' && column.stats && (
                    <div className="border-t pt-3 space-y-2">
                      <div className="text-xs text-muted-foreground font-medium">Statistical Summary</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between">
                          <span>Min:</span>
                          <span>{column.stats.min?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Max:</span>
                          <span>{column.stats.max?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Mean:</span>
                          <span>{column.stats.mean?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Median:</span>
                          <span>{column.stats.median?.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {column.type === 'categorical' && column.stats?.topValues && (
                    <div className="border-t pt-3 space-y-2">
                      <div className="text-xs text-muted-foreground font-medium">Top Categories</div>
                      <div className="space-y-1">
                        {column.stats.topValues.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-xs">
                            <span className="truncate mr-2">{item.value}</span>
                            <span>{item.percentage.toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};