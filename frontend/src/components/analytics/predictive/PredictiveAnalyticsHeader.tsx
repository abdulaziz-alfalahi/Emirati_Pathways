
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Brain } from 'lucide-react';

interface PredictiveAnalyticsHeaderProps {
  selectedTimeHorizon: string;
  onTimeHorizonChange: (value: string) => void;
  selectedModel: string;
  onModelChange: (value: string) => void;
}

export const PredictiveAnalyticsHeader: React.FC<PredictiveAnalyticsHeaderProps> = ({
  selectedTimeHorizon,
  onTimeHorizonChange,
  selectedModel,
  onModelChange
}) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Predictive Analytics Configuration</h2>
            <Badge variant="default" className="flex items-center gap-1">
              <Brain className="h-3 w-3" />
              AI-Powered
            </Badge>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Time Horizon:</span>
              <Select value={selectedTimeHorizon} onValueChange={onTimeHorizonChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-year">1 Year</SelectItem>
                  <SelectItem value="3-year">3 Years</SelectItem>
                  <SelectItem value="5-year">5 Years</SelectItem>
                  <SelectItem value="10-year">10 Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Model:</span>
              <Select value={selectedModel} onValueChange={onModelChange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ml-ensemble">ML Ensemble</SelectItem>
                  <SelectItem value="time-series">Time Series</SelectItem>
                  <SelectItem value="neural-network">Neural Network</SelectItem>
                  <SelectItem value="regression">Regression</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
