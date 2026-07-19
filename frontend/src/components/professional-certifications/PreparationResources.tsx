
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Video, Users, FileText, Play, Download, Clock } from 'lucide-react';

export const PreparationResources: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const studyGuides = [
    {
      id: '1',
      title: 'AWS Solutions Architect Complete Study Guide',
      certification: 'AWS Solutions Architect - Associate',
      type: 'PDF Guide',
      pages: 850,
      rating: 4.8,
      price: 'Free',
      downloadCount: 15420,
      lastUpdated: '2024-01-15'
    },
    {
      id: '2',
      title: 'PMP Exam Prep Comprehensive Guide',
      certification: 'Project Management Professional',
      type: 'Interactive Guide',
      pages: 650,
      rating: 4.7,
      price: 'AED 150',
      downloadCount: 8950,
      lastUpdated: '2024-02-01'
    }
  ];

  const practiceExams = [
    {
      id: '1',
      title: 'AWS SAA-C03 Practice Test',
      certification: 'AWS Solutions Architect - Associate',
      questions: 65,
      duration: '130 minutes',
      passRate: 78,
      attempts: 2450,
      price: 'AED 50',
      difficulty: 'Intermediate'
    },
    {
      id: '2',
      title: 'CFA Level 1 Mock Exam',
      certification: 'CFA Level 1',
      questions: 180,
      duration: '6 hours',
      passRate: 65,
      attempts: 890,
      price: 'AED 200',
      difficulty: 'Advanced'
    }
  ];

  const trainingCourses = [
    {
      id: '1',
      title: 'AWS Solutions Architect Masterclass',
      provider: 'TechSkills UAE',
      format: 'Online',
      duration: '40 hours',
      price: 'AED 1,200',
      rating: 4.9,
      students: 3250,
      instructor: 'Ahmed Al-Mansouri',
      nextSession: '2024-03-15'
    },
    {
      id: '2',
      title: 'PMP Certification Bootcamp',
      provider: 'Dubai Management Institute',
      format: 'In-Person',
      duration: '5 days',
      price: 'AED 2,500',
      rating: 4.8,
      students: 890,
      instructor: 'Sarah Johnson',
      nextSession: '2024-03-20'
    }
  ];

  const studyGroups = [
    {
      id: '1',
      name: 'AWS Solutions Architects Dubai',
      certification: 'AWS Solutions Architect',
      members: 245,
      activity: 'Very Active',
      location: 'Dubai',
      nextMeeting: '2024-03-10',
      description: 'Weekly study sessions and exam prep discussions'
    },
    {
      id: '2',
      name: 'CFA Level 1 Study Group',
      certification: 'CFA Level 1',
      members: 89,
      activity: 'Active',
      location: 'Abu Dhabi',
      nextMeeting: '2024-03-12',
      description: 'Intensive study sessions for June exam'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Preparation Resources</h2>
          <p className="text-muted-foreground">Comprehensive study materials to help you succeed</p>
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <Input
              placeholder="Search resources by certification or topic..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button>Search</Button>
          </div>
        </CardContent>
      </Card>

      {/* Resources Tabs */}
      <Tabs defaultValue="guides" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="guides" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Study Guides
          </TabsTrigger>
          <TabsTrigger value="practice" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Practice Exams
          </TabsTrigger>
          <TabsTrigger value="courses" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Training Courses
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Study Groups
          </TabsTrigger>
        </TabsList>

        <TabsContent value="guides" className="space-y-4">
          {studyGuides.map((guide) => (
            <Card key={guide.id}>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{guide.title}</h3>
                    <p className="text-muted-foreground mb-3">{guide.certification}</p>
                    
                    <div className="grid md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Type:</span>
                        <div className="text-muted-foreground">{guide.type}</div>
                      </div>
                      <div>
                        <span className="font-medium">Pages:</span>
                        <div className="text-muted-foreground">{guide.pages}</div>
                      </div>
                      <div>
                        <span className="font-medium">Downloads:</span>
                        <div className="text-muted-foreground">{guide.downloadCount.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="font-medium">Updated:</span>
                        <div className="text-muted-foreground">{guide.lastUpdated}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{guide.rating} ⭐</Badge>
                      <Badge className="bg-green-100 text-green-800">{guide.price}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <BookOpen className="h-4 w-4 me-2" />
                        Preview
                      </Button>
                      <Button size="sm" className="bg-slate-800 hover:bg-slate-700">
                        <Download className="h-4 w-4 me-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="practice" className="space-y-4">
          {practiceExams.map((exam) => (
            <Card key={exam.id}>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{exam.title}</h3>
                    <p className="text-muted-foreground mb-3">{exam.certification}</p>
                    
                    <div className="grid md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Questions:</span>
                        <div className="text-muted-foreground">{exam.questions}</div>
                      </div>
                      <div>
                        <span className="font-medium">Duration:</span>
                        <div className="text-muted-foreground">{exam.duration}</div>
                      </div>
                      <div>
                        <span className="font-medium">Pass Rate:</span>
                        <div className="text-muted-foreground">{exam.passRate}%</div>
                      </div>
                      <div>
                        <span className="font-medium">Attempts:</span>
                        <div className="text-muted-foreground">{exam.attempts.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{exam.difficulty}</Badge>
                      <Badge className="bg-blue-100 text-blue-800">{exam.price}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                      <Button size="sm" className="bg-slate-800 hover:bg-slate-700">
                        <Play className="h-4 w-4 me-2" />
                        Start Exam
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="courses" className="space-y-4">
          {trainingCourses.map((course) => (
            <Card key={course.id}>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{course.title}</h3>
                    <p className="text-muted-foreground mb-3">{course.provider}</p>
                    
                    <div className="grid md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Format:</span>
                        <div className="text-muted-foreground">{course.format}</div>
                      </div>
                      <div>
                        <span className="font-medium">Duration:</span>
                        <div className="text-muted-foreground">{course.duration}</div>
                      </div>
                      <div>
                        <span className="font-medium">Students:</span>
                        <div className="text-muted-foreground">{course.students.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="font-medium">Next Session:</span>
                        <div className="text-muted-foreground">{course.nextSession}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{course.rating} ⭐</Badge>
                      <Badge className="bg-blue-100 text-blue-800">{course.price}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        Course Details
                      </Button>
                      <Button size="sm" className="bg-slate-800 hover:bg-slate-700">
                        Enroll Now
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="groups" className="space-y-4">
          {studyGroups.map((group) => (
            <Card key={group.id}>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{group.name}</h3>
                    <p className="text-muted-foreground mb-3">{group.description}</p>
                    
                    <div className="grid md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Members:</span>
                        <div className="text-muted-foreground">{group.members}</div>
                      </div>
                      <div>
                        <span className="font-medium">Activity:</span>
                        <div className="text-muted-foreground">{group.activity}</div>
                      </div>
                      <div>
                        <span className="font-medium">Location:</span>
                        <div className="text-muted-foreground">{group.location}</div>
                      </div>
                      <div>
                        <span className="font-medium">Next Meeting:</span>
                        <div className="text-muted-foreground">{group.nextMeeting}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button variant="outline">
                      View Group
                    </Button>
                    <Button className="bg-slate-800 hover:bg-slate-700">
                      <Users className="h-4 w-4 me-2" />
                      Join Group
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};
