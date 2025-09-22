
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Calendar, 
  Target, 
  Clock, 
  Lightbulb, 
  ArrowRight,
  Brain,
  Zap,
  Star
} from 'lucide-react';
import { usePersonalization } from '@/context/PersonalizationContext';
import { usePhase } from '@/context/PhaseContext';

interface PredictiveInsight {
  id: string;
  type: 'opportunity' | 'transition' | 'skill' | 'achievement';
  title: string;
  description: string;
  confidence: number;
  timeframe: string;
  actionable: boolean;
  impact: 'high' | 'medium' | 'low';
  category: string;
}

const PredictiveAnalytics: React.FC = () => {
  const { profile, trackInteraction } = usePersonalization();
  const { currentPhase } = usePhase();
  const [insights, setInsights] = useState<PredictiveInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    generatePredictiveInsights();
  }, [profile, currentPhase]);

  const generatePredictiveInsights = async () => {
    setIsLoading(true);
    
    try {
      // Simulate AI-generated predictive insights
      const mockInsights: PredictiveInsight[] = [
        {
          id: '1',
          type: 'transition',
          title: 'Ready for Career Phase Transition',
          description: 'Based on your progress patterns, you\'ll likely be ready to transition to the career phase in 2-3 months.',
          confidence: 0.85,
          timeframe: '2-3 months',
          actionable: true,
          impact: 'high',
          category: 'Phase Progression'
        },
        {
          id: '2',
          type: 'skill',
          title: 'Emerging Interest in Data Analytics',
          description: 'Your interaction patterns suggest growing interest in data analytics. Consider exploring related courses.',
          confidence: 0.72,
          timeframe: 'Next 2 weeks',
          actionable: true,
          impact: 'medium',
          category: 'Skill Development'
        },
        {
          id: '3',
          type: 'opportunity',
          title: 'Optimal Time for Networking',
          description: 'Your engagement levels peak on Tuesday afternoons - ideal for networking activities.',
          confidence: 0.68,
          timeframe: 'This week',
          actionable: true,
          impact: 'medium',
          category: 'Timing Optimization'
        },
        {
          id: '4',
          type: 'achievement',
          title: 'Goal Achievement Prediction',
          description: 'At your current pace, you\'ll achieve your quarterly learning goals 1 week early.',
          confidence: 0.91,
          timeframe: '5 weeks',
          actionable: false,
          impact: 'high',
          category: 'Goal Progress'
        }
      ];

      // Filter insights based on user phase and preferences
      const filteredInsights = mockInsights.filter(insight => {
        if (!profile) return true;
        
        // Customize based on learning pace
        if (profile.preferences.learningPace === 'fast' && insight.timeframe.includes('months')) {
          return false;
        }
        
        return true;
      });

      setInsights(filteredInsights);
    } catch (error) {
      console.error('Error generating predictive insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInsightAction = async (insight: PredictiveInsight) => {
    await trackInteraction({
      type: 'predictive_insight_action',
      insightId: insight.id,
      insightType: insight.type,
      significant: true
    });
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'transition':
        return <ArrowRight className="h-5 w-5 text-blue-500" />;
      case 'skill':
        return <Brain className="h-5 w-5 text-purple-500" />;
      case 'opportunity':
        return <Lightbulb className="h-5 w-5 text-yellow-500" />;
      case 'achievement':
        return <Star className="h-5 w-5 text-green-500" />;
      default:
        return <TrendingUp className="h-5 w-5" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <TrendingUp className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Predictive Analytics</h2>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">AI Confidence</p>
                <p className="text-2xl font-bold">
                  {Math.round(insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length * 100)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Actionable Insights</p>
                <p className="text-2xl font-bold">
                  {insights.filter(i => i.actionable).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">High Impact</p>
                <p className="text-2xl font-bold">
                  {insights.filter(i => i.impact === 'high').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Predictive Insights */}
      <div className="space-y-4">
        {insights.map((insight) => (
          <Card key={insight.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  {getInsightIcon(insight.type)}
                  <div>
                    <CardTitle className="text-lg">{insight.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {insight.description}
                    </CardDescription>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <Badge variant="outline" className={getImpactColor(insight.impact)}>
                    {insight.impact} impact
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {insight.timeframe}
                  </p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">Confidence:</span>
                      <span className={`text-sm font-medium ${getConfidenceColor(insight.confidence)}`}>
                        {Math.round(insight.confidence * 100)}%
                      </span>
                    </div>
                    <Progress 
                      value={insight.confidence * 100} 
                      className="w-24 h-2"
                    />
                  </div>
                  
                  <Badge variant="secondary">
                    {insight.category}
                  </Badge>
                </div>
                
                {insight.actionable && (
                  <Button 
                    size="sm" 
                    onClick={() => handleInsightAction(insight)}
                    className="flex items-center space-x-1"
                  >
                    <span>Take Action</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Model Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <span>How Predictions Work</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              Our AI uses machine learning algorithms to analyze your behavior patterns, 
              progress velocity, and engagement levels to make predictions about your future needs.
            </p>
            <p>
              Predictions become more accurate as you use the platform more. All analysis 
              is done with privacy protection and you maintain full control over your data.
            </p>
            <div className="flex items-center space-x-2 pt-2">
              <Button variant="outline" size="sm">
                Learn More About AI
              </Button>
              <Button variant="outline" size="sm">
                Adjust Privacy Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PredictiveAnalytics;
