import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ExternalLink, BookOpen, Clock, TrendingUp } from 'lucide-react';
import { SkillGap, JobMatch } from '@/utils/api'; // Import correct types

interface SkillsGapAnalysisProps {
  jobMatch: JobMatch; // Use the correct JobMatch type
  onClose?: () => void;
}

const SkillsGapAnalysis: React.FC<SkillsGapAnalysisProps> = ({ jobMatch, onClose }) => {
  // Generate skills gap analysis from job match data
  const generateSkillsGap = (match: JobMatch): SkillGap[] => {
    const matchDetails = match.match_details || {};
    const skillsData = matchDetails.skills || { matched: [], missing: [] };
    
    const gaps: SkillGap[] = [];
    
    // Add missing skills as high priority gaps
    if (skillsData.missing && Array.isArray(skillsData.missing)) {
      skillsData.missing.forEach((skill: string) => {
        gaps.push({
          skill,
          currentLevel: 'Beginner',
          requiredLevel: 'Intermediate',
          priority: 'high' as const, // Explicitly type as const
          frequency: Math.floor(Math.random() * 50) + 50, // Random frequency 50-100
          learningResources: [
            {
              title: `Master ${skill} Fundamentals`,
              provider: 'Coursera',
              url: `https://coursera.org/search?query=${encodeURIComponent(skill)}`,
              duration: '4-6 weeks',
              level: 'Beginner to Intermediate'
            },
            {
              title: `${skill} Complete Guide`,
              provider: 'Udemy',
              url: `https://udemy.com/courses/search/?q=${encodeURIComponent(skill)}`,
              duration: '8-12 hours',
              level: 'All Levels'
            },
            {
              title: `${skill} Documentation`,
              provider: 'Official Docs',
              url: '#',
              duration: 'Self-paced',
              level: 'Reference'
            }
          ]
        });
      });
    }
    
    // Add matched skills that could be improved
    if (skillsData.matched && Array.isArray(skillsData.matched)) {
      skillsData.matched.slice(0, 2).forEach((skill: string) => {
        gaps.push({
          skill,
          currentLevel: 'Intermediate',
          requiredLevel: 'Advanced',
          priority: 'medium' as const, // Explicitly type as const
          frequency: Math.floor(Math.random() * 30) + 20, // Random frequency 20-50
          learningResources: [
            {
              title: `Advanced ${skill} Techniques`,
              provider: 'LinkedIn Learning',
              url: `https://linkedin.com/learning/search?keywords=${encodeURIComponent(skill)}`,
              duration: '2-3 weeks',
              level: 'Advanced'
            },
            {
              title: `${skill} Best Practices`,
              provider: 'Pluralsight',
              url: `https://pluralsight.com/search?q=${encodeURIComponent(skill)}`,
              duration: '6-10 hours',
              level: 'Intermediate to Advanced'
            }
          ]
        });
      });
    }
    
    return gaps;
  };

  const skillsGap = generateSkillsGap(jobMatch);

  const getPriorityColor = (priority: SkillGap['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: SkillGap['priority']) => {
    switch (priority) {
      case 'high':
        return <TrendingUp className="w-4 h-4 text-red-600" />;
      case 'medium':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'low':
        return <BookOpen className="w-4 h-4 text-green-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Skills Gap Analysis</h2>
          <p className="text-gray-600 mt-1">
            Identify skills to develop for {jobMatch.job_title} at {jobMatch.company}
          </p>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      {/* Overall Match Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Overall Match Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Progress value={jobMatch.overall_score} className="h-3" />
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {jobMatch.overall_score}%
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {jobMatch.overall_score >= 80 
              ? "Excellent match! Focus on advanced skills to stand out."
              : jobMatch.overall_score >= 60
              ? "Good match. Address key skill gaps to improve your candidacy."
              : "Significant skill development needed for this role."
            }
          </p>
        </CardContent>
      </Card>

      {/* Skills Gap List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Skills to Develop ({skillsGap.length})
        </h3>
        
        {skillsGap.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No significant skill gaps identified
              </h3>
              <p className="text-gray-600">
                Your skills align well with this position. Consider developing advanced expertise in your core areas.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {skillsGap.map((gap, index) => (
              <Card key={index} className="border-s-4 border-s-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{gap.skill}</CardTitle>
                    <div className="flex items-center gap-2">
                      {getPriorityIcon(gap.priority)}
                      <Badge className={getPriorityColor(gap.priority)}>
                        {gap.priority} priority
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Current: {gap.currentLevel}</span>
                    <span>→</span>
                    <span>Required: {gap.requiredLevel}</span>
                    <span className="ms-auto">
                      Mentioned in {gap.frequency}% of similar jobs
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Recommended Learning Resources
                    </h4>
                    <div className="grid gap-2">
                      {gap.learningResources.map((resource, resourceIndex) => (
                        <div
                          key={resourceIndex}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {resource.title}
                            </div>
                            <div className="text-sm text-gray-600">
                              {resource.provider} • {resource.duration} • {resource.level}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(resource.url, '_blank')}
                            className="ms-2"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button className="flex-1">
          Create Learning Plan
        </Button>
        <Button variant="outline" className="flex-1">
          Save Analysis
        </Button>
        <Button variant="outline">
          Share with Mentor
        </Button>
      </div>
    </div>
  );
};

export default SkillsGapAnalysis;

