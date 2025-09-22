import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart3, 
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  Users,
  Calendar,
  Download,
  Filter,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  BookOpen,
  Star,
  Globe,
  Zap,
  Brain,
  Heart,
  Shield
} from 'lucide-react';

interface StudentPerformance {
  studentId: string;
  studentName: string;
  overallGrade: number;
  subjectGrades: { [subject: string]: number };
  attendanceRate: number;
  trend: 'improving' | 'declining' | 'stable';
  riskLevel: 'low' | 'medium' | 'high';
  lastAssessment: string;
}

interface ClassAnalytics {
  className: string;
  totalStudents: number;
  averageGrade: number;
  attendanceRate: number;
  passRate: number;
  topPerformers: number;
  atRiskStudents: number;
  subjectPerformance: { [subject: string]: number };
}

interface AssessmentAnalytics {
  assessmentId: string;
  assessmentName: string;
  subject: string;
  date: string;
  totalStudents: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passRate: number;
  difficulty: 'easy' | 'medium' | 'hard';
  reliability: number;
}

interface UAEBenchmark {
  subject: string;
  gradeLevel: number;
  nationalAverage: number;
  emirateAverage: number;
  schoolAverage: number;
  classAverage: number;
  percentileRank: number;
}

const PerformanceAnalytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedClass, setSelectedClass] = useState('5A');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('current_term');
  const [loading, setLoading] = useState(true);
  
  const [studentPerformance, setStudentPerformance] = useState<StudentPerformance[]>([]);
  const [classAnalytics, setClassAnalytics] = useState<ClassAnalytics | null>(null);
  const [assessmentAnalytics, setAssessmentAnalytics] = useState<AssessmentAnalytics[]>([]);
  const [uaeBenchmarks, setUaeBenchmarks] = useState<UAEBenchmark[]>([]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedClass, selectedSubject, selectedPeriod]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Mock data for demonstration - replace with actual API calls
      setStudentPerformance([
        {
          studentId: 'STU001',
          studentName: 'Ahmed Al Mansouri',
          overallGrade: 88.2,
          subjectGrades: {
            'Mathematics': 92,
            'Arabic': 85,
            'English': 87,
            'Science': 90,
            'Islamic Studies': 95
          },
          attendanceRate: 95.5,
          trend: 'improving',
          riskLevel: 'low',
          lastAssessment: '2025-09-18'
        },
        {
          studentId: 'STU002',
          studentName: 'Fatima Al Zahra',
          overallGrade: 91.5,
          subjectGrades: {
            'Mathematics': 94,
            'Arabic': 96,
            'English': 89,
            'Science': 88,
            'Islamic Studies': 98
          },
          attendanceRate: 92.8,
          trend: 'stable',
          riskLevel: 'low',
          lastAssessment: '2025-09-18'
        },
        {
          studentId: 'STU003',
          studentName: 'Omar Al Rashid',
          overallGrade: 76.8,
          subjectGrades: {
            'Mathematics': 72,
            'Arabic': 78,
            'English': 75,
            'Science': 80,
            'Islamic Studies': 79
          },
          attendanceRate: 89.2,
          trend: 'declining',
          riskLevel: 'medium',
          lastAssessment: '2025-09-17'
        }
      ]);

      setClassAnalytics({
        className: '5A',
        totalStudents: 25,
        averageGrade: 85.5,
        attendanceRate: 92.5,
        passRate: 88.0,
        topPerformers: 8,
        atRiskStudents: 3,
        subjectPerformance: {
          'Mathematics': 86.2,
          'Arabic': 89.1,
          'English': 83.7,
          'Science': 87.4,
          'Islamic Studies': 91.3
        }
      });

      setAssessmentAnalytics([
        {
          assessmentId: 'ASSESS001',
          assessmentName: 'Mathematics Mid-Term Exam',
          subject: 'Mathematics',
          date: '2025-09-15',
          totalStudents: 25,
          averageScore: 86.2,
          highestScore: 98,
          lowestScore: 65,
          passRate: 92.0,
          difficulty: 'medium',
          reliability: 0.85
        },
        {
          assessmentId: 'ASSESS002',
          assessmentName: 'Arabic Reading Comprehension',
          subject: 'Arabic',
          date: '2025-09-12',
          totalStudents: 25,
          averageScore: 89.1,
          highestScore: 100,
          lowestScore: 72,
          passRate: 96.0,
          difficulty: 'easy',
          reliability: 0.78
        }
      ]);

      setUaeBenchmarks([
        {
          subject: 'Mathematics',
          gradeLevel: 5,
          nationalAverage: 82.1,
          emirateAverage: 84.3,
          schoolAverage: 86.2,
          classAverage: 86.2,
          percentileRank: 68
        },
        {
          subject: 'Arabic',
          gradeLevel: 5,
          nationalAverage: 85.7,
          emirateAverage: 87.2,
          schoolAverage: 89.1,
          classAverage: 89.1,
          percentileRank: 72
        },
        {
          subject: 'English',
          gradeLevel: 5,
          nationalAverage: 79.4,
          emirateAverage: 81.8,
          schoolAverage: 83.7,
          classAverage: 83.7,
          percentileRank: 65
        }
      ]);

    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'stable': return <BarChart3 className="h-4 w-4 text-gray-600" />;
      default: return <BarChart3 className="h-4 w-4 text-gray-600" />;
    }
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'text-green-600 font-semibold';
    if (grade >= 80) return 'text-blue-600 font-semibold';
    if (grade >= 70) return 'text-yellow-600 font-semibold';
    return 'text-red-600 font-semibold';
  };

  const getPerformanceIcon = (score: number) => {
    if (score >= 90) return <Award className="h-4 w-4 text-yellow-500" />;
    if (score >= 80) return <Star className="h-4 w-4 text-blue-500" />;
    if (score >= 70) return <Target className="h-4 w-4 text-green-500" />;
    return <AlertCircle className="h-4 w-4 text-red-500" />;
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
          <h1 className="text-3xl font-bold text-gray-900">Performance Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive insights into student and class performance</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Advanced Filters
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5A">Class 5A</SelectItem>
                  <SelectItem value="5B">Class 5B</SelectItem>
                  <SelectItem value="5C">Class 5C</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Subject</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
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
              <label className="text-sm font-medium mb-2 block">Time Period</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current_term">Current Term</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="last_quarter">Last Quarter</SelectItem>
                  <SelectItem value="academic_year">Academic Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full">
                <BarChart3 className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Analytics */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Student Performance</TabsTrigger>
          <TabsTrigger value="assessments">Assessment Analysis</TabsTrigger>
          <TabsTrigger value="benchmarks">UAE Benchmarks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Class Average</p>
                    <p className="text-2xl font-bold text-blue-600">{classAnalytics?.averageGrade}%</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                    <p className="text-2xl font-bold text-green-600">{classAnalytics?.attendanceRate}%</p>
                  </div>
                  <Users className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pass Rate</p>
                    <p className="text-2xl font-bold text-purple-600">{classAnalytics?.passRate}%</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">At Risk Students</p>
                    <p className="text-2xl font-bold text-red-600">{classAnalytics?.atRiskStudents}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Subject Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                Subject Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {classAnalytics && Object.entries(classAnalytics.subjectPerformance).map(([subject, score]) => (
                  <div key={subject} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      {getPerformanceIcon(score)}
                      <span className="font-medium">{subject}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${score}%` }}
                        ></div>
                      </div>
                      <span className={`font-semibold ${getGradeColor(score)}`}>
                        {score}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {studentPerformance
                    .filter(student => student.overallGrade >= 90)
                    .slice(0, 3)
                    .map((student) => (
                    <div key={student.studentId} className="flex items-center justify-between">
                      <span className="font-medium">{student.studentName}</span>
                      <Badge className="bg-green-100 text-green-800">
                        {student.overallGrade}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
                  Students Needing Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {studentPerformance
                    .filter(student => student.riskLevel === 'medium' || student.riskLevel === 'high')
                    .slice(0, 3)
                    .map((student) => (
                    <div key={student.studentId} className="flex items-center justify-between">
                      <span className="font-medium">{student.studentName}</span>
                      <Badge className={getRiskLevelColor(student.riskLevel)}>
                        {student.riskLevel} risk
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Individual Student Performance
              </CardTitle>
              <CardDescription>
                Detailed performance analysis for each student in {selectedClass}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {studentPerformance.map((student) => (
                  <div key={student.studentId} className="p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-blue-600">
                            {student.studentName.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold">{student.studentName}</h3>
                          <p className="text-sm text-gray-600">ID: {student.studentId}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {getTrendIcon(student.trend)}
                        <Badge className={getRiskLevelColor(student.riskLevel)}>
                          {student.riskLevel} risk
                        </Badge>
                        <span className={`text-lg font-bold ${getGradeColor(student.overallGrade)}`}>
                          {student.overallGrade}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {Object.entries(student.subjectGrades).map(([subject, grade]) => (
                        <div key={subject} className="text-center p-2 rounded border">
                          <p className="text-xs text-gray-600 mb-1">{subject}</p>
                          <p className={`font-semibold ${getGradeColor(grade)}`}>{grade}%</p>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-between items-center mt-3 pt-3 border-t">
                      <span className="text-sm text-gray-600">
                        Attendance: {student.attendanceRate}%
                      </span>
                      <span className="text-sm text-gray-600">
                        Last Assessment: {student.lastAssessment}
                      </span>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Assessment Analysis
              </CardTitle>
              <CardDescription>
                Detailed analysis of recent assessments and their effectiveness
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assessmentAnalytics.map((assessment) => (
                  <div key={assessment.assessmentId} className="p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{assessment.assessmentName}</h3>
                        <p className="text-sm text-gray-600">
                          {assessment.subject} • {assessment.date} • {assessment.totalStudents} students
                        </p>
                      </div>
                      <Badge variant={assessment.difficulty === 'easy' ? 'default' : 
                                   assessment.difficulty === 'medium' ? 'secondary' : 'destructive'}>
                        {assessment.difficulty}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-3">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Average Score</p>
                        <p className={`text-xl font-bold ${getGradeColor(assessment.averageScore)}`}>
                          {assessment.averageScore}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Highest Score</p>
                        <p className="text-xl font-bold text-green-600">{assessment.highestScore}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Lowest Score</p>
                        <p className="text-xl font-bold text-red-600">{assessment.lowestScore}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Pass Rate</p>
                        <p className="text-xl font-bold text-blue-600">{assessment.passRate}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Reliability</p>
                        <p className="text-xl font-bold text-purple-600">{assessment.reliability}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-3 border-t">
                      <div className="flex space-x-4">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Export Results
                        </Button>
                      </div>
                      <div className="text-sm text-gray-600">
                        Assessment ID: {assessment.assessmentId}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="benchmarks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 mr-2" />
                UAE National Benchmarks
              </CardTitle>
              <CardDescription>
                Compare your class performance against UAE national and emirate averages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {uaeBenchmarks.map((benchmark) => (
                  <div key={benchmark.subject} className="p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-lg">{benchmark.subject} - Grade {benchmark.gradeLevel}</h3>
                      <Badge className="bg-blue-100 text-blue-800">
                        {benchmark.percentileRank}th Percentile
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Your Class Average</span>
                        <span className={`font-bold ${getGradeColor(benchmark.classAverage)}`}>
                          {benchmark.classAverage}%
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">School Average</span>
                        <span className="font-medium">{benchmark.schoolAverage}%</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Emirate Average</span>
                        <span className="font-medium">{benchmark.emirateAverage}%</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">UAE National Average</span>
                        <span className="font-medium">{benchmark.nationalAverage}%</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-3 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Performance vs National</span>
                        <div className="flex items-center space-x-2">
                          {benchmark.classAverage > benchmark.nationalAverage ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                          <span className={`font-medium ${
                            benchmark.classAverage > benchmark.nationalAverage ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {benchmark.classAverage > benchmark.nationalAverage ? '+' : ''}
                            {(benchmark.classAverage - benchmark.nationalAverage).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* UAE Ministry Notice */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>UAE Ministry of Education:</strong> Benchmark data is updated quarterly and reflects the latest national assessment results. 
              All data is anonymized and complies with UAE data protection standards.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceAnalytics;
