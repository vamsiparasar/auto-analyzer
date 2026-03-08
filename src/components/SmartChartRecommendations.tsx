import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChartType } from "./ChartSelector";
import { 
  BarChart3, LineChart, PieChart, Activity,
  TrendingUp, Zap, Star, CheckCircle
} from "lucide-react";
import { useDataAnalysis, calculateCorrelation } from "@/hooks/useDataAnalysis";

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
  const [addedCharts, setAddedCharts] = useState<Set<string>>(new Set());
  const { numericColumns, categoricalColumns, dateColumns } = useDataAnalysis(data || []);

  const recommendations = useMemo(() => {
    if (!data || data.length === 0) return [];
    const recs: ChartRecommendation[] = [];

    if (categoricalColumns.length > 0) {
      const best = categoricalColumns[0];
      const uniq = new Set(data.map(row => row[best])).size;
      recs.push({
        chartType: 'bar', confidence: uniq <= 10 ? 95 : 80,
        reasoning: `Perfect for comparing ${uniq} categories in ${best}`,
        bestColumn: best, icon: BarChart3, priority: 'high'
      });
      if (uniq <= 6) {
        recs.push({
          chartType: 'pie', confidence: 88,
          reasoning: `Great for showing proportions of ${best} categories`,
          bestColumn: best, icon: PieChart, priority: 'medium'
        });
        recs.push({
          chartType: 'donut', confidence: 85,
          reasoning: `Modern donut view for ${best} distribution`,
          bestColumn: best, icon: PieChart, priority: 'low'
        });
      }
      if (numericColumns.length > 1) {
        recs.push({
          chartType: 'stacked-bar', confidence: 82,
          reasoning: `Compare multiple metrics across ${best} categories`,
          bestColumn: best, icon: BarChart3, priority: 'medium'
        });
      }
    }

    if (numericColumns.length > 0) {
      const ts = dateColumns.length > 0 ? 95 : 75;
      recs.push({
        chartType: 'line', confidence: ts,
        reasoning: dateColumns.length > 0 ? `Ideal for trends over time with ${dateColumns[0]}` : `Show progression in ${numericColumns[0]}`,
        bestColumn: numericColumns[0], icon: LineChart,
        priority: dateColumns.length > 0 ? 'high' : 'medium'
      });
      recs.push({
        chartType: 'area', confidence: 78,
        reasoning: `Cumulative trends for ${numericColumns[0]}`,
        bestColumn: numericColumns[0], icon: TrendingUp, priority: 'low'
      });
    }

    if (numericColumns.length >= 2) {
      const corr = calculateCorrelation(data, numericColumns[0], numericColumns[1]);
      recs.push({
        chartType: 'scatter', confidence: Math.abs(corr) > 0.3 ? 90 : 75,
        reasoning: `Explore relationship between ${numericColumns[0]} and ${numericColumns[1]}`,
        icon: Activity, priority: Math.abs(corr) > 0.5 ? 'high' : 'medium'
      });
      recs.push({
        chartType: 'heatmap', confidence: 84,
        reasoning: `Visualize correlation matrix across numeric columns`,
        icon: Activity, priority: 'medium'
      });
    }

    if (numericColumns.length > 0 && data.length > 20) {
      recs.push({
        chartType: 'histogram', confidence: data.length > 100 ? 85 : 70,
        reasoning: `Distribution patterns in ${numericColumns[0]} (${data.length} points)`,
        bestColumn: numericColumns[0], icon: BarChart3, priority: 'medium'
      });
    }

    if (numericColumns.length >= 3) {
      recs.push({
        chartType: 'radar', confidence: 80,
        reasoning: `Multi-dimensional comparison across ${numericColumns.length} metrics`,
        icon: Activity, priority: 'medium'
      });
    }

    recs.sort((a, b) => {
      const p = { high: 3, medium: 2, low: 1 };
      return p[b.priority] - p[a.priority] || b.confidence - a.confidence;
    });

    return recs.slice(0, 8);
  }, [data, numericColumns, categoricalColumns, dateColumns]);

  const handleAddChart = (rec: ChartRecommendation) => {
    onChartAdd(rec.chartType, rec.bestColumn);
    setAddedCharts(prev => new Set([...prev, `${rec.chartType}-${rec.bestColumn}`]));
  };

  if (!data || data.length === 0) return null;

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center">
          <Zap className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Smart Chart Recommendations
          </h3>
          <p className="text-sm text-muted-foreground">
            AI-suggested visualizations — click to add directly to your dashboard
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {recommendations.map((rec, index) => {
          const IconComponent = rec.icon;
          const key = `${rec.chartType}-${rec.bestColumn}`;
          const isAdded = addedCharts.has(key);
          
          return (
            <div key={`${rec.chartType}-${index}`}
              className="group relative p-4 border rounded-xl hover:shadow-md transition-all duration-300 hover:scale-[1.02] hover:border-primary/30">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <IconComponent className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <span className="font-medium text-sm capitalize block">
                      {rec.chartType.replace('-', ' ')}
                    </span>
                    <Badge variant={rec.priority === 'high' ? 'default' : rec.priority === 'medium' ? 'secondary' : 'outline'} 
                      className="text-[10px] px-1.5 py-0">
                      {rec.priority}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 text-yellow-500" />
                  <span className={`text-xs font-medium ${rec.confidence >= 90 ? 'text-accent' : rec.confidence >= 75 ? 'text-chart-3' : 'text-muted-foreground'}`}>
                    {rec.confidence}%
                  </span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{rec.reasoning}</p>

              <Button size="sm" variant={isAdded ? "outline" : "default"} disabled={isAdded}
                onClick={() => handleAddChart(rec)}
                className="w-full transition-all duration-300 hover:scale-105 text-xs h-8">
                {isAdded ? (
                  <><CheckCircle className="w-3 h-3 mr-1" />Added</>
                ) : (
                  <><Plus className="w-3 h-3 mr-1" />Add to Dashboard</>
                )}
              </Button>

              {rec.priority === 'high' && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background" />
              )}
            </div>
          );
        })}
      </div>

      {recommendations.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <div className="font-medium mb-1">No recommendations available</div>
          <div className="text-sm">Upload data with more columns for suggestions</div>
        </div>
      )}
    </Card>
  );
};
