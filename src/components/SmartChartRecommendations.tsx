import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChartType } from "./ChartSelector";
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  Activity,
  TrendingUp,
  Zap,
  Star,
  CheckCircle
} from "lucide-react";

interface SmartChartRecommendationsProps {
  data: any[];
  onChartAdd: (chartType: ChartType, column?: string) => void;
}

interface ChartRecommendation {
  chartType: ChartType;
  confidence: number;
  reasoning: string;
  bestColumn?: string;
  icon: React.ComponentType<any>;
  priority: 'high' | 'medium' | 'low';
}

export const SmartChartRecommendations = ({ data, onChartAdd }: SmartChartRecommendationsProps) => {
  const [recommendations, setRecommendations] = useState<ChartRecommendation[]>([]);
  const [addedCharts, setAddedCharts] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (data && data.length > 0) {
      generateRecommendations();
    }
  }, [data]);

  const generateRecommendations = () => {
    const columns = Object.keys(data[0]);
    const recommendations: ChartRecommendation[] = [];

    // Analyze data characteristics
    const numericColumns = getNumericColumns(columns);
    const categoricalColumns = getCategoricalColumns(columns);
    const dateColumns = getDateColumns(columns);
    const dataSize = data.length;

    // Bar Chart Recommendations
    if (categoricalColumns.length > 0) {
      const bestCategorical = categoricalColumns[0];
      const uniqueValues = new Set(data.map(row => row[bestCategorical])).size;
      
      recommendations.push({
        chartType: 'bar',
        confidence: uniqueValues <= 10 ? 95 : 80,
        reasoning: `Perfect for comparing ${uniqueValues} categories in ${bestCategorical}`,
        bestColumn: bestCategorical,
        icon: BarChart3,
        priority: 'high'
      });

      // Pie Chart for categories
      if (uniqueValues <= 6) {
        recommendations.push({
          chartType: 'pie',
          confidence: 88,
          reasoning: `Great for showing proportions of ${bestCategorical} categories`,
          bestColumn: bestCategorical,
          icon: PieChart,
          priority: 'medium'
        });
      }
    }

    // Line Chart for trends
    if (numericColumns.length > 0) {
      const timeSeriesScore = dateColumns.length > 0 ? 95 : 75;
      recommendations.push({
        chartType: 'line',
        confidence: timeSeriesScore,
        reasoning: dateColumns.length > 0 
          ? `Ideal for showing trends over time with ${dateColumns[0]}`
          : `Good for showing data progression in ${numericColumns[0]}`,
        bestColumn: numericColumns[0],
        icon: LineChart,
        priority: dateColumns.length > 0 ? 'high' : 'medium'
      });
    }

    // Scatter Plot for relationships
    if (numericColumns.length >= 2) {
      const correlation = calculateCorrelation(numericColumns[0], numericColumns[1]);
      recommendations.push({
        chartType: 'scatter',
        confidence: Math.abs(correlation) > 0.3 ? 90 : 75,
        reasoning: `Explore relationship between ${numericColumns[0]} and ${numericColumns[1]}`,
        icon: Activity,
        priority: Math.abs(correlation) > 0.5 ? 'high' : 'medium'
      });
    }

    // Histogram for distributions
    if (numericColumns.length > 0 && dataSize > 20) {
      recommendations.push({
        chartType: 'histogram',
        confidence: dataSize > 100 ? 85 : 70,
        reasoning: `Analyze distribution patterns in ${numericColumns[0]} (${dataSize} data points)`,
        bestColumn: numericColumns[0],
        icon: BarChart3,
        priority: 'medium'
      });
    }

    // Area Chart for cumulative data
    if (numericColumns.length > 0 && dataSize > 10) {
      recommendations.push({
        chartType: 'area',
        confidence: 78,
        reasoning: `Show cumulative trends and filled areas for ${numericColumns[0]}`,
        bestColumn: numericColumns[0],
        icon: TrendingUp,
        priority: 'low'
      });
    }

    // Sort by priority and confidence
    recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.confidence - a.confidence;
    });

    setRecommendations(recommendations.slice(0, 6)); // Show top 6 recommendations
  };

  const getNumericColumns = (columns: string[]) => {
    return columns.filter(col => {
      const sample = data.slice(0, 10).map(row => row[col]).filter(val => val != null && val !== '');
      const numericCount = sample.filter(val => !isNaN(Number(val))).length;
      return numericCount > sample.length * 0.8;
    });
  };

  const getCategoricalColumns = (columns: string[]) => {
    return columns.filter(col => {
      const uniqueValues = new Set(data.map(row => row[col]));
      return uniqueValues.size <= 20 && uniqueValues.size > 1;
    });
  };

  const getDateColumns = (columns: string[]) => {
    return columns.filter(col => {
      const sample = data.slice(0, 5).map(row => row[col]).filter(val => val != null && val !== '');
      const dateCount = sample.filter(val => !isNaN(Date.parse(val))).length;
      return dateCount > sample.length * 0.8;
    });
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

  const handleAddChart = (recommendation: ChartRecommendation) => {
    onChartAdd(recommendation.chartType, recommendation.bestColumn);
    setAddedCharts(prev => new Set([...prev, recommendation.chartType]));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'default';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-success';
    if (confidence >= 75) return 'text-warning';
    return 'text-muted-foreground';
  };

  if (!data || data.length === 0) return null;

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
          <Zap className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Smart Chart Recommendations
          </h3>
          <p className="text-sm text-muted-foreground">
            AI-suggested visualizations based on your data characteristics
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((rec, index) => {
          const IconComponent = rec.icon;
          const isAdded = addedCharts.has(rec.chartType);
          
          return (
            <div
              key={`${rec.chartType}-${index}`}
              className="group relative p-4 border rounded-lg hover:shadow-md transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <IconComponent className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium capitalize">
                      {rec.chartType.replace('-', ' ')} Chart
                    </span>
                    <Badge variant={getPriorityColor(rec.priority) as any} className="text-xs w-fit">
                      {rec.priority} priority
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Star className="w-3 h-3 text-yellow-500" />
                  <span className={`text-xs font-medium ${getConfidenceColor(rec.confidence)}`}>
                    {rec.confidence}%
                  </span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {rec.reasoning}
              </p>

              <Button
                size="sm"
                variant={isAdded ? "outline" : "default"}
                disabled={isAdded}
                onClick={() => handleAddChart(rec)}
                className="w-full transition-all duration-300 hover:scale-105"
              >
                {isAdded ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Added to Dashboard
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Add Chart
                  </>
                )}
              </Button>

              {rec.priority === 'high' && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background"></div>
              )}
            </div>
          );
        })}
      </div>

      {recommendations.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <div className="font-medium mb-1">No recommendations available</div>
          <div className="text-sm">Analyzing your data for chart suggestions...</div>
        </div>
      )}
    </Card>
  );
};