import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDataAnalysis, calculateCorrelation } from "@/hooks/useDataAnalysis";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from "recharts";
import {
  BarChart3, TrendingUp, Hash, Activity,
  ArrowUpRight, ArrowDownRight, Minus
} from "lucide-react";

interface StatisticalAnalysisProps {
  data: any[];
}

const ProgressRing = ({ percent, size = 48, strokeWidth = 4 }: { percent: number; size?: number; strokeWidth?: number }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);
  const color = percent >= 90 ? 'hsl(var(--accent))' : percent >= 70 ? 'hsl(var(--chart-3))' : 'hsl(var(--destructive))';

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-1000 ease-out" />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
        className="fill-foreground text-[10px] font-semibold" transform={`rotate(90 ${size / 2} ${size / 2})`}>
        {percent.toFixed(0)}%
      </text>
    </svg>
  );
};

const HeatmapCell = ({ value, label }: { value: number; label: string }) => {
  const intensity = Math.abs(value);
  const bgColor = value > 0
    ? `hsl(var(--accent) / ${intensity * 0.7 + 0.05})`
    : value < 0
    ? `hsl(var(--destructive) / ${intensity * 0.7 + 0.05})`
    : 'hsl(var(--muted) / 0.3)';

  return (
    <div
      className="aspect-square flex items-center justify-center rounded-md text-[10px] font-medium cursor-pointer transition-all duration-200 hover:scale-110 hover:shadow-md border border-transparent hover:border-foreground/10"
      style={{ backgroundColor: bgColor }}
      title={`${label}: ${(value * 100).toFixed(1)}%`}
    >
      {Math.abs(value) > 0.01 ? (value > 0 ? '+' : '') + (value * 100).toFixed(0) : '—'}
    </div>
  );
};

