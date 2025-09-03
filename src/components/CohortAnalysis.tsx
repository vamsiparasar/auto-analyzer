import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { Users, Calendar, TrendingUp, BarChart3 } from "lucide-react";

interface CohortAnalysisProps {
  data: any[];
}

interface CohortData {
  cohort: string;
  period: number;
  users: number;
  retention: number;
  size: number;
}

export const CohortAnalysis = ({ data }: CohortAnalysisProps) => {
  const [cohortData, setCohortData] = useState<CohortData[]>([]);
  const [userColumn, setUserColumn] = useState<string>("");
  const [dateColumn, setDateColumn] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const dateColumns = Object.keys(data[0] || {}).filter(col => {
    const sample = data.slice(0, 5).map(row => row[col]).filter(val => val != null);
    return sample.some(val => !isNaN(Date.parse(val.toString())));
  });

  const userColumns = Object.keys(data[0] || {}).filter(col => 
    col.toLowerCase().includes('user') || 
    col.toLowerCase().includes('customer') || 
    col.toLowerCase().includes('id')
  );

  useEffect(() => {
    if (userColumn && dateColumn && data.length > 0) {
      performCohortAnalysis();
    }
  }, [userColumn, dateColumn]);

  const performCohortAnalysis = async () => {
    setIsAnalyzing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // Parse and prepare data
      const parsedData = data.map(row => ({
        user: row[userColumn],
        date: new Date(row[dateColumn]),
        ...row
      })).filter(row => !isNaN(row.date.getTime()) && row.user);

      if (parsedData.length === 0) {
        setCohortData([]);
        setIsAnalyzing(false);
        return;
      }

      // Group by cohort (month of first appearance)
      const userFirstSeen = new Map<string, Date>();
      parsedData.forEach(row => {
        if (!userFirstSeen.has(row.user)) {
          userFirstSeen.set(row.user, row.date);
        } else {
          const existing = userFirstSeen.get(row.user)!;
          if (row.date < existing) {
            userFirstSeen.set(row.user, row.date);
          }
        }
      });

      // Create cohorts by month
      const cohorts = new Map<string, Set<string>>();
      userFirstSeen.forEach((firstDate, user) => {
        const cohortKey = `${firstDate.getFullYear()}-${String(firstDate.getMonth() + 1).padStart(2, '0')}`;
        if (!cohorts.has(cohortKey)) {
          cohorts.set(cohortKey, new Set());
        }
        cohorts.get(cohortKey)!.add(user);
      });

      // Calculate retention for each cohort
      const retentionData: CohortData[] = [];
      const sortedCohorts = Array.from(cohorts.entries()).sort();

      sortedCohorts.forEach(([cohortKey, cohortUsers]) => {
        const cohortDate = new Date(cohortKey + '-01');
        const cohortSize = cohortUsers.size;

        // Calculate retention for periods 0-11 (months)
        for (let period = 0; period <= 11; period++) {
          const periodDate = new Date(cohortDate);
          periodDate.setMonth(periodDate.getMonth() + period);
          
          const periodEndDate = new Date(periodDate);
          periodEndDate.setMonth(periodEndDate.getMonth() + 1);

          // Count users active in this period
          const activeUsers = Array.from(cohortUsers).filter(user => {
            return parsedData.some(row => 
              row.user === user && 
              row.date >= periodDate && 
              row.date < periodEndDate
            );
          }).length;

          const retention = cohortSize > 0 ? (activeUsers / cohortSize) * 100 : 0;

          retentionData.push({
            cohort: cohortKey,
            period,
            users: activeUsers,
            retention,
            size: cohortSize
          });
        }
      });

      setCohortData(retentionData);
    } catch (error) {
      console.error('Cohort analysis error:', error);
      setCohortData([]);
    }

    setIsAnalyzing(false);
  };

  const getCohortChartData = () => {
    const cohorts = [...new Set(cohortData.map(d => d.cohort))];
    const periods = [...new Set(cohortData.map(d => d.period))].sort((a, b) => a - b);

    return periods.map(period => {
      const periodData: any = { period: `Month ${period}` };
      cohorts.forEach(cohort => {
        const data = cohortData.find(d => d.cohort === cohort && d.period === period);
        periodData[cohort] = data ? data.retention : 0;
      });
      return periodData;
    });
  };

  const getAverageRetention = () => {
    const periods = [...new Set(cohortData.map(d => d.period))].sort((a, b) => a - b);
    return periods.map(period => {
      const periodData = cohortData.filter(d => d.period === period);
      const avgRetention = periodData.length > 0 
        ? periodData.reduce((sum, d) => sum + d.retention, 0) / periodData.length 
        : 0;
      return {
        period: `Month ${period}`,
        retention: avgRetention
      };
    });
  };

  const cohorts = [...new Set(cohortData.map(d => d.cohort))];
  const colors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))", 
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))"
  ];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">User ID Column</label>
          <Select value={userColumn} onValueChange={setUserColumn}>
            <SelectTrigger>
              <SelectValue placeholder="Select user identifier" />
            </SelectTrigger>
            <SelectContent>
              {userColumns.map(col => (
                <SelectItem key={col} value={col}>{col}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Date Column</label>
          <Select value={dateColumn} onValueChange={setDateColumn}>
            <SelectTrigger>
              <SelectValue placeholder="Select date column" />
            </SelectTrigger>
            <SelectContent>
              {dateColumns.map(col => (
                <SelectItem key={col} value={col}>{col}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button 
            onClick={performCohortAnalysis} 
            disabled={!userColumn || !dateColumn || isAnalyzing}
            className="w-full"
          >
            <Users className="w-4 h-4 mr-2" />
            {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
          </Button>
        </div>
      </div>

      {/* Results */}
      {isAnalyzing ? (
        <Card className="p-8 text-center">
          <Users className="w-8 h-8 mx-auto mb-4 animate-pulse text-primary" />
          <p className="text-muted-foreground">Running cohort analysis...</p>
        </Card>
      ) : cohortData.length > 0 ? (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{cohorts.length}</div>
              <div className="text-sm text-muted-foreground">Cohorts</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-chart-2">
                {Math.max(...cohortData.map(d => d.size))}
              </div>
              <div className="text-sm text-muted-foreground">Largest Cohort</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-chart-3">
                {getAverageRetention().find(d => d.period === 'Month 0')?.retention.toFixed(1) || 0}%
              </div>
              <div className="text-sm text-muted-foreground">Initial Retention</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-chart-4">
                {getAverageRetention()[getAverageRetention().length - 1]?.retention.toFixed(1) || 0}%
              </div>
              <div className="text-sm text-muted-foreground">Final Retention</div>
            </Card>
          </div>

          {/* Average Retention Curve */}
          <Card className="p-6">
            <h4 className="font-medium mb-4 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Average Retention Curve
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={getAverageRetention()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                    formatter={(value: any) => [`${value.toFixed(1)}%`, 'Retention']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="retention" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Individual Cohort Performance */}
          <Card className="p-6">
            <h4 className="font-medium mb-4 flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              Cohort Retention Comparison
            </h4>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getCohortChartData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                    formatter={(value: any) => [`${value.toFixed(1)}%`, 'Retention']}
                  />
                  {cohorts.map((cohort, index) => (
                    <Line
                      key={cohort}
                      type="monotone"
                      dataKey={cohort}
                      stroke={colors[index % colors.length]}
                      strokeWidth={2}
                      name={cohort}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Cohort Details Table */}
          <Card className="p-6">
            <h4 className="font-medium mb-4 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Cohort Details
            </h4>
            <div className="space-y-4">
              {cohorts.map((cohort, index) => {
                const cohortDetails = cohortData.filter(d => d.cohort === cohort);
                const initialSize = cohortDetails.find(d => d.period === 0)?.size || 0;
                const latestRetention = cohortDetails[cohortDetails.length - 1]?.retention || 0;
                
                return (
                  <div key={cohort} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: colors[index % colors.length] }}
                        />
                        <h5 className="font-medium">Cohort {cohort}</h5>
                      </div>
                      <div className="flex space-x-4 text-sm">
                        <Badge variant="outline">{initialSize} users</Badge>
                        <Badge variant={latestRetention > 20 ? "default" : "secondary"}>
                          {latestRetention.toFixed(1)}% retention
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2 text-xs">
                      {cohortDetails.slice(0, 12).map((detail) => (
                        <div key={detail.period} className="text-center p-2 bg-muted/50 rounded">
                          <div className="font-medium">M{detail.period}</div>
                          <div className="text-muted-foreground">
                            {detail.retention.toFixed(0)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      ) : userColumn && dateColumn ? (
        <Card className="p-8 text-center">
          <Calendar className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No cohort data available with current selection</p>
        </Card>
      ) : (
        <Card className="p-8 text-center">
          <Users className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            Select user ID and date columns to begin cohort analysis
          </p>
        </Card>
      )}
    </div>
  );
};