
import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Settings, TrendingUp, Target, Clock, Star } from 'lucide-react';
import { usePersonalization } from '@/context/PersonalizationContext';
import { cn } from '@/lib/utils';

interface PersonalizedDashboardProps {
  className?: string;
}

const PersonalizedDashboard: React.FC<PersonalizedDashboardProps> = ({ className }) => {
  const { 
    recommendations, 
    interfaceAdaptation, 
    trackInteraction, 
    refreshRecommendations,
    isLoading 
  } = usePersonalization();

  useEffect(() => {
    // Track dashboard view
    trackInteraction({
      type: 'dashboard_view',
      significant: false
    });
  }, [trackInteraction]);

  const handleRecommendationClick = async (recommendation: any) => {
    await trackInteraction({
      type: 'recommendation_click',
      recommendationId: recommendation.id,
      recommendationType: recommendation.type,
      significant: true
    });
  };

  const getLayoutClasses = () => {
    if (!interfaceAdaptation) return '';
    
    switch (interfaceAdaptation.layout) {
      case 'compact':
        return 'space-y-3 p-3';
      case 'spacious':
        return 'space-y-6 p-6';
      case 'focused':
        return 'space-y-4 p-4 max-w-3xl mx-auto';
      default:
        return 'space-y-4 p-4';
    }
  };

  const getFontSizeClass = () => {
    if (!interfaceAdaptation) return '';
    
    const modifier = interfaceAdaptation.fontSizeModifier;
    if (modifier > 1.1) return 'text-lg';
    if (modifier < 0.9) return 'text-sm';
    return '';
  };

  const getColorSchemeClass = () => {
    if (!interfaceAdaptation) return '';
    
    switch (interfaceAdaptation.colorScheme) {
      case 'high-contrast':
        return 'high-contrast-theme';
      case 'warm':
        return 'warm-theme';
      case 'cool':
        return 'cool-theme';
      default:
        return '';
    }
  };

  const getAnimationClass = () => {
    if (!interfaceAdaptation) return '';
    
    switch (interfaceAdaptation.animationLevel) {
      case 'none':
        return 'no-animations';
      case 'reduced':
        return 'reduced-animations';
      default:
        return '';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Star className="h-4 w-4 text-amber-500" />;
      case 'medium':
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'low':
        return <Clock className="h-4 w-4 text-gray-500" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const getTimingBadgeVariant = (timing: string) => {
    switch (timing) {
      case 'immediate':
        return 'destructive';
      case 'soon':
        return 'default';
      case 'later':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className={cn('flex justify-center items-center py-8', className)}>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={cn(
      getLayoutClasses(),
      getFontSizeClass(),
      getColorSchemeClass(),
      getAnimationClass(),
      className
    )}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Your Personalized Experience</h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshRecommendations}
          className="flex items-center space-x-2"
        >
          <Settings className="h-4 w-4" />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Personalized Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>AI-Powered Recommendations</span>
          </CardTitle>
          <CardDescription>
            Tailored suggestions based on your learning patterns and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recommendations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Building your personalized recommendations...</p>
              <p className="text-sm">Complete more activities to get better suggestions</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.map((recommendation) => (
                <div
                  key={recommendation.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleRecommendationClick(recommendation)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getPriorityIcon(recommendation.priority)}
                      <h4 className="font-medium">{recommendation.title}</h4>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getTimingBadgeVariant(recommendation.timing)}>
                        {recommendation.timing}
                      </Badge>
                      <div className="text-sm text-muted-foreground">
                        {Math.round(recommendation.relevanceScore * 100)}% match
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {recommendation.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="capitalize">
                      {recommendation.type}
                    </Badge>
                    <Button size="sm" variant="ghost">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interface Adaptation Info */}
      {interfaceAdaptation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Interface Adaptations</span>
            </CardTitle>
            <CardDescription>
              Your interface has been optimized based on your preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Layout & Design</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Layout: <span className="capitalize">{interfaceAdaptation.layout}</span></p>
                  <p>Color Scheme: <span className="capitalize">{interfaceAdaptation.colorScheme}</span></p>
                  <p>Animations: <span className="capitalize">{interfaceAdaptation.animationLevel}</span></p>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Prioritized Features</h4>
                <div className="flex flex-wrap gap-1">
                  {interfaceAdaptation.prioritizedFeatures.map((feature) => (
                    <Badge key={feature} variant="secondary" className="text-xs">
                      {feature.replace('-', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PersonalizedDashboard;
