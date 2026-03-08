import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, Lightbulb, TrendingUp, AlertTriangle, Target,
  Sparkles, ChevronRight, Zap, Activity, BarChart3, Shield
} from "lucide-react";
import { useDataAnalysis, calculateCorrelation } from "@/hooks/useDataAnalysis";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, ScatterChart, Scatter
} from "recharts";

interface AIInsightsProps {
  data: any[];
}

interface Insight {
  id: string;
  type: 'correlation' | 'outlier' | 'trend' | 'recommendation' | 'pattern' | 'normality' | 'variance';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  sparkData?: any[];
}

const INSIGHT_COLORS: Record<string, string> = {
  correlation: 'hsl(var(--chart-1))',
  outlier: 'hsl(var(--destructive))',
  pattern: 'hsl(var(--chart-4))',
  recommendation: 'hsl(var(--accent))',
  trend: 'hsl(var(--chart-3))',
  normality: 'hsl(var(--chart-2))',
  variance: 'hsl(var(--chart-5))',
};

// Animated counter hook
const useAnimatedNumber = (target: number, duration = 800) => {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(from + (target - from) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration]);
  return current;
};

// Mini sparkline component
const MiniSparkline = ({ data, color, type = 'line' }: { data: any[]; color: string; type?: string }) => {
  if (!data || data.length === 0) return null;
  
  return (
    <div className="w-20 h-10 opacity-70">
      <ResponsiveContainer width="100%" height="100%">
        {type === 'scatter' ? (
          <ScatterChart margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
            <Scatter data={data} fill={color} dataKey="y">
              {data.map((_, i) => (
                <Cell key={i} fill={color} r={1.5} />
              ))}
            </Scatter>
          </ScatterChart>
        ) : type === 'area' ? (
          <AreaChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
            <defs>
              <linearGradient id={`spark-${color.replace(/[^a-z0-9]/gi, '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                <stop offset="100%" stopColor={color} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="y" stroke={color} strokeWidth={1.5}
              fill={`url(#spark-${color.replace(/[^a-z0-9]/gi, '')})`} dot={false} />
          </AreaChart>
        ) : (
          <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
            <Line type="monotone" dataKey="y" stroke={color} strokeWidth={1.5} dot={false} />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

// Confidence meter
const ConfidenceMeter = ({ value, color }: { value: number; color: string }) => (
  <div className="flex items-center gap-1.5 min-w-[80px]">
    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-1000 ease-out"
        style={{ width: `${value}%`, backgroundColor: color }}
      />
    </div>
    <span className="text-[10px] font-medium text-muted-foreground w-8 text-right">{value}%</span>
  </div>
);

// Health gauge component
const HealthGauge = ({ score }: { score: number }) => {
  const animatedScore = useAnimatedNumber(score);
  const gaugeData = [
    { value: score },
    { value: 100 - score },
  ];
  const getColor = (s: number) => s >= 80 ? 'hsl(var(--accent))' : s >= 60 ? 'hsl(var(--chart-3))' : 'hsl(var(--destructive))';
  const color = getColor(score);

  return (
    <div className="relative w-36 h-20">
      <ResponsiveContainer width="100%" height={80}>
        <PieChart>
          <Pie
            data={gaugeData}
            cx="50%"
            cy="95%"
            startAngle={180}
            endAngle={0}
            innerRadius={50}
            outerRadius={65}
            paddingAngle={0}
            dataKey="value"
            stroke="none"
          >
            <Cell fill={color} />
            <Cell fill="hsl(var(--muted))" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
        <div className="text-xl font-bold" style={{ color }}>{animatedScore}</div>
        <div className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">Health</div>
      </div>
    </div>
  );
};

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

    // Correlation insights with sparkline data
    for (let i = 0; i < numericColumns.length; i++) {
      for (let j = i + 1; j < numericColumns.length; j++) {
        const corr = calculateCorrelation(data, numericColumns[i], numericColumns[j]);
        if (Math.abs(corr) > 0.7) {
          const sparkData = data.slice(0, 30).map(row => ({
            x: parseFloat(row[numericColumns[i]]) || 0,
            y: parseFloat(row[numericColumns[j]]) || 0,
          }));
          result.push({
            id: `correlation-${numericColumns[i]}-${numericColumns[j]}`,
            type: 'correlation',
            severity: Math.abs(corr) > 0.9 ? 'high' : 'medium',
            title: `Strong Correlation Detected`,
            description: `${numericColumns[i]} and ${numericColumns[j]} show ${corr > 0 ? 'positive' : 'negative'} correlation (${(corr * 100).toFixed(1)}%)`,
            confidence: 88,
            actionable: true,
            sparkData,
          });
        }
      }
    }

    // Distribution insights with sparkline
    numericColumns.forEach(col => {
      const stats = columnStats[col];
      if (!stats) return;
      const skewness = Math.abs(stats.mean - stats.median) / (stats.max - stats.min || 1);
      if (skewness > 0.3) {
        const values = data.map(row => parseFloat(row[col])).filter(v => !isNaN(v)).slice(0, 40);
        const sparkData = values.map((v, i) => ({ x: i, y: v }));
        result.push({
          id: `distribution-${col}`,
          type: 'pattern',
          severity: 'medium',
          title: `Skewed Distribution in ${col}`,
          description: `Data shows ${stats.mean > stats.median ? 'right' : 'left'} skewness. Consider data transformation.`,
          confidence: 82,
          actionable: true,
          sparkData,
        });
      }
    });

    // Outlier detection with sparkline
    numericColumns.forEach(col => {
      const stats = columnStats[col];
      if (!stats) return;
      const threshold = 1.5 * stats.iqr;
      const values = data.map(row => parseFloat(row[col])).filter(v => !isNaN(v));
      const outliers = values.filter(v => v < stats.q1 - threshold || v > stats.q3 + threshold);
      const pct = (outliers.length / values.length) * 100;
      if (pct > 5) {
        const sparkData = values.slice(0, 40).map((v, i) => ({ x: i, y: v }));
        result.push({
          id: `outliers-${col}`,
          type: 'outlier',
          severity: pct > 10 ? 'high' : 'medium',
          title: `Outliers Detected in ${col}`,
          description: `${outliers.length} outliers found (${pct.toFixed(1)}% of data). Review for data quality issues.`,
          confidence: 91,
          actionable: true,
          sparkData,
        });
      }
    });

    // Trend detection (monotonic)
    numericColumns.slice(0, 5).forEach(col => {
      const values = data.map(row => parseFloat(row[col])).filter(v => !isNaN(v));
      if (values.length < 10) return;
      let increasing = 0, decreasing = 0;
      for (let k = 1; k < values.length; k++) {
        if (values[k] > values[k - 1]) increasing++;
        if (values[k] < values[k - 1]) decreasing++;
      }
      const total = values.length - 1;
      const incRatio = increasing / total;
      const decRatio = decreasing / total;
      if (incRatio > 0.7 || decRatio > 0.7) {
        const sparkData = values.slice(0, 40).map((v, i) => ({ x: i, y: v }));
        result.push({
          id: `trend-${col}`,
          type: 'trend',
          severity: 'medium',
          title: `${incRatio > 0.7 ? 'Increasing' : 'Decreasing'} Trend in ${col}`,
          description: `${((incRatio > 0.7 ? incRatio : decRatio) * 100).toFixed(0)}% of consecutive values ${incRatio > 0.7 ? 'increase' : 'decrease'}.`,
          confidence: 85,
          actionable: true,
          sparkData,
        });
      }
    });

    // Normality test (simplified Shapiro-Wilk-like via skewness/kurtosis)
    numericColumns.slice(0, 3).forEach(col => {
      const stats = columnStats[col];
      if (!stats) return;
      const values = data.map(row => parseFloat(row[col])).filter(v => !isNaN(v));
      if (values.length < 10) return;
      const n = values.length;
      const m = stats.mean;
      const s = stats.stdDev || 1;
      const skew = values.reduce((sum, v) => sum + Math.pow((v - m) / s, 3), 0) / n;
      const kurt = values.reduce((sum, v) => sum + Math.pow((v - m) / s, 4), 0) / n - 3;
      const isNormal = Math.abs(skew) < 0.5 && Math.abs(kurt) < 1;
      result.push({
        id: `normality-${col}`,
        type: 'normality',
        severity: 'low',
        title: `${col} is ${isNormal ? 'Normally' : 'Non-Normally'} Distributed`,
        description: `Skewness: ${skew.toFixed(2)}, Kurtosis: ${kurt.toFixed(2)}. ${isNormal ? 'Parametric tests are appropriate.' : 'Consider non-parametric methods.'}`,
        confidence: 80,
        actionable: !isNormal,
      });
    });

    // Variance analysis
    if (numericColumns.length >= 2) {
      const cvs = numericColumns.map(col => {
        const s = columnStats[col];
        return s ? { col, cv: s.stdDev / (Math.abs(s.mean) || 1) } : null;
      }).filter(Boolean) as { col: string; cv: number }[];
      const highVar = cvs.filter(c => c.cv > 1);
      if (highVar.length > 0) {
        result.push({
          id: 'variance-high',
          type: 'variance',
          severity: 'medium',
          title: 'High Variance Detected',
          description: `${highVar.map(h => h.col).join(', ')} ${highVar.length === 1 ? 'has' : 'have'} coefficient of variation > 1. Consider normalization.`,
          confidence: 86,
          actionable: true,
        });
      }
    }

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
      case 'trend': return <Activity className="w-4 h-4" />;
      case 'normality': return <BarChart3 className="w-4 h-4" />;
      case 'variance': return <Shield className="w-4 h-4" />;
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

  const getSparkType = (type: string) => {
    if (type === 'correlation') return 'scatter';
    if (type === 'pattern' || type === 'outlier') return 'area';
    return 'line';
  };

  if (!data || data.length === 0) return null;

  const highCount = insights.filter(i => i.severity === 'high').length;
  const actionableCount = insights.filter(i => i.actionable).length;
  const avgConf = insights.length > 0 ? Math.round(insights.reduce((s, i) => s + i.confidence, 0) / insights.length) : 0;

  // Compute health score
  const totalCols = Object.keys(columnStats).length || 1;
  const avgMissing = Object.values(columnStats).reduce((s, st) => s + st.missingPercentage, 0) / totalCols;
  const outlierInsights = insights.filter(i => i.type === 'outlier').length;
  const healthScore = Math.round(Math.max(0, Math.min(100,
    100 - avgMissing * 1.5 - outlierInsights * 5 - highCount * 3
  )));

  const animatedTotal = useAnimatedNumber(insights.length);
  const animatedHigh = useAnimatedNumber(highCount);
  const animatedActionable = useAnimatedNumber(actionableCount);
  const animatedConf = useAnimatedNumber(avgConf);

  return (
    <Card className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center animate-pulse-glow">
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

      {/* Health Gauge + Summary Stats */}
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="flex flex-col items-center">
          <HealthGauge score={healthScore} />
          <span className="text-[10px] text-muted-foreground mt-1">Data Quality Score</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1 w-full">
          <div className="text-center p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/10">
            <div className="text-lg font-bold text-primary">{animatedTotal}</div>
            <div className="text-xs text-muted-foreground">Total Insights</div>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-destructive/10 to-destructive/5 rounded-xl border border-destructive/10">
            <div className="text-lg font-bold text-destructive">{animatedHigh}</div>
            <div className="text-xs text-muted-foreground">High Priority</div>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl border border-accent/10">
            <div className="text-lg font-bold text-accent">{animatedActionable}</div>
            <div className="text-xs text-muted-foreground">Actionable</div>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-chart-4/10 to-chart-4/5 rounded-xl border border-chart-4/10">
            <div className="text-lg font-bold" style={{ color: 'hsl(var(--chart-4))' }}>{animatedConf}%</div>
            <div className="text-xs text-muted-foreground">Avg Confidence</div>
          </div>
        </div>
      </div>

      {/* Metric pills */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="text-xs px-2.5 py-1">
          {data.length} rows
        </Badge>
        <Badge variant="outline" className="text-xs px-2.5 py-1">
          {Object.keys(data[0] || {}).length} columns
        </Badge>
        <Badge variant="outline" className="text-xs px-2.5 py-1">
          {(100 - avgMissing).toFixed(1)}% complete
        </Badge>
        <Badge variant="outline" className="text-xs px-2.5 py-1">
          {numericColumns.length} numeric
        </Badge>
        <Badge variant="outline" className="text-xs px-2.5 py-1">
          {categoricalColumns.length} categorical
        </Badge>
      </div>

      <Separator />

      {/* Insight Cards */}
      <div className="space-y-3">
        {insights.length > 0 ? (
          insights.map((insight, idx) => {
            const borderColor = INSIGHT_COLORS[insight.type] || 'hsl(var(--border))';
            return (
              <div
                key={insight.id}
                className="flex items-start space-x-4 p-4 rounded-xl border hover:shadow-md transition-all duration-300 hover:border-primary/20 group animate-fade-in"
                style={{
                  borderLeft: `3px solid ${borderColor}`,
                  animationDelay: `${idx * 60}ms`,
                  animationFillMode: 'both',
                }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${borderColor}15`, color: borderColor }}
                >
                  {getInsightIcon(insight.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="font-medium text-sm">{insight.title}</h4>
                    <Badge variant={getSeverityColor(insight.severity) as any} className="text-[10px] px-1.5 py-0">
                      {insight.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                  <ConfidenceMeter value={insight.confidence} color={borderColor} />
                  {insight.actionable && (
                    <div className="mt-1.5 flex items-center text-xs text-primary group-hover:text-primary/80">
                      <span>Actionable insight</span>
                      <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </div>
                {insight.sparkData && insight.sparkData.length > 0 && (
                  <MiniSparkline
                    data={insight.sparkData}
                    color={borderColor}
                    type={getSparkType(insight.type)}
                  />
                )}
              </div>
            );
          })
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
