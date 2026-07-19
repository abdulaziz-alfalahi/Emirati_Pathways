
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, TrendingUp, AlertCircle } from 'lucide-react';

interface Skill {
  name: string;
  currentLevel: number;
  requiredLevel: number;
  category: 'technical' | 'soft' | 'leadership';
  priority: 'high' | 'medium' | 'low';
}

const SkillsGapAnalysis: React.FC = () => {
  const skills: Skill[] = [
    {
      name: 'React Development',
      currentLevel: 80,
      requiredLevel: 90,
      category: 'technical',
      priority: 'high'
    },
    {
      name: 'Team Leadership',
      currentLevel: 40,
      requiredLevel: 75,
      category: 'leadership',
      priority: 'high'
    },
    {
      name: 'System Architecture',
      currentLevel: 30,
      requiredLevel: 70,
      category: 'technical',
      priority: 'medium'
    },
    {
      name: 'Communication',
      currentLevel: 70,
      requiredLevel: 80,
      category: 'soft',
      priority: 'medium'
    },
    {
      name: 'Project Management',
      currentLevel: 50,
      requiredLevel: 85,
      category: 'leadership',
      priority: 'high'
    }
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technical': return 'bg-blue-100 text-blue-800';
      case 'soft': return 'bg-green-100 text-green-800';
      case 'leadership': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getGapSeverity = (current: number, required: number) => {
    const gap = required - current;
    if (gap <= 10) return 'low';
    if (gap <= 25) return 'medium';
    return 'high';
  };

  const priorityOrder = { high: 3, medium: 2, low: 1 };
  const sortedSkills = [...skills].sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Skills Gaps Identified</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {skills.filter(s => s.requiredLevel > s.currentLevel).length}
            </div>
            <p className="text-xs text-muted-foreground">Areas needing improvement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {skills.filter(s => s.priority === 'high').length}
            </div>
            <p className="text-xs text-muted-foreground">Critical skills to develop</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Learning Resources</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">12</div>
            <p className="text-xs text-muted-foreground">Recommended courses</p>
          </CardContent>
        </Card>
      </div>

      {/* Skills Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Skills Gap Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {sortedSkills.map((skill, index) => {
              const gap = skill.requiredLevel - skill.currentLevel;
              const gapSeverity = getGapSeverity(skill.currentLevel, skill.requiredLevel);
              
              return (
                <div key={index} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{skill.name}</h3>
                      <Badge variant="secondary" className={getCategoryColor(skill.category)}>
                        {skill.category}
                      </Badge>
                      <Badge variant="outline" className={getPriorityColor(skill.priority)}>
                        {skill.priority} priority
                      </Badge>
                    </div>
                    {gap > 0 && (
                      <span className={`text-sm font-medium ${
                        gapSeverity === 'high' ? 'text-red-600' :
                        gapSeverity === 'medium' ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        Gap: {gap}%
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Current Level</span>
                      <span>{skill.currentLevel}%</span>
                    </div>
                    <Progress value={skill.currentLevel} className="h-2" />
                    
                    <div className="flex justify-between text-sm">
                      <span>Required Level</span>
                      <span>{skill.requiredLevel}%</span>
                    </div>
                    <Progress value={skill.requiredLevel} className="h-2 opacity-50" />
                  </div>
                  
                  {gap > 0 && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <BookOpen className="h-4 w-4 me-1" />
                        Find Courses
                      </Button>
                      <Button size="sm" variant="outline">
                        Connect Mentor
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recommended Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Learning Path</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-900 mb-2">Immediate Focus (Next 3 months)</h4>
              <ul className="space-y-1 text-sm text-red-800">
                {skills
                  .filter(s => s.priority === 'high' && s.requiredLevel > s.currentLevel)
                  .map((skill, idx) => (
                    <li key={idx}>• {skill.name} - Bridge {skill.requiredLevel - skill.currentLevel}% gap</li>
                  ))}
              </ul>
            </div>
            
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-2">Medium Term (3-6 months)</h4>
              <ul className="space-y-1 text-sm text-yellow-800">
                {skills
                  .filter(s => s.priority === 'medium' && s.requiredLevel > s.currentLevel)
                  .map((skill, idx) => (
                    <li key={idx}>• {skill.name} - Develop from {skill.currentLevel}% to {skill.requiredLevel}%</li>
                  ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SkillsGapAnalysis;
