import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Brain, 
  Lightbulb, 
  TrendingUp, 
  AlertTriangle, 
  Target,
  Sparkles,
  ChevronRight,
  Zap
} from "lucide-react";

interface AIInsightsProps {
  data: any[];
}

interface Insight {
  id: string;
  type: 'correlation' | 'outlier' | 'trend' | 'recommendation' | 'pattern';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
}

export const AIInsights = ({ data }: AIInsightsProps) => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (data && data.length > 0) {
      generateInsights();
    }
  }, [data]);

  const generateInsights = async () => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const columns = Object.keys(data[0]);
    const numericColumns = getNumericColumns(columns);
    const categoricalColumns = getCategoricalColumns(columns);
    
    const generatedInsights: Insight[] = [];

    // Data Quality Insights
    const missingValueInsights = analyzeMissingValues();
    generatedInsights.push(...missingValueInsights);

    // Correlation Insights
    if (numericColumns.length >= 2) {
      const correlationInsights = analyzeCorrelations(numericColumns);
      generatedInsights.push(...correlationInsights);
    }

    // Distribution Insights
    const distributionInsights = analyzeDistributions(numericColumns);
    generatedInsights.push(...distributionInsights);

    // Outlier Detection
    const outlierInsights = detectOutliers(numericColumns);
    generatedInsights.push(...outlierInsights);

    // Chart Recommendations
    const chartRecommendations = generateChartRecommendations(numericColumns, categoricalColumns);
    generatedInsights.push(...chartRecommendations);

    setInsights(generatedInsights);
    setIsAnalyzing(false);
  };

  const getNumericColumns = (columns: string[]) => {
    return columns.filter(col => {
      const sample = data.slice(0, 10).map(row => row[col]).filter(val => val != null && val !== '');
      const numericCount = sample.filter(val => !isNaN(Number(val))).length;
      return numericCount > sample.length * 0.8;
    });
  };

  const getCategoricalColumns = (columns: string[]) => {
    return Object.keys(data[0]).filter(col => {
      const uniqueValues = new Set(data.map(row => row[col]));
      return uniqueValues.size <= 20 && uniqueValues.size > 1;
    });
  };

  const analyzeMissingValues = (): Insight[] => {
    const insights: Insight[] = [];
    const columns = Object.keys(data[0]);
    
    columns.forEach(col => {
      const missingCount = data.filter(row => row[col] == null || row[col] === '').length;
      const missingPercentage = (missingCount / data.length) * 100;
      
      if (missingPercentage > 15) {
        insights.push({
          id: `missing-${col}`,
          type: 'recommendation',
          severity: missingPercentage > 30 ? 'high' : 'medium',
          title: `High Missing Values in ${col}`,
          description: `${missingPercentage.toFixed(1)}% missing values detected. Consider imputation or removal strategies.`,
          confidence: 95,
          actionable: true
        });
      }
    });
    
    return insights;
  };

  const analyzeCorrelations = (numericColumns: string[]): Insight[] => {
    const insights: Insight[] = [];
    
    for (let i = 0; i < numericColumns.length; i++) {
      for (let j = i + 1; j < numericColumns.length; j++) {
        const col1 = numericColumns[i];
        const col2 = numericColumns[j];
        
        const correlation = calculateCorrelation(col1, col2);
        
        if (Math.abs(correlation) > 0.7) {
          insights.push({
            id: `correlation-${col1}-${col2}`,
            type: 'correlation',
            severity: Math.abs(correlation) > 0.9 ? 'high' : 'medium',
            title: `Strong Correlation Detected`,
            description: `${col1} and ${col2} show ${correlation > 0 ? 'positive' : 'negative'} correlation (${(correlation * 100).toFixed(1)}%)`,
            confidence: 88,
            actionable: true
          });
        }
      }
    }
    
    return insights;
  };

  const calculateCorrelation = (col1: string, col2: string): number => {
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

  const analyzeDistributions = (numericColumns: string[]): Insight[] => {
    const insights: Insight[] = [];
    
    numericColumns.forEach(col => {
      const values = data.map(row => parseFloat(row[col])).filter(val => !isNaN(val));
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const sorted = values.sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      
      const skewness = Math.abs(mean - median) / (Math.max(...values) - Math.min(...values));
      
      if (skewness > 0.3) {
        insights.push({
          id: `distribution-${col}`,
          type: 'pattern',
          severity: 'medium',
          title: `Skewed Distribution in ${col}`,
          description: `Data shows ${mean > median ? 'right' : 'left'} skewness. Consider data transformation for better analysis.`,
          confidence: 82,
          actionable: true
        });
      }
    });
    
    return insights;
  };

  const detectOutliers = (numericColumns: string[]): Insight[] => {
    const insights: Insight[] = [];
    
    numericColumns.forEach(col => {
      const values = data.map(row => parseFloat(row[col])).filter(val => !isNaN(val));
      const sorted = values.sort((a, b) => a - b);
      const q1 = sorted[Math.floor(sorted.length * 0.25)];
      const q3 = sorted[Math.floor(sorted.length * 0.75)];
      const iqr = q3 - q1;
      const outlierThreshold = 1.5 * iqr;
      
      const outliers = values.filter(val => val < q1 - outlierThreshold || val > q3 + outlierThreshold);
      const outlierPercentage = (outliers.length / values.length) * 100;
      
      if (outlierPercentage > 5) {
        insights.push({
          id: `outliers-${col}`,
          type: 'outlier',
          severity: outlierPercentage > 10 ? 'high' : 'medium',
          title: `Outliers Detected in ${col}`,
          description: `${outliers.length} outliers found (${outlierPercentage.toFixed(1)}% of data). Review for data quality issues.`,
          confidence: 91,
          actionable: true
        });
      }
    });
    
    return insights;
  };

  const generateChartRecommendations = (numericColumns: string[], categoricalColumns: string[]): Insight[] => {
    const insights: Insight[] = [];
    
    if (categoricalColumns.length > 0) {
      insights.push({
        id: 'chart-categorical',
        type: 'recommendation',
        severity: 'low',
        title: 'Bar Chart Recommended',
        description: `Use bar charts to visualize categorical data in ${categoricalColumns[0]}. Great for comparing categories.`,
        confidence: 95,
        actionable: true
      });
    }
    
    if (numericColumns.length >= 2) {
      insights.push({
        id: 'chart-scatter',
        type: 'recommendation',
        severity: 'low',
        title: 'Scatter Plot Recommended',
        description: `Create scatter plots to explore relationships between ${numericColumns[0]} and ${numericColumns[1]}.`,
        confidence: 90,
        actionable: true
      });
    }
    
    if (data.length > 50) {
      insights.push({
        id: 'chart-histogram',
        type: 'recommendation',
        severity: 'low',
        title: 'Histogram Analysis Suggested',
        description: `With ${data.length} data points, histograms will reveal distribution patterns effectively.`,
        confidence: 88,
        actionable: true
      });
    }
    
    return insights;
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'correlation': return <TrendingUp className="w-4 h-4" />;
      case 'outlier': return <AlertTriangle className="w-4 h-4" />;
      case 'trend': return <TrendingUp className="w-4 h-4" />;
      case 'recommendation': return <Target className="w-4 h-4" />;
      case 'pattern': return <Sparkles className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'warning';
      default: return 'default';
    }
  };

  if (!data || data.length === 0) return null;

  return (
    <Card className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
            <Brain className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              AI-Powered Insights
            </h3>
            <p className="text-sm text-muted-foreground">
              Intelligent analysis and recommendations for your data
            </p>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={generateInsights}
          disabled={isAnalyzing}
          className="transition-all duration-300 hover:scale-105"
        >
          <Zap className="w-4 h-4 mr-2" />
          {isAnalyzing ? 'Analyzing...' : 'Refresh Insights'}
        </Button>
      </div>

      {/* Analysis Status */}
      {isAnalyzing ? (
        <div className="text-center py-8">
          <div className="inline-flex items-center space-x-2 text-primary">
            <Brain className="w-5 h-5 animate-pulse" />
            <span className="font-medium">AI is analyzing your data...</span>
          </div>
          <div className="mt-2 w-32 mx-auto bg-muted rounded-full h-1">
            <div className="bg-primary h-1 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      ) : (
        <>
          {/* Insights Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gradient-to-br from-chart-1/10 to-chart-1/5 rounded-lg">
              <div className="text-lg font-bold text-chart-1">{insights.length}</div>
              <div className="text-xs text-muted-foreground">Total Insights</div>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-destructive/10 to-destructive/5 rounded-lg">
              <div className="text-lg font-bold text-destructive">
                {insights.filter(i => i.severity === 'high').length}
              </div>
              <div className="text-xs text-muted-foreground">High Priority</div>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-chart-3/10 to-chart-3/5 rounded-lg">
              <div className="text-lg font-bold text-chart-3">
                {insights.filter(i => i.actionable).length}
              </div>
              <div className="text-xs text-muted-foreground">Actionable</div>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-chart-4/10 to-chart-4/5 rounded-lg">
              <div className="text-lg font-bold text-chart-4">
                {Math.round(insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length)}%
              </div>
              <div className="text-xs text-muted-foreground">Avg Confidence</div>
            </div>
          </div>

          <Separator />

          {/* Insights List */}
          <div className="space-y-4">
            {insights.length > 0 ? (
              insights.map((insight) => (
                <div
                  key={insight.id}
                  className="flex items-start space-x-4 p-4 rounded-lg border hover:shadow-md transition-all duration-300 hover:scale-[1.01] group"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${getSeverityColor(insight.severity)}/10`}>
                    {getInsightIcon(insight.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium truncate">{insight.title}</h4>
                      <Badge variant={getSeverityColor(insight.severity) as any} className="text-xs">
                        {insight.severity}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {insight.confidence}% confidence
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                    
                    {insight.actionable && (
                      <div className="mt-2 flex items-center text-xs text-primary group-hover:text-primary/80 transition-colors">
                        <span>Actionable insight</span>
                        <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <div className="font-medium mb-1">No insights generated yet</div>
                <div className="text-sm">Click "Refresh Insights" to analyze your data</div>
              </div>
            )}
          </div>
        </>
      )}
    </Card>
  );
};