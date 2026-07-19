/**
 * Enhanced Navigation Header with Phase-Aware Features
 * Provides intelligent cross-phase navigation with transition guidance
 */

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { 
  Navigation, 
  Search, 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  Star,
  TrendingUp,
  MapPin,
  Lightbulb,
  ChevronRight,
  Menu
} from 'lucide-react';
import { usePhase } from '@/context/PhaseContext';
import { useAuth } from '@/context/AuthContext';
import { UnifiedSearch } from './UnifiedSearch';
import { PhaseTransitionGuide } from './PhaseTransitionGuide';

export const EnhancedNavigationHeader: React.FC = () => {
  const { user } = useAuth();
  const { currentPhase, phaseProgress, phaseInfo, getRecommendationsForCurrentContext } = usePhase();
  const location = useLocation();
  const [isPhaseMenuOpen, setIsPhaseMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const currentPhaseInfo = currentPhase ? phaseInfo[currentPhase] : null;
  const currentProgress = currentPhase ? phaseProgress.find(p => p.phase === currentPhase) : null;
  const recommendations = getRecommendationsForCurrentContext();

  const getPhaseColor = (phase: string) => {
    return phaseInfo[phase as keyof typeof phaseInfo]?.color || '#006E6D';
  };

  const renderPhaseIndicator = () => {
    if (!currentPhase || !currentPhaseInfo || !currentProgress) return null;

    return (
      <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
        <div 
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: currentPhaseInfo.color }}
        />
        <div className="flex flex-col">
          <span className="text-sm font-medium text-white">
            {currentPhaseInfo.name}
          </span>
          <div className="flex items-center gap-2">
            <Progress 
              value={currentProgress.completionPercentage} 
              className="w-16 h-1"
            />
            <span className="text-xs text-white/80">
              {currentProgress.completionPercentage}%
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderPhaseNavigation = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Your Journey Progress</h3>
        <div className="space-y-4">
          {Object.entries(phaseInfo).map(([phaseId, info]) => {
            const progress = phaseProgress.find(p => p.phase === phaseId);
            const isActive = currentPhase === phaseId;
            const isAccessible = progress && progress.readinessScore > 0;

            return (
              <div 
                key={phaseId}
                className={`p-4 rounded-lg border transition-all ${
                  isActive 
                    ? 'border-blue-200 bg-blue-50' 
                    : isAccessible 
                      ? 'border-border hover:border-gray-300 cursor-pointer' 
                      : 'border-gray-100 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: info.color }}
                    />
                    <div>
                      <h4 className="font-medium">{info.name}</h4>
                      <p className="text-sm text-muted-foreground">{info.description}</p>
                    </div>
                  </div>
                  {progress && (
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {progress.completionPercentage}%
                      </div>
                      <Progress value={progress.completionPercentage} className="w-20 h-2" />
                    </div>
                  )}
                </div>
                
                {isActive && progress && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {progress.milestonesCompleted} of {progress.totalMilestones} milestones
                      </span>
                      <Badge variant={progress.eligibleForTransition ? 'default' : 'secondary'}>
                        {progress.eligibleForTransition ? 'Ready to advance' : 'In progress'}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {recommendations.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Smart Recommendations</h3>
          <div className="space-y-3">
            {recommendations.slice(0, 3).map((rec) => (
              <Link
                key={rec.id}
                to={rec.actionUrl}
                className="block p-3 rounded-lg border border-border hover:border-blue-300 hover:bg-blue-50 transition-colors"
                onClick={() => setIsPhaseMenuOpen(false)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">{rec.title}</h4>
                    <p className="text-xs text-muted-foreground">{rec.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                        style={{ 
                          borderColor: getPhaseColor(rec.targetPhase),
                          color: getPhaseColor(rec.targetPhase)
                        }}
                      >
                        {phaseInfo[rec.targetPhase].name}
                      </Badge>
                      {rec.estimatedTime && (
                        <span className="text-xs text-muted-foreground">
                          • {rec.estimatedTime}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <header className="bg-gradient-to-r from-ehrdc-teal to-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Phase Indicator */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="font-bold text-xl">EHRDC</div>
            </Link>
            
            {user && renderPhaseIndicator()}
          </div>

          {/* Navigation Actions */}
          <div className="flex items-center gap-4">
            {/* Unified Search */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSearchOpen(true)}
              className="text-white hover:bg-white/20"
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>

            {/* Phase Navigation */}
            {user && (
              <Sheet open={isPhaseMenuOpen} onOpenChange={setIsPhaseMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Navigate Phases
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-96">
                  <SheetHeader>
                    <SheetTitle>Phase Navigation</SheetTitle>
                    <SheetDescription>
                      Explore your journey across the four-phase citizen lifecycle
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6">
                    {renderPhaseNavigation()}
                  </div>
                </SheetContent>
              </Sheet>
            )}

            {/* User Menu */}
            {user && (
              <Link
                to="/dashboard"
                className={`text-sm font-medium hover:text-blue-200 transition-colors ${
                  location.pathname === '/dashboard' ? 'text-blue-200' : ''
                }`}
              >
                Dashboard
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Search Modal */}
      {isSearchOpen && (
        <UnifiedSearch 
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
        />
      )}
    </header>
  );
};
