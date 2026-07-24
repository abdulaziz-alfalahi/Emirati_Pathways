import React, { useState, useEffect } from 'react';
import { restClient } from '@/utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BookOpen, 
  Calendar,
  Target,
  Award,
  Plus,
  Edit,
  Eye,
  Search,
  Filter,
  Download,
  Upload,
  Save,
  Copy,
  Share,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Presentation,
  Video,
  Globe,
  Star,
  Users,
  BarChart3,
  Bell
} from 'lucide-react';

interface UAEStandard {
  id: string;
  standardCode: string;
  subject: string;
  gradeLevel: number;
  strand: string;
  description: string;
  learningOutcome: string;
  skillsDeveloped: string[];
  ministryReference: string;
  isCoreStandard: boolean;
}

interface LessonPlan {
  id: string;
  title: string;
  subject: string;
  grade: string;
  duration: number;
  objectives: string[];
  standards: string[];
  materials: string[];
  activities: string[];
  assessment: string;
  homework: string;
  notes: string;
  status: 'draft' | 'approved' | 'published';
  createdAt: string;
  updatedAt: string;
}

interface CurriculumTemplate {
  id: string;
  name: string;
  subject: string;
  grade: string;
  description: string;
  totalLessons: number;
  estimatedWeeks: number;
  standards: string[];
  isPublic: boolean;
  rating: number;
  downloads: number;
  author: string;
}

