/**
 * Phase Transition Guide Component
 * Provides guidance and onboarding for phase transitions
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  Clock, 
  Star, 
  ArrowRight, 
  BookOpen, 
  Target,
  TrendingUp,
  Users,
  Lightbulb,
  AlertTriangle,
  Calendar
} from 'lucide-react';
import { usePhase, Phase, PhaseInfo } from '@/context/PhaseContext';
import { Link } from 'react-router-dom';

interface Milestone {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
  estimatedTime?: string;
  actionUrl?: string;
}

interface TransitionRequirement {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'not-started';
  priority: 'high' | 'medium' | 'low';
}

interface PhaseTransitionGuideProps {
  isOpen: boolean;
  onClose: () => void;
  targetPhase: Phase;
}

export const PhaseTransitionGuide: React.FC<PhaseTransitionGuideProps> = ({
  isOpen,
  onClose,
  targetPhase
}) => {
  const { 
    currentPhase, 
    phaseInfo, 
    getPhaseProgress, 
    canTransitionToPhase, 
    getTransitionGuidance,
    triggerPhaseTransition 
  } = usePhase();

  const [transitionRequirements, setTransitionRequirements] = useState<TransitionRequirement[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [readinessScore, setReadinessScore] = useState(0);

  const targetPhaseInfo = phaseInfo[targetPhase];
  const currentProgress = currentPhase ? getPhaseProgress(currentPhase) : null;
  const canTransition = canTransitionToPhase(targetPhase);
  const guidance = getTransitionGuidance(targetPhase);

  // Mock transition requirements and milestones
  useEffect(() => {
    const requirements: TransitionRequirement[] = [];
    const phaseMilestones: Milestone[] = [];

    switch (targetPhase) {
      case 'career':
        requirements.push(
          {
            id: 'education-complete',
            title: 'Complete Educational Foundation',
            description: 'Finish required educational milestones and certifications',
            status: currentProgress?.completionPercentage > 80 ? 'completed' : 'in-progress',
            priority: 'high'
          },
          {
            id: 'career-readiness',
            title: 'Career Readiness Assessment',
            description: 'Complete career orientation and skills assessment',
            status: 'not-started',
            priority: 'high'
          },
          {
            id: 'resume-portfolio',
            title: 'Professional Documentation',
            description: 'Create resume and professional portfolio',
            status: 'not-started',
            priority: 'medium'
          }
        );

        phaseMilestones.push(
          {
            id: 'career-plan',
            title: 'Create Career Development Plan',
            description: 'Define your career goals and development pathway',
            completed: false,
            required: true,
            estimatedTime: '2-3 hours',
            actionUrl: '/career-planning-hub'
          },
          {
            id: 'industry-research',
            title: 'Industry Exploration',
            description: 'Research target industries and job markets',
            completed: false,
            required: true,
            estimatedTime: '1-2 weeks',
            actionUrl: '/industry-exploration'
          },
          {
            id: 'skill-assessment',
            title: 'Skills Gap Analysis',
            description: 'Identify skills gaps and development needs',
            completed: false,
            required: false,
            estimatedTime: '1 hour',
            actionUrl: '/assessments'
          }
        );
        break;

      case 'professional':
        requirements.push(
          {
            id: 'work-experience',
            title: 'Professional Experience',
            description: 'Gain relevant work experience in your field',
            status: 'in-progress',
            priority: 'high'
          },
          {
            id: 'network-building',
            title: 'Professional Network',
            description: 'Build connections with industry professionals',
            status: 'not-started',
            priority: 'medium'
          },
          {
            id: 'leadership-skills',
            title: 'Leadership Development',
            description: 'Develop leadership and management capabilities',
            status: 'not-started',
            priority: 'medium'
          }
        );

        phaseMilestones.push(
          {
            id: 'certification',
            title: 'Professional Certification',
            description: 'Obtain industry-recognized certifications',
            completed: false,
            required: true,
            estimatedTime: '3-6 months',
            actionUrl: '/professional-certifications'
          },
          {
            id: 'mentorship',
            title: 'Find a Mentor',
            description: 'Connect with experienced professionals for guidance',
            completed: false,
            required: false,
            estimatedTime: '2-4 weeks',
            actionUrl: '/mentorship'
          }
        );
        break;

      case 'lifelong':
        requirements.push(
          {
            id: 'expertise',
            title: 'Domain Expertise',
            description: 'Establish recognized expertise in your field',
            status: 'in-progress',
            priority: 'high'
          },
          {
            id: 'community-contribution',
            title: 'Community Contribution',
            description: 'Demonstrate commitment to community development',
            status: 'not-started',
            priority: 'high'
          }
        );

        phaseMilestones.push(
          {
            id: 'thought-leadership',
            title: 'Thought Leadership',
            description: 'Share insights and expertise with the community',
            completed: false,
            required: true,
            estimatedTime: 'Ongoing',
            actionUrl: '/thought-leadership'
          },
          {
            id: 'success-story',
            title: 'Share Your Story',
            description: 'Inspire others by sharing your journey',
            completed: false,
            required: false,
            estimatedTime: '1-2 hours',
            actionUrl: '/share-success-stories'
          }
        );
        break;
    }

    setTransitionRequirements(requirements);
    setMilestones(phaseMilestones);

    // Calculate readiness score
    const completedReqs = requirements.filter(r => r.status === 'completed').length;
    const totalReqs = requirements.length;
    const score = totalReqs > 0 ? Math.round((completedReqs / totalReqs) * 100) : 0;
    setReadinessScore(score);
  }, [targetPhase, currentProgress]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in-progress':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'in-progress':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const handleBeginTransition = () => {
    triggerPhaseTransition(targetPhase);
    onClose();
  };

  const renderReadinessAssessment = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-3xl font-bold mb-2" style={{ color: targetPhaseInfo.color }}>
          {readinessScore}%
        </div>
        <p className="text-gray-600">Transition Readiness</p>
        <Progress value={readinessScore} className="w-full mt-4" />
      </div>

      <Alert className={readinessScore >= 70 ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {readinessScore >= 70
            ? `You're ready to transition to ${targetPhaseInfo.name}! Complete the remaining milestones to begin.`
            : `Continue developing your skills and completing requirements to improve your readiness for ${targetPhaseInfo.name}.`
          }
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <h3 className="font-semibold">Transition Requirements</h3>
        {transitionRequirements.map((req) => (
          <div key={req.id} className={`p-4 rounded-lg border ${getStatusColor(req.status)}`}>
            <div className="flex items-start gap-3">
              {getStatusIcon(req.status)}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{req.title}</h4>
                  <Badge variant={req.priority === 'high' ? 'default' : 'secondary'}>
                    {req.priority} priority
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mt-1">{req.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMilestones = () => (
    <div className="space-y-4">
      <h3 className="font-semibold">Key Milestones</h3>
      {milestones.map((milestone) => (
        <Card key={milestone.id} className={milestone.completed ? 'bg-green-50 border-green-200' : ''}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {milestone.completed ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-gray-300 mt-0.5" />
                )}
                <div>
                  <h4 className="font-medium">{milestone.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                  {milestone.estimatedTime && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      {milestone.estimatedTime}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {milestone.required && (
                  <Badge variant="outline" className="text-xs">
                    Required
                  </Badge>
                )}
                {milestone.actionUrl && !milestone.completed && (
                  <Link to={milestone.actionUrl} onClick={onClose}>
                    <Button size="sm" variant="outline">
                      Start
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderGuidance = () => (
    <div className="space-y-4">
      <h3 className="font-semibold">Transition Guidance</h3>
      <div className="space-y-3">
        {guidance.map((item, index) => (
          <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
            <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
            <p className="text-sm">{item}</p>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">What to Expect</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <p><strong>Phase Overview:</strong> {targetPhaseInfo.description}</p>
            <p><strong>Duration:</strong> This phase typically lasts 2-5 years depending on your goals</p>
            <p><strong>Support:</strong> You'll have access to specialized tools, mentorship, and community resources</p>
            <p><strong>Flexibility:</strong> You can explore other phases while maintaining your primary focus here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: targetPhaseInfo.color }}
            />
            Transition to {targetPhaseInfo.name}
          </DialogTitle>
          <DialogDescription>
            Prepare for your next phase of the citizen journey with personalized guidance and milestones
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="readiness" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="readiness">Readiness Assessment</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="guidance">Guidance</TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="readiness">{renderReadinessAssessment()}</TabsContent>
            <TabsContent value="milestones">{renderMilestones()}</TabsContent>
            <TabsContent value="guidance">{renderGuidance()}</TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-between items-center pt-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Continue Exploring
          </Button>
          <div className="flex gap-3">
            {canTransition && readinessScore >= 70 && (
              <Button onClick={handleBeginTransition}>
                Begin Transition
                <ArrowRight className="h-4 w-4 ms-2" />
              </Button>
            )}
            {(!canTransition || readinessScore < 70) && (
              <Button variant="outline" disabled>
                Not Ready Yet
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
