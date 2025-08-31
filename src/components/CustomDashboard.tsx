import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartSelector, ChartType } from "./ChartSelector";
import { ChartRenderer } from "./ChartRenderer";
import { Plus, Layout, Save, Share, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface CustomDashboardProps {
  data: any[];
}

interface DashboardChart {
  id: string;
  type: ChartType;
  column?: string;
  title: string;
}

export const CustomDashboard = ({ data }: CustomDashboardProps) => {
  const [dashboardCharts, setDashboardCharts] = useState<DashboardChart[]>([]);
  const [showChartSelector, setShowChartSelector] = useState(false);

  if (!data || data.length === 0) return null;

  const columns = Object.keys(data[0]);
  
  const getNumericColumns = () => {
    return columns.filter(col => {
      const sample = data.slice(0, 10).map(row => row[col]).filter(val => val != null && val !== '');
      const numericCount = sample.filter(val => !isNaN(Number(val))).length;
      return numericCount > sample.length * 0.8;
    });
  };

  const getCategoricalColumns = () => {
    return columns.filter(col => {
      const uniqueValues = new Set(data.map(row => row[col]));
      return uniqueValues.size <= 20 && uniqueValues.size > 1;
    });
  };

  const numericColumns = getNumericColumns();
  const categoricalColumns = getCategoricalColumns();

  const handleAddChart = (chartType: ChartType, column?: string) => {
    const newChart: DashboardChart = {
      id: Date.now().toString(),
      type: chartType,
      column: column || (chartType === 'bar' ? categoricalColumns[0] : numericColumns[0]),
      title: `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`
    };

    setDashboardCharts(prev => [...prev, newChart]);
    setShowChartSelector(false);
    toast.success(`Added ${chartType} chart to dashboard`);
  };

  const handleRemoveChart = (chartId: string) => {
    setDashboardCharts(prev => prev.filter(chart => chart.id !== chartId));
    toast.success("Chart removed from dashboard");
  };

  const handleSaveDashboard = () => {
    // In a real app, this would save to a backend
    localStorage.setItem('customDashboard', JSON.stringify(dashboardCharts));
    toast.success("Dashboard saved successfully");
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Layout className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Custom Dashboard</h3>
              <p className="text-sm text-muted-foreground">
                Create your personalized data visualization dashboard
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {dashboardCharts.length > 0 && (
              <>
                <Button variant="outline" size="sm" onClick={handleSaveDashboard}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Dashboard
                </Button>
                <Button variant="outline" size="sm">
                  <Share className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </>
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

      {/* Chart Selector */}
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

      {/* Dashboard Grid */}
      {dashboardCharts.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {dashboardCharts.map((chart) => (
            <Card key={chart.id} className="p-6 relative group">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">{chart.title}</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveChart(chart.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
              
              <div className="h-64">
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
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Layout className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Charts Added</h3>
            <p className="text-muted-foreground mb-6">
              Start building your dashboard by adding charts that visualize your data in meaningful ways.
            </p>
            <Button onClick={() => setShowChartSelector(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Chart
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};