import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  AreaChart,
  Area
} from "recharts";
import { ChartType } from "./ChartSelector";

interface ChartRendererProps {
  data: any[];
  chartType: ChartType;
  column?: string;
  numericColumns: string[];
  categoricalColumns: string[];
}

export const ChartRenderer = ({ 
  data, 
  chartType, 
  column, 
  numericColumns, 
  categoricalColumns 
}: ChartRendererProps) => {
  
  const COLORS = [
    'hsl(var(--chart-1))', 
    'hsl(var(--chart-2))', 
    'hsl(var(--chart-3))', 
    'hsl(var(--chart-4))', 
    'hsl(var(--chart-5))'
  ];

  const generateChartData = () => {
    switch (chartType) {
      case 'bar':
      case 'pie': {
        const targetColumn = column || categoricalColumns[0];
        if (!targetColumn) return [];
        
        const counts = data.reduce((acc, row) => {
          const value = row[targetColumn] || 'Unknown';
          acc[value] = (acc[value] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        return Object.entries(counts)
          .sort(([,a], [,b]) => Number(b) - Number(a))
          .slice(0, 10)
          .map(([name, value]) => ({ name, value }));
      }
      
      case 'line':
      case 'area': {
        const targetColumn = column || numericColumns[0];
        if (!targetColumn) return [];
        
        return data
          .slice(0, 20)
          .map((row, index) => ({
            index: index + 1,
            value: parseFloat(row[targetColumn]) || 0
          }))
          .filter(item => !isNaN(item.value));
      }
      
      case 'scatter': {
        const xColumn = numericColumns[0];
        const yColumn = numericColumns[1];
        if (!xColumn || !yColumn) return [];
        
        return data
          .slice(0, 50)
          .map(row => ({
            x: parseFloat(row[xColumn]) || 0,
            y: parseFloat(row[yColumn]) || 0
          }))
          .filter(item => !isNaN(item.x) && !isNaN(item.y));
      }
      
      case 'histogram': {
        const targetColumn = column || numericColumns[0];
        if (!targetColumn) return [];
        
        const values = data.map(row => parseFloat(row[targetColumn])).filter(val => !isNaN(val));
        const min = Math.min(...values);
        const max = Math.max(...values);
        const bins = 10;
        const binSize = (max - min) / bins;
        
        const histogram = Array.from({ length: bins }, (_, i) => {
          const binStart = min + i * binSize;
          const binEnd = binStart + binSize;
          const count = values.filter(val => val >= binStart && val < binEnd).length;
          return {
            range: `${binStart.toFixed(1)}-${binEnd.toFixed(1)}`,
            count
          };
        });
        
        return histogram;
      }
      
      default:
        return [];
    }
  };

  const chartData = generateChartData();
  
  if (!chartData.length) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        No data available for this chart type
      </div>
    );
  }

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <BarChart data={chartData}>
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
            <Bar dataKey="value" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
          </BarChart>
        );
        
      case 'line':
        return (
          <LineChart data={chartData}>
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
              stroke={COLORS[1]} 
              strokeWidth={2}
              dot={{ fill: COLORS[1], strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        );
        
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill={COLORS[2]}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        );
        
      case 'scatter':
        return (
          <ScatterChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              type="number"
              dataKey="x"
              fontSize={12}
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              type="number"
              dataKey="y"
              fontSize={12}
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Scatter dataKey="y" fill={COLORS[3]} />
          </ScatterChart>
        );
        
      case 'area':
        return (
          <AreaChart data={chartData}>
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
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={COLORS[4]} 
              fill={COLORS[4]}
              fillOpacity={0.3}
            />
          </AreaChart>
        );
        
      case 'histogram':
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="range" 
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
            <Bar dataKey="count" fill={COLORS[0]} radius={[2, 2, 0, 0]} />
          </BarChart>
        );
        
      default:
        return <div>Chart type not supported</div>;
    }
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      {renderChart()}
    </ResponsiveContainer>
  );
};