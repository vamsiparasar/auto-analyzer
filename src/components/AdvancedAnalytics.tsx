import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Users, 
  Calculator,
  BarChart3,
  Zap,
  LineChart,
  Layers
} from "lucide-react";
import { PredictiveAnalytics } from "./PredictiveAnalytics";
import { ClusterAnalysis } from "./ClusterAnalysis";
import { StatisticalAnalysis } from "./StatisticalAnalysis";
import { CohortAnalysis } from "./CohortAnalysis";
import { RegressionAnalysis } from "./RegressionAnalysis";

interface AdvancedAnalyticsProps {
  data: any[];
}

export const AdvancedAnalytics = ({ data }: AdvancedAnalyticsProps) => {
  const [activeAnalysis, setActiveAnalysis] = useState("descriptive");

  if (!data || data.length === 0) return null;

  const analyticsTypes = [
    {
      id: "descriptive",
      name: "Descriptive Analytics",
      icon: <BarChart3 className="w-4 h-4" />,
      description: "What happened in your data",
      color: "from-blue-500/20 to-blue-600/20"
    },
    {
      id: "diagnostic",
      name: "Diagnostic Analytics", 
      icon: <Target className="w-4 h-4" />,
      description: "Why did it happen",
      color: "from-green-500/20 to-green-600/20"
    },
    {
      id: "predictive",
      name: "Predictive Analytics",
      icon: <TrendingUp className="w-4 h-4" />,
      description: "What will happen next",
      color: "from-purple-500/20 to-purple-600/20"
    },
    {
      id: "prescriptive",
      name: "Prescriptive Analytics",
      icon: <Brain className="w-4 h-4" />,
      description: "What should we do",
      color: "from-orange-500/20 to-orange-600/20"
    },
    {
      id: "cluster",
      name: "Cluster Analysis",
      icon: <Users className="w-4 h-4" />,
      description: "Group similar data points",
      color: "from-red-500/20 to-red-600/20"
    },
    {
      id: "statistical",
      name: "Statistical Analysis",
      icon: <Calculator className="w-4 h-4" />,
      description: "Deep statistical insights",
      color: "from-teal-500/20 to-teal-600/20"
    }
  ];

  return (
    <Card className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
            <Layers className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Advanced Analytics Suite
            </h3>
            <p className="text-sm text-muted-foreground">
              Comprehensive data analysis with AI-powered insights
            </p>
          </div>
        </div>
        
        <Badge variant="outline" className="bg-gradient-to-r from-primary/10 to-accent/10">
          <Zap className="w-3 h-3 mr-1" />
          AI-Powered
        </Badge>
      </div>

      {/* Analytics Type Selector */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {analyticsTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => setActiveAnalysis(type.id)}
            className={`p-4 rounded-lg border transition-all duration-300 hover:scale-105 text-left ${
              activeAnalysis === type.id 
                ? 'border-primary bg-gradient-to-br ' + type.color + ' shadow-lg' 
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="flex items-center space-x-2 mb-2">
              {type.icon}
              <span className="font-medium text-sm">{type.name}</span>
            </div>
            <p className="text-xs text-muted-foreground">{type.description}</p>
          </button>
        ))}
      </div>

      {/* Analytics Content */}
      <div className="min-h-[400px]">
        <Tabs value={activeAnalysis} onValueChange={setActiveAnalysis} className="w-full">
          <TabsList className="hidden" />
          
          <TabsContent value="descriptive" className="mt-4">
            <StatisticalAnalysis data={data} type="descriptive" />
          </TabsContent>
          
          <TabsContent value="diagnostic" className="mt-4">
            <StatisticalAnalysis data={data} type="diagnostic" />
          </TabsContent>
          
          <TabsContent value="predictive" className="mt-4">
            <PredictiveAnalytics data={data} />
          </TabsContent>
          
          <TabsContent value="prescriptive" className="mt-4">
            <StatisticalAnalysis data={data} type="prescriptive" />
          </TabsContent>
          
          <TabsContent value="cluster" className="mt-4">
            <ClusterAnalysis data={data} />
          </TabsContent>
          
          <TabsContent value="statistical" className="mt-4">
            <div className="space-y-6">
              <StatisticalAnalysis data={data} type="comprehensive" />
              <RegressionAnalysis data={data} />
              <CohortAnalysis data={data} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
};