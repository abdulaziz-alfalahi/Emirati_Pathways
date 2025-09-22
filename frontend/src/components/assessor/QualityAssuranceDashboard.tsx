import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Shield,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Users,
  Target,
  Clock,
  Award,
  Eye,
  RefreshCw,
  Download,
  Settings,
  Zap,
  Activity
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface QualityMetric {
  metricType: string;
  currentValue: number;
  benchmark: number;
  trend: 'up' | 'down' | 'stable';
  status: 'excellent' | 'good' | 'acceptable' | 'needs_improvement' | 'critical';
  lastUpdated: string;
}

interface BiasAnalysis {
  biasType: string;
  detected: boolean;
  severity: 'none' | 'low' | 'medium' | 'high';
  affectedGroups: string[];
  recommendations: string[];
}

interface QualityAlert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  status: 'active' | 'acknowledged' | 'resolved';
}

const QualityAssuranceDashboard: React.FC = () => {
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetric[]>([]);
  const [biasAnalyses, setBiasAnalyses] = useState<BiasAnalysis[]>([]);
  const [qualityAlerts, setQualityAlerts] = useState<QualityAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  // Sample data
  const reliabilityTrends = [
    { month: 'Jan', reliability: 0.85, consistency: 0.82, fairness: 0.90 },
    { month: 'Feb', reliability: 0.87, consistency: 0.84, fairness: 0.92 },
    { month: 'Mar', reliability: 0.89, consistency: 0.86, fairness: 0.91 },
    { month: 'Apr', reliability: 0.91, consistency: 0.88, fairness: 0.93 },
    { month: 'May', reliability: 0.88, consistency: 0.85, fairness: 0.94 },
    { month: 'Jun', reliability: 0.92, consistency: 0.89, fairness: 0.95 }
  ];

  const biasDistribution = [
    { name: 'No Bias Detected', value: 75, color: '#10B981' },
    { name: 'Low Risk', value: 18, color: '#F59E0B' },
    { name: 'Medium Risk', value: 5, color: '#EF4444' },
    { name: 'High Risk', value: 2, color: '#DC2626' }
  ];

  const assessorPerformance = [
    { assessor: 'Dr. Sarah Ahmed', reliability: 0.95, bias: 0.02, assessments: 45 },
    { assessor: 'Prof. Mohammed Ali', reliability: 0.92, bias: 0.03, assessments: 38 },
    { assessor: 'Dr. Fatima Hassan', reliability: 0.89, bias: 0.05, assessments: 52 },
    { assessor: 'Mr. Ahmed Khalil', reliability: 0.87, bias: 0.08, assessments: 29 },
    { assessor: 'Dr. Layla Omar', reliability: 0.94, bias: 0.01, assessments: 41 }
  ];

  const qualityRadarData = [
    { subject: 'Reliability', A: 92, fullMark: 100 },
    { subject: 'Validity', A: 88, fullMark: 100 },
    { subject: 'Fairness', A: 95, fullMark: 100 },
    { subject: 'Consistency', A: 89, fullMark: 100 },
    { subject: 'Transparency', A: 91, fullMark: 100 },
    { subject: 'Efficiency', A: 86, fullMark: 100 }
  ];

  useEffect(() => {
    fetchQualityData();
  }, [selectedTimeframe]);

  const fetchQualityData = async () => {
    setLoading(true);
    try {
      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setQualityMetrics([
        {
          metricType: 'Inter-rater Reliability',
          currentValue: 0.92,
          benchmark: 0.85,
          trend: 'up',
          status: 'excellent',
          lastUpdated: '2025-09-20T10:00:00Z'
        },
        {
          metricType: 'Assessment Consistency',
          currentValue: 0.89,
          benchmark: 0.80,
          trend: 'stable',
          status: 'good',
          lastUpdated: '2025-09-20T10:00:00Z'
        },
        {
          metricType: 'Bias Detection Score',
          currentValue: 0.03,
          benchmark: 0.05,
          trend: 'down',
          status: 'excellent',
          lastUpdated: '2025-09-20T10:00:00Z'
        },
        {
          metricType: 'Candidate Satisfaction',
          currentValue: 4.6,
          benchmark: 4.0,
          trend: 'up',
          status: 'excellent',
          lastUpdated: '2025-09-20T10:00:00Z'
        }
      ]);

      setBiasAnalyses([
        {
          biasType: 'Gender Bias',
          detected: false,
          severity: 'none',
          affectedGroups: [],
          recommendations: ['Continue current practices', 'Monitor regularly']
        },
        {
          biasType: 'Age Bias',
          detected: false,
          severity: 'none',
          affectedGroups: [],
          recommendations: ['Maintain age-neutral assessment criteria']
        },
        {
          biasType: 'Nationality Bias',
          detected: false,
          severity: 'none',
          affectedGroups: [],
          recommendations: ['Ensure cultural sensitivity in assessments']
        },
        {
          biasType: 'Experience Bias',
          detected: true,
          severity: 'low',
          affectedGroups: ['Entry-level candidates'],
          recommendations: [
            'Review assessment criteria for experience requirements',
            'Consider competency-based evaluation over experience length'
          ]
        }
      ]);

      setQualityAlerts([
        {
          id: '1',
          type: 'Bias Detection',
          severity: 'low',
          message: 'Slight experience bias detected in recent assessments',
          timestamp: '2025-09-20T09:30:00Z',
          status: 'active'
        },
        {
          id: '2',
          type: 'Reliability Check',
          severity: 'medium',
          message: 'Inter-rater reliability below threshold for Technical Competency assessments',
          timestamp: '2025-09-19T14:15:00Z',
          status: 'acknowledged'
        }
      ]);

    } catch (error) {
      console.error('Error fetching quality data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'acceptable': return 'text-yellow-600 bg-yellow-100';
      case 'needs_improvement': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-yellow-600 bg-yellow-100';
      case 'medium': return 'text-orange-600 bg-orange-100';
      case 'high': return 'text-red-600 bg-red-100';
      case 'critical': return 'text-red-700 bg-red-200';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'stable': return <Activity className="h-4 w-4 text-blue-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const acknowledgeAlert = (alertId: string) => {
    setQualityAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, status: 'acknowledged' } : alert
      )
    );
  };

  const resolveAlert = (alertId: string) => {
    setQualityAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, status: 'resolved' } : alert
      )
    );
  };

  const runQualityCheck = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      // Refresh data after quality check
      await fetchQualityData();
    } catch (error) {
      console.error('Error running quality check:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && qualityMetrics.length === 0) {
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
          <h1 className="text-3xl font-bold text-gray-900">Quality Assurance Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor assessment quality, bias detection, and reliability metrics</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={runQualityCheck} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Run Check
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Quality Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {qualityMetrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.metricType}</CardTitle>
              {getTrendIcon(metric.trend)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metric.metricType === 'Candidate Satisfaction' 
                  ? `${metric.currentValue}/5.0`
                  : `${Math.round(metric.currentValue * 100)}%`
                }
              </div>
              <div className="flex items-center justify-between mt-2">
                <Badge className={getStatusColor(metric.status)}>
                  {metric.status.replace('_', ' ')}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  vs {metric.metricType === 'Candidate Satisfaction' 
                    ? `${metric.benchmark}/5.0`
                    : `${Math.round(metric.benchmark * 100)}%`
                  } target
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quality Alerts */}
      {qualityAlerts.filter(alert => alert.status === 'active').length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Active Quality Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {qualityAlerts
                .filter(alert => alert.status === 'active')
                .map((alert) => (
                  <Alert key={alert.id}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                          <span className="text-sm font-medium">{alert.type}</span>
                        </div>
                        <AlertDescription>{alert.message}</AlertDescription>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(alert.timestamp).toLocaleString('en-AE')}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button size="sm" variant="outline" onClick={() => acknowledgeAlert(alert.id)}>
                          Acknowledge
                        </Button>
                        <Button size="sm" onClick={() => resolveAlert(alert.id)}>
                          Resolve
                        </Button>
                      </div>
                    </div>
                  </Alert>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reliability">Reliability</TabsTrigger>
          <TabsTrigger value="bias">Bias Analysis</TabsTrigger>
          <TabsTrigger value="assessors">Assessors</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quality Radar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Quality Dimensions</CardTitle>
                <CardDescription>Overall quality assessment across key dimensions</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={qualityRadarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name="Quality Score"
                      dataKey="A"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Bias Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Bias Risk Distribution</CardTitle>
                <CardDescription>Assessment bias risk levels across all evaluations</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={biasDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {biasDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Quality Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Quality Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 border rounded-lg bg-green-50">
                  <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">95%</div>
                  <div className="text-sm text-gray-600">Assessments Pass Quality Checks</div>
                </div>
                <div className="text-center p-4 border rounded-lg bg-blue-50">
                  <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600">92%</div>
                  <div className="text-sm text-gray-600">Average Reliability Score</div>
                </div>
                <div className="text-center p-4 border rounded-lg bg-purple-50">
                  <Award className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-600">4.6/5</div>
                  <div className="text-sm text-gray-600">Quality Rating</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reliability" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Reliability Trends</CardTitle>
              <CardDescription>Inter-rater reliability, consistency, and fairness over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={reliabilityTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0.7, 1.0]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="reliability" stroke="#8884d8" strokeWidth={2} name="Reliability" />
                  <Line type="monotone" dataKey="consistency" stroke="#82ca9d" strokeWidth={2} name="Consistency" />
                  <Line type="monotone" dataKey="fairness" stroke="#ffc658" strokeWidth={2} name="Fairness" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Reliability Benchmarks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { metric: 'Inter-rater Reliability', current: 0.92, target: 0.85, status: 'excellent' },
                    { metric: 'Test-retest Reliability', current: 0.88, target: 0.80, status: 'good' },
                    { metric: 'Internal Consistency', current: 0.89, target: 0.80, status: 'good' },
                    { metric: 'Split-half Reliability', current: 0.91, target: 0.85, status: 'excellent' }
                  ].map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{item.metric}</span>
                        <Badge className={getStatusColor(item.status)}>
                          {Math.round(item.current * 100)}%
                        </Badge>
                      </div>
                      <Progress value={(item.current / 1.0) * 100} className="h-2" />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Target: {Math.round(item.target * 100)}%</span>
                        <span>{item.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Calibration Sessions</CardTitle>
                <CardDescription>Recent assessor calibration activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { date: '2025-09-18', topic: 'Technical Competency Assessment', participants: 8, agreement: 0.94 },
                    { date: '2025-09-15', topic: 'Behavioral Assessment Methods', participants: 12, agreement: 0.89 },
                    { date: '2025-09-10', topic: 'NQF Level Mapping', participants: 6, agreement: 0.91 }
                  ].map((session, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-sm">{session.topic}</h4>
                        <Badge variant="outline">{Math.round(session.agreement * 100)}% Agreement</Badge>
                      </div>
                      <div className="text-xs text-gray-600">
                        <p>{session.date} • {session.participants} participants</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bias" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bias Analysis Results</CardTitle>
              <CardDescription>Comprehensive bias detection across different dimensions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {biasAnalyses.map((analysis, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium">{analysis.biasType}</h4>
                      <div className="flex items-center gap-2">
                        {analysis.detected ? (
                          <Badge className={getSeverityColor(analysis.severity)}>
                            {analysis.severity.toUpperCase()} RISK
                          </Badge>
                        ) : (
                          <Badge className="text-green-600 bg-green-100">
                            NO BIAS DETECTED
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {analysis.detected && analysis.affectedGroups.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-600 mb-1">Affected Groups:</p>
                        <div className="flex gap-1">
                          {analysis.affectedGroups.map((group, groupIndex) => (
                            <Badge key={groupIndex} variant="outline">{group}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Recommendations:</p>
                      <ul className="text-sm space-y-1">
                        {analysis.recommendations.map((rec, recIndex) => (
                          <li key={recIndex} className="flex items-start gap-2">
                            <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bias Prevention Measures</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Active Measures</h4>
                  {[
                    'Blind assessment protocols',
                    'Diverse assessor panels',
                    'Standardized rubrics',
                    'Regular bias training'
                  ].map((measure, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{measure}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium">Monitoring Tools</h4>
                  {[
                    'Statistical bias detection',
                    'Pattern analysis algorithms',
                    'Peer review processes',
                    'Candidate feedback analysis'
                  ].map((tool, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">{tool}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assessor Performance</CardTitle>
              <CardDescription>Individual assessor quality metrics and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assessorPerformance.map((assessor, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium">{assessor.assessor}</h4>
                        <p className="text-sm text-gray-600">{assessor.assessments} assessments completed</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          Reliability: {Math.round(assessor.reliability * 100)}%
                        </div>
                        <div className="text-sm text-gray-600">
                          Bias Score: {(assessor.bias * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs">Reliability Score</Label>
                        <Progress value={assessor.reliability * 100} className="h-2 mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs">Bias Risk (Lower is Better)</Label>
                        <Progress 
                          value={100 - (assessor.bias * 100 * 20)} 
                          className="h-2 mt-1" 
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quality Trends Analysis</CardTitle>
              <CardDescription>Long-term quality metrics and improvement trends</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={reliabilityTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="reliability" fill="#8884d8" name="Reliability" />
                  <Bar dataKey="consistency" fill="#82ca9d" name="Consistency" />
                  <Bar dataKey="fairness" fill="#ffc658" name="Fairness" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Improvement Initiatives</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { initiative: 'Assessor Training Program', impact: '+5%', status: 'ongoing' },
                    { initiative: 'Bias Detection Algorithm', impact: '+12%', status: 'completed' },
                    { initiative: 'Quality Rubric Standardization', impact: '+8%', status: 'completed' },
                    { initiative: 'Peer Review Process', impact: '+6%', status: 'ongoing' }
                  ].map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <div className="font-medium text-sm">{item.initiative}</div>
                        <div className="text-xs text-gray-600">Impact: {item.impact} reliability improvement</div>
                      </div>
                      <Badge variant={item.status === 'completed' ? 'default' : 'secondary'}>
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quality Predictions</CardTitle>
                <CardDescription>AI-powered quality forecasting</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 border rounded-lg bg-blue-50">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-sm">Reliability Forecast</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Expected to reach 95% reliability by end of quarter based on current trends
                    </p>
                  </div>
                  
                  <div className="p-3 border rounded-lg bg-green-50">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-sm">Bias Reduction</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Bias incidents projected to decrease by 25% with new training program
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QualityAssuranceDashboard;
