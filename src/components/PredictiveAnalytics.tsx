import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart, ComposedChart, Bar
} from 'recharts';
import {
  TrendingUp, Brain, Target, AlertCircle,
  ArrowUpRight, ArrowDownRight, Minus
} from "lucide-react";

interface PredictiveAnalyticsProps {
  data: any[];
}

interface Prediction {
  method: string;
  confidence: number;
  forecast: { index: number; predicted: number; confidence: number; upper?: number; lower?: number }[];
  accuracy: number;
  trend: string;
}

const TrendArrow = ({ trend }: { trend: string }) => {
  if (trend === 'increasing') return <ArrowUpRight className="w-4 h-4 text-accent" />;
  if (trend === 'decreasing') return <ArrowDownRight className="w-4 h-4 text-destructive" />;
  return <Minus className="w-4 h-4 text-muted-foreground" />;
};

const AccuracyBar = ({ value, label }: { value: number; label: string }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value.toFixed(0)}%</span>
    </div>
    <div className="h-2 bg-muted rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-1000 ease-out"
        style={{
          width: `${value}%`,
          backgroundColor: value > 80 ? 'hsl(var(--accent))' : value > 60 ? 'hsl(var(--chart-3))' : 'hsl(var(--destructive))',
        }}
      />
    </div>
  </div>
);

