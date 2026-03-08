import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Brain, Lightbulb, TrendingUp, AlertTriangle, Target,
  Sparkles, ChevronRight, Zap
} from "lucide-react";
import { useDataAnalysis, calculateCorrelation } from "@/hooks/useDataAnalysis";

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
  const { numericColumns, categoricalColumns, columnStats } = useDataAnalysis(data || []);
  const [refreshKey, setRefreshKey] = useState(0);

  const insights = useMemo(() => {
    if (!data || data.length === 0) return [];

    const result: Insight[] = [];

    // Missing value insights
    Object.entries(columnStats).forEach(([col, stats]) => {
      if (stats.missingPercentage > 15) {
        result.push({
          id: `missing-${col}`,
          type: 'recommendation',
          severity: stats.missingPercentage > 30 ? 'high' : 'medium',
          title: `High Missing Values in ${col}`,
          description: `${stats.missingPercentage.toFixed(1)}% missing values detected. Consider imputation or removal strategies.`,
          confidence: 95,
          actionable: true
        });
      }
    });

    // Correlation insights
    for (let i = 0; i < numericColumns.length; i++) {
      for (let j = i + 1; j < numericColumns.length; j++) {
        const corr = calculateCorrelation(data, numericColumns[i], numericColumns[j]);
        if (Math.abs(corr) > 0.7) {
          result.push({
            id: `correlation-${numericColumns[i]}-${numericColumns[j]}`,
            type: 'correlation',
            severity: Math.abs(corr) > 0.9 ? 'high' : 'medium',
            title: `Strong Correlation Detected`,
            description: `${numericColumns[i]} and ${numericColumns[j]} show ${corr > 0 ? 'positive' : 'negative'} correlation (${(corr * 100).toFixed(1)}%)`,
            confidence: 88,
            actionable: true
          });
        }
      }
    }

    // Distribution insights
    numericColumns.forEach(col => {
      const stats = columnStats[col];
      if (!stats) return;
      const skewness = Math.abs(stats.mean - stats.median) / (stats.max - stats.min || 1);
      if (skewness > 0.3) {
        result.push({
          id: `distribution-${col}`,
          type: 'pattern',
          severity: 'medium',
          title: `Skewed Distribution in ${col}`,
          description: `Data shows ${stats.mean > stats.median ? 'right' : 'left'} skewness. Consider data transformation.`,
          confidence: 82,
          actionable: true
        });
      }
    });

    // Outlier detection
    numericColumns.forEach(col => {
      const stats = columnStats[col];
      if (!stats) return;
      const threshold = 1.5 * stats.iqr;
      const values = data.map(row => parseFloat(row[col])).filter(v => !isNaN(v));
      const outliers = values.filter(v => v < stats.q1 - threshold || v > stats.q3 + threshold);
      const pct = (outliers.length / values.length) * 100;
      if (pct > 5) {
        result.push({
          id: `outliers-${col}`,
          type: 'outlier',
          severity: pct > 10 ? 'high' : 'medium',
          title: `Outliers Detected in ${col}`,
          description: `${outliers.length} outliers found (${pct.toFixed(1)}% of data). Review for data quality issues.`,
          confidence: 91,
          actionable: true
        });
      }
    });

    // Chart recommendations
    if (categoricalColumns.length > 0) {
      result.push({
        id: 'chart-categorical',
        type: 'recommendation',
        severity: 'low',
        title: 'Bar Chart Recommended',
        description: `Use bar charts to visualize categorical data in ${categoricalColumns[0]}.`,
        confidence: 95,
        actionable: true
      });
    }
    if (numericColumns.length >= 2) {
      result.push({
        id: 'chart-scatter',
        type: 'recommendation',
        severity: 'low',
        title: 'Scatter Plot Recommended',
        description: `Explore relationships between ${numericColumns[0]} and ${numericColumns[1]}.`,
        confidence: 90,
        actionable: true
      });
    }
    if (data.length > 50) {
      result.push({
        id: 'chart-histogram',
        type: 'recommendation',
        severity: 'low',
        title: 'Histogram Analysis Suggested',
        description: `With ${data.length} data points, histograms will reveal distribution patterns.`,
        confidence: 88,
        actionable: true
      });
    }

    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, numericColumns, categoricalColumns, columnStats, refreshKey]);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'correlation': return <TrendingUp className="w-4 h-4" />;
      case 'outlier': return <AlertTriangle className="w-4 h-4" />;
      case 'recommendation': return <Target className="w-4 h-4" />;
      case 'pattern': return <Sparkles className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  if (!data || data.length === 0) return null;

  const highCount = insights.filter(i => i.severity === 'high').length;
  const actionableCount = insights.filter(i => i.actionable).length;
  const avgConf = insights.length > 0 ? Math.round(insights.reduce((s, i) => s + i.confidence, 0) / insights.length) : 0;

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              AI-Powered Insights
            </h3>
            <p className="text-sm text-muted-foreground">
              Intelligent analysis of your data
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setRefreshKey(k => k + 1)}
          className="transition-all duration-300 hover:scale-105">
          <Zap className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="text-center p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl">
          <div className="text-lg font-bold text-primary">{insights.length}</div>
          <div className="text-xs text-muted-foreground">Total Insights</div>
        </div>
        <div className="text-center p-3 bg-gradient-to-br from-destructive/10 to-destructive/5 rounded-xl">
          <div className="text-lg font-bold text-destructive">{highCount}</div>
          <div className="text-xs text-muted-foreground">High Priority</div>
        </div>
        <div className="text-center p-3 bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl">
          <div className="text-lg font-bold text-accent">{actionableCount}</div>
          <div className="text-xs text-muted-foreground">Actionable</div>
        </div>
        <div className="text-center p-3 bg-gradient-to-br from-chart-4/10 to-chart-4/5 rounded-xl">
          <div className="text-lg font-bold" style={{ color: 'hsl(var(--chart-4))' }}>{avgConf}%</div>
          <div className="text-xs text-muted-foreground">Avg Confidence</div>
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        {insights.length > 0 ? (
          insights.map((insight) => (
            <div key={insight.id}
              className="flex items-start space-x-4 p-4 rounded-xl border hover:shadow-md transition-all duration-300 hover:border-primary/20 group">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-muted/50 shrink-0">
                {getInsightIcon(insight.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h4 className="font-medium text-sm">{insight.title}</h4>
                  <Badge variant={getSeverityColor(insight.severity) as any} className="text-[10px] px-1.5 py-0">
                    {insight.severity}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{insight.confidence}%</span>
                </div>
                <p className="text-sm text-muted-foreground">{insight.description}</p>
                {insight.actionable && (
                  <div className="mt-1.5 flex items-center text-xs text-primary group-hover:text-primary/80">
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
            <div className="font-medium mb-1">No insights generated</div>
            <div className="text-sm">Upload data with more columns to see AI analysis</div>
          </div>
        )}
      </div>
    </Card>
  );
};
