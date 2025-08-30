import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  TrendingUp, 
  AlertTriangle,
  Download,
  Eye,
  Hash
} from "lucide-react";
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Cell,
  Pie
} from "recharts";

interface AnalyticsDashboardProps {
  data: any[];
}

export const AnalyticsDashboard = ({ data }: AnalyticsDashboardProps) => {
  if (!data || data.length === 0) return null;

  const columns = Object.keys(data[0]);
  
  // Generate summary statistics
  const getNumericColumns = () => {
    return columns.filter(col => {
      const sample = data.slice(0, 10).map(row => row[col]).filter(val => val != null && val !== '');
      const numericCount = sample.filter(val => !isNaN(Number(val))).length;
      return numericCount > sample.length * 0.8;
    });
  };

  const getCategoricalColumns = () => {
    return columns.filter(col => {
      const uniqueValues = new Set(data.map(row => row[col]));
      return uniqueValues.size <= 20 && uniqueValues.size > 1;
    });
  };

  const numericColumns = getNumericColumns();
  const categoricalColumns = getCategoricalColumns();

  // Summary statistics
  const summaryStats = {
    totalRows: data.length,
    totalColumns: columns.length,
    numericColumns: numericColumns.length,
    categoricalColumns: categoricalColumns.length,
    missingValues: columns.reduce((acc, col) => {
      const missing = data.filter(row => !row[col] || row[col] === '').length;
      return acc + missing;
    }, 0)
  };

  // Generate chart data for first numeric column
  const generateBarChartData = () => {
    if (categoricalColumns.length === 0) return [];
    
    const column = categoricalColumns[0];
    const counts = data.reduce((acc, row) => {
      const value = row[column] || 'Unknown';
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

        return Object.entries(counts)
      .sort(([,a], [,b]) => Number(b) - Number(a))
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));
  };

  // Generate trend data for first numeric column
  const generateTrendData = () => {
    if (numericColumns.length === 0) return [];
    
    const column = numericColumns[0];
    return data
      .slice(0, 20)
      .map((row, index) => ({
        index: index + 1,
        value: parseFloat(row[column]) || 0
      }))
      .filter(item => !isNaN(item.value));
  };

  const barData = generateBarChartData();
  const trendData = generateTrendData();

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  return (
    <div className="space-y-8">
      {/* Summary Statistics */}
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
                Summary Statistics
              </h3>
              <p className="text-sm text-muted-foreground transition-colors duration-300 group-hover/header:text-muted-foreground/90">
                Overview of your dataset
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="transition-all duration-300 hover:scale-105 hover:shadow-md group/btn">
            <Download className="w-4 h-4 mr-2 transition-transform duration-300 group-hover/btn:scale-110" />
            Export Report
          </Button>
        </div>
        
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-primary/5 
                        opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 relative z-10">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-4 animate-fade-in 
                        hover:shadow-md transition-all duration-300 hover:scale-105 group cursor-pointer border border-primary/10">
            <div className="text-2xl font-bold text-primary transition-all duration-300 group-hover:scale-110">
              {summaryStats.totalRows.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground group-hover:text-muted-foreground/90 transition-colors duration-300">
              Total Rows
            </div>
          </div>
          <div className="bg-gradient-to-br from-chart-2/10 to-chart-2/5 rounded-lg p-4 animate-fade-in 
                        hover:shadow-md transition-all duration-300 hover:scale-105 group cursor-pointer border border-chart-2/10"
               style={{ animationDelay: '0.1s' }}>
            <div className="text-2xl font-bold text-chart-2 transition-all duration-300 group-hover:scale-110">
              {summaryStats.totalColumns}
            </div>
            <div className="text-sm text-muted-foreground group-hover:text-muted-foreground/90 transition-colors duration-300">
              Columns
            </div>
          </div>
          <div className="bg-gradient-to-br from-chart-3/10 to-chart-3/5 rounded-lg p-4 animate-fade-in 
                        hover:shadow-md transition-all duration-300 hover:scale-105 group cursor-pointer border border-chart-3/10"
               style={{ animationDelay: '0.2s' }}>
            <div className="text-2xl font-bold text-chart-3 transition-all duration-300 group-hover:scale-110">
              {summaryStats.numericColumns}
            </div>
            <div className="text-sm text-muted-foreground group-hover:text-muted-foreground/90 transition-colors duration-300">
              Numeric
            </div>
          </div>
          <div className="bg-gradient-to-br from-chart-4/10 to-chart-4/5 rounded-lg p-4 animate-fade-in 
                        hover:shadow-md transition-all duration-300 hover:scale-105 group cursor-pointer border border-chart-4/10"
               style={{ animationDelay: '0.3s' }}>
            <div className="text-2xl font-bold text-chart-4 transition-all duration-300 group-hover:scale-110">
              {summaryStats.categoricalColumns}
            </div>
            <div className="text-sm text-muted-foreground group-hover:text-muted-foreground/90 transition-colors duration-300">
              Categorical
            </div>
          </div>
          <div className="bg-gradient-to-br from-destructive/10 to-destructive/5 rounded-lg p-4 animate-fade-in 
                        hover:shadow-md transition-all duration-300 hover:scale-105 group cursor-pointer border border-destructive/10"
               style={{ animationDelay: '0.4s' }}>
            <div className="text-2xl font-bold text-destructive transition-all duration-300 group-hover:scale-110">
              {summaryStats.missingValues}
            </div>
            <div className="text-sm text-muted-foreground group-hover:text-muted-foreground/90 transition-colors duration-300">
              Missing Values
            </div>
          </div>
        </div>

        {summaryStats.missingValues > 0 && (
          <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-lg flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <span className="text-sm">
              {summaryStats.missingValues} missing values detected across your dataset
            </span>
          </div>
        )}
      </Card>

      {/* Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        {barData.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-chart-1/10 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-chart-1" />
                </div>
                <div>
                  <h4 className="font-semibold">Category Distribution</h4>
                  <p className="text-sm text-muted-foreground">{categoricalColumns[0]}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <Eye className="w-4 h-4" />
              </Button>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="name" 
                    fontSize={12}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    fontSize={12}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Line Chart */}
        {trendData.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-chart-2/10 rounded-lg flex items-center justify-center">
                  <LineChart className="w-4 h-4 text-chart-2" />
                </div>
                <div>
                  <h4 className="font-semibold">Data Trend</h4>
                  <p className="text-sm text-muted-foreground">{numericColumns[0]}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <Eye className="w-4 h-4" />
              </Button>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="index" 
                    fontSize={12}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    fontSize={12}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--chart-2))', strokeWidth: 2, r: 4 }}
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}
      </div>

      {/* Column Analysis */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-chart-4/10 rounded-lg flex items-center justify-center">
            <Hash className="w-4 h-4 text-chart-4" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Column Analysis</h3>
            <p className="text-sm text-muted-foreground">Detailed breakdown of each column</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {columns.slice(0, 6).map((column) => {
            const uniqueValues = new Set(data.map(row => row[column])).size;
            const missingCount = data.filter(row => !row[column] || row[column] === '').length;
            const isNumeric = numericColumns.includes(column);
            
            return (
              <div key={column} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium truncate">{column}</h4>
                  <Badge variant={isNumeric ? "default" : "secondary"} className="text-xs">
                    {isNumeric ? "Numeric" : "Text"}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unique values:</span>
                    <span>{uniqueValues}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Missing:</span>
                    <span className={missingCount > 0 ? "text-destructive" : ""}>{missingCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Completeness:</span>
                    <span>{((1 - missingCount / data.length) * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};