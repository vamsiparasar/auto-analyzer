import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, ScatterChart, Scatter,
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Treemap, FunnelChart, Funnel, LabelList,
  ReferenceLine
} from "recharts";
import { ChartType } from "./ChartSelector";
import { calculateCorrelation } from "@/hooks/useDataAnalysis";

interface ChartRendererProps {
  data: any[];
  chartType: ChartType;
  column?: string;
  numericColumns: string[];
  categoricalColumns: string[];
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))'
];

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '12px'
};

const axisProps = {
  fontSize: 12,
  tick: { fill: 'hsl(var(--muted-foreground))' }
};

const generateChartData = (
  data: any[],
  chartType: ChartType,
  column: string | undefined,
  numericColumns: string[],
  categoricalColumns: string[]
) => {
  const categoricalCount = (col: string) => {
    const counts = data.reduce((acc, row) => {
      const value = row[col] || 'Unknown';
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts)
      .sort(([, a], [, b]) => Number(b) - Number(a))
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));
  };

  const numericSeries = (col: string, limit = 20) =>
    data.slice(0, limit).map((row, i) => ({
      index: i + 1,
      value: parseFloat(row[col]) || 0
    })).filter(item => !isNaN(item.value));

  switch (chartType) {
    case 'bar':
    case 'column':
    case 'pie':
    case 'donut':
    case 'funnel':
    case 'treemap':
    case 'sunburst':
    case 'map':
      return categoricalCount(column || categoricalColumns[0] || numericColumns[0]);

    case 'line':
    case 'area':
      return numericSeries(column || numericColumns[0], 30);

    case 'scatter': {
      const x = numericColumns[0], y = numericColumns[1];
      if (!x || !y) return [];
      return data.slice(0, 50).map(row => ({
        x: parseFloat(row[x]) || 0,
        y: parseFloat(row[y]) || 0
      })).filter(item => !isNaN(item.x) && !isNaN(item.y));
    }

    case 'bubble': {
      const [xc, yc, zc] = numericColumns;
      if (!xc || !yc || !zc) return [];
      return data.slice(0, 50).map(row => ({
        x: parseFloat(row[xc]) || 0,
        y: parseFloat(row[yc]) || 0,
        z: Math.abs(parseFloat(row[zc]) || 1)
      })).filter(d => !isNaN(d.x) && !isNaN(d.y));
    }

    case 'histogram': {
      const col = column || numericColumns[0];
      if (!col) return [];
      const values = data.map(row => parseFloat(row[col])).filter(v => !isNaN(v));
      const min = Math.min(...values), max = Math.max(...values);
      const bins = 10, binSize = (max - min) / bins;
      return Array.from({ length: bins }, (_, i) => {
        const s = min + i * binSize;
        return {
          range: `${s.toFixed(1)}-${(s + binSize).toFixed(1)}`,
          count: values.filter(v => v >= s && v < s + binSize).length
        };
      });
    }

    case 'boxplot': {
      const cols = numericColumns.slice(0, 5);
      return cols.map(col => {
        const vals = data.map(r => parseFloat(r[col])).filter(v => !isNaN(v)).sort((a, b) => a - b);
        if (vals.length === 0) return null;
        const n = vals.length;
        return {
          name: col.length > 10 ? col.slice(0, 10) + '…' : col,
          min: vals[0],
          q1: vals[Math.floor(n * 0.25)],
          median: vals[Math.floor(n * 0.5)],
          q3: vals[Math.floor(n * 0.75)],
          max: vals[n - 1]
        };
      }).filter(Boolean);
    }

    case 'heatmap': {
      const cols = numericColumns.slice(0, 6);
      return cols.map(c1 => {
        const row: any = { name: c1.length > 8 ? c1.slice(0, 8) + '…' : c1 };
        cols.forEach(c2 => {
          row[c2.length > 8 ? c2.slice(0, 8) + '…' : c2] = parseFloat(calculateCorrelation(data, c1, c2).toFixed(2));
        });
        return row;
      });
    }

    case 'stacked-bar': {
      const cat = categoricalColumns[0];
      const nums = numericColumns.slice(0, 3);
      if (!cat || nums.length === 0) return [];
      const grouped: Record<string, any> = {};
      data.forEach(row => {
        const key = row[cat] || 'Unknown';
        if (!grouped[key]) grouped[key] = { name: key };
        nums.forEach(n => {
          grouped[key][n] = (grouped[key][n] || 0) + (parseFloat(row[n]) || 0);
        });
      });
      return Object.values(grouped).slice(0, 10);
    }

    case 'stacked-area': {
      const nums = numericColumns.slice(0, 3);
      if (nums.length === 0) return [];
      return data.slice(0, 30).map((row, i) => {
        const d: any = { index: i + 1 };
        nums.forEach(n => { d[n] = parseFloat(row[n]) || 0; });
        return d;
      });
    }

    case 'waterfall': {
      const col = column || numericColumns[0];
      if (!col) return [];
      let cumulative = 0;
      return data.slice(0, 10).map((row, i) => {
        const val = parseFloat(row[col]) || 0;
        const start = cumulative;
        cumulative += val;
        return { name: `Item ${i + 1}`, value: val, start, end: cumulative };
      });
    }

    case 'radar': {
      const nums = numericColumns.slice(0, 6);
      if (nums.length < 3) return [];
      // Normalize each column to 0-100
      const stats = nums.map(col => {
        const vals = data.map(r => parseFloat(r[col])).filter(v => !isNaN(v));
        return { col, min: Math.min(...vals), max: Math.max(...vals), mean: vals.reduce((a, b) => a + b, 0) / vals.length };
      });
      return stats.map(s => ({
        subject: s.col.length > 10 ? s.col.slice(0, 10) + '…' : s.col,
        value: s.max - s.min > 0 ? ((s.mean - s.min) / (s.max - s.min)) * 100 : 50,
        fullMark: 100
      }));
    }

    case 'gauge': {
      const col = column || numericColumns[0];
      if (!col) return [];
      const vals = data.map(r => parseFloat(r[col])).filter(v => !isNaN(v));
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const max = Math.max(...vals);
      const pct = max > 0 ? (mean / max) * 100 : 0;
      return [
        { name: 'Value', value: pct },
        { name: 'Remaining', value: 100 - pct }
      ];
    }

    case 'bullet': {
      const [actual, target] = numericColumns;
      if (!actual || !target) return [];
      const actVals = data.map(r => parseFloat(r[actual])).filter(v => !isNaN(v));
      const tgtVals = data.map(r => parseFloat(r[target])).filter(v => !isNaN(v));
      return [{
        name: actual,
        actual: actVals.reduce((a, b) => a + b, 0) / actVals.length,
        target: tgtVals.reduce((a, b) => a + b, 0) / tgtVals.length,
        max: Math.max(...actVals, ...tgtVals) * 1.2
      }];
    }

    case 'sankey': {
      const [cat1, cat2] = categoricalColumns;
      if (!cat1 || !cat2) return [];
      const flows: Record<string, number> = {};
      data.forEach(row => {
        const key = `${row[cat1] || 'Unknown'} → ${row[cat2] || 'Unknown'}`;
        flows[key] = (flows[key] || 0) + 1;
      });
      return Object.entries(flows)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .map(([name, value]) => ({ name, value }));
    }

    case 'gantt': {
      const cat = categoricalColumns[0];
      const num = numericColumns[0];
      if (!cat || !num) return [];
      const grouped: Record<string, number[]> = {};
      data.forEach(row => {
        const key = row[cat] || 'Unknown';
        if (!grouped[key]) grouped[key] = [];
        const v = parseFloat(row[num]);
        if (!isNaN(v)) grouped[key].push(v);
      });
      return Object.entries(grouped).slice(0, 8).map(([name, vals]) => ({
        name: name.length > 12 ? name.slice(0, 12) + '…' : name,
        start: Math.min(...vals),
        end: Math.max(...vals),
        duration: Math.max(...vals) - Math.min(...vals)
      }));
    }

    case 'venn': {
      const [c1, c2] = categoricalColumns;
      if (!c1 || !c2) return [];
      const set1 = new Set(data.map(r => r[c1]));
      const set2 = new Set(data.map(r => r[c2]));
      const overlap = [...set1].filter(v => set2.has(v)).length;
      return [
        { name: c1, value: set1.size, fill: COLORS[0] },
        { name: c2, value: set2.size, fill: COLORS[1] },
        { name: 'Overlap', value: overlap, fill: COLORS[2] }
      ];
    }

    default:
      return [];
  }
};

