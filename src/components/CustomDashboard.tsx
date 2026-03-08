import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartSelector, ChartType } from "./ChartSelector";
import { ChartRenderer } from "./ChartRenderer";
import { Plus, Layout, Save, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { useDataAnalysis } from "@/hooks/useDataAnalysis";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DashboardChart {
  id: string;
  type: ChartType;
  column?: string;
  title: string;
}

interface CustomDashboardProps {
  data: any[];
  externalCharts: DashboardChart[];
  onChartsChange: (charts: DashboardChart[]) => void;
}

export const CustomDashboard = ({ data, externalCharts, onChartsChange }: CustomDashboardProps) => {
  const [showChartSelector, setShowChartSelector] = useState(false);
  const { numericColumns, categoricalColumns, columns } = useDataAnalysis(data || []);

  // Sync external charts
  useEffect(() => {
    // handled externally
  }, [externalCharts]);

  if (!data || data.length === 0) return null;

  const handleAddChart = (chartType: ChartType, column?: string) => {
    const newChart: DashboardChart = {
      id: Date.now().toString(),
      type: chartType,
      column: column || undefined,
      title: `${chartType.charAt(0).toUpperCase() + chartType.slice(1).replace('-', ' ')} Chart`
    };
    onChartsChange([...externalCharts, newChart]);
    setShowChartSelector(false);
    toast.success(`Added ${chartType} chart to dashboard`);
  };

  const handleRemoveChart = (chartId: string) => {
    onChartsChange(externalCharts.filter(chart => chart.id !== chartId));
    toast.success("Chart removed from dashboard");
  };

  const handleColumnChange = (chartId: string, newColumn: string) => {
    onChartsChange(
      externalCharts.map(chart =>
        chart.id === chartId ? { ...chart, column: newColumn } : chart
      )
    );
  };

  const handleSaveDashboard = () => {
    localStorage.setItem('customDashboard', JSON.stringify(externalCharts));
    toast.success("Dashboard saved successfully");
  };

  const allColumns = [...new Set([...numericColumns, ...categoricalColumns])];

  return (
    <div className="space-y-6">
      <Card className="p-6 border-primary/10 bg-gradient-to-br from-card to-card/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center">
              <Layout className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Custom Dashboard</h3>
              <p className="text-sm text-muted-foreground">
                {externalCharts.length} chart{externalCharts.length !== 1 ? 's' : ''} • Build your visualization workspace
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {externalCharts.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleSaveDashboard}
                className="transition-all duration-300 hover:scale-105">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            )}
            <Button 
              size="sm" 
              onClick={() => setShowChartSelector(!showChartSelector)}
              className="transition-all duration-300 hover:scale-105"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Chart
            </Button>
          </div>
        </div>
      </Card>

      {showChartSelector && (
        <div className="animate-fade-in">
          <ChartSelector
            onChartAdd={handleAddChart}
            availableColumns={columns}
            numericColumns={numericColumns}
            categoricalColumns={categoricalColumns}
          />
        </div>
      )}

      {externalCharts.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {externalCharts.map((chart) => (
            <Card key={chart.id} className="p-5 relative group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-muted-foreground/40" />
                  <h4 className="font-semibold text-sm">{chart.title}</h4>
                </div>
                <div className="flex items-center gap-2">
                  {allColumns.length > 0 && (
                    <Select value={chart.column || undefined} onValueChange={(val) => handleColumnChange(chart.id, val)}>
                      <SelectTrigger className="h-7 text-xs w-[120px]">
                        <SelectValue placeholder="Column" />
                      </SelectTrigger>
                      <SelectContent>
                        {allColumns.map(col => (
                          <SelectItem key={col} value={col} className="text-xs">{col}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Button variant="ghost" size="sm"
                    onClick={() => handleRemoveChart(chart.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 h-7 w-7 p-0">
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
              
              <div className="h-64 rounded-lg overflow-hidden bg-muted/5">
                <ChartRenderer
                  data={data}
                  chartType={chart.type}
                  column={chart.column}
                  numericColumns={numericColumns}
                  categoricalColumns={categoricalColumns}
                />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center border-dashed border-2 border-muted-foreground/20">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Layout className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Charts Added</h3>
            <p className="text-muted-foreground mb-6 text-sm">
              Add charts from the selector above or use Smart Chart Recommendations to get started.
            </p>
            <Button onClick={() => setShowChartSelector(true)} className="transition-all duration-300 hover:scale-105">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Chart
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
