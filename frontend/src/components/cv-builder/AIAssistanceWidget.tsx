import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sparkles, 
  Target, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  Lightbulb,
  RefreshCw,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { generateCVSuggestions, improveContent, CVData, AISuggestion } from '@/integrations/groq';
import { useToast } from '@/hooks/use-toast';

interface AIAssistanceWidgetProps {
  currentData: Partial<CVData>;
  stepType: string;
  onDataUpdate?: (updatedData: Partial<CVData>) => void;
  className?: string;
}

const AIAssistanceWidget: React.FC<AIAssistanceWidgetProps> = ({
  currentData,
  stepType,
  onDataUpdate,
  className = ''
}) => {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [strategicFitScore, setStrategicFitScore] = useState(75);
  const [activeTips, setActiveTips] = useState(0);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Load suggestions when step type or data changes
  useEffect(() => {
    if (stepType && currentData) {
      loadSuggestions();
    }
  }, [stepType, currentData]);

  const loadSuggestions = async () => {
    try {
      setIsLoadingSuggestions(true);
      const newSuggestions = await generateCVSuggestions(currentData as CVData);
      setSuggestions(newSuggestions);
      
      // Update strategic fit score based on suggestions
      const highPrioritySuggestions = newSuggestions.filter(s => s.confidence > 0.8).length;
      const newScore = Math.max(50, 95 - (highPrioritySuggestions * 8));
      setStrategicFitScore(newScore);
      setActiveTips(newSuggestions.length);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load AI suggestions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const applySuggestion = async (suggestion: AISuggestion) => {
    try {
      // Improve the content using AI
      const improvedContent = await improveContent(suggestion.suggestedValue, suggestion.field);
      
      // Create updated data based on the suggestion field
      const updatedData = { ...currentData };
      
      // Apply the suggestion to the appropriate field
      if (suggestion.field.includes('personalInfo')) {
        if (suggestion.field.includes('summary')) {
          updatedData.personalInfo = {
            ...updatedData.personalInfo,
            summary: improvedContent
          };
        }
      } else if (suggestion.field.includes('experience')) {
        // Handle experience field updates
        const expIndex = parseInt(suggestion.field.match(/\[(\d+)\]/)?.[1] || '0');
        if (updatedData.experience && updatedData.experience[expIndex]) {
          if (suggestion.field.includes('description')) {
            updatedData.experience[expIndex].description = improvedContent;
          }
        }
      }
      
      // Mark suggestion as applied
      setAppliedSuggestions(prev => new Set([...prev, suggestion.id]));
      
      // Notify parent component
      if (onDataUpdate) {
        onDataUpdate(updatedData);
      }
      
      toast({
        title: 'Suggestion Applied',
        description: 'Your CV has been updated with the AI suggestion.',
      });
      
    } catch (error) {
      console.error('Failed to apply suggestion:', error);
      toast({
        title: 'Error',
        description: 'Failed to apply suggestion. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const dismissSuggestion = (suggestionId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    setActiveTips(prev => Math.max(0, prev - 1));
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'improvement':
        return <TrendingUp className="h-4 w-4" />;
      case 'addition':
        return <Lightbulb className="h-4 w-4" />;
      case 'correction':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Strategic Fit Score */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Target className="h-4 w-4" />
            UAE Strategic Alignment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Strategic Fit Score</span>
              <span className={`text-lg font-bold ${getScoreColor(strategicFitScore)}`}>
                {strategicFitScore}%
              </span>
            </div>
            <Progress value={strategicFitScore} className="h-2" />
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <Lightbulb className="h-3 w-3" />
                <span>{activeTips} active tips</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                <span>{appliedSuggestions.size} applied</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Suggestions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4" />
              AI Suggestions
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={loadSuggestions}
              disabled={isLoadingSuggestions}
            >
              <RefreshCw className={`h-3 w-3 ${isLoadingSuggestions ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingSuggestions ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : suggestions.length > 0 ? (
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className={`p-3 border rounded-lg ${
                      appliedSuggestions.has(suggestion.id) 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getSuggestionIcon(suggestion.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {suggestion.field}
                          </Badge>
                          <Badge className={`text-xs ${getConfidenceColor(suggestion.confidence)}`}>
                            {getConfidenceLabel(suggestion.confidence)}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-900 mb-2">
                          {suggestion.reason}
                        </p>
                        
                        {suggestion.currentValue && (
                          <div className="mb-2">
                            <p className="text-xs text-gray-500 mb-1">Current:</p>
                            <p className="text-xs bg-gray-50 p-2 rounded border">
                              {suggestion.currentValue}
                            </p>
                          </div>
                        )}
                        
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 mb-1">Suggested:</p>
                          <p className="text-xs bg-blue-50 p-2 rounded border">
                            {suggestion.suggestedValue}
                          </p>
                        </div>
                        
                        {!appliedSuggestions.has(suggestion.id) && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => applySuggestion(suggestion)}
                              className="flex items-center gap-1 text-xs"
                            >
                              <ThumbsUp className="h-3 w-3" />
                              Apply
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => dismissSuggestion(suggestion.id)}
                              className="flex items-center gap-1 text-xs"
                            >
                              <ThumbsDown className="h-3 w-3" />
                              Dismiss
                            </Button>
                          </div>
                        )}
                        
                        {appliedSuggestions.has(suggestion.id) && (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-3 w-3" />
                            <span className="text-xs">Applied</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-6">
              <Sparkles className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                No suggestions available. Complete more sections to get AI recommendations.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadSuggestions}
              disabled={isLoadingSuggestions}
              className="text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh Tips
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAppliedSuggestions(new Set())}
              className="text-xs"
            >
              <AlertCircle className="h-3 w-3 mr-1" />
              Reset Applied
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIAssistanceWidget;