export const ChartRenderer = ({
  data, chartType, column, numericColumns, categoricalColumns
}: ChartRendererProps) => {
  const chartData = generateChartData(data, chartType, column, numericColumns, categoricalColumns);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <div className="text-2xl mb-2">📊</div>
          <div className="text-sm">Insufficient data for this chart type</div>
        </div>
      </div>
    );
  }

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="name" {...axisProps} />
            <YAxis {...axisProps} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
          </BarChart>
        );

      case 'column':
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="name" {...axisProps} />
            <YAxis {...axisProps} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" fill={COLORS[1]} radius={[4, 4, 0, 0]} />
          </BarChart>
        );

      case 'line':
        return (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="index" {...axisProps} />
            <YAxis {...axisProps} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="value" stroke={COLORS[1]} strokeWidth={2}
              dot={{ fill: COLORS[1], strokeWidth: 2, r: 3 }} />
          </LineChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie data={chartData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
              {chartData.map((_: any, i: number) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        );

      case 'donut':
        return (
          <PieChart>
            <Pie data={chartData} cx="50%" cy="50%" outerRadius={80} innerRadius={45} dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
              {chartData.map((_: any, i: number) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        );

      case 'scatter':
        return (
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis type="number" dataKey="x" {...axisProps} />
            <YAxis type="number" dataKey="y" {...axisProps} />
            <Tooltip contentStyle={tooltipStyle} />
            <Scatter data={chartData} fill={COLORS[3]} />
          </ScatterChart>
        );

      case 'bubble':
        return (
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis type="number" dataKey="x" {...axisProps} />
            <YAxis type="number" dataKey="y" {...axisProps} />
            <Tooltip contentStyle={tooltipStyle} />
            <Scatter data={chartData} fill={COLORS[2]}>
              {chartData.map((entry: any, i: number) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]}
                  // @ts-ignore
                  r={Math.max(4, Math.min(20, entry.z / Math.max(...chartData.map((d: any) => d.z)) * 20))} />
              ))}
            </Scatter>
          </ScatterChart>
        );

      case 'area':
        return (
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="index" {...axisProps} />
            <YAxis {...axisProps} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="value" stroke={COLORS[4]} fill={COLORS[4]} fillOpacity={0.3} />
          </AreaChart>
        );

      case 'histogram':
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="range" {...axisProps} angle={-30} textAnchor="end" height={60} />
            <YAxis {...axisProps} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="count" fill={COLORS[0]} radius={[2, 2, 0, 0]} />
          </BarChart>
        );

      case 'stacked-bar': {
        const keys = Object.keys(chartData[0]).filter(k => k !== 'name');
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="name" {...axisProps} />
            <YAxis {...axisProps} />
            <Tooltip contentStyle={tooltipStyle} />
            {keys.map((key, i) => (
              <Bar key={key} dataKey={key} stackId="a" fill={COLORS[i % COLORS.length]} radius={i === keys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
            ))}
          </BarChart>
        );
      }

      case 'stacked-area': {
        const keys = Object.keys(chartData[0]).filter(k => k !== 'index');
        return (
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="index" {...axisProps} />
            <YAxis {...axisProps} />
            <Tooltip contentStyle={tooltipStyle} />
            {keys.map((key, i) => (
              <Area key={key} type="monotone" dataKey={key} stackId="1"
                stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.4} />
            ))}
          </AreaChart>
        );
      }

      case 'boxplot':
        return (
          <BarChart data={chartData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="name" {...axisProps} />
            <YAxis {...axisProps} />
            <Tooltip contentStyle={tooltipStyle}
              formatter={(value: any, name: string) => [typeof value === 'number' ? value.toFixed(2) : value, name]} />
            <Bar dataKey="q1" stackId="box" fill="transparent" />
            <Bar dataKey="median" stackId="box" fill={COLORS[0]} radius={[0, 0, 0, 0]} />
            <Bar dataKey="q3" fill={COLORS[1]} radius={[4, 4, 0, 0]} />
          </BarChart>
        );

      case 'heatmap': {
        const cols = Object.keys(chartData[0]).filter(k => k !== 'name');
        const getColor = (val: number) => {
          const abs = Math.abs(val);
          if (abs > 0.7) return val > 0 ? COLORS[1] : COLORS[3];
          if (abs > 0.4) return COLORS[2];
          return 'hsl(var(--muted))';
        };
        return (
          <div className="w-full h-full overflow-auto p-2">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr>
                  <th className="p-1 text-left text-muted-foreground"></th>
                  {cols.map(c => <th key={c} className="p-1 text-center text-muted-foreground font-normal">{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {chartData.map((row: any, i: number) => (
                  <tr key={i}>
                    <td className="p-1 text-muted-foreground font-medium">{row.name}</td>
                    {cols.map(c => (
                      <td key={c} className="p-1 text-center rounded" style={{
                        backgroundColor: getColor(row[c]),
                        color: Math.abs(row[c]) > 0.4 ? 'white' : 'inherit',
                        minWidth: '40px'
                      }}>
                        {row[c]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      case 'radar':
        return (
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis dataKey="subject" {...axisProps} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} {...axisProps} />
            <Radar dataKey="value" stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.3} />
            <Tooltip contentStyle={tooltipStyle} />
          </RadarChart>
        );

      case 'treemap':
        return (
          <Treemap
            data={chartData.map((d: any, i: number) => ({ ...d, size: d.value, fill: COLORS[i % COLORS.length] }))}
            dataKey="size"
            aspectRatio={4 / 3}
            stroke="hsl(var(--background))"
          />
        );

      case 'funnel':
        return (
          <BarChart data={chartData} layout="vertical">
            <XAxis type="number" {...axisProps} />
            <YAxis type="category" dataKey="name" {...axisProps} width={80} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((_: any, i: number) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        );

      case 'waterfall':
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="name" {...axisProps} />
            <YAxis {...axisProps} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="start" stackId="w" fill="transparent" />
            <Bar dataKey="value" stackId="w" radius={[4, 4, 0, 0]}>
              {chartData.map((entry: any, i: number) => (
                <Cell key={i} fill={entry.value >= 0 ? COLORS[1] : 'hsl(var(--destructive))'} />
              ))}
            </Bar>
          </BarChart>
        );

      case 'bullet': {
        const d = chartData[0];
        return (
          <BarChart data={chartData} layout="vertical">
            <XAxis type="number" domain={[0, d.max]} {...axisProps} />
            <YAxis type="category" dataKey="name" {...axisProps} width={80} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="actual" fill={COLORS[0]} radius={[0, 4, 4, 0]} barSize={20} />
            <ReferenceLine x={d.target} stroke={COLORS[3]} strokeWidth={3} strokeDasharray="5 5"
              label={{ value: 'Target', fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
          </BarChart>
        );
      }

      case 'gauge': {
        return (
          <PieChart>
            <Pie data={chartData} cx="50%" cy="60%" startAngle={180} endAngle={0}
              innerRadius={50} outerRadius={80} dataKey="value">
              <Cell fill={COLORS[0]} />
              <Cell fill="hsl(var(--muted))" />
            </Pie>
            <text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle"
              style={{ fontSize: '20px', fontWeight: 'bold', fill: 'hsl(var(--foreground))' }}>
              {chartData[0].value.toFixed(0)}%
            </text>
            <Tooltip />
          </PieChart>
        );
      }

      case 'sankey':
        return (
          <BarChart data={chartData} layout="vertical">
            <XAxis type="number" {...axisProps} />
            <YAxis type="category" dataKey="name" {...axisProps} width={120} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((_: any, i: number) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        );

      case 'gantt':
        return (
          <BarChart data={chartData} layout="vertical">
            <XAxis type="number" {...axisProps} />
            <YAxis type="category" dataKey="name" {...axisProps} width={100} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="start" stackId="g" fill="transparent" />
            <Bar dataKey="duration" stackId="g" fill={COLORS[0]} radius={[0, 4, 4, 0]} />
          </BarChart>
        );

      case 'venn':
        return (
          <div className="h-full flex items-center justify-center">
            <svg viewBox="0 0 300 200" className="w-full h-full max-w-xs">
              <circle cx="110" cy="100" r="60" fill={COLORS[0]} opacity={0.4} />
              <circle cx="190" cy="100" r="60" fill={COLORS[1]} opacity={0.4} />
              <text x="85" y="95" textAnchor="middle" fontSize="12" fill="hsl(var(--foreground))">
                {chartData[0]?.name}
              </text>
              <text x="85" y="110" textAnchor="middle" fontSize="14" fontWeight="bold" fill="hsl(var(--foreground))">
                {chartData[0]?.value}
              </text>
              <text x="215" y="95" textAnchor="middle" fontSize="12" fill="hsl(var(--foreground))">
                {chartData[1]?.name}
              </text>
              <text x="215" y="110" textAnchor="middle" fontSize="14" fontWeight="bold" fill="hsl(var(--foreground))">
                {chartData[1]?.value}
              </text>
              <text x="150" y="95" textAnchor="middle" fontSize="10" fill="hsl(var(--foreground))">Overlap</text>
              <text x="150" y="110" textAnchor="middle" fontSize="14" fontWeight="bold" fill="hsl(var(--foreground))">
                {chartData[2]?.value}
              </text>
            </svg>
          </div>
        );

      case 'sunburst':
        return (
          <PieChart>
            <Pie data={chartData} cx="50%" cy="50%" outerRadius={50} dataKey="value">
              {chartData.map((_: any, i: number) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value"
              label={({ name }) => name}>
              {chartData.map((_: any, i: number) => (
                <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} opacity={0.7} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        );

      case 'map':
        return (
          <BarChart data={chartData} layout="vertical">
            <XAxis type="number" {...axisProps} />
            <YAxis type="category" dataKey="name" {...axisProps} width={80} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" fill={COLORS[0]} radius={[0, 4, 4, 0]}>
              {chartData.map((_: any, i: number) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        );

      default:
        return <div className="h-full flex items-center justify-center text-muted-foreground">Chart type not supported</div>;
    }
  };

  // Heatmap and Venn render their own containers
  if (chartType === 'heatmap' || chartType === 'venn') {
    return renderChart() as JSX.Element;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      {renderChart()}
    </ResponsiveContainer>
  );
};
