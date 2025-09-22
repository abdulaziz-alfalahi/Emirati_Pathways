import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  Users, 
  ClipboardCheck, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Award,
  Target,
  BookOpen,
  Settings
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface DashboardStats {
  totalAssessments: number;
  scheduledAssessments: number;
  inProgressAssessments: number;
  completedAssessments: number;
  averageScore: number;
  qualityRating: number;
  reliabilityScore: number;
  biasScore: number;
}

interface UpcomingAssessment {
  id: number;
  candidateName: string;
  assessmentTitle: string;
  scheduledDate: string;
  competencyType: string;
  status: string;
}

interface QualityMetric {
  metricType: string;
  value: number;
  benchmark: number;
  flag: string;
  trend: 'up' | 'down' | 'stable';
}

const AssessorDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [upcomingAssessments, setUpcomingAssessments] = useState<UpcomingAssessment[]>([]);
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');

  // Sample data for demonstration
  const performanceData = [
    { month: 'Jan', assessments: 12, avgScore: 78, reliability: 0.85 },
    { month: 'Feb', assessments: 15, avgScore: 82, reliability: 0.87 },
    { month: 'Mar', assessments: 18, avgScore: 79, reliability: 0.89 },
    { month: 'Apr', assessments: 14, avgScore: 85, reliability: 0.91 },
    { month: 'May', assessments: 20, avgScore: 83, reliability: 0.88 },
    { month: 'Jun', assessments: 16, avgScore: 87, reliability: 0.92 }
  ];

  const competencyDistribution = [
    { name: 'Technical', value: 45, color: '#0088FE' },
    { name: 'Behavioral', value: 30, color: '#00C49F' },
    { name: 'Cognitive', value: 15, color: '#FFBB28' },
    { name: 'Leadership', value: 10, color: '#FF8042' }
  ];

  const qualityTrends = [
    { metric: 'Reliability', current: 0.89, target: 0.85, status: 'excellent' },
    { metric: 'Consistency', current: 0.82, target: 0.80, status: 'good' },
    { metric: 'Fairness', current: 0.94, target: 0.90, status: 'excellent' },
    { metric: 'Bias Score', current: 0.08, target: 0.05, status: 'needs_improvement' }
  ];

  useEffect(() => {
    fetchDashboardData();
  }, [selectedTimeframe]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStats({
        totalAssessments: 95,
        scheduledAssessments: 8,
        inProgressAssessments: 3,
        completedAssessments: 84,
        averageScore: 83.2,
        qualityRating: 4.6,
        reliabilityScore: 0.89,
        biasScore: 0.08
      });

      setUpcomingAssessments([
        {
          id: 1,
          candidateName: 'Ahmed Al Mansouri',
          assessmentTitle: 'Senior Software Engineer Assessment',
          scheduledDate: '2025-09-22T10:00:00Z',
          competencyType: 'Technical',
          status: 'scheduled'
        },
        {
          id: 2,
          candidateName: 'Fatima Al Zahra',
          assessmentTitle: 'Project Management Competency',
          scheduledDate: '2025-09-23T14:00:00Z',
          competencyType: 'Leadership',
          status: 'confirmed'
        },
        {
          id: 3,
          candidateName: 'Omar Hassan',
          assessmentTitle: 'Financial Analysis Skills',
          scheduledDate: '2025-09-24T09:30:00Z',
          competencyType: 'Technical',
          status: 'scheduled'
        }
      ]);

      setQualityMetrics([
        { metricType: 'Inter-rater Reliability', value: 0.89, benchmark: 0.85, flag: 'excellent', trend: 'up' },
        { metricType: 'Assessment Consistency', value: 0.82, benchmark: 0.80, flag: 'good', trend: 'stable' },
        { metricType: 'Bias Detection Score', value: 0.08, benchmark: 0.05, flag: 'needs_improvement', trend: 'down' },
        { metricType: 'Candidate Satisfaction', value: 4.6, benchmark: 4.0, flag: 'excellent', trend: 'up' }
      ]);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getQualityFlagColor = (flag: string) => {
    switch (flag) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'acceptable': return 'text-yellow-600';
      case 'needs_improvement': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AE', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assessor Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor your assessment activities and quality metrics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button size="sm">
            <ClipboardCheck className="h-4 w-4 mr-2" />
            New Assessment
          </Button>
        </div>
      </div>

      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalAssessments}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.averageScore}%</div>
            <p className="text-xs text-muted-foreground">
              +2.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quality Rating</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.qualityRating}/5.0</div>
            <p className="text-xs text-muted-foreground">
              Excellent performance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reliability Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats?.reliabilityScore || 0) * 100}%</div>
            <p className="text-xs text-muted-foreground">
              Above benchmark (85%)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="quality">Quality Metrics</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="nqf">NQF Integration</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Assessments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Assessments
                </CardTitle>
                <CardDescription>
                  Your scheduled assessments for the next 7 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingAssessments.map((assessment) => (
                    <div key={assessment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{assessment.candidateName}</h4>
                        <p className="text-sm text-gray-600">{assessment.assessmentTitle}</p>
                        <p className="text-xs text-gray-500">{formatDate(assessment.scheduledDate)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(assessment.status)}>
                          {assessment.status}
                        </Badge>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance Trends
                </CardTitle>
                <CardDescription>
                  Assessment volume and quality over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="assessments" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="avgScore" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Quality Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Quality Alerts & Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Your bias detection score (0.08) is slightly above the recommended threshold (0.05). 
                    Consider reviewing recent assessments for potential bias patterns.
                  </AlertDescription>
                </Alert>
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Excellent inter-rater reliability score! Your assessments are highly consistent with peer evaluations.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Assessment Status Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Assessment Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Scheduled</span>
                    <Badge variant="secondary">{stats?.scheduledAssessments}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">In Progress</span>
                    <Badge variant="secondary">{stats?.inProgressAssessments}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Completed</span>
                    <Badge variant="secondary">{stats?.completedAssessments}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Competency Distribution */}
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Competency Assessment Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={competencyDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {competencyDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quality" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quality Metrics Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Quality Metrics</CardTitle>
                <CardDescription>Current performance against benchmarks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {qualityTrends.map((metric, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{metric.metric}</span>
                        <span className={`text-sm font-medium ${getQualityFlagColor(metric.status)}`}>
                          {metric.current}
                        </span>
                      </div>
                      <Progress 
                        value={(metric.current / (metric.target * 1.2)) * 100} 
                        className="h-2"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Target: {metric.target}</span>
                        <span className={getQualityFlagColor(metric.status)}>
                          {metric.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quality Trends Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Quality Trends</CardTitle>
                <CardDescription>Quality metrics over the last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0.7, 1.0]} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="reliability" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      name="Reliability Score"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Bias Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Bias Analysis Summary</CardTitle>
              <CardDescription>Recent bias detection results and recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">No Bias</div>
                  <div className="text-sm text-gray-600">Gender Assessment</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">No Bias</div>
                  <div className="text-sm text-gray-600">Age Assessment</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">Low Risk</div>
                  <div className="text-sm text-gray-600">Experience Bias</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assessment Volume */}
            <Card>
              <CardHeader>
                <CardTitle>Assessment Volume</CardTitle>
                <CardDescription>Monthly assessment activity</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="assessments" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Score Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Score Distribution</CardTitle>
                <CardDescription>Average scores by competency type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {competencyDistribution.map((competency, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{competency.name}</span>
                        <span className="text-sm font-medium">
                          {75 + Math.floor(Math.random() * 20)}%
                        </span>
                      </div>
                      <Progress value={competency.value + 30} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="nqf" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* NQF Level Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  NQF Level Distribution
                </CardTitle>
                <CardDescription>Assessments by UAE NQF levels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { level: 'Level 6 (Bachelor)', count: 25, percentage: 35 },
                    { level: 'Level 7 (Honours)', count: 18, percentage: 25 },
                    { level: 'Level 5 (Advanced Diploma)', count: 15, percentage: 21 },
                    { level: 'Level 8 (Master)', count: 10, percentage: 14 },
                    { level: 'Level 4 (Higher Diploma)', count: 4, percentage: 5 }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{item.level}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={item.percentage} className="w-20 h-2" />
                        <span className="text-sm font-medium w-8">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Digital Credentials */}
            <Card>
              <CardHeader>
                <CardTitle>Digital Credentials Issued</CardTitle>
                <CardDescription>Blockchain-verified credentials generated</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div className="text-3xl font-bold text-blue-600">47</div>
                  <div className="text-sm text-gray-600">Total Credentials Issued</div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Active</div>
                      <div className="text-green-600">42</div>
                    </div>
                    <div>
                      <div className="font-medium">Pending</div>
                      <div className="text-yellow-600">5</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* NQF Compliance */}
          <Card>
            <CardHeader>
              <CardTitle>NQF Compliance Status</CardTitle>
              <CardDescription>Alignment with UAE National Qualifications Framework</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg bg-green-50">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="font-medium">Fully Compliant</div>
                  <div className="text-sm text-gray-600">Assessment Standards</div>
                </div>
                <div className="text-center p-4 border rounded-lg bg-green-50">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="font-medium">Certified</div>
                  <div className="text-sm text-gray-600">NQF Level Mapping</div>
                </div>
                <div className="text-center p-4 border rounded-lg bg-blue-50">
                  <Award className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="font-medium">Authorized</div>
                  <div className="text-sm text-gray-600">Credential Issuing</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AssessorDashboard;
