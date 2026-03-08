import { useState } from "react";
import { Card } from "@/components/ui/card";
import { CohortAnalysis } from "./CohortAnalysis";
import { ClusterAnalysis } from "./ClusterAnalysis";
import { RegressionAnalysis } from "./RegressionAnalysis";
import { DataQualityScanner } from "./DataQualityScanner";
import { PredictiveAnalytics } from "./PredictiveAnalytics";
import { StatisticalAnalysis } from "./StatisticalAnalysis";
import {
  BarChart3, Users, Boxes, TrendingUp, Shield, Brain
} from "lucide-react";

interface AdvancedAnalyticsProps {
  data: any[];
}

const ANALYTICS_TYPES = [
  { id: 'statistical', label: 'Statistical', icon: BarChart3, description: 'Descriptive stats & distributions', color: 'hsl(var(--chart-1))' },
  { id: 'predictive', label: 'Predictive', icon: Brain, description: 'Forecast & trend analysis', color: 'hsl(var(--chart-2))' },
  { id: 'regression', label: 'Regression', icon: TrendingUp, description: 'Variable relationships', color: 'hsl(var(--chart-3))' },
  { id: 'cohort', label: 'Cohort', icon: Users, description: 'Group-based analysis', color: 'hsl(var(--chart-4))' },
  { id: 'cluster', label: 'Cluster', icon: Boxes, description: 'Pattern discovery', color: 'hsl(var(--chart-5))' },
  { id: 'quality', label: 'Data Quality', icon: Shield, description: 'Data health & validation', color: 'hsl(var(--accent))' },
];

export const AdvancedAnalytics = ({ data }: AdvancedAnalyticsProps) => {
  const [selectedType, setSelectedType] = useState('statistical');

  const renderContent = () => {
    switch (selectedType) {
      case 'statistical': return <StatisticalAnalysis data={data} />;
      case 'predictive': return <PredictiveAnalytics data={data} />;
      case 'regression': return <RegressionAnalysis data={data} />;
      case 'cohort': return <CohortAnalysis data={data} />;
      case 'cluster': return <ClusterAnalysis data={data} />;
      case 'quality': return <DataQualityScanner data={data} />;
      default: return <StatisticalAnalysis data={data} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {ANALYTICS_TYPES.map((type) => {
          const Icon = type.icon;
          const isActive = selectedType === type.id;
          return (
            <Card
              key={type.id}
              className={`p-3.5 cursor-pointer transition-all duration-300 group relative overflow-hidden ${
                isActive
                  ? 'border-primary/40 shadow-md scale-[1.02]'
                  : 'hover:border-primary/20 hover:shadow-sm hover:scale-[1.01]'
              }`}
              onClick={() => setSelectedType(type.id)}
            >
              {isActive && (
                <div
                  className="absolute inset-0 opacity-[0.06] rounded-lg"
                  style={{ background: `radial-gradient(ellipse at top left, ${type.color}, transparent 70%)` }}
                />
              )}
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                      isActive ? 'scale-110' : 'group-hover:scale-105'
                    }`}
                    style={{
                      backgroundColor: isActive ? `${type.color}20` : 'hsl(var(--muted) / 0.5)',
                      color: isActive ? type.color : 'hsl(var(--muted-foreground))',
                    }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {isActive && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                        style={{ backgroundColor: type.color }} />
                      <span className="relative inline-flex rounded-full h-2 w-2"
                        style={{ backgroundColor: type.color }} />
                    </span>
                  )}
                </div>
                <h4 className={`text-xs font-semibold transition-colors ${
                  isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                }`}>{type.label}</h4>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{type.description}</p>
              </div>
            </Card>
          );
        })}
      </div>
      <div className="animate-fade-in" key={selectedType}>
        {renderContent()}
      </div>
    </div>
  );
};