const CurriculumPlanning: React.FC = () => {
  const [activeTab, setActiveTab] = useState('standards');
  const [uaeStandards, setUaeStandards] = useState<UAEStandard[]>([]);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [curriculumTemplates, setCurriculumTemplates] = useState<CurriculumTemplate[]>([]);
  const [selectedStandards, setSelectedStandards] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterGrade, setFilterGrade] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showCreateLesson, setShowCreateLesson] = useState(false);
  const [editingLesson, setEditingLesson] = useState<LessonPlan | null>(null);

  useEffect(() => {
    fetchUAEStandards();
    fetchLessonPlans();
    fetchCurriculumTemplates();
  }, []);

  const fetchUAEStandards = async () => {
    try {
      // restClient so cookie auth + CSRF work (was raw fetch + Bearer placeholder).
      const res = await restClient.get('/api/curriculum/standards');
      setUaeStandards(res.data?.standards || []);
    } catch (error) {
      console.error('Error fetching UAE standards:', error);
      // Honest empty state — do not substitute fabricated curriculum standards.
      setUaeStandards([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLessonPlans = async () => {
    try {
      // Mock data for demonstration
      setLessonPlans([
        {
          id: '1',
          title: 'Introduction to Fractions',
          subject: 'Mathematics',
          grade: '5',
          duration: 45,
          objectives: [
            'Understand what fractions represent',
            'Identify numerator and denominator',
            'Compare simple fractions'
          ],
          standards: ['UAE-MATH-G5-1.1'],
          materials: ['Fraction circles', 'Whiteboard', 'Student worksheets'],
          activities: [
            'Warm-up: Review whole numbers',
            'Introduction to fractions using visual aids',
            'Hands-on activity with fraction circles',
            'Practice exercises'
          ],
          assessment: 'Exit ticket with 3 fraction identification questions',
          homework: 'Worksheet pages 45-46',
          notes: 'Focus on visual representations for better understanding',
          status: 'published',
          createdAt: '2025-09-15',
          updatedAt: '2025-09-18'
        },
        {
          id: '2',
          title: 'أركان الإيمان الستة',
          subject: 'Islamic Studies',
          grade: '5',
          duration: 40,
          objectives: [
            'تعلم أركان الإيمان الستة',
            'فهم معنى كل ركن',
            'تطبيق الأركان في الحياة اليومية'
          ],
          standards: ['UAE-IS-G5-5.1'],
          materials: ['القرآن الكريم', 'السبورة', 'أوراق العمل'],
          activities: [
            'تلاوة آيات من القرآن',
            'شرح أركان الإيمان',
            'أنشطة تفاعلية',
            'مناقشة جماعية'
          ],
          assessment: 'اختبار شفهي لأركان الإيمان',
          homework: 'حفظ أركان الإيمان الستة',
          notes: 'التركيز على الفهم العملي للأركان',
          status: 'draft',
          createdAt: '2025-09-16',
          updatedAt: '2025-09-16'
        }
      ]);
    } catch (error) {
      console.error('Error fetching lesson plans:', error);
    }
  };

  const fetchCurriculumTemplates = async () => {
    try {
      // Mock data for demonstration
      setCurriculumTemplates([
        {
          id: '1',
          name: 'Grade 5 Mathematics - Complete Year',
          subject: 'Mathematics',
          grade: '5',
          description: 'Comprehensive mathematics curriculum covering all UAE standards for Grade 5',
          totalLessons: 120,
          estimatedWeeks: 36,
          standards: ['UAE-MATH-G5-1.1', 'UAE-MATH-G5-1.2', 'UAE-MATH-G5-2.1'],
          isPublic: true,
          rating: 4.8,
          downloads: 245,
          author: 'Ministry of Education'
        },
        {
          id: '2',
          name: 'منهج اللغة العربية - الصف الخامس',
          subject: 'Arabic',
          grade: '5',
          description: 'منهج شامل للغة العربية يغطي جميع المعايير الإماراتية للصف الخامس',
          totalLessons: 100,
          estimatedWeeks: 32,
          standards: ['UAE-AR-G5-4.1', 'UAE-AR-G5-4.2', 'UAE-AR-G5-3.1'],
          isPublic: true,
          rating: 4.9,
          downloads: 189,
          author: 'وزارة التربية والتعليم'
        }
      ]);
    } catch (error) {
      console.error('Error fetching curriculum templates:', error);
    }
  };

  const filteredStandards = uaeStandards.filter(standard => {
    const matchesSearch = standard.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         standard.standardCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         standard.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = filterSubject === 'all' || standard.subject === filterSubject;
    const matchesGrade = filterGrade === 'all' || standard.gradeLevel.toString() === filterGrade;
    
    return matchesSearch && matchesSubject && matchesGrade;
  });

  const filteredLessonPlans = lessonPlans.filter(lesson => {
    const matchesSearch = lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lesson.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = filterSubject === 'all' || lesson.subject === filterSubject;
    const matchesGrade = filterGrade === 'all' || lesson.grade === filterGrade;
    
    return matchesSearch && matchesSubject && matchesGrade;
  });

  const filteredTemplates = curriculumTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = filterSubject === 'all' || template.subject === filterSubject;
    const matchesGrade = filterGrade === 'all' || template.grade === filterGrade;
    
    return matchesSearch && matchesSubject && matchesGrade;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSubjectIcon = (subject: string) => {
    switch (subject.toLowerCase()) {
      case 'mathematics': return <BarChart3 className="h-4 w-4" />;
      case 'arabic': return <Globe className="h-4 w-4" />;
      case 'english': return <BookOpen className="h-4 w-4" />;
      case 'science': return <Target className="h-4 w-4" />;
      case 'islamic studies': return <Star className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Curriculum Planning</h1>
          <p className="text-gray-600 mt-1">Plan lessons aligned with UAE educational standards</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 me-2" />
            Export Plans
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 me-2" />
            Import Template
          </Button>
          <Button onClick={() => setShowCreateLesson(true)}>
            <Plus className="h-4 w-4 me-2" />
            Create Lesson
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute start-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search curriculum content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="ps-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="Arabic">Arabic</SelectItem>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Science">Science</SelectItem>
                  <SelectItem value="Islamic Studies">Islamic Studies</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="grade">Grade</Label>
              <Select value={filterGrade} onValueChange={setFilterGrade}>
                <SelectTrigger>
                  <SelectValue placeholder="All Grades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  <SelectItem value="1">Grade 1</SelectItem>
                  <SelectItem value="2">Grade 2</SelectItem>
                  <SelectItem value="3">Grade 3</SelectItem>
                  <SelectItem value="4">Grade 4</SelectItem>
                  <SelectItem value="5">Grade 5</SelectItem>
                  <SelectItem value="6">Grade 6</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="standards">UAE Standards</TabsTrigger>
          <TabsTrigger value="lessons">Lesson Plans</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="calendar">Pacing Guide</TabsTrigger>
        </TabsList>

        <TabsContent value="standards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 me-2" />
                UAE Educational Standards ({filteredStandards.length})
              </CardTitle>
              <CardDescription>
                Browse and select standards aligned with UAE Ministry of Education curriculum
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredStandards.map((standard) => (
                  <div key={standard.id} className="p-4 rounded-lg border">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {getSubjectIcon(standard.subject)}
                          <Badge variant="outline">{standard.standardCode}</Badge>
                          <Badge variant="secondary">{standard.subject}</Badge>
                          <Badge variant="outline">Grade {standard.gradeLevel}</Badge>
                          {standard.isCoreStandard && (
                            <Badge className="bg-red-100 text-red-800">Core Standard</Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">{standard.strand}</h3>
                        <p className="text-gray-700 mb-2">{standard.description}</p>
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Learning Outcome:</strong> {standard.learningOutcome}
                        </p>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {standard.skillsDeveloped.map((skill, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500">{standard.ministryReference}</p>
                      </div>
                      <div className="ms-4">
                        <Button
                          variant={selectedStandards.includes(standard.id) ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            if (selectedStandards.includes(standard.id)) {
                              setSelectedStandards(selectedStandards.filter(id => id !== standard.id));
                            } else {
                              setSelectedStandards([...selectedStandards, standard.id]);
                            }
                          }}
                        >
                          {selectedStandards.includes(standard.id) ? (
                            <CheckCircle className="h-4 w-4 me-2" />
                          ) : (
                            <Plus className="h-4 w-4 me-2" />
                          )}
                          {selectedStandards.includes(standard.id) ? 'Selected' : 'Select'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lessons" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="h-5 w-5 me-2" />
                Lesson Plans ({filteredLessonPlans.length})
              </CardTitle>
              <CardDescription>
                Create and manage detailed lesson plans aligned with UAE standards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLessonPlans.map((lesson) => (
                  <Card key={lesson.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          {getSubjectIcon(lesson.subject)}
                          <Badge className={getStatusColor(lesson.status)}>
                            {lesson.status}
                          </Badge>
                        </div>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardTitle className="text-lg">{lesson.title}</CardTitle>
                      <CardDescription>
                        {lesson.subject} • Grade {lesson.grade} • {lesson.duration} min
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-sm font-medium mb-1">Objectives</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {lesson.objectives.slice(0, 2).map((objective, index) => (
                              <li key={index} className="flex items-start">
                                <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 me-2 flex-shrink-0"></span>
                                {objective}
                              </li>
                            ))}
                            {lesson.objectives.length > 2 && (
                              <li className="text-xs text-gray-500">
                                +{lesson.objectives.length - 2} more objectives
                              </li>
                            )}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium mb-1">Standards</h4>
                          <div className="flex flex-wrap gap-1">
                            {lesson.standards.map((standard, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {standard}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-between text-xs text-gray-500 pt-2 border-t">
                          <span>Updated: {lesson.updatedAt}</span>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm">
                              <Share className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 me-2" />
                Curriculum Templates ({filteredTemplates.length})
              </CardTitle>
              <CardDescription>
                Pre-built curriculum templates approved by UAE Ministry of Education
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredTemplates.map((template) => (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          {getSubjectIcon(template.subject)}
                          <Badge variant="secondary">{template.subject}</Badge>
                          <Badge variant="outline">Grade {template.grade}</Badge>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="text-sm font-medium">{template.rating}</span>
                        </div>
                      </div>
                      <CardTitle className="text-xl">{template.name}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Total Lessons:</span>
                            <p className="font-medium">{template.totalLessons}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Duration:</span>
                            <p className="font-medium">{template.estimatedWeeks} weeks</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Downloads:</span>
                            <p className="font-medium">{template.downloads}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Author:</span>
                            <p className="font-medium">{template.author}</p>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium mb-2">Covered Standards</h4>
                          <div className="flex flex-wrap gap-1">
                            {template.standards.slice(0, 3).map((standard, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {standard}
                              </Badge>
                            ))}
                            {template.standards.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{template.standards.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex space-x-2 pt-2">
                          <Button className="flex-1">
                            <Download className="h-4 w-4 me-2" />
                            Use Template
                          </Button>
                          <Button variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 me-2" />
                Pacing Guide & Calendar
              </CardTitle>
              <CardDescription>
                Plan your curriculum timeline and track progress throughout the academic year
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Pacing Guide Coming Soon</h3>
                <p className="text-gray-600 mb-4">
                  Interactive calendar and pacing guide features are being developed to help you plan your curriculum timeline.
                </p>
                <Button variant="outline">
                  <Bell className="h-4 w-4 me-2" />
                  Notify Me When Available
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* UAE Ministry Notice */}
      <Alert>
        <Globe className="h-4 w-4" />
        <AlertDescription>
          <strong>UAE Ministry of Education:</strong> All curriculum content is aligned with the latest UAE educational standards and cultural values. 
          <Button variant="link" className="p-0 h-auto ms-2">
            Learn More
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default CurriculumPlanning;
