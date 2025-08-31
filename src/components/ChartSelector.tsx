import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  ScatterChart,
  TrendingUp,
  Activity,
  MapPin,
  Grid,
  Plus
} from "lucide-react";

export type ChartType = 
  | 'bar' 
  | 'line' 
  | 'pie' 
  | 'scatter' 
  | 'area' 
  | 'histogram' 
  | 'boxplot' 
  | 'heatmap' 
  | 'radar'
  | 'treemap'
  | 'bullet'
  | 'bubble'
  | 'funnel'
  | 'waterfall'
  | 'donut'
  | 'sankey'
  | 'gantt'
  | 'gauge'
  | 'stacked-area'
  | 'stacked-bar'
  | 'venn'
  | 'sunburst'
  | 'column'
  | 'map';

interface ChartSelectorProps {
  onChartAdd: (chartType: ChartType, column?: string) => void;
  availableColumns: string[];
  numericColumns: string[];
  categoricalColumns: string[];
}

export const ChartSelector = ({ 
  onChartAdd, 
  availableColumns, 
  numericColumns, 
  categoricalColumns 
}: ChartSelectorProps) => {
  const [selectedChartType, setSelectedChartType] = useState<ChartType | null>(null);

  const chartTypes = [
    {
      type: 'bar' as ChartType,
      name: 'Bar Chart',
      icon: BarChart3,
      description: 'Compare categories',
      color: 'chart-1',
      bestFor: 'Categorical data',
      requiresColumns: categoricalColumns.length > 0
    },
    {
      type: 'column' as ChartType,
      name: 'Column Chart',
      icon: BarChart3,
      description: 'Vertical bar chart',
      color: 'chart-1',
      bestFor: 'Categorical data',
      requiresColumns: categoricalColumns.length > 0
    },
    {
      type: 'stacked-bar' as ChartType,
      name: 'Stacked Bar',
      icon: BarChart3,
      description: 'Stacked categories',
      color: 'chart-1',
      bestFor: 'Multi-series',
      requiresColumns: categoricalColumns.length > 0 && numericColumns.length > 1
    },
    {
      type: 'line' as ChartType,
      name: 'Line Chart',
      icon: LineChart,
      description: 'Show trends over time',
      color: 'chart-2',
      bestFor: 'Time series',
      requiresColumns: numericColumns.length > 0
    },
    {
      type: 'pie' as ChartType,
      name: 'Pie Chart',
      icon: PieChart,
      description: 'Show proportions',
      color: 'chart-3',
      bestFor: 'Part-to-whole',
      requiresColumns: categoricalColumns.length > 0
    },
    {
      type: 'donut' as ChartType,
      name: 'Donut Chart',
      icon: PieChart,
      description: 'Hollow pie chart',
      color: 'chart-3',
      bestFor: 'Part-to-whole',
      requiresColumns: categoricalColumns.length > 0
    },
    {
      type: 'scatter' as ChartType,
      name: 'Scatter Plot',
      icon: ScatterChart,
      description: 'Find correlations',
      color: 'chart-4',
      bestFor: 'Relationships',
      requiresColumns: numericColumns.length >= 2
    },
    {
      type: 'bubble' as ChartType,
      name: 'Bubble Chart',
      icon: ScatterChart,
      description: '3D scatter plot',
      color: 'chart-4',
      bestFor: '3D relationships',
      requiresColumns: numericColumns.length >= 3
    },
    {
      type: 'area' as ChartType,
      name: 'Area Chart',
      icon: TrendingUp,
      description: 'Cumulative trends',
      color: 'chart-5',
      bestFor: 'Cumulative data',
      requiresColumns: numericColumns.length > 0
    },
    {
      type: 'stacked-area' as ChartType,
      name: 'Stacked Area',
      icon: TrendingUp,
      description: 'Multi-series area',
      color: 'chart-5',
      bestFor: 'Multi-series trends',
      requiresColumns: numericColumns.length > 1
    },
    {
      type: 'histogram' as ChartType,
      name: 'Histogram',
      icon: Activity,
      description: 'Data distribution',
      color: 'primary',
      bestFor: 'Distribution',
      requiresColumns: numericColumns.length > 0
    },
    {
      type: 'boxplot' as ChartType,
      name: 'Box Plot',
      icon: Grid,
      description: 'Statistical summary',
      color: 'accent',
      bestFor: 'Outliers & quartiles',
      requiresColumns: numericColumns.length > 0
    },
    {
      type: 'heatmap' as ChartType,
      name: 'Heatmap',
      icon: MapPin,
      description: 'Correlation matrix',
      color: 'secondary',
      bestFor: 'Correlations',
      requiresColumns: numericColumns.length >= 2
    },
    {
      type: 'treemap' as ChartType,
      name: 'TreeMap',
      icon: Grid,
      description: 'Hierarchical data',
      color: 'chart-1',
      bestFor: 'Hierarchical data',
      requiresColumns: categoricalColumns.length > 0
    },
    {
      type: 'sunburst' as ChartType,
      name: 'Sunburst',
      icon: PieChart,
      description: 'Nested pie chart',
      color: 'chart-3',
      bestFor: 'Hierarchical data',
      requiresColumns: categoricalColumns.length > 0
    },
    {
      type: 'funnel' as ChartType,
      name: 'Funnel Chart',
      icon: TrendingUp,
      description: 'Process stages',
      color: 'chart-2',
      bestFor: 'Process flow',
      requiresColumns: categoricalColumns.length > 0
    },
    {
      type: 'waterfall' as ChartType,
      name: 'Waterfall',
      icon: BarChart3,
      description: 'Cumulative effect',
      color: 'chart-4',
      bestFor: 'Change analysis',
      requiresColumns: numericColumns.length > 0
    },
    {
      type: 'bullet' as ChartType,
      name: 'Bullet Graph',
      icon: Activity,
      description: 'Performance vs target',
      color: 'chart-5',
      bestFor: 'KPI tracking',
      requiresColumns: numericColumns.length >= 2
    },
    {
      type: 'gauge' as ChartType,
      name: 'Gauge Chart',
      icon: Activity,
      description: 'Single metric',
      color: 'primary',
      bestFor: 'Single KPI',
      requiresColumns: numericColumns.length > 0
    },
    {
      type: 'radar' as ChartType,
      name: 'Radar Chart',
      icon: Grid,
      description: 'Multi-dimensional',
      color: 'accent',
      bestFor: 'Multi-criteria',
      requiresColumns: numericColumns.length >= 3
    },
    {
      type: 'sankey' as ChartType,
      name: 'Sankey Diagram',
      icon: TrendingUp,
      description: 'Flow visualization',
      color: 'secondary',
      bestFor: 'Flow analysis',
      requiresColumns: categoricalColumns.length >= 2
    },
    {
      type: 'gantt' as ChartType,
      name: 'Gantt Chart',
      icon: BarChart3,
      description: 'Timeline view',
      color: 'chart-2',
      bestFor: 'Project timeline',
      requiresColumns: categoricalColumns.length > 0 && numericColumns.length > 0
    },
    {
      type: 'venn' as ChartType,
      name: 'Venn Diagram',
      icon: Grid,
      description: 'Set relationships',
      color: 'chart-4',
      bestFor: 'Set analysis',
      requiresColumns: categoricalColumns.length >= 2
    },
    {
      type: 'map' as ChartType,
      name: 'Map Chart',
      icon: MapPin,
      description: 'Geographic data',
      color: 'chart-5',
      bestFor: 'Geographic analysis',
      requiresColumns: categoricalColumns.length > 0
    }
  ];

  const handleChartSelect = (chartType: ChartType) => {
    setSelectedChartType(chartType);
    onChartAdd(chartType);
  };

  return (
    <Card className="p-6 animate-fade-in">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
          <Plus className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Add Chart to Dashboard</h3>
          <p className="text-sm text-muted-foreground">
            Choose from {chartTypes.filter(chart => chart.requiresColumns).length} available chart types
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {chartTypes.map((chart) => {
          const Icon = chart.icon;
          const isDisabled = !chart.requiresColumns;
          
          return (
            <div
              key={chart.type}
              className={`
                relative border rounded-lg p-4 cursor-pointer transition-all duration-300
                ${isDisabled 
                  ? 'opacity-50 cursor-not-allowed bg-muted/20' 
                  : 'hover:shadow-md hover:scale-105 hover:border-primary/50 bg-card group'
                }
                ${selectedChartType === chart.type 
                  ? 'border-primary shadow-lg scale-105' 
                  : 'border-border'
                }
              `}
              onClick={() => !isDisabled && handleChartSelect(chart.type)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300
                  ${isDisabled 
                    ? 'bg-muted' 
                    : `bg-${chart.color}/10 group-hover:bg-${chart.color}/20`
                  }`}>
                  <Icon className={`w-4 h-4 transition-all duration-300 ${
                    isDisabled 
                      ? 'text-muted-foreground' 
                      : `text-${chart.color} group-hover:scale-110`
                  }`} />
                </div>
                {!isDisabled && (
                  <Badge variant="outline" className="text-xs">
                    Available
                  </Badge>
                )}
              </div>
              
              <div className="space-y-2">
                <h4 className={`font-medium ${isDisabled ? 'text-muted-foreground' : 'text-foreground'}`}>
                  {chart.name}
                </h4>
                <p className={`text-xs ${isDisabled ? 'text-muted-foreground/70' : 'text-muted-foreground'}`}>
                  {chart.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${isDisabled ? 'text-muted-foreground/70' : 'text-muted-foreground'}`}>
                    {chart.bestFor}
                  </span>
                  {isDisabled && (
                    <Badge variant="secondary" className="text-xs">
                      No data
                    </Badge>
                  )}
                </div>
              </div>

              {selectedChartType === chart.type && (
                <div className="absolute inset-0 bg-primary/10 rounded-lg pointer-events-none animate-pulse" />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <div>
            <span className="text-muted-foreground">Available columns:</span>
            <span className="ml-2 font-medium">{availableColumns.length}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Numeric:</span>
            <span className="ml-2 font-medium text-chart-1">{numericColumns.length}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Categorical:</span>
            <span className="ml-2 font-medium text-chart-2">{categoricalColumns.length}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};