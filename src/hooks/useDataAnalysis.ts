import { useMemo } from "react";

export interface ColumnAnalysis {
  columns: string[];
  numericColumns: string[];
  categoricalColumns: string[];
  dateColumns: string[];
  columnStats: Record<string, ColumnStats>;
}

export interface ColumnStats {
  min: number;
  max: number;
  mean: number;
  median: number;
  stdDev: number;
  q1: number;
  q3: number;
  iqr: number;
  missingCount: number;
  missingPercentage: number;
  uniqueCount: number;
}

export const useDataAnalysis = (data: any[]): ColumnAnalysis => {
  return useMemo(() => {
    if (!data || data.length === 0) {
      return { columns: [], numericColumns: [], categoricalColumns: [], dateColumns: [], columnStats: {} };
    }

    const columns = Object.keys(data[0]);

    const numericColumns = columns.filter(col => {
      const sample = data.slice(0, 20).map(row => row[col]).filter(val => val != null && val !== '');
      if (sample.length === 0) return false;
      const numericCount = sample.filter(val => !isNaN(Number(val))).length;
      return numericCount > sample.length * 0.8;
    });

    const categoricalColumns = columns.filter(col => {
      const uniqueValues = new Set(data.map(row => row[col]));
      return uniqueValues.size <= 20 && uniqueValues.size > 1;
    });

    const dateColumns = columns.filter(col => {
      const sample = data.slice(0, 5).map(row => row[col]).filter(val => val != null && val !== '');
      if (sample.length === 0) return false;
      const dateCount = sample.filter(val => !isNaN(Date.parse(val))).length;
      return dateCount > sample.length * 0.8;
    });

    const columnStats: Record<string, ColumnStats> = {};
    numericColumns.forEach(col => {
      const values = data.map(row => parseFloat(row[col])).filter(val => !isNaN(val));
      if (values.length === 0) return;
      const sorted = [...values].sort((a, b) => a - b);
      const n = sorted.length;
      const mean = sorted.reduce((a, b) => a + b, 0) / n;
      const median = sorted[Math.floor(n / 2)];
      const q1 = sorted[Math.floor(n * 0.25)];
      const q3 = sorted[Math.floor(n * 0.75)];
      const variance = sorted.reduce((sum, v) => sum + (v - mean) ** 2, 0) / n;
      const missingCount = data.filter(row => row[col] == null || row[col] === '' || isNaN(Number(row[col]))).length;

      columnStats[col] = {
        min: sorted[0],
        max: sorted[n - 1],
        mean,
        median,
        stdDev: Math.sqrt(variance),
        q1,
        q3,
        iqr: q3 - q1,
        missingCount,
        missingPercentage: (missingCount / data.length) * 100,
        uniqueCount: new Set(values).size,
      };
    });

    return { columns, numericColumns, categoricalColumns, dateColumns, columnStats };
  }, [data]);
};

export const calculateCorrelation = (data: any[], col1: string, col2: string): number => {
  const pairs = data
    .map(row => [parseFloat(row[col1]), parseFloat(row[col2])])
    .filter(([x, y]) => !isNaN(x) && !isNaN(y));

  if (pairs.length < 2) return 0;

  const n = pairs.length;
  const sumX = pairs.reduce((s, [x]) => s + x, 0);
  const sumY = pairs.reduce((s, [, y]) => s + y, 0);
  const sumXY = pairs.reduce((s, [x, y]) => s + x * y, 0);
  const sumX2 = pairs.reduce((s, [x]) => s + x * x, 0);
  const sumY2 = pairs.reduce((s, [, y]) => s + y * y, 0);

  const num = n * sumXY - sumX * sumY;
  const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  return den === 0 ? 0 : num / den;
};
