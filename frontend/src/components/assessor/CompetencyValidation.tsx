import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import { 
  CheckCircle,
  AlertTriangle,
  Target,
  TrendingUp,
  FileText,
  Award,
  BookOpen,
  Users,
  BarChart3,
  Clock,
  Star,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Edit,
  Save,
  Send
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface CompetencyAssessment {
  id: number;
  candidateId: number;
  candidateName: string;
  competencyId: number;
  competencyName: string;
  assessmentDate: string;
  assessorScore: number;
  evidenceQuality: number;
  validationStatus: string;
  nqfMapping: NQFMapping;
  evidenceItems: EvidenceItem[];
  validationNotes: string;
  recommendations: string[];
}

interface NQFMapping {
  suggestedLevel: number;
  confidence: number;
  levelTitle: string;
  creditEquivalent: number;
  industryAlignment: string[];
}

interface EvidenceItem {
  id: string;
  type: string;
  title: string;
  description: string;
  qualityScore: number;
  relevanceScore: number;
  authenticityScore: number;
  fileUrl?: string;
}

interface ValidationCriteria {
  id: string;
  criterion: string;
  weight: number;
  score: number;
  maxScore: number;
  comments: string;
}

const CompetencyValidation: React.FC = () => {
  const [currentAssessment, setCurrentAssessment] = useState<CompetencyAssessment | null>(null);
  const [validationCriteria, setValidationCriteria] = useState<ValidationCriteria[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('assessment');

  // Sample data
  const sampleAssessment: CompetencyAssessment = {
    id: 1,
    candidateId: 101,
    candidateName: 'Ahmed Al Mansouri',
    competencyId: 1,
    competencyName: 'Technical Problem Solving',
    assessmentDate: '2025-09-20T10:00:00Z',
    assessorScore: 85,
    evidenceQuality: 0.88,
    validationStatus: 'pending',
    nqfMapping: {
      suggestedLevel: 6,
      confidence: 0.92,
      levelTitle: "Bachelor's Degree Level",
      creditEquivalent: 15,
      industryAlignment: ['Technology', 'Engineering']
    },
    evidenceItems: [
      {
        id: 'ev1',
        type: 'Portfolio',
        title: 'Software Development Projects',
        description: 'Collection of 5 software projects demonstrating problem-solving skills',
        qualityScore: 90,
        relevanceScore: 95,
        authenticityScore: 88,
        fileUrl: '/documents/portfolio.pdf'
      },
      {
        id: 'ev2',
        type: 'Case Study',
        title: 'System Architecture Analysis',
        description: 'Detailed analysis of complex system architecture challenges',
        qualityScore: 85,
        relevanceScore: 92,
        authenticityScore: 90
      },
      {
        id: 'ev3',
        type: 'Practical Demo',
        title: 'Live Coding Session',
        description: 'Real-time problem-solving demonstration',
        qualityScore: 88,
        relevanceScore: 90,
        authenticityScore: 95
      }
    ],
    validationNotes: '',
    recommendations: []
  };

  const competencyRadarData = [
    { subject: 'Technical Skills', A: 85, fullMark: 100 },
    { subject: 'Problem Solving', A: 90, fullMark: 100 },
    { subject: 'Innovation', A: 78, fullMark: 100 },
    { subject: 'Communication', A: 82, fullMark: 100 },
    { subject: 'Teamwork', A: 88, fullMark: 100 },
    { subject: 'Leadership', A: 75, fullMark: 100 }
  ];

  const validationHistory = [
    { date: 'Sep 15', score: 82, confidence: 0.85 },
    { date: 'Sep 16', score: 84, confidence: 0.87 },
    { date: 'Sep 17', score: 85, confidence: 0.90 },
    { date: 'Sep 18', score: 85, confidence: 0.92 },
    { date: 'Sep 19', score: 85, confidence: 0.92 },
    { date: 'Sep 20', score: 85, confidence: 0.92 }
  ];

  useEffect(() => {
    loadAssessment();
    initializeValidationCriteria();
  }, []);

  const loadAssessment = () => {
    setCurrentAssessment(sampleAssessment);
  };

  const initializeValidationCriteria = () => {
    setValidationCriteria([
      {
        id: 'evidence_quality',
        criterion: 'Evidence Quality',
        weight: 25,
        score: 88,
        maxScore: 100,
        comments: 'High-quality evidence with clear documentation'
      },
      {
        id: 'relevance',
        criterion: 'Competency Relevance',
        weight: 30,
        score: 92,
        maxScore: 100,
        comments: 'Directly relevant to the assessed competency'
      },
      {
        id: 'authenticity',
        criterion: 'Authenticity',
        weight: 20,
        score: 90,
        maxScore: 100,
        comments: 'Evidence appears authentic and verifiable'
      },
      {
        id: 'comprehensiveness',
        criterion: 'Comprehensiveness',
        weight: 15,
        score: 85,
        maxScore: 100,
        comments: 'Covers most aspects of the competency'
      },
      {
        id: 'currency',
        criterion: 'Currency',
        weight: 10,
        score: 80,
        maxScore: 100,
        comments: 'Evidence is recent and up-to-date'
      }
    ]);
  };

  const updateValidationScore = (criterionId: string, score: number) => {
    setValidationCriteria(prev => 
      prev.map(vc => 
        vc.id === criterionId ? { ...vc, score } : vc
      )
    );
  };

  const updateValidationComments = (criterionId: string, comments: string) => {
    setValidationCriteria(prev => 
      prev.map(vc => 
        vc.id === criterionId ? { ...vc, comments } : vc
      )
    );
  };

  const calculateOverallValidationScore = () => {
    const totalWeightedScore = validationCriteria.reduce((sum, vc) => 
      sum + (vc.score * vc.weight / 100), 0
    );
    const totalWeight = validationCriteria.reduce((sum, vc) => sum + vc.weight, 0);
    return Math.round(totalWeightedScore / totalWeight * 100);
  };

  const validateCompetency = async () => {
    setLoading(true);
    try {
      const overallScore = calculateOverallValidationScore();
      
      // Simulate validation process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (currentAssessment) {
        const updatedAssessment = {
          ...currentAssessment,
          validationStatus: overallScore >= 80 ? 'validated' : 'needs_review',
          evidenceQuality: overallScore / 100,
          recommendations: generateRecommendations(overallScore)
        };
        
        setCurrentAssessment(updatedAssessment);
      }
      
    } catch (error) {
      console.error('Error validating competency:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = (score: number): string[] => {
    const recommendations = [];
    
    if (score >= 90) {
      recommendations.push('Excellent competency demonstration - ready for certification');
      recommendations.push('Consider this candidate for advanced roles');
    } else if (score >= 80) {
      recommendations.push('Good competency level - meets requirements');
      recommendations.push('Minor improvements could enhance performance');
    } else if (score >= 70) {
      recommendations.push('Competency partially demonstrated - additional evidence needed');
      recommendations.push('Recommend targeted skill development');
    } else {
      recommendations.push('Competency not sufficiently demonstrated');
      recommendations.push('Significant skill development required');
      recommendations.push('Consider alternative assessment methods');
    }
    
    return recommendations;
  };

  const getValidationStatusColor = (status: string) => {
    switch (status) {
      case 'validated': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'needs_review': return 'text-orange-600 bg-orange-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getEvidenceTypeIcon = (type: string) => {
    switch (type) {
      case 'Portfolio': return <FileText className="h-4 w-4" />;
      case 'Case Study': return <BookOpen className="h-4 w-4" />;
      case 'Practical Demo': return <Target className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (!currentAssessment) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const overallScore = calculateOverallValidationScore();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Competency Validation</h1>
          <p className="text-gray-600 mt-1">Validate and map competencies to NQF levels</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            Preview Report
          </Button>
          <Button onClick={validateCompetency} disabled={loading}>
            <CheckCircle className="h-4 w-4 mr-2" />
            {loading ? 'Validating...' : 'Validate Competency'}
          </Button>
        </div>
      </div>

      {/* Assessment Overview */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{currentAssessment.candidateName}</CardTitle>
              <CardDescription>{currentAssessment.competencyName}</CardDescription>
            </div>
            <Badge className={getValidationStatusColor(currentAssessment.validationStatus)}>
              {currentAssessment.validationStatus.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{currentAssessment.assessorScore}%</div>
              <div className="text-sm text-gray-600">Assessor Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{overallScore}%</div>
              <div className="text-sm text-gray-600">Validation Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                Level {currentAssessment.nqfMapping.suggestedLevel}
              </div>
              <div className="text-sm text-gray-600">NQF Level</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(currentAssessment.nqfMapping.confidence * 100)}%
              </div>
              <div className="text-sm text-gray-600">Confidence</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="assessment">Assessment</TabsTrigger>
          <TabsTrigger value="evidence">Evidence</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
          <TabsTrigger value="nqf">NQF Mapping</TabsTrigger>
        </TabsList>

        <TabsContent value="assessment" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Competency Radar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Competency Profile</CardTitle>
                <CardDescription>Multi-dimensional competency assessment</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={competencyRadarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name="Score"
                      dataKey="A"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Validation History */}
            <Card>
              <CardHeader>
                <CardTitle>Validation Progress</CardTitle>
                <CardDescription>Score and confidence trends over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={validationHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="confidence" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Assessment Details */}
          <Card>
            <CardHeader>
              <CardTitle>Assessment Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Assessment Date</Label>
                    <p className="text-sm text-gray-600">
                      {new Date(currentAssessment.assessmentDate).toLocaleDateString('en-AE')}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Competency Type</Label>
                    <p className="text-sm text-gray-600">Technical Competency</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Industry Alignment</Label>
                    <div className="flex gap-1 mt-1">
                      {currentAssessment.nqfMapping.industryAlignment.map((industry, index) => (
                        <Badge key={index} variant="outline">{industry}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Evidence Quality</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={currentAssessment.evidenceQuality * 100} className="flex-1" />
                      <span className="text-sm font-medium">
                        {Math.round(currentAssessment.evidenceQuality * 100)}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Credit Equivalent</Label>
                    <p className="text-sm text-gray-600">
                      {currentAssessment.nqfMapping.creditEquivalent} Credits
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">NQF Level Title</Label>
                    <p className="text-sm text-gray-600">
                      {currentAssessment.nqfMapping.levelTitle}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evidence" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Evidence Portfolio</CardTitle>
              <CardDescription>Review and validate submitted evidence</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentAssessment.evidenceItems.map((evidence) => (
                  <div key={evidence.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getEvidenceTypeIcon(evidence.type)}
                        <div>
                          <h4 className="font-medium">{evidence.title}</h4>
                          <p className="text-sm text-gray-600">{evidence.description}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{evidence.type}</Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs">Quality</Label>
                        <div className="flex items-center gap-2">
                          <Progress value={evidence.qualityScore} className="flex-1 h-2" />
                          <span className="text-xs font-medium">{evidence.qualityScore}%</span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Relevance</Label>
                        <div className="flex items-center gap-2">
                          <Progress value={evidence.relevanceScore} className="flex-1 h-2" />
                          <span className="text-xs font-medium">{evidence.relevanceScore}%</span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Authenticity</Label>
                        <div className="flex items-center gap-2">
                          <Progress value={evidence.authenticityScore} className="flex-1 h-2" />
                          <span className="text-xs font-medium">{evidence.authenticityScore}%</span>
                        </div>
                      </div>
                    </div>
                    
                    {evidence.fileUrl && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-2" />
                          View Document
                        </Button>
                        <Button size="sm" variant="outline">
                          <ThumbsUp className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button size="sm" variant="outline">
                          <ThumbsDown className="h-4 w-4 mr-2" />
                          Request Revision
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Validation Criteria</CardTitle>
              <CardDescription>Score each validation criterion</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {validationCriteria.map((criterion) => (
                  <div key={criterion.id} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="font-medium">{criterion.criterion}</Label>
                      <Badge variant="outline">Weight: {criterion.weight}%</Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <span className="text-sm w-16">Score:</span>
                        <Slider
                          aria-label={`Score for ${criterion.criterion}`}
                          value={[criterion.score]}
                          onValueChange={(value) => updateValidationScore(criterion.id, value[0])}
                          max={criterion.maxScore}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-sm font-medium w-16">
                          {criterion.score}/{criterion.maxScore}
                        </span>
                      </div>
                      
                      <Textarea
                        value={criterion.comments}
                        onChange={(e) => updateValidationComments(criterion.id, e.target.value)}
                        placeholder="Add validation comments..."
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 border rounded-lg bg-gray-50">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Overall Validation Score</span>
                  <span className="text-2xl font-bold text-blue-600">{overallScore}%</span>
                </div>
                <Progress value={overallScore} className="mt-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Validation Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={currentAssessment.validationNotes}
                onChange={(e) => setCurrentAssessment(prev => 
                  prev ? { ...prev, validationNotes: e.target.value } : null
                )}
                placeholder="Add detailed validation notes and observations..."
                rows={4}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nqf" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* NQF Level Mapping */}
            <Card>
              <CardHeader>
                <CardTitle>NQF Level Mapping</CardTitle>
                <CardDescription>Competency alignment with UAE NQF</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-6 border rounded-lg bg-blue-50">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    Level {currentAssessment.nqfMapping.suggestedLevel}
                  </div>
                  <div className="text-lg font-medium mb-1">
                    {currentAssessment.nqfMapping.levelTitle}
                  </div>
                  <div className="text-sm text-gray-600">
                    Confidence: {Math.round(currentAssessment.nqfMapping.confidence * 100)}%
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Credit Equivalent</span>
                    <span className="font-medium">{currentAssessment.nqfMapping.creditEquivalent} Credits</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Assessment Score</span>
                    <span className="font-medium">{currentAssessment.assessorScore}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Evidence Quality</span>
                    <span className="font-medium">
                      {Math.round(currentAssessment.evidenceQuality * 100)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Industry Alignment */}
            <Card>
              <CardHeader>
                <CardTitle>Industry Alignment</CardTitle>
                <CardDescription>Relevant industry sectors and career paths</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Aligned Industries</Label>
                    <div className="flex flex-wrap gap-2">
                      {currentAssessment.nqfMapping.industryAlignment.map((industry, index) => (
                        <Badge key={index} variant="secondary">{industry}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Career Opportunities</Label>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Software Engineer</li>
                      <li>• System Analyst</li>
                      <li>• Technical Lead</li>
                      <li>• Solution Architect</li>
                    </ul>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Progression Pathways</Label>
                    <div className="text-sm text-gray-600">
                      <p>Next Level: NQF Level 7 (Bachelor's Honours)</p>
                      <p>Required: Additional 60 credits</p>
                      <p>Duration: 12-18 months</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Validation Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              {currentAssessment.recommendations.length > 0 ? (
                <div className="space-y-2">
                  {currentAssessment.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{recommendation}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Complete the validation process to generate recommendations.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompetencyValidation;