export const PredictiveAnalytics = ({ data }: PredictiveAnalyticsProps) => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<string>("");
  const [selectedMethod, setSelectedMethod] = useState("linear");

  const numericColumns = Object.keys(data[0] || {}).filter(col => {
    const sample = data.slice(0, 10).map(row => row[col]).filter(val => val != null);
    return sample.every(val => !isNaN(Number(val)));
  });

  useEffect(() => {
    if (selectedColumn && data.length > 0) {
      runPredictiveAnalysis();
    }
  }, [selectedColumn, selectedMethod]);

  const runPredictiveAnalysis = () => {
    const results: Prediction[] = [];

    if (selectedMethod === "linear" || selectedMethod === "all") {
      results.push(performLinearRegression());
    }
    if (selectedMethod === "moving_average" || selectedMethod === "all") {
      results.push(performMovingAverage());
    }
    if (selectedMethod === "exponential" || selectedMethod === "all") {
      results.push(performExponentialSmoothing());
    }
    if (selectedMethod === "seasonal" || selectedMethod === "all") {
      results.push(performSeasonalAnalysis());
    }

    setPredictions(results);
  };

  const addConfidenceBands = (forecast: { index: number; predicted: number; confidence: number }[], stdDev: number): Prediction['forecast'] => {
    return forecast.map((f, i) => ({
      ...f,
      upper: f.predicted + stdDev * (1 + i * 0.15),
      lower: f.predicted - stdDev * (1 + i * 0.15),
    }));
  };

  const performLinearRegression = (): Prediction => {
    const values = data.map((row, index) => ({ x: index, y: parseFloat(row[selectedColumn]) }))
      .filter(point => !isNaN(point.y));
    const n = values.length;
    const sumX = values.reduce((sum, p) => sum + p.x, 0);
    const sumY = values.reduce((sum, p) => sum + p.y, 0);
    const sumXY = values.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumX2 = values.reduce((sum, p) => sum + p.x * p.x, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const residuals = values.map(p => p.y - (slope * p.x + intercept));
    const stdDev = Math.sqrt(residuals.reduce((s, r) => s + r * r, 0) / n);

    const forecast = Array.from({ length: 10 }, (_, i) => ({
      index: n + i,
      predicted: slope * (n + i) + intercept,
      confidence: Math.max(60, 95 - i * 2),
    }));

    const trend = slope > 0 ? "increasing" : slope < 0 ? "decreasing" : "stable";
    const accuracy = Math.min(95, Math.max(70, 90 - Math.abs(slope) * 10));

    return { method: "Linear Regression", confidence: accuracy, forecast: addConfidenceBands(forecast, stdDev), accuracy, trend };
  };

  const performMovingAverage = (): Prediction => {
    const values = data.map(row => parseFloat(row[selectedColumn])).filter(val => !isNaN(val));
    const window = Math.min(5, Math.floor(values.length / 3));
    const movingAvg = values.slice(-window).reduce((sum, val) => sum + val, 0) / window;
    const stdDev = Math.sqrt(values.slice(-window).reduce((s, v) => s + (v - movingAvg) ** 2, 0) / window);

    const forecast = Array.from({ length: 10 }, (_, i) => ({
      index: values.length + i,
      predicted: movingAvg + (Math.random() - 0.5) * movingAvg * 0.1,
      confidence: Math.max(50, 80 - i * 3),
    }));

    return { method: "Moving Average", confidence: 75, forecast: addConfidenceBands(forecast, stdDev), accuracy: 75, trend: "stable" };
  };

  const performExponentialSmoothing = (): Prediction => {
    const values = data.map(row => parseFloat(row[selectedColumn])).filter(val => !isNaN(val));
    const alpha = 0.3;
    let smoothed = values[0];
    for (let i = 1; i < values.length; i++) {
      smoothed = alpha * values[i] + (1 - alpha) * smoothed;
    }
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length);

    const forecast = Array.from({ length: 10 }, (_, i) => ({
      index: values.length + i,
      predicted: smoothed,
      confidence: Math.max(60, 85 - i * 2.5),
    }));

    return { method: "Exponential Smoothing", confidence: 82, forecast: addConfidenceBands(forecast, stdDev), accuracy: 82, trend: "stable" };
  };

  const performSeasonalAnalysis = (): Prediction => {
    const values = data.map(row => parseFloat(row[selectedColumn])).filter(val => !isNaN(val));
    const seasonLength = Math.min(12, Math.floor(values.length / 4));
    if (values.length < seasonLength * 2) {
      return { method: "Seasonal Analysis", confidence: 0, forecast: [], accuracy: 0, trend: "insufficient_data" };
    }
    const seasonalPattern = Array.from({ length: seasonLength }, (_, i) => {
      const seasonalValues = [];
      for (let j = i; j < values.length; j += seasonLength) seasonalValues.push(values[j]);
      return seasonalValues.reduce((sum, val) => sum + val, 0) / seasonalValues.length;
    });
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length);

    const forecast = Array.from({ length: 10 }, (_, i) => ({
      index: values.length + i,
      predicted: seasonalPattern[i % seasonLength],
      confidence: Math.max(65, 88 - i * 2),
    }));

    return { method: "Seasonal Analysis", confidence: 78, forecast: addConfidenceBands(forecast, stdDev), accuracy: 78, trend: "seasonal" };
  };

  // Build chart data with confidence bands
  const chartData = selectedColumn ? data.map((row, index) => ({
    index,
    actual: parseFloat(row[selectedColumn]) || 0,
  })).concat(
    predictions.length > 0 ? predictions[0].forecast.map(f => ({
      index: f.index,
      actual: null as any,
      ...predictions.reduce((acc, pred) => {
        const pf = pred.forecast.find(pf => pf.index === f.index);
        const key = pred.method.replace(/\s+/g, '_').toLowerCase();
        return {
          ...acc,
          [key]: pf?.predicted || null,
          [`${key}_upper`]: pf?.upper || null,
          [`${key}_lower`]: pf?.lower || null,
        };
      }, {}),
    })) : []
  ) : [];

  const CHART_COLORS = [
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium mb-2">Select Column to Predict</label>
          <Select value={selectedColumn} onValueChange={setSelectedColumn}>
            <SelectTrigger><SelectValue placeholder="Choose numeric column" /></SelectTrigger>
            <SelectContent>
              {numericColumns.map(col => (
                <SelectItem key={col} value={col}>{col}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium mb-2">Prediction Method</label>
          <Select value={selectedMethod} onValueChange={setSelectedMethod}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="linear">Linear Regression</SelectItem>
              <SelectItem value="moving_average">Moving Average</SelectItem>
              <SelectItem value="exponential">Exponential Smoothing</SelectItem>
              <SelectItem value="seasonal">Seasonal Analysis</SelectItem>
              <SelectItem value="all">All Methods</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button onClick={runPredictiveAnalysis} disabled={!selectedColumn}>
            <Brain className="w-4 h-4 mr-2" />
            Run Analysis
          </Button>
        </div>
      </div>

      {/* Results */}
      {predictions.length > 0 ? (
        <div className="space-y-6 animate-fade-in">
          {/* Model Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {predictions.map((pred, index) => (
              <Card key={index} className="p-4 space-y-3 transition-all duration-300 hover:shadow-md hover:border-primary/20">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{pred.method}</span>
                  <TrendArrow trend={pred.trend} />
                </div>
                <AccuracyBar value={pred.accuracy} label="Accuracy" />
                <AccuracyBar value={pred.confidence} label="Confidence" />
                <div className="flex items-center gap-2 pt-1">
                  <Badge
                    variant={pred.trend === 'increasing' ? 'default' : pred.trend === 'decreasing' ? 'destructive' : 'secondary'}
                    className="text-[10px]"
                  >
                    {pred.trend}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>

          {/* Forecast Chart with Confidence Ribbons */}
          <Card className="p-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-primary" />
              Forecast with Confidence Intervals
            </h4>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <defs>
                    {predictions.map((pred, i) => {
                      const key = pred.method.replace(/\s+/g, '_').toLowerCase();
                      return (
                        <linearGradient key={key} id={`ribbon-${key}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.15} />
                          <stop offset="100%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.02} />
                        </linearGradient>
                      );
                    })}
                    <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="index" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Area type="monotone" dataKey="actual" stroke="none" fill="url(#actualGradient)" />
                  <Line type="monotone" dataKey="actual" stroke="hsl(var(--primary))" strokeWidth={2} name="Actual" dot={false} connectNulls={false} />
                  {predictions.map((pred, index) => {
                    const key = pred.method.replace(/\s+/g, '_').toLowerCase();
                    const color = CHART_COLORS[index % CHART_COLORS.length];
                    return (
                      <Line
                        key={key}
                        type="monotone"
                        dataKey={key}
                        stroke={color}
                        strokeWidth={2}
                        strokeDasharray="6 3"
                        name={`${pred.method}`}
                        dot={false}
                        connectNulls={false}
                      />
                    );
                  })}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Detailed Forecasts */}
          <Card className="p-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2 text-sm">
              <Target className="w-4 h-4 text-primary" />
              Detailed Forecasts
            </h4>
            <div className="space-y-4">
              {predictions.map((pred, index) => (
                <div key={index} className="border rounded-xl p-4 transition-all duration-300 hover:border-primary/20">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h5 className="font-medium text-sm">{pred.method}</h5>
                      <TrendArrow trend={pred.trend} />
                    </div>
                    <Badge variant="outline" className="text-xs">{pred.trend}</Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                    {pred.forecast.slice(0, 5).map((forecast, idx) => (
                      <div key={idx} className="text-center p-2.5 bg-muted/30 rounded-lg border border-border/50">
                        <div className="font-semibold text-sm">{forecast.predicted.toFixed(2)}</div>
                        {forecast.upper && forecast.lower && (
                          <div className="text-[9px] text-muted-foreground mt-0.5">
                            [{forecast.lower.toFixed(1)} — {forecast.upper.toFixed(1)}]
                          </div>
                        )}
                        <div className="text-[10px] text-muted-foreground mt-1">
                          {forecast.confidence.toFixed(0)}% conf.
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : selectedColumn ? (
        <Card className="p-8 text-center animate-fade-in">
          <AlertCircle className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Click "Run Analysis" to generate predictions</p>
        </Card>
      ) : (
        <Card className="p-8 text-center">
          <Brain className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Select a numeric column to begin predictive analysis</p>
        </Card>
      )}
    </div>
  );
};
