
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  Circle, 
  X,
  TrendingUp,
  Clock,
  Target,
  Users
} from 'lucide-react';

interface CareerStage {
  id: string;
  title: string;
  description: string;
  category: 'education' | 'career' | 'personal' | 'retirement';
  ageRange: string;
  completed: boolean;
  current: boolean;
  recommended: boolean;
  icon: React.ComponentType<any>;
  requirements?: string[];
  benefits?: string[];
  duration?: string;
}

interface CareerPath {
  id: string;
  title: string;
  industry: string;
  stages: CareerStage[];
  totalProgress: number;
}

interface CareerPathComparisonProps {
  availablePaths: CareerPath[];
  isOpen: boolean;
  onClose: () => void;
}

const CareerPathComparison: React.FC<CareerPathComparisonProps> = ({
  availablePaths,
  isOpen,
  onClose
}) => {
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [maxPaths] = useState(3); // Limit to 3 paths for better comparison

  const handlePathSelect = (pathId: string) => {
    if (selectedPaths.includes(pathId)) {
      setSelectedPaths(selectedPaths.filter(id => id !== pathId));
    } else if (selectedPaths.length < maxPaths) {
      setSelectedPaths([...selectedPaths, pathId]);
    }
  };

  const getSelectedPathsData = () => {
    return availablePaths.filter(path => selectedPaths.includes(path.id));
  };

  const getStageComparison = () => {
    const paths = getSelectedPathsData();
    if (paths.length === 0) return [];

    const maxStages = Math.max(...paths.map(path => path.stages.length));
    const comparison = [];

    for (let i = 0; i < maxStages; i++) {
      const stageData = {
        index: i,
        stages: paths.map(path => path.stages[i] || null)
      };
      comparison.push(stageData);
    }

    return comparison;
  };

  const getPathMetrics = (path: CareerPath) => {
    const completedStages = path.stages.filter(stage => stage.completed).length;
    const totalStages = path.stages.length;
    const estimatedYears = path.stages.reduce((total, stage) => {
      if (stage.duration) {
        const years = parseInt(stage.duration.split(' ')[0]) || 1;
        return total + years;
      }
      return total + 2; // Default 2 years per stage
    }, 0);

    return {
      completedStages,
      totalStages,
      estimatedYears,
      progressPercentage: Math.round((completedStages / totalStages) * 100)
    };
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'education': return 'bg-blue-100 text-blue-800';
      case 'career': return 'bg-green-100 text-green-800';
      case 'personal': return 'bg-purple-100 text-purple-800';
      case 'retirement': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Compare Career Paths</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-muted-foreground mt-2">
            Select up to {maxPaths} career paths to compare side by side
          </p>
        </div>

        <div className="p-6">
          {/* Path Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Select Paths to Compare</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {availablePaths.map(path => (
                <Card
                  key={path.id}
                  className={`cursor-pointer transition-all ${
                    selectedPaths.includes(path.id)
                      ? 'ring-2 ring-primary bg-primary/5'
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => handlePathSelect(path.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{path.title}</h4>
                        <p className="text-sm text-muted-foreground">{path.industry}</p>
                      </div>
                      {selectedPaths.includes(path.id) && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {selectedPaths.length > 0 && (
            <>
              {/* Path Overview Comparison */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Path Overview</h3>
                <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selectedPaths.length}, 1fr)` }}>
                  {getSelectedPathsData().map(path => {
                    const metrics = getPathMetrics(path);
                    return (
                      <Card key={path.id}>
                        <CardHeader>
                          <CardTitle className="text-lg">{path.title}</CardTitle>
                          <p className="text-muted-foreground">{path.industry}</p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Progress value={metrics.progressPercentage} className="flex-1" />
                            <span className="text-sm font-medium">{metrics.progressPercentage}%</span>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Target className="h-4 w-4" />
                              <span>{metrics.completedStages}/{metrics.totalStages} stages completed</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4" />
                              <span>Est. {metrics.estimatedYears} years total</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Stage-by-Stage Comparison */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Stage-by-Stage Comparison</h3>
                <div className="space-y-4">
                  {getStageComparison().map(({ index, stages }) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-3">Stage {index + 1}</h4>
                      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selectedPaths.length}, 1fr)` }}>
                        {stages.map((stage, pathIndex) => (
                          <div key={pathIndex} className="border rounded p-3">
                            {stage ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <h5 className="font-medium text-sm">{stage.title}</h5>
                                  {stage.completed && (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  )}
                                  {stage.current && (
                                    <Circle className="h-4 w-4 text-blue-600 fill-current" />
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">{stage.description}</p>
                                <div className="flex gap-1">
                                  <Badge variant="secondary" className={`text-xs ${getCategoryColor(stage.category)}`}>
                                    {stage.category}
                                  </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Age: {stage.ageRange}
                                  {stage.duration && ` • Duration: ${stage.duration}`}
                                </div>
                              </div>
                            ) : (
                              <div className="text-center text-muted-foreground text-sm">
                                No stage at this level
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {selectedPaths.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Select paths to compare</h3>
              <p className="text-muted-foreground">
                Choose up to {maxPaths} career paths from above to see a detailed comparison
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CareerPathComparison;
