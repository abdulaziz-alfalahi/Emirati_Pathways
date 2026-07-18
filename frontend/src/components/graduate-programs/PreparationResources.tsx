
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, Brain, Users, MessageCircle, Play, Download, 
  CheckCircle, Clock, Target, Award, FileText 
} from 'lucide-react';

export const PreparationResources: React.FC = () => {
  const [activeTab, setActiveTab] = useState('assessment');

  const assessmentResources = [
    {
      id: 1,
      title: 'Numerical Reasoning Tests',
      type: 'Practice Tests',
      description: 'Master numerical analysis and data interpretation skills',
      duration: '45 minutes',
      difficulty: 'Intermediate',
      completed: false,
      questions: 25,
      topics: ['Data Analysis', 'Charts & Graphs', 'Percentages', 'Ratios']
    },
    {
      id: 2,
      title: 'Verbal Reasoning Assessment',
      type: 'Practice Tests',
      description: 'Improve comprehension and critical thinking abilities',
      duration: '30 minutes',
      difficulty: 'Intermediate',
      completed: true,
      questions: 20,
      topics: ['Reading Comprehension', 'Critical Analysis', 'Logic', 'Arguments']
    },
    {
      id: 3,
      title: 'Situational Judgment Tests',
      type: 'Practice Tests',
      description: 'Develop workplace scenario response skills',
      duration: '35 minutes',
      difficulty: 'Advanced',
      completed: false,
      questions: 15,
      topics: ['Leadership', 'Team Dynamics', 'Problem Solving', 'Ethics']
    }
  ];

  const interviewResources = [
    {
      id: 1,
      title: 'Competency-Based Interview Guide',
      type: 'Guide',
      description: 'Master the STAR method for behavioral questions',
      downloadable: true,
      videoAvailable: false
    },
    {
      id: 2,
      title: 'Common Graduate Program Questions',
      type: 'Question Bank',
      description: '100+ frequently asked questions with sample answers',
      downloadable: true,
      videoAvailable: true
    },
    {
      id: 3,
      title: 'Industry-Specific Interview Prep',
      type: 'Specialized',
      description: 'Tailored preparation for different sectors',
      downloadable: false,
      videoAvailable: true
    }
  ];

  const groupExercises = [
    {
      id: 1,
      title: 'Case Study Analysis',
      description: 'Collaborative problem-solving exercises',
      participants: '4-6 people',
      duration: '60 minutes',
      skills: ['Analysis', 'Teamwork', 'Presentation', 'Leadership']
    },
    {
      id: 2,
      title: 'Business Simulation',
      description: 'Strategic decision-making scenarios',
      participants: '6-8 people',
      duration: '90 minutes',
      skills: ['Strategy', 'Communication', 'Decision Making', 'Collaboration']
    }
  ];

  const presentationTips = [
    {
      topic: 'Structure & Content',
      tips: ['Clear introduction and conclusion', 'Logical flow of ideas', 'Evidence-based arguments', 'Engaging storytelling']
    },
    {
      topic: 'Delivery Skills',
      tips: ['Confident body language', 'Eye contact with audience', 'Clear articulation', 'Appropriate pace']
    },
    {
      topic: 'Visual Aids',
      tips: ['Clean slide design', 'Minimal text per slide', 'Relevant graphics', 'Professional formatting']
    }
  ];

  return (
    <div className="space-y-6">
      {/* Resource Categories */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button 
          variant={activeTab === 'assessment' ? 'default' : 'outline'}
          onClick={() => setActiveTab('assessment')}
          className={activeTab === 'assessment' ? 'bg-ehrdc-teal hover:bg-ehrdc-teal/90' : ''}
        >
          <Brain className="h-4 w-4 me-2" />
          Assessment Center
        </Button>
        <Button 
          variant={activeTab === 'interview' ? 'default' : 'outline'}
          onClick={() => setActiveTab('interview')}
          className={activeTab === 'interview' ? 'bg-ehrdc-teal hover:bg-ehrdc-teal/90' : ''}
        >
          <MessageCircle className="h-4 w-4 me-2" />
          Interview Prep
        </Button>
        <Button 
          variant={activeTab === 'group' ? 'default' : 'outline'}
          onClick={() => setActiveTab('group')}
          className={activeTab === 'group' ? 'bg-ehrdc-teal hover:bg-ehrdc-teal/90' : ''}
        >
          <Users className="h-4 w-4 me-2" />
          Group Exercises
        </Button>
        <Button 
          variant={activeTab === 'presentation' ? 'default' : 'outline'}
          onClick={() => setActiveTab('presentation')}
          className={activeTab === 'presentation' ? 'bg-ehrdc-teal hover:bg-ehrdc-teal/90' : ''}
        >
          <FileText className="h-4 w-4 me-2" />
          Presentations
        </Button>
      </div>

      {/* Assessment Center Resources */}
      {activeTab === 'assessment' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-ehrdc-teal">Psychometric Test Preparation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold mb-2">Your Progress</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Tests Completed</span>
                    <span>1/3</span>
                  </div>
                  <Progress value={33} className="h-2" />
                </div>
              </div>
              
              <div className="space-y-4">
                {assessmentResources.map((resource) => (
                  <Card key={resource.id} className="border-s-4 border-s-ehrdc-teal">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold">{resource.title}</h4>
                          <Badge variant="outline" className="mb-2">{resource.type}</Badge>
                          <p className="text-sm text-gray-600">{resource.description}</p>
                        </div>
                        {resource.completed && (
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-gray-500" />
                          {resource.duration}
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="h-4 w-4 text-gray-500" />
                          {resource.questions} questions
                        </div>
                        <div className="flex items-center gap-1">
                          <Award className="h-4 w-4 text-gray-500" />
                          {resource.difficulty}
                        </div>
                        <div>
                          <Badge variant="outline" className="text-xs">
                            {resource.completed ? 'Completed' : 'Available'}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <span className="text-sm font-medium">Topics covered:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {resource.topics.map((topic, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <Button 
                        className={resource.completed ? 'bg-green-600 hover:bg-green-700' : 'bg-ehrdc-teal hover:bg-ehrdc-teal/90'}
                        size="sm"
                      >
                        {resource.completed ? 'Retake Test' : 'Start Test'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Interview Preparation */}
      {activeTab === 'interview' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-ehrdc-teal">Interview Preparation Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {interviewResources.map((resource) => (
                  <Card key={resource.id} className="border-s-4 border-s-blue-500">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold">{resource.title}</h4>
                          <Badge variant="outline" className="mb-2">{resource.type}</Badge>
                          <p className="text-sm text-gray-600">{resource.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        {resource.downloadable && (
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 me-1" />
                            Download
                          </Button>
                        )}
                        {resource.videoAvailable && (
                          <Button variant="outline" size="sm">
                            <Play className="h-4 w-4 me-1" />
                            Watch Video
                          </Button>
                        )}
                        <Button className="bg-ehrdc-teal hover:bg-ehrdc-teal/90" size="sm">
                          <BookOpen className="h-4 w-4 me-1" />
                          Access Resource
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Group Exercise Preparation */}
      {activeTab === 'group' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-ehrdc-teal">Group Exercise Preparation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {groupExercises.map((exercise) => (
                  <Card key={exercise.id} className="border-s-4 border-s-purple-500">
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2">{exercise.title}</h4>
                      <p className="text-sm text-gray-600 mb-3">{exercise.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <span className="text-sm font-medium">Participants:</span>
                          <p className="text-sm text-gray-600">{exercise.participants}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium">Duration:</span>
                          <p className="text-sm text-gray-600">{exercise.duration}</p>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <span className="text-sm font-medium">Skills assessed:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {exercise.skills.map((skill, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <Button className="bg-ehrdc-teal hover:bg-ehrdc-teal/90" size="sm">
                        Practice Exercise
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Presentation Tips */}
      {activeTab === 'presentation' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-ehrdc-teal">Presentation Skills Guide</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {presentationTips.map((section, index) => (
                  <div key={index}>
                    <h4 className="font-semibold mb-3 text-lg">{section.topic}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {section.tips.map((tip, tipIndex) => (
                        <div key={tipIndex} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 text-center">
                <Button className="bg-ehrdc-teal hover:bg-ehrdc-teal/90">
                  <Play className="h-4 w-4 me-2" />
                  Watch Presentation Tutorial
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
