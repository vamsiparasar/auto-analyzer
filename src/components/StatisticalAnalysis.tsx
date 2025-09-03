import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Calculator, TrendingUp, AlertTriangle, Target, BarChart3, PieChart } from "lucide-react";

interface StatisticalAnalysisProps {
  data: any[];
  type: 'descriptive' | 'diagnostic' | 'prescriptive' | 'comprehensive';
}

interface ColumnStats {
  column: string;
  type: 'numeric' | 'categorical';
  count: number;
  missing: number;
  unique: number;
  mean?: number;
  median?: number;
  mode?: string | number;
  std?: number;
  min?: number;
  max?: number;
  q1?: number;
  q3?: number;
  skewness?: number;
  kurtosis?: number;
  distribution?: any[];
}

export const StatisticalAnalysis = ({ data, type }: StatisticalAnalysisProps) => {
  const [statistics, setStatistics] = useState<ColumnStats[]>([]);
  const [correlations, setCorrelations] = useState<any[]>([]);
  const [insights, setInsights] = useState<string[]>([]);

  useEffect(() => {
    if (data && data.length > 0) {
      analyzeData();
    }
  }, [data, type]);

  const analyzeData = () => {
    const columns = Object.keys(data[0]);
    const stats: ColumnStats[] = [];

    columns.forEach(col => {
      const values = data.map(row => row[col]).filter(val => val != null && val !== '');
      const numericValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
      const isNumeric = numericValues.length > values.length * 0.8;

      if (isNumeric && numericValues.length > 0) {
        const sorted = numericValues.sort((a, b) => a - b);
        const mean = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
        const variance = numericValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numericValues.length;
        const std = Math.sqrt(variance);
        
        const q1 = sorted[Math.floor(sorted.length * 0.25)];
        const median = sorted[Math.floor(sorted.length * 0.5)];
        const q3 = sorted[Math.floor(sorted.length * 0.75)];

        // Calculate skewness and kurtosis
        const skewness = numericValues.reduce((sum, val) => sum + Math.pow((val - mean) / std, 3), 0) / numericValues.length;
        const kurtosis = numericValues.reduce((sum, val) => sum + Math.pow((val - mean) / std, 4), 0) / numericValues.length - 3;

        // Create distribution for histogram
        const bins = 10;
        const binSize = (Math.max(...numericValues) - Math.min(...numericValues)) / bins;
        const distribution = Array.from({ length: bins }, (_, i) => {
          const binStart = Math.min(...numericValues) + i * binSize;
          const binEnd = binStart + binSize;
          const count = numericValues.filter(val => val >= binStart && val < binEnd).length;
          return { bin: `${binStart.toFixed(1)}-${binEnd.toFixed(1)}`, count };
        });

        stats.push({
          column: col,
          type: 'numeric',
          count: values.length,
          missing: data.length - values.length,
          unique: new Set(values).size,
          mean,
          median,
          std,
          min: Math.min(...numericValues),
          max: Math.max(...numericValues),
          q1,
          q3,
          skewness,
          kurtosis,
          distribution
        });
      } else {
        // Categorical analysis
        const valueCounts = values.reduce((acc, val) => {
          acc[val] = (acc[val] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const mode = Object.entries(valueCounts).reduce((a, b) => valueCounts[a[0]] > valueCounts[b[0]] ? a : b)[0];

        stats.push({
          column: col,
          type: 'categorical',
          count: values.length,
          missing: data.length - values.length,
          unique: new Set(values).size,
          mode
        });
      }
    });

    setStatistics(stats);
    
    // Calculate correlations for numeric columns
    calculateCorrelations(stats.filter(s => s.type === 'numeric'));
    
    // Generate insights based on type
    generateInsights(stats);
  };

  const calculateCorrelations = (numericStats: ColumnStats[]) => {
    const correlationMatrix: any[] = [];
    
    for (let i = 0; i < numericStats.length; i++) {
      for (let j = i + 1; j < numericStats.length; j++) {
        const col1 = numericStats[i].column;
        const col2 = numericStats[j].column;
        
        const correlation = calculatePearsonCorrelation(col1, col2);
        
        correlationMatrix.push({
          col1,
          col2,
          correlation: correlation,
          strength: Math.abs(correlation) > 0.7 ? 'Strong' : Math.abs(correlation) > 0.3 ? 'Moderate' : 'Weak'
        });
      }
    }
    
    setCorrelations(correlationMatrix.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation)));
  };

  const calculatePearsonCorrelation = (col1: string, col2: string): number => {
    const pairs = data
      .map(row => [parseFloat(row[col1]), parseFloat(row[col2])])
      .filter(([x, y]) => !isNaN(x) && !isNaN(y));
    
    if (pairs.length < 2) return 0;
    
    const n = pairs.length;
    const sumX = pairs.reduce((sum, [x]) => sum + x, 0);
    const sumY = pairs.reduce((sum, [, y]) => sum + y, 0);
    const sumXY = pairs.reduce((sum, [x, y]) => sum + x * y, 0);
    const sumX2 = pairs.reduce((sum, [x]) => sum + x * x, 0);
    const sumY2 = pairs.reduce((sum, [, y]) => sum + y * y, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  };

  const generateInsights = (stats: ColumnStats[]) => {
    const insights: string[] = [];
    
    if (type === 'descriptive' || type === 'comprehensive') {
      const numericCols = stats.filter(s => s.type === 'numeric');
      const categoricalCols = stats.filter(s => s.type === 'categorical');
      
      insights.push(`Dataset contains ${numericCols.length} numeric and ${categoricalCols.length} categorical variables`);
      
      const highMissingCols = stats.filter(s => (s.missing / data.length) > 0.1);
      if (highMissingCols.length > 0) {
        insights.push(`${highMissingCols.length} columns have >10% missing values`);
      }
      
      const skewedCols = numericCols.filter(s => Math.abs(s.skewness || 0) > 1);
      if (skewedCols.length > 0) {
        insights.push(`${skewedCols.length} numeric columns show significant skewness`);
      }
    }
    
    if (type === 'diagnostic' || type === 'comprehensive') {
      const outlierCols = stats.filter(s => s.type === 'numeric').filter(s => {
        const iqr = (s.q3 || 0) - (s.q1 || 0);
        const lowerBound = (s.q1 || 0) - 1.5 * iqr;
        const upperBound = (s.q3 || 0) + 1.5 * iqr;
        return (s.min || 0) < lowerBound || (s.max || 0) > upperBound;
      });
      
      if (outlierCols.length > 0) {
        insights.push(`Potential outliers detected in ${outlierCols.length} columns`);
      }
      
      const strongCorrs = correlations.filter(c => Math.abs(c.correlation) > 0.7);
      if (strongCorrs.length > 0) {
        insights.push(`${strongCorrs.length} strong correlations found - potential multicollinearity`);
      }
    }
    
    if (type === 'prescriptive' || type === 'comprehensive') {
      const highCardinalityCols = stats.filter(s => s.type === 'categorical' && s.unique > 20);
      if (highCardinalityCols.length > 0) {
        insights.push(`Consider encoding or grouping high cardinality categorical variables`);
      }
      
      const normalDistCols = stats.filter(s => 
        s.type === 'numeric' && Math.abs(s.skewness || 0) < 0.5 && Math.abs(s.kurtosis || 0) < 3
      );
      if (normalDistCols.length > 0) {
        insights.push(`${normalDistCols.length} columns appear normally distributed - suitable for parametric tests`);
      }
    }
    
    setInsights(insights);
  };

  const getAnalysisTitle = () => {
    switch (type) {
      case 'descriptive': return 'Descriptive Analytics';
      case 'diagnostic': return 'Diagnostic Analytics';
      case 'prescriptive': return 'Prescriptive Analytics';
      default: return 'Comprehensive Statistical Analysis';
    }
  };

  const getAnalysisIcon = () => {
    switch (type) {
      case 'descriptive': return <BarChart3 className="w-4 h-4" />;
      case 'diagnostic': return <Target className="w-4 h-4" />;
      case 'prescriptive': return <TrendingUp className="w-4 h-4" />;
      default: return <Calculator className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
            {getAnalysisIcon()}
          </div>
          <div>
            <h3 className="text-lg font-semibold">{getAnalysisTitle()}</h3>
            <p className="text-sm text-muted-foreground">
              {type === 'descriptive' && "What happened in your data"}
              {type === 'diagnostic' && "Why did it happen"}
              {type === 'prescriptive' && "What should you do"}
              {type === 'comprehensive' && "Complete statistical overview"}
            </p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="distributions">Distributions</TabsTrigger>
            <TabsTrigger value="correlations">Correlations</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="space-y-4">
              {statistics.map((stat) => (
                <Card key={stat.column} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">{stat.column}</h4>
                    <Badge variant={stat.type === 'numeric' ? 'default' : 'secondary'}>
                      {stat.type}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Count:</span>
                      <div className="font-medium">{stat.count}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Missing:</span>
                      <div className="font-medium">{stat.missing}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Unique:</span>
                      <div className="font-medium">{stat.unique}</div>
                    </div>
                    
                    {stat.type === 'numeric' ? (
                      <>
                        <div>
                          <span className="text-muted-foreground">Mean:</span>
                          <div className="font-medium">{stat.mean?.toFixed(2)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Std:</span>
                          <div className="font-medium">{stat.std?.toFixed(2)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Range:</span>
                          <div className="font-medium">{stat.min?.toFixed(1)} - {stat.max?.toFixed(1)}</div>
                        </div>
                      </>
                    ) : (
                      <div>
                        <span className="text-muted-foreground">Mode:</span>
                        <div className="font-medium">{stat.mode}</div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="distributions" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {statistics.filter(s => s.type === 'numeric' && s.distribution).map((stat) => (
                <Card key={stat.column} className="p-4">
                  <h4 className="font-medium mb-4">{stat.column} Distribution</h4>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stat.distribution}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="bin" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))', 
                            border: '1px solid hsl(var(--border))'
                          }} 
                        />
                        <Bar dataKey="count" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Skewness: {stat.skewness?.toFixed(2)} | Kurtosis: {stat.kurtosis?.toFixed(2)}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="correlations" className="mt-6">
            <div className="space-y-4">
              {correlations.slice(0, 10).map((corr, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{corr.col1} ↔ {corr.col2}</div>
                      <div className="text-sm text-muted-foreground">
                        {corr.strength} correlation
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {(corr.correlation * 100).toFixed(1)}%
                      </div>
                      <Badge 
                        variant={
                          Math.abs(corr.correlation) > 0.7 ? 'destructive' : 
                          Math.abs(corr.correlation) > 0.3 ? 'default' : 'secondary'
                        }
                      >
                        {corr.strength}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="insights" className="mt-6">
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-primary mt-0.5" />
                    <div className="text-sm">{insight}</div>
                  </div>
                </Card>
              ))}
              
              {insights.length === 0 && (
                <Card className="p-8 text-center">
                  <PieChart className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No specific insights generated for this analysis type</p>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};