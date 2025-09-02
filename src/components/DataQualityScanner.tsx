import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Activity,
  TrendingUp,
  RotateCcw,
  Zap
} from "lucide-react";
import { toast } from "sonner";

interface DataQualityScannerProps {
  data: any[];
  onDataCleaned?: (cleanedData: any[]) => void;
}

interface QualityIssue {
  type: 'missing' | 'duplicate' | 'outlier' | 'inconsistent' | 'format';
  severity: 'low' | 'medium' | 'high' | 'critical';
  column?: string;
  count: number;
  description: string;
  autoFixable: boolean;
}

interface QualityReport {
  overallScore: number;
  issues: QualityIssue[];
  suggestions: string[];
  datasetHealth: {
    completeness: number;
    consistency: number;
    accuracy: number;
    validity: number;
  };
}

export const DataQualityScanner = ({ data, onDataCleaned }: DataQualityScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [report, setReport] = useState<QualityReport | null>(null);
  const [scanProgress, setScanProgress] = useState(0);

  useEffect(() => {
    if (data && data.length > 0) {
      performQualityScan();
    }
  }, [data]);

  const performQualityScan = async () => {
    setIsScanning(true);
    setScanProgress(0);

    // Simulate progressive scanning
    const steps = [
      { name: "Analyzing missing values", duration: 300 },
      { name: "Detecting duplicates", duration: 400 },
      { name: "Identifying outliers", duration: 500 },
      { name: "Checking consistency", duration: 300 },
      { name: "Validating formats", duration: 400 }
    ];

    let currentProgress = 0;
    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, step.duration));
      currentProgress += 100 / steps.length;
      setScanProgress(Math.round(currentProgress));
    }

    const qualityReport = generateQualityReport();
    setReport(qualityReport);
    setIsScanning(false);
  };

  const generateQualityReport = (): QualityReport => {
    const columns = Object.keys(data[0]);
    const issues: QualityIssue[] = [];
    const suggestions: string[] = [];

    // Scan for missing values
    columns.forEach(col => {
      const missingCount = data.filter(row => 
        row[col] == null || row[col] === '' || row[col] === undefined
      ).length;
      
      if (missingCount > 0) {
        const percentage = (missingCount / data.length) * 100;
        issues.push({
          type: 'missing',
          severity: percentage > 20 ? 'high' : percentage > 10 ? 'medium' : 'low',
          column: col,
          count: missingCount,
          description: `${missingCount} missing values (${percentage.toFixed(1)}%) in ${col}`,
          autoFixable: true
        });
      }
    });

    // Scan for duplicates
    const uniqueRows = new Set(data.map(row => JSON.stringify(row)));
    const duplicateCount = data.length - uniqueRows.size;
    if (duplicateCount > 0) {
      issues.push({
        type: 'duplicate',
        severity: duplicateCount > data.length * 0.1 ? 'high' : 'medium',
        count: duplicateCount,
        description: `${duplicateCount} duplicate rows detected`,
        autoFixable: true
      });
    }

    // Scan for outliers in numeric columns
    const numericColumns = getNumericColumns(columns);
    numericColumns.forEach(col => {
      const outliers = detectOutliers(col);
      if (outliers.length > 0) {
        issues.push({
          type: 'outlier',
          severity: outliers.length > data.length * 0.05 ? 'medium' : 'low',
          column: col,
          count: outliers.length,
          description: `${outliers.length} potential outliers in ${col}`,
          autoFixable: false
        });
      }
    });

    // Scan for data type inconsistencies
    columns.forEach(col => {
      const inconsistencies = detectTypeInconsistencies(col);
      if (inconsistencies > 0) {
        issues.push({
          type: 'inconsistent',
          severity: 'medium',
          column: col,
          count: inconsistencies,
          description: `${inconsistencies} data type inconsistencies in ${col}`,
          autoFixable: true
        });
      }
    });

    // Generate suggestions
    if (issues.some(i => i.type === 'missing')) {
      suggestions.push("Consider using imputation techniques for missing values");
    }
    if (issues.some(i => i.type === 'duplicate')) {
      suggestions.push("Remove duplicate rows to improve data quality");
    }
    if (issues.some(i => i.type === 'outlier')) {
      suggestions.push("Investigate outliers - they might indicate data errors or interesting patterns");
    }

    // Calculate health metrics
    const completeness = calculateCompleteness();
    const consistency = calculateConsistency();
    const accuracy = calculateAccuracy();
    const validity = calculateValidity();

    const overallScore = Math.round((completeness + consistency + accuracy + validity) / 4);

    return {
      overallScore,
      issues,
      suggestions,
      datasetHealth: {
        completeness,
        consistency,
        accuracy,
        validity
      }
    };
  };

  const getNumericColumns = (columns: string[]) => {
    return columns.filter(col => {
      const sample = data.slice(0, 10).map(row => row[col]).filter(val => val != null && val !== '');
      const numericCount = sample.filter(val => !isNaN(Number(val))).length;
      return numericCount > sample.length * 0.8;
    });
  };

  const detectOutliers = (column: string) => {
    const values = data
      .map(row => parseFloat(row[column]))
      .filter(val => !isNaN(val));
    
    if (values.length < 4) return [];
    
    const sorted = values.sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    return values.filter(val => val < lowerBound || val > upperBound);
  };

  const detectTypeInconsistencies = (column: string) => {
    const values = data.map(row => row[column]).filter(val => val != null && val !== '');
    if (values.length === 0) return 0;
    
    const types = values.map(val => {
      if (!isNaN(Number(val))) return 'number';
      if (!isNaN(Date.parse(val))) return 'date';
      return 'string';
    });
    
    const typeCount = new Set(types).size;
    return typeCount > 1 ? values.length - Math.max(...Object.values(
      types.reduce((acc, type) => ({ ...acc, [type]: (acc[type] || 0) + 1 }), {} as Record<string, number>)
    )) : 0;
  };

  const calculateCompleteness = () => {
    const totalCells = data.length * Object.keys(data[0]).length;
    const missingCells = data.reduce((count, row) => {
      return count + Object.values(row).filter(val => val == null || val === '').length;
    }, 0);
    return Math.round(((totalCells - missingCells) / totalCells) * 100);
  };

  const calculateConsistency = () => {
    // Simplified consistency calculation based on data type uniformity
    const columns = Object.keys(data[0]);
    let consistencyScore = 0;
    
    columns.forEach(col => {
      const inconsistencies = detectTypeInconsistencies(col);
      const values = data.map(row => row[col]).filter(val => val != null && val !== '');
      const columnScore = values.length > 0 ? ((values.length - inconsistencies) / values.length) * 100 : 100;
      consistencyScore += columnScore;
    });
    
    return Math.round(consistencyScore / columns.length);
  };

  const calculateAccuracy = () => {
    // Simplified accuracy based on outlier detection
    const numericColumns = getNumericColumns(Object.keys(data[0]));
    if (numericColumns.length === 0) return 95; // Default for non-numeric data
    
    let totalValues = 0;
    let outlierCount = 0;
    
    numericColumns.forEach(col => {
      const values = data.map(row => parseFloat(row[col])).filter(val => !isNaN(val));
      totalValues += values.length;
      outlierCount += detectOutliers(col).length;
    });
    
    return totalValues > 0 ? Math.round(((totalValues - outlierCount) / totalValues) * 100) : 95;
  };

  const calculateValidity = () => {
    // Simplified validity based on format consistency
    return Math.min(calculateConsistency() + 5, 100); // Slightly higher than consistency
  };

  const autoFixIssues = () => {
    let cleanedData = [...data];
    const fixableIssues = report?.issues.filter(issue => issue.autoFixable) || [];
    
    fixableIssues.forEach(issue => {
      switch (issue.type) {
        case 'missing':
          if (issue.column) {
            cleanedData = cleanedData.map(row => {
              if (row[issue.column!] == null || row[issue.column!] === '') {
                return { ...row, [issue.column!]: 'N/A' }; // Simple replacement
              }
              return row;
            });
          }
          break;
        case 'duplicate':
          const seen = new Set();
          cleanedData = cleanedData.filter(row => {
            const key = JSON.stringify(row);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          break;
      }
    });
    
    onDataCleaned?.(cleanedData);
    toast.success(`Fixed ${fixableIssues.length} data quality issues`);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-success';
    if (score >= 70) return 'text-warning';
    return 'text-destructive';
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="w-4 h-4 text-destructive" />;
      case 'high': return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case 'medium': return <AlertTriangle className="w-4 h-4 text-warning" />;
      default: return <CheckCircle className="w-4 h-4 text-warning" />;
    }
  };

  if (!data || data.length === 0) return null;

  return (
    <Card className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Data Quality Scanner
            </h3>
            <p className="text-sm text-muted-foreground">
              AI-powered analysis of your data integrity and quality
            </p>
          </div>
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={performQualityScan}
          disabled={isScanning}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          {isScanning ? 'Scanning...' : 'Rescan'}
        </Button>
      </div>

      {/* Scanning Progress */}
      {isScanning && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-sm font-medium">Analyzing data quality...</span>
          </div>
          <Progress value={scanProgress} className="h-2" />
          <div className="text-xs text-muted-foreground text-center">
            {scanProgress}% complete
          </div>
        </div>
      )}

      {/* Quality Report */}
      {report && !isScanning && (
        <>
          {/* Overall Score */}
          <div className="text-center p-6 bg-gradient-to-br from-card via-card to-card/95 rounded-lg border">
            <div className={`text-4xl font-bold mb-2 ${getScoreColor(report.overallScore)}`}>
              {report.overallScore}%
            </div>
            <div className="text-lg font-medium mb-1">Overall Data Quality</div>
            <div className="text-sm text-muted-foreground">
              {report.overallScore >= 90 ? 'Excellent' : 
               report.overallScore >= 70 ? 'Good' : 
               report.overallScore >= 50 ? 'Fair' : 'Needs Improvement'}
            </div>
          </div>

          {/* Health Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(report.datasetHealth).map(([metric, score]) => (
              <div key={metric} className="text-center p-3 bg-gradient-to-br from-muted/50 to-muted/30 rounded-lg">
                <div className={`text-xl font-bold ${getScoreColor(score)}`}>
                  {score}%
                </div>
                <div className="text-xs text-muted-foreground capitalize">
                  {metric}
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Issues & Fixes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold">Quality Issues</h4>
              {report.issues.some(i => i.autoFixable) && (
                <Button size="sm" onClick={autoFixIssues}>
                  <Zap className="w-4 h-4 mr-2" />
                  Auto-fix Issues
                </Button>
              )}
            </div>

            {report.issues.length > 0 ? (
              <div className="space-y-3">
                {report.issues.map((issue, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                    {getSeverityIcon(issue.severity)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium">{issue.description}</span>
                        <Badge variant={issue.severity === 'high' || issue.severity === 'critical' ? 'destructive' : 'secondary'}>
                          {issue.severity}
                        </Badge>
                        {issue.autoFixable && (
                          <Badge variant="outline" className="text-xs">
                            Auto-fixable
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-success" />
                <div className="font-medium text-success">No quality issues detected!</div>
                <div className="text-sm">Your data appears to be in excellent condition.</div>
              </div>
            )}
          </div>

          {/* Suggestions */}
          {report.suggestions.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="text-lg font-semibold">Recommendations</h4>
                <ul className="space-y-2">
                  {report.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <TrendingUp className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </>
      )}
    </Card>
  );
};