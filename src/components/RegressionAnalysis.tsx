import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Bar, BarChart } from 'recharts';
import { TrendingUp, Target, Calculator, BarChart3, Zap } from "lucide-react";

interface RegressionAnalysisProps {
  data: any[];
}

interface RegressionResult {
  slope: number;
  intercept: number;
  rSquared: number;
  pValue: number;
  standardError: number;
  predictions: { x: number; y: number; predicted: number; residual: number }[];
  coefficients?: { feature: string; coefficient: number; importance: number }[];
}

export const RegressionAnalysis = ({ data }: RegressionAnalysisProps) => {
  const [result, setResult] = useState<RegressionResult | null>(null);
  const [targetVariable, setTargetVariable] = useState<string>("");
  const [features, setFeatures] = useState<string[]>([]);
  const [regressionType, setRegressionType] = useState<string>("linear");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const numericColumns = Object.keys(data[0] || {}).filter(col => {
    const sample = data.slice(0, 10).map(row => row[col]).filter(val => val != null);
    return sample.every(val => !isNaN(Number(val)));
  });

  useEffect(() => {
    if (targetVariable && features.length > 0) {
      performRegression();
    }
  }, [targetVariable, features, regressionType]);

  const performRegression = async () => {
    setIsAnalyzing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      if (regressionType === "linear" && features.length === 1) {
        const result = performSimpleLinearRegression();
        setResult(result);
      } else if (regressionType === "multiple") {
        const result = performMultipleLinearRegression();
        setResult(result);
      } else if (regressionType === "polynomial") {
        const result = performPolynomialRegression();
        setResult(result);
      }
    } catch (error) {
      console.error('Regression analysis error:', error);
      setResult(null);
    }

    setIsAnalyzing(false);
  };

  const performSimpleLinearRegression = (): RegressionResult => {
    const pairs = data
      .map(row => ({
        x: parseFloat(row[features[0]]),
        y: parseFloat(row[targetVariable])
      }))
      .filter(pair => !isNaN(pair.x) && !isNaN(pair.y));

    if (pairs.length < 2) {
      throw new Error('Insufficient data for regression');
    }

    const n = pairs.length;
    const sumX = pairs.reduce((sum, p) => sum + p.x, 0);
    const sumY = pairs.reduce((sum, p) => sum + p.y, 0);
    const sumXY = pairs.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumX2 = pairs.reduce((sum, p) => sum + p.x * p.x, 0);
    const sumY2 = pairs.reduce((sum, p) => sum + p.y * p.y, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared
    const meanY = sumY / n;
    const ssTotal = pairs.reduce((sum, p) => sum + Math.pow(p.y - meanY, 2), 0);
    const ssResidual = pairs.reduce((sum, p) => {
      const predicted = slope * p.x + intercept;
      return sum + Math.pow(p.y - predicted, 2);
    }, 0);
    const rSquared = 1 - (ssResidual / ssTotal);

    // Calculate standard error
    const standardError = Math.sqrt(ssResidual / (n - 2));

    // Calculate p-value (simplified)
    const tStatistic = slope / (standardError / Math.sqrt(sumX2 - (sumX * sumX) / n));
    const pValue = 2 * (1 - tDistribution(Math.abs(tStatistic), n - 2));

    const predictions = pairs.map(p => ({
      x: p.x,
      y: p.y,
      predicted: slope * p.x + intercept,
      residual: p.y - (slope * p.x + intercept)
    }));

    return {
      slope,
      intercept,
      rSquared,
      pValue,
      standardError,
      predictions
    };
  };

  const performMultipleLinearRegression = (): RegressionResult => {
    // Simplified multiple regression using normal equations
    const cleanData = data
      .map(row => {
        const y = parseFloat(row[targetVariable]);
        const x = features.map(feature => parseFloat(row[feature]));
        return { x, y };
      })
      .filter(row => !isNaN(row.y) && row.x.every(val => !isNaN(val)));

    if (cleanData.length < features.length + 1) {
      throw new Error('Insufficient data for multiple regression');
    }

    // Create design matrix (with intercept term)
    const X = cleanData.map(row => [1, ...row.x]);
    const y = cleanData.map(row => row.y);

    // Calculate coefficients using normal equation: β = (X'X)^(-1)X'y
    const coefficients = solveNormalEquation(X, y);

    // Calculate predictions and R-squared
    const predictions = cleanData.map((row, i) => {
      const predicted = coefficients.reduce((sum, coef, j) => sum + coef * X[i][j], 0);
      return {
        x: row.x[0], // Use first feature for plotting
        y: row.y,
        predicted,
        residual: row.y - predicted
      };
    });

    const meanY = y.reduce((sum, val) => sum + val, 0) / y.length;
    const ssTotal = y.reduce((sum, val) => sum + Math.pow(val - meanY, 2), 0);
    const ssResidual = predictions.reduce((sum, pred) => sum + Math.pow(pred.residual, 2), 0);
    const rSquared = 1 - (ssResidual / ssTotal);

    const standardError = Math.sqrt(ssResidual / (cleanData.length - features.length - 1));

    // Feature importance (absolute coefficient values normalized)
    const maxCoef = Math.max(...coefficients.slice(1).map(Math.abs));
    const featureCoefficients = features.map((feature, index) => ({
      feature,
      coefficient: coefficients[index + 1],
      importance: maxCoef > 0 ? Math.abs(coefficients[index + 1]) / maxCoef : 0
    }));

    return {
      slope: coefficients[1] || 0,
      intercept: coefficients[0],
      rSquared,
      pValue: 0.05, // Simplified
      standardError,
      predictions,
      coefficients: featureCoefficients
    };
  };

  const performPolynomialRegression = (): RegressionResult => {
    // Simplified polynomial regression (degree 2)
    const pairs = data
      .map(row => ({
        x: parseFloat(row[features[0]]),
        y: parseFloat(row[targetVariable])
      }))
      .filter(pair => !isNaN(pair.x) && !isNaN(pair.y));

    if (pairs.length < 3) {
      throw new Error('Insufficient data for polynomial regression');
    }

    // Create design matrix for polynomial features [1, x, x^2]
    const X = pairs.map(p => [1, p.x, p.x * p.x]);
    const y = pairs.map(p => p.y);

    const coefficients = solveNormalEquation(X, y);

    const predictions = pairs.map(p => {
      const predicted = coefficients[0] + coefficients[1] * p.x + coefficients[2] * p.x * p.x;
      return {
        x: p.x,
        y: p.y,
        predicted,
        residual: p.y - predicted
      };
    });

    const meanY = y.reduce((sum, val) => sum + val, 0) / y.length;
    const ssTotal = y.reduce((sum, val) => sum + Math.pow(val - meanY, 2), 0);
    const ssResidual = predictions.reduce((sum, pred) => sum + Math.pow(pred.residual, 2), 0);
    const rSquared = 1 - (ssResidual / ssTotal);

    const standardError = Math.sqrt(ssResidual / (pairs.length - 3));

    return {
      slope: coefficients[1],
      intercept: coefficients[0],
      rSquared,
      pValue: 0.05, // Simplified
      standardError,
      predictions
    };
  };

  const solveNormalEquation = (X: number[][], y: number[]): number[] => {
    // Simplified matrix operations for normal equation
    const n = X.length;
    const m = X[0].length;
    
    // Calculate X'X
    const XtX = Array(m).fill(0).map(() => Array(m).fill(0));
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < m; j++) {
        for (let k = 0; k < n; k++) {
          XtX[i][j] += X[k][i] * X[k][j];
        }
      }
    }

    // Calculate X'y
    const Xty = Array(m).fill(0);
    for (let i = 0; i < m; i++) {
      for (let k = 0; k < n; k++) {
        Xty[i] += X[k][i] * y[k];
      }
    }

    // Solve using Gaussian elimination (simplified)
    return gaussianElimination(XtX, Xty);
  };

  const gaussianElimination = (A: number[][], b: number[]): number[] => {
    const n = A.length;
    const augmented = A.map((row, i) => [...row, b[i]]);

    // Forward elimination
    for (let i = 0; i < n; i++) {
      // Find pivot
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
          maxRow = k;
        }
      }
      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

      // Make all rows below this one 0 in current column
      for (let k = i + 1; k < n; k++) {
        const factor = augmented[k][i] / augmented[i][i];
        for (let j = i; j < n + 1; j++) {
          augmented[k][j] -= factor * augmented[i][j];
        }
      }
    }

    // Back substitution
    const solution = Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      solution[i] = augmented[i][n];
      for (let j = i + 1; j < n; j++) {
        solution[i] -= augmented[i][j] * solution[j];
      }
      solution[i] /= augmented[i][i];
    }

    return solution;
  };

  const tDistribution = (t: number, df: number): number => {
    // Simplified t-distribution approximation
    return 0.5 * (1 + Math.sign(t) * Math.sqrt(1 - Math.exp(-2 * t * t / (df + 1))));
  };

  const handleFeatureToggle = (feature: string) => {
    setFeatures(prev => 
      prev.includes(feature) 
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };

  const getResidualsData = () => {
    if (!result) return [];
    return result.predictions.map((pred, index) => ({
      index,
      residual: pred.residual,
      predicted: pred.predicted
    }));
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Target Variable</label>
          <Select value={targetVariable} onValueChange={setTargetVariable}>
            <SelectTrigger>
              <SelectValue placeholder="Select target" />
            </SelectTrigger>
            <SelectContent>
              {numericColumns.map(col => (
                <SelectItem key={col} value={col}>{col}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Regression Type</label>
          <Select value={regressionType} onValueChange={setRegressionType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="linear">Simple Linear</SelectItem>
              <SelectItem value="multiple">Multiple Linear</SelectItem>
              <SelectItem value="polynomial">Polynomial</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Features</label>
          <div className="space-y-1 max-h-32 overflow-y-auto border rounded p-2">
            {numericColumns.filter(col => col !== targetVariable).map(col => (
              <label key={col} className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={features.includes(col)}
                  onChange={() => handleFeatureToggle(col)}
                  className="rounded"
                />
                <span>{col}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-end">
          <Button 
            onClick={performRegression} 
            disabled={!targetVariable || features.length === 0 || isAnalyzing}
            className="w-full"
          >
            <Calculator className="w-4 h-4 mr-2" />
            {isAnalyzing ? 'Analyzing...' : 'Run Regression'}
          </Button>
        </div>
      </div>

      {/* Results */}
      {isAnalyzing ? (
        <Card className="p-8 text-center">
          <Calculator className="w-8 h-8 mx-auto mb-4 animate-pulse text-primary" />
          <p className="text-muted-foreground">Running regression analysis...</p>
        </Card>
      ) : result ? (
        <div className="space-y-6">
          {/* Model Performance */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {(result.rSquared * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">R-Squared</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-chart-2">
                {result.slope.toFixed(3)}
              </div>
              <div className="text-sm text-muted-foreground">Slope</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-chart-3">
                {result.intercept.toFixed(3)}
              </div>
              <div className="text-sm text-muted-foreground">Intercept</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-chart-4">
                {result.standardError.toFixed(3)}
              </div>
              <div className="text-sm text-muted-foreground">Std Error</div>
            </Card>
          </div>

          {/* Regression Plot */}
          <Card className="p-6">
            <h4 className="font-medium mb-4 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Regression Fit
            </h4>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart data={result.predictions}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="x" 
                    type="number" 
                    domain={['dataMin', 'dataMax']}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis 
                    dataKey="y" 
                    type="number" 
                    domain={['dataMin', 'dataMax']}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Scatter dataKey="y" fill="hsl(var(--primary))" name="Actual" />
                  <Scatter dataKey="predicted" fill="hsl(var(--chart-2))" name="Predicted" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Feature Coefficients (for multiple regression) */}
          {result.coefficients && (
            <Card className="p-6">
              <h4 className="font-medium mb-4 flex items-center">
                <BarChart3 className="w-4 h-4 mr-2" />
                Feature Importance
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={result.coefficients}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="feature" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Bar dataKey="importance" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* Residuals Analysis */}
          <Card className="p-6">
            <h4 className="font-medium mb-4 flex items-center">
              <Target className="w-4 h-4 mr-2" />
              Residuals Analysis
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart data={getResidualsData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="predicted" 
                    type="number" 
                    domain={['dataMin', 'dataMax']}
                    stroke="hsl(var(--muted-foreground))"
                    name="Predicted"
                  />
                  <YAxis 
                    dataKey="residual" 
                    type="number" 
                    domain={['dataMin', 'dataMax']}
                    stroke="hsl(var(--muted-foreground))"
                    name="Residuals"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Scatter dataKey="residual" fill="hsl(var(--chart-3))" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Model Summary */}
          <Card className="p-6">
            <h4 className="font-medium mb-4 flex items-center">
              <Zap className="w-4 h-4 mr-2" />
              Model Summary & Insights
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                <div>
                  <strong>Model Fit:</strong> {
                    result.rSquared > 0.8 
                      ? "Excellent fit - model explains most variance"
                      : result.rSquared > 0.6 
                      ? "Good fit - reasonable predictive power"
                      : result.rSquared > 0.3
                      ? "Moderate fit - some predictive value"
                      : "Poor fit - consider other variables or methods"
                  }
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 rounded-full bg-chart-2 mt-1.5" />
                <div>
                  <strong>Statistical Significance:</strong> {
                    result.pValue < 0.05 
                      ? "Statistically significant relationship detected"
                      : "Relationship may not be statistically significant"
                  }
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 rounded-full bg-chart-3 mt-1.5" />
                <div>
                  <strong>Interpretation:</strong> For every unit increase in {features[0]}, 
                  {targetVariable} {result.slope > 0 ? 'increases' : 'decreases'} by approximately {Math.abs(result.slope).toFixed(3)} units
                </div>
              </div>

              {result.coefficients && (
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 rounded-full bg-chart-4 mt-1.5" />
                  <div>
                    <strong>Most Important Feature:</strong> {
                      result.coefficients.reduce((max, curr) => 
                        curr.importance > max.importance ? curr : max
                      ).feature
                    } has the strongest influence on {targetVariable}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      ) : targetVariable && features.length > 0 ? (
        <Card className="p-8 text-center">
          <Target className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Click "Run Regression" to analyze relationships</p>
        </Card>
      ) : (
        <Card className="p-8 text-center">
          <Calculator className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            Select target variable and features to begin regression analysis
          </p>
        </Card>
      )}
    </div>
  );
};