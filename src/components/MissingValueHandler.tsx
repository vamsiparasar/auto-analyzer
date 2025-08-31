import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Trash2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface MissingValueHandlerProps {
  data: any[];
  onDataCleaned: (cleanedData: any[]) => void;
}

export const MissingValueHandler = ({ data, onDataCleaned }: MissingValueHandlerProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  
  if (!data || data.length === 0) return null;

  const columns = Object.keys(data[0]);
  
  const getMissingValueStats = () => {
    return columns.map(column => {
      const missingCount = data.filter(row => 
        !row[column] || row[column] === '' || row[column] === null || row[column] === undefined
      ).length;
      const percentage = (missingCount / data.length) * 100;
      
      return {
        column,
        missingCount,
        percentage,
        totalRows: data.length
      };
    }).filter(stat => stat.missingCount > 0);
  };

  const missingStats = getMissingValueStats();
  
  if (missingStats.length === 0) {
    return (
      <Card className="p-6 bg-gradient-to-br from-success/10 to-success/5 border-success/20">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-success/20 rounded-lg flex items-center justify-center">
            <ArrowRight className="w-4 h-4 text-success" />
          </div>
          <div>
            <h3 className="font-semibold text-success">Data Quality Excellent</h3>
            <p className="text-sm text-muted-foreground">No missing values detected in your dataset</p>
          </div>
        </div>
      </Card>
    );
  }

  const handleRemoveMissingValues = async () => {
    setIsProcessing(true);
    
    try {
      // Remove rows with any missing values
      const cleanedData = data.filter(row => {
        return columns.every(column => 
          row[column] !== '' && 
          row[column] !== null && 
          row[column] !== undefined &&
          row[column] !== 'N/A' &&
          row[column] !== 'null'
        );
      });
      
      const removedRows = data.length - cleanedData.length;
      
      if (cleanedData.length === 0) {
        toast.error("Cannot remove all rows - dataset would be empty");
        return;
      }
      
      onDataCleaned(cleanedData);
      toast.success(`Removed ${removedRows} rows with missing values. ${cleanedData.length} rows remaining.`);
      
    } catch (error) {
      toast.error("Error cleaning data");
    } finally {
      setIsProcessing(false);
    }
  };

  const totalMissingValues = missingStats.reduce((sum, stat) => sum + stat.missingCount, 0);

  return (
    <Card className="p-6 bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-warning/20 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-warning" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Missing Values Detected</h3>
            <p className="text-sm text-muted-foreground">
              {totalMissingValues} missing values found across {missingStats.length} columns
            </p>
          </div>
        </div>
        <Button 
          onClick={handleRemoveMissingValues}
          disabled={isProcessing}
          className="bg-warning hover:bg-warning/90"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          {isProcessing ? "Cleaning..." : "Remove Missing Values"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {missingStats.map((stat) => (
          <div key={stat.column} className="border rounded-lg p-4 bg-card/50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium truncate">{stat.column}</h4>
              <Badge variant="destructive" className="text-xs">
                {stat.percentage.toFixed(1)}%
              </Badge>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Missing:</span>
                <span className="text-destructive">{stat.missingCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total:</span>
                <span>{stat.totalRows}</span>
              </div>
            </div>
            <div className="mt-2 w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-destructive h-2 rounded-full transition-all duration-300"
                style={{ width: `${stat.percentage}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};