export const StatisticalAnalysis = ({ data }: StatisticalAnalysisProps) => {
  const { numericColumns, columnStats } = useDataAnalysis(data);
  const [selectedCol, setSelectedCol] = useState<string | null>(null);

  const distributionData = useMemo(() => {
    const col = selectedCol || numericColumns[0];
    if (!col) return [];
    const values = data.map(row => parseFloat(row[col])).filter(v => !isNaN(v));
    if (values.length === 0) return [];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binCount = Math.min(20, Math.ceil(Math.sqrt(values.length)));
    const binSize = (max - min) / binCount || 1;
    const bins = Array.from({ length: binCount }, (_, i) => ({
      range: `${(min + i * binSize).toFixed(1)}`,
      count: 0,
    }));
    values.forEach(v => {
      const idx = Math.min(Math.floor((v - min) / binSize), binCount - 1);
      bins[idx].count++;
    });
    return bins;
  }, [data, numericColumns, selectedCol]);

  const correlationMatrix = useMemo(() => {
    const cols = numericColumns.slice(0, 8);
    return cols.map(col1 =>
      cols.map(col2 => col1 === col2 ? 1 : calculateCorrelation(data, col1, col2))
    );
  }, [data, numericColumns]);

  const boxPlotData = useMemo(() => {
    return numericColumns.slice(0, 6).map(col => {
      const stats = columnStats[col];
      if (!stats) return null;
      return {
        name: col.length > 12 ? col.slice(0, 12) + '…' : col,
        fullName: col,
        median: stats.median,
        iqrHeight: stats.q3 - stats.q1,
        base: stats.q1,
      };
    }).filter(Boolean);
  }, [numericColumns, columnStats]);

  const displayCols = numericColumns.slice(0, 8);
  const GRADIENT_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4 bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg text-xs">Overview</TabsTrigger>
          <TabsTrigger value="distributions" className="rounded-lg text-xs">Distributions</TabsTrigger>
          <TabsTrigger value="correlations" className="rounded-lg text-xs">Correlations</TabsTrigger>
          <TabsTrigger value="boxplots" className="rounded-lg text-xs">Box Plots</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {numericColumns.map((col, idx) => {
              const stats = columnStats[col];
              if (!stats) return null;
              const completeness = 100 - stats.missingPercentage;
              const trendIcon = stats.mean > stats.median
                ? <ArrowUpRight className="w-3 h-3 text-accent" />
                : stats.mean < stats.median
                ? <ArrowDownRight className="w-3 h-3 text-destructive" />
                : <Minus className="w-3 h-3 text-muted-foreground" />;

              return (
                <Card key={col} className="p-4 space-y-3 animate-fade-in cursor-pointer transition-all duration-300 hover:shadow-md hover:border-primary/20"
                  style={{ animationDelay: `${idx * 80}ms`, animationFillMode: 'both' }}
                  onClick={() => setSelectedCol(col)}>
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-sm truncate">{col}</h4>
                      <div className="flex items-center gap-1 mt-0.5">
                        {trendIcon}
                        <span className="text-xs text-muted-foreground">
                          {stats.mean > stats.median ? 'Right-skewed' : stats.mean < stats.median ? 'Left-skewed' : 'Symmetric'}
                        </span>
                      </div>
                    </div>
                    <ProgressRing percent={completeness} size={40} strokeWidth={3} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5"><Hash className="w-3 h-3 text-muted-foreground" /><span className="text-muted-foreground">Mean:</span><span className="font-medium">{stats.mean.toFixed(2)}</span></div>
                    <div className="flex items-center gap-1.5"><Activity className="w-3 h-3 text-muted-foreground" /><span className="text-muted-foreground">Std:</span><span className="font-medium">{stats.stdDev.toFixed(2)}</span></div>
                    <div className="flex items-center gap-1.5"><TrendingUp className="w-3 h-3 text-muted-foreground" /><span className="text-muted-foreground">Min:</span><span className="font-medium">{stats.min.toFixed(2)}</span></div>
                    <div className="flex items-center gap-1.5"><BarChart3 className="w-3 h-3 text-muted-foreground" /><span className="text-muted-foreground">Max:</span><span className="font-medium">{stats.max.toFixed(2)}</span></div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                    <span>{stats.uniqueCount} unique</span>
                    <span>IQR: {stats.iqr.toFixed(2)}</span>
                    <Badge variant="outline" className="text-[9px] px-1 py-0">Q1: {stats.q1.toFixed(1)} | Q3: {stats.q3.toFixed(1)}</Badge>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="distributions">
          <Card className="p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Distribution: {selectedCol || numericColumns[0] || 'N/A'}
              </h4>
              <div className="flex gap-1 flex-wrap">
                {numericColumns.slice(0, 6).map(col => (
                  <Badge key={col} variant={col === (selectedCol || numericColumns[0]) ? "default" : "outline"}
                    className="cursor-pointer text-[10px] px-2 py-0.5 transition-all hover:scale-105"
                    onClick={() => setSelectedCol(col)}>
                    {col.length > 10 ? col.slice(0, 10) + '…' : col}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distributionData} barCategoryGap="8%">
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="range" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(value: any) => [value, 'Count']} />
                  <Bar dataKey="count" fill="url(#barGradient)" radius={[4, 4, 0, 0]} animationDuration={800}>
                    {distributionData.map((_, i) => (<Cell key={i} />))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="correlations">
          <Card className="p-6 animate-fade-in">
            <h4 className="font-semibold text-sm flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-primary" />
              Correlation Matrix
            </h4>
            {displayCols.length > 1 ? (
              <div className="overflow-x-auto">
                <div className="inline-block min-w-fit">
                  <div className="flex items-end mb-1" style={{ paddingLeft: '80px' }}>
                    {displayCols.map(col => (
                      <div key={col} className="w-12 text-[9px] text-muted-foreground text-center truncate px-0.5" title={col}>{col.slice(0, 6)}</div>
                    ))}
                  </div>
                  {displayCols.map((rowCol, ri) => (
                    <div key={rowCol} className="flex items-center gap-1 mb-1">
                      <div className="w-[76px] text-[10px] text-muted-foreground text-right pr-1 truncate shrink-0" title={rowCol}>
                        {rowCol.length > 10 ? rowCol.slice(0, 10) + '…' : rowCol}
                      </div>
                      {displayCols.map((colCol, ci) => (
                        <div key={colCol} className="w-12 shrink-0">
                          <HeatmapCell value={correlationMatrix[ri]?.[ci] ?? 0} label={`${rowCol} × ${colCol}`} />
                        </div>
                      ))}
                    </div>
                  ))}
                  <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-muted-foreground">
                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--destructive) / 0.6)' }} /><span>Negative</span></div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--muted) / 0.3)' }} /><span>None</span></div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--accent) / 0.6)' }} /><span>Positive</span></div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Need at least 2 numeric columns for correlation analysis</p>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="boxplots">
          <Card className="p-6 animate-fade-in">
            <h4 className="font-semibold text-sm flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-primary" />
              Box Plot Summary
            </h4>
            {boxPlotData.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={boxPlotData} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(value: any, name: string) => {
                        const labels: Record<string, string> = { base: 'Q1', iqrHeight: 'IQR' };
                        return [typeof value === 'number' ? value.toFixed(2) : value, labels[name] || name];
                      }} />
                    <Bar dataKey="base" stackId="box" fill="transparent" />
                    <Bar dataKey="iqrHeight" stackId="box" radius={[4, 4, 0, 0]} animationDuration={800}>
                      {boxPlotData.map((_, i) => (<Cell key={i} fill={GRADIENT_COLORS[i % GRADIENT_COLORS.length]} fillOpacity={0.7} />))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No numeric columns available</p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
              {boxPlotData.map((bp: any, i) => (
                <div key={i} className="text-[10px] p-2 rounded-lg bg-muted/30 border border-border/50">
                  <span className="font-medium">{bp.fullName}</span>
                  <div className="flex justify-between mt-1 text-muted-foreground">
                    <span>Med: {bp.median.toFixed(1)}</span>
                    <span>IQR: {bp.iqrHeight.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
