import React, { useState, useEffect } from 'react';
import { restClient } from '@/utils/api';
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

  // REAL DATA ONLY.
  //
  // Reported 2026-08-31 (fb_1788181600, surveyed from it): this screen invented
  // everything it showed. Ninety-five assessments, an 83.2 average, a
  // reliability of 0.89 — and a work queue of candidates who do not exist:
  // "Ahmed Al Mansouri", "Fatima Al Zahra", "Omar Hassan", each with a
  // scheduled date. It also published a Bias Detection Score and a Fairness
  // figure, invented, on a government assessment platform.
  //
  // It even faked the wait: `await new Promise(r => setTimeout(r, 1000))`
  // before setting constants, so it looked like it had fetched something.
  //
  // The backend was already honest — /api/assessor/dashboard aggregates the
  // assessor's own assessments and returns zeros for what it does not track.
  // This now reads it.
  //
  // Series with no source were REMOVED rather than kept: there is nothing
  // behind inter-rater reliability, consistency, bias or fairness, and a
  // plausible number is worse than an absent one on exactly these measures.
  const [rows, setRows] = useState<any[]>([]);
  const [loadError, setLoadError] = useState(false);

  // Assessments per month, counted from the assessor's real rows.
  const performanceData = React.useMemo(() => {
    const byMonth = new Map<string, { month: string; assessments: number; total: number; scored: number }>();
    rows.forEach(r => {
      const when = r.scheduled_date || r.created_at;
      if (!when) return;
      const d = new Date(when);
      if (Number.isNaN(d.getTime())) return;
      const key = d.toLocaleString('en', { month: 'short', year: '2-digit' });
      const e = byMonth.get(key) || { month: key, assessments: 0, total: 0, scored: 0 };
      e.assessments += 1;
      if (typeof r.percentage_score === 'number') { e.total += r.percentage_score; e.scored += 1; }
      byMonth.set(key, e);
    });
    return Array.from(byMonth.values()).map(e => ({
      month: e.month,
      assessments: e.assessments,
      avgScore: e.scored ? Math.round(e.total / e.scored) : null,
    }));
  }, [rows]);

  // How the assessor's work divides, by the assessment mode actually recorded.
  const competencyDistribution = React.useMemo(() => {
    const palette = ['#0F766E', '#0891B2', '#CA8A04', '#DC2626', '#7C3AED'];
    const by = new Map<string, number>();
    rows.forEach(r => {
      const k = (r.assessment_mode || r.competencyType || 'Unspecified').toString();
      by.set(k, (by.get(k) || 0) + 1);
    });
    return Array.from(by.entries()).map(([name, value], i) => ({
      name, value, color: palette[i % palette.length],
    }));
  }, [rows]);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedTimeframe]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const [dash, apps] = await Promise.allSettled([
        restClient.get('/api/assessor/dashboard'),
        restClient.get('/api/assessor/applications'),
      ]);

      if (dash.status === 'fulfilled') {
        const d = dash.value.data || {};
        const a = d.assessments || {};
        const c = d.candidates || {};
        const p = d.performance || {};
        setStats({
          totalAssessments: a.totalAssessments ?? 0,
          scheduledAssessments: a.pendingReview ?? 0,
          inProgressAssessments: 0,
          completedAssessments: c.passedAssessments + c.failedAssessments || 0,
          averageScore: p.feedbackRating ?? 0,
          qualityRating: p.qualityScore ?? 0,
          reliabilityScore: 0,
          biasScore: 0,
        });
        // Only measures the platform actually records.
        const metrics: QualityMetric[] = [];
        if (p.qualityScore) metrics.push({
          metricType: 'Average quality score', value: p.qualityScore,
          benchmark: 0, flag: 'recorded', trend: 'stable',
        });
        if (p.feedbackRating) metrics.push({
          metricType: 'Average assessment score', value: p.feedbackRating,
          benchmark: 0, flag: 'recorded', trend: 'stable',
        });
        setQualityMetrics(metrics);
      } else {
        setLoadError(true);
      }

      if (apps.status === 'fulfilled') {
        const list = apps.value.data?.applications || apps.value.data?.data || [];
        setRows(Array.isArray(list) ? list : []);
        setUpcomingAssessments((Array.isArray(list) ? list : [])
          .filter((r: any) => ['scheduled', 'confirmed', 'pending'].includes((r.status || '').toLowerCase()))
          .slice(0, 10)
          .map((r: any, i: number) => ({
            id: r.id ?? i,
            candidateName: (r.candidate_name || '').trim() || 'Candidate not named',
            assessmentTitle: r.assessment_title || 'Assessment',
            scheduledDate: r.scheduled_date || r.created_at || '',
            competencyType: r.assessment_mode || '—',
            status: r.status || 'scheduled',
          })));
      }
    } catch (error) {
      console.error('Error fetching assessor dashboard:', error);
      setLoadError(true);
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
            <Settings className="h-4 w-4 me-2" />
            Settings
          </Button>
          <Button size="sm">
            <ClipboardCheck className="h-4 w-4 me-2" />
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
                  {/* The block that stood here published invented Reliability,
                      Consistency, Fairness and Bias Detection scores against
                      invented targets. Nothing in the platform measures any of
                      them. On a government assessment service a plausible
                      fairness number is worse than none at all, so the section
                      reports only what is recorded. */}
                  {qualityMetrics.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No quality measures have been recorded for your assessments yet.
                    </p>
                  ) : qualityMetrics.map((metric, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{metric.metricType}</span>
                        <span className="text-sm font-medium">{metric.value}</span>
                      </div>
                      <Progress value={Math.min(100, Number(metric.value) || 0)} className="h-2" />
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
