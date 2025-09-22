
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  MapPin, 
  CheckCircle, 
  Circle, 
  ArrowRight, 
  Target,
  BookOpen,
  Users,
  Award,
  Briefcase
} from 'lucide-react';

interface CareerStage {
  id: string;
  title: string;
  description: string;
  category: 'education' | 'career' | 'personal';
  ageRange: string;
  completed: boolean;
  current: boolean;
  recommended: boolean;
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

const CareerJourneyVisualization: React.FC = () => {
  const [selectedPath, setSelectedPath] = useState<string>('tech');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Mock data for demonstration
  const careerPaths: CareerPath[] = [
    {
      id: 'tech',
      title: 'Technology & Innovation',
      industry: 'Technology',
      totalProgress: 35,
      stages: [
        {
          id: '1',
          title: 'High School Graduation',
          description: 'Complete secondary education with focus on STEM subjects',
          category: 'education',
          ageRange: '17-18',
          completed: true,
          current: false,
          recommended: false,
          requirements: ['Mathematics', 'Science', 'English'],
          duration: '3 years'
        },
        {
          id: '2',
          title: 'University Degree',
          description: 'Bachelor\'s in Computer Science or related field',
          category: 'education',
          ageRange: '18-22',
          completed: true,
          current: false,
          recommended: false,
          requirements: ['High school diploma', 'IELTS/TOEFL', 'SAT scores'],
          duration: '4 years'
        },
        {
          id: '3',
          title: 'Junior Developer',
          description: 'Entry-level programming position',
          category: 'career',
          ageRange: '22-25',
          completed: false,
          current: true,
          recommended: false,
          requirements: ['Programming skills', 'Portfolio projects', 'Internship experience'],
          benefits: ['Hands-on experience', 'Industry networking', 'Skill development'],
          duration: '2-3 years'
        },
        {
          id: '4',
          title: 'Senior Developer',
          description: 'Advanced programming and team leadership',
          category: 'career',
          ageRange: '25-30',
          completed: false,
          current: false,
          recommended: true,
          requirements: ['3+ years experience', 'Technical leadership', 'Mentoring skills'],
          benefits: ['Higher salary', 'Project leadership', 'Team management'],
          duration: '3-5 years'
        }
      ]
    },
    {
      id: 'healthcare',
      title: 'Healthcare & Life Sciences',
      industry: 'Healthcare',
      totalProgress: 60,
      stages: [
        {
          id: '1',
          title: 'Pre-Med Studies',
          description: 'Bachelor\'s degree with medical prerequisites',
          category: 'education',
          ageRange: '18-22',
          completed: true,
          current: false,
          recommended: false,
          duration: '4 years'
        },
        {
          id: '2',
          title: 'Medical School',
          description: 'Doctor of Medicine (MD) degree',
          category: 'education',
          ageRange: '22-26',
          completed: true,
          current: false,
          recommended: false,
          duration: '4 years'
        },
        {
          id: '3',
          title: 'Residency Training',
          description: 'Specialized medical training',
          category: 'career',
          ageRange: '26-29',
          completed: false,
          current: true,
          recommended: false,
          requirements: ['MD degree', 'Medical licensing exam', 'Hospital placement'],
          duration: '3-7 years'
        }
      ]
    }
  ];

  const currentPath = careerPaths.find(path => path.id === selectedPath) || careerPaths[0];
  
  const filteredStages = currentPath.stages.filter(stage => 
    selectedCategory === 'all' || stage.category === selectedCategory
  );

  const getStageIcon = (stage: CareerStage) => {
    if (stage.category === 'education') return BookOpen;
    if (stage.category === 'career') return Briefcase;
    return Target;
  };

  const getStageStatus = (stage: CareerStage) => {
    if (stage.completed) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (stage.current) return <Circle className="h-4 w-4 text-blue-600 fill-current" />;
    return <Circle className="h-4 w-4 text-gray-400" />;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'education': return 'bg-blue-100 text-blue-800';
      case 'career': return 'bg-green-100 text-green-800';
      case 'personal': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Path Selection */}
      <div className="flex flex-wrap gap-2">
        {careerPaths.map(path => (
          <Button
            key={path.id}
            variant={selectedPath === path.id ? "default" : "outline"}
            onClick={() => setSelectedPath(path.id)}
            className="flex items-center gap-2"
          >
            <MapPin className="h-4 w-4" />
            {path.title}
          </Button>
        ))}
      </div>

      {/* Category Filter */}
      <div className="flex gap-2">
        <Button
          variant={selectedCategory === 'all' ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory('all')}
        >
          All Stages
        </Button>
        <Button
          variant={selectedCategory === 'education' ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory('education')}
        >
          <BookOpen className="h-4 w-4 mr-1" />
          Education
        </Button>
        <Button
          variant={selectedCategory === 'career' ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory('career')}
        >
          <Briefcase className="h-4 w-4 mr-1" />
          Career
        </Button>
        <Button
          variant={selectedCategory === 'personal' ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory('personal')}
        >
          <Target className="h-4 w-4 mr-1" />
          Personal
        </Button>
      </div>

      {/* Career Path Overview */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold">{currentPath.title}</h3>
              <p className="text-muted-foreground">{currentPath.industry} Industry</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground mb-1">Overall Progress</div>
              <div className="flex items-center gap-2">
                <Progress value={currentPath.totalProgress} className="w-32" />
                <span className="text-sm font-medium">{currentPath.totalProgress}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Career Stages Timeline */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-8">
            {filteredStages.map((stage, index) => {
              const StageIcon = getStageIcon(stage);
              const isLast = index === filteredStages.length - 1;
              
              return (
                <div key={stage.id} className="relative">
                  {!isLast && (
                    <div className="absolute left-6 top-12 h-16 w-0.5 bg-gray-200" />
                  )}
                  
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-gray-200 bg-white">
                        <StageIcon className={`h-6 w-6 ${
                          stage.completed ? 'text-green-600' : 
                          stage.current ? 'text-blue-600' : 
                          stage.recommended ? 'text-orange-600' : 'text-gray-400'
                        }`} />
                      </div>
                      {getStageStatus(stage)}
                    </div>
                    
                    <div className="flex-1 pb-8">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{stage.title}</h3>
                            <Badge variant="secondary" className={getCategoryColor(stage.category)}>
                              {stage.category}
                            </Badge>
                            {stage.current && (
                              <Badge variant="default">Current</Badge>
                            )}
                            {stage.recommended && (
                              <Badge variant="outline" className="border-orange-500 text-orange-600">
                                Recommended
                              </Badge>
                            )}
                          </div>
                          <p className="text-muted-foreground mb-2">{stage.description}</p>
                          <div className="flex gap-4 text-sm text-muted-foreground">
                            <span>Age: {stage.ageRange}</span>
                            {stage.duration && <span>Duration: {stage.duration}</span>}
                          </div>
                        </div>
                      </div>
                      
                      {(stage.requirements || stage.benefits) && (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {stage.requirements && (
                            <div>
                              <h4 className="text-sm font-medium mb-2">Requirements</h4>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                {stage.requirements.map((req, idx) => (
                                  <li key={idx} className="flex items-center gap-2">
                                    <div className="h-1 w-1 bg-gray-400 rounded-full" />
                                    {req}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {stage.benefits && (
                            <div>
                              <h4 className="text-sm font-medium mb-2">Benefits</h4>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                {stage.benefits.map((benefit, idx) => (
                                  <li key={idx} className="flex items-center gap-2">
                                    <div className="h-1 w-1 bg-green-500 rounded-full" />
                                    {benefit}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {stage.recommended && (
                        <div className="mt-4">
                          <Button size="sm" className="flex items-center gap-2">
                            Start Planning
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CareerJourneyVisualization;
