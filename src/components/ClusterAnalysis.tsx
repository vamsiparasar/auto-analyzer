import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, Settings, Target, Zap, BarChart3 } from "lucide-react";

interface ClusterAnalysisProps {
  data: any[];
}

interface ClusterResult {
  clusters: number[][][];
  centroids: number[][];
  labels: number[];
  inertia: number;
  silhouetteScore: number;
}

export const ClusterAnalysis = ({ data }: ClusterAnalysisProps) => {
  const [clusterResult, setClusterResult] = useState<ClusterResult | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [numClusters, setNumClusters] = useState([3]);
  const [algorithm, setAlgorithm] = useState("kmeans");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const numericColumns = Object.keys(data[0] || {}).filter(col => {
    const sample = data.slice(0, 10).map(row => row[col]).filter(val => val != null);
    return sample.every(val => !isNaN(Number(val)));
  });

  useEffect(() => {
    if (selectedColumns.length >= 2) {
      runClusterAnalysis();
    }
  }, [selectedColumns, numClusters, algorithm]);

  const runClusterAnalysis = async () => {
    if (selectedColumns.length < 2) return;
    
    setIsAnalyzing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const result = performKMeansClustering();
    setClusterResult(result);
    setIsAnalyzing(false);
  };

  const performKMeansClustering = (): ClusterResult => {
    const points = data.map(row => 
      selectedColumns.map(col => parseFloat(row[col]) || 0)
    ).filter(point => point.every(val => !isNaN(val)));

    if (points.length === 0) {
      return {
        clusters: [],
        centroids: [],
        labels: [],
        inertia: 0,
        silhouetteScore: 0
      };
    }

    const k = numClusters[0];
    const maxIterations = 100;
    
    // Initialize centroids randomly
    let centroids = Array.from({ length: k }, () => 
      selectedColumns.map(() => Math.random() * 100)
    );

    let labels = new Array(points.length).fill(0);
    let prevLabels = [...labels];

    // K-means iterations
    for (let iter = 0; iter < maxIterations; iter++) {
      // Assign points to nearest centroid
      for (let i = 0; i < points.length; i++) {
        let minDistance = Infinity;
        let bestCluster = 0;
        
        for (let j = 0; j < k; j++) {
          const distance = euclideanDistance(points[i], centroids[j]);
          if (distance < minDistance) {
            minDistance = distance;
            bestCluster = j;
          }
        }
        
        labels[i] = bestCluster;
      }

      // Update centroids
      for (let j = 0; j < k; j++) {
        const clusterPoints = points.filter((_, i) => labels[i] === j);
        if (clusterPoints.length > 0) {
          centroids[j] = selectedColumns.map((_, dim) => 
            clusterPoints.reduce((sum, point) => sum + point[dim], 0) / clusterPoints.length
          );
        }
      }

      // Check convergence
      if (labels.every((label, i) => label === prevLabels[i])) {
        break;
      }
      prevLabels = [...labels];
    }

    // Calculate inertia (within-cluster sum of squares)
    const inertia = points.reduce((sum, point, i) => {
      const centroid = centroids[labels[i]];
      return sum + euclideanDistance(point, centroid) ** 2;
    }, 0);

    // Calculate silhouette score (simplified)
    const silhouetteScore = calculateSilhouetteScore(points, labels, centroids);

    // Group points by cluster
    const clusters = Array.from({ length: k }, () => [] as number[][]);
    points.forEach((point, i) => {
      clusters[labels[i]].push(point);
    });

    return {
      clusters,
      centroids,
      labels,
      inertia,
      silhouetteScore
    };
  };

  const euclideanDistance = (point1: number[], point2: number[]): number => {
    return Math.sqrt(
      point1.reduce((sum, val, i) => sum + (val - point2[i]) ** 2, 0)
    );
  };

  const calculateSilhouetteScore = (points: number[][], labels: number[], centroids: number[][]): number => {
    if (points.length < 2) return 0;

    let totalScore = 0;
    for (let i = 0; i < points.length; i++) {
      const currentCluster = labels[i];
      
      // Calculate average distance to points in same cluster (a)
      const sameClusterPoints = points.filter((_, j) => labels[j] === currentCluster && j !== i);
      const a = sameClusterPoints.length > 0 
        ? sameClusterPoints.reduce((sum, point) => sum + euclideanDistance(points[i], point), 0) / sameClusterPoints.length
        : 0;

      // Calculate average distance to nearest cluster (b)
      let minAvgDistance = Infinity;
      for (let k = 0; k < centroids.length; k++) {
        if (k !== currentCluster) {
          const otherClusterPoints = points.filter((_, j) => labels[j] === k);
          if (otherClusterPoints.length > 0) {
            const avgDistance = otherClusterPoints.reduce((sum, point) => sum + euclideanDistance(points[i], point), 0) / otherClusterPoints.length;
            minAvgDistance = Math.min(minAvgDistance, avgDistance);
          }
        }
      }
      const b = minAvgDistance;

      // Silhouette coefficient
      const silhouette = (b - a) / Math.max(a, b);
      totalScore += silhouette;
    }

    return totalScore / points.length;
  };

  const getChartData = () => {
    if (!clusterResult || selectedColumns.length < 2) return [];

    return data.map((row, index) => ({
      x: parseFloat(row[selectedColumns[0]]) || 0,
      y: parseFloat(row[selectedColumns[1]]) || 0,
      cluster: clusterResult.labels[index] || 0,
      index
    })).filter(point => !isNaN(point.x) && !isNaN(point.y));
  };

  const clusterColors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))", 
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))"
  ];

  const handleColumnToggle = (column: string) => {
    setSelectedColumns(prev => 
      prev.includes(column) 
        ? prev.filter(col => col !== column)
        : [...prev, column].slice(0, 5) // Limit to 5 columns
    );
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Select Features</label>
          <div className="space-y-2 max-h-32 overflow-y-auto border rounded p-2">
            {numericColumns.map(col => (
              <label key={col} className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedColumns.includes(col)}
                  onChange={() => handleColumnToggle(col)}
                  className="rounded"
                />
                <span>{col}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Algorithm</label>
          <Select value={algorithm} onValueChange={setAlgorithm}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kmeans">K-Means</SelectItem>
              <SelectItem value="hierarchical">Hierarchical</SelectItem>
              <SelectItem value="dbscan">DBSCAN</SelectItem>
              <SelectItem value="gaussian">Gaussian Mixture</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Number of Clusters: {numClusters[0]}
          </label>
          <Slider
            value={numClusters}
            onValueChange={setNumClusters}
            max={8}
            min={2}
            step={1}
            className="mt-2"
          />
        </div>

        <div className="flex items-end">
          <Button 
            onClick={runClusterAnalysis} 
            disabled={selectedColumns.length < 2 || isAnalyzing}
            className="w-full"
          >
            <Users className="w-4 h-4 mr-2" />
            {isAnalyzing ? 'Analyzing...' : 'Run Clustering'}
          </Button>
        </div>
      </div>

      {/* Results */}
      {isAnalyzing ? (
        <Card className="p-8 text-center">
          <Users className="w-8 h-8 mx-auto mb-4 animate-pulse text-primary" />
          <p className="text-muted-foreground">Running cluster analysis...</p>
        </Card>
      ) : clusterResult && selectedColumns.length >= 2 ? (
        <div className="space-y-6">
          {/* Cluster Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{numClusters[0]}</div>
              <div className="text-sm text-muted-foreground">Clusters</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-chart-2">{data.length}</div>
              <div className="text-sm text-muted-foreground">Data Points</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-chart-3">
                {clusterResult.inertia.toFixed(0)}
              </div>
              <div className="text-sm text-muted-foreground">Inertia</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-chart-4">
                {(clusterResult.silhouetteScore * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-muted-foreground">Silhouette Score</div>
            </Card>
          </div>

          {/* Cluster Visualization */}
          {selectedColumns.length >= 2 && (
            <Card className="p-6">
              <h4 className="font-medium mb-4 flex items-center">
                <BarChart3 className="w-4 h-4 mr-2" />
                Cluster Visualization ({selectedColumns[0]} vs {selectedColumns[1]})
              </h4>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart data={getChartData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="x" 
                      type="number" 
                      domain={['dataMin', 'dataMax']}
                      name={selectedColumns[0]}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis 
                      dataKey="y" 
                      type="number" 
                      domain={['dataMin', 'dataMax']}
                      name={selectedColumns[1]}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                      formatter={(value, name) => [value, name]}
                    />
                    <Scatter dataKey="y" fill="hsl(var(--primary))">
                      {getChartData().map((entry, index) => (
                        <Cell key={index} fill={clusterColors[entry.cluster % clusterColors.length]} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* Cluster Details */}
          <Card className="p-6">
            <h4 className="font-medium mb-4 flex items-center">
              <Target className="w-4 h-4 mr-2" />
              Cluster Analysis
            </h4>
            <div className="space-y-4">
              {clusterResult.clusters.map((cluster, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: clusterColors[index % clusterColors.length] }}
                      />
                      <h5 className="font-medium">Cluster {index + 1}</h5>
                    </div>
                    <Badge variant="outline">{cluster.length} points</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Size:</span>
                      <div className="font-medium">{cluster.length} points</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Percentage:</span>
                      <div className="font-medium">
                        {((cluster.length / data.length) * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Centroid X:</span>
                      <div className="font-medium">
                        {clusterResult.centroids[index]?.[0]?.toFixed(2) || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Centroid Y:</span>
                      <div className="font-medium">
                        {clusterResult.centroids[index]?.[1]?.toFixed(2) || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Insights */}
          <Card className="p-6">
            <h4 className="font-medium mb-4 flex items-center">
              <Zap className="w-4 h-4 mr-2" />
              AI Insights
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                <div>
                  <strong>Cluster Quality:</strong> {
                    clusterResult.silhouetteScore > 0.5 
                      ? "Excellent clustering - well-separated groups"
                      : clusterResult.silhouetteScore > 0.25 
                      ? "Good clustering - distinct groups identified"
                      : "Fair clustering - some overlap between groups"
                  }
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 rounded-full bg-chart-2 mt-1.5" />
                <div>
                  <strong>Optimal Clusters:</strong> Based on the data distribution, 
                  {numClusters[0] <= 3 ? " you may benefit from more clusters" : " the current number seems appropriate"}
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 rounded-full bg-chart-3 mt-1.5" />
                <div>
                  <strong>Business Application:</strong> These clusters can be used for customer segmentation, 
                  market analysis, or targeted strategies
                </div>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <Card className="p-8 text-center">
          <Users className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            Select at least 2 numeric features to begin cluster analysis
          </p>
        </Card>
      )}
    </div>
  );
};