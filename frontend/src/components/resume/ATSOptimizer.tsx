
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  FileText,
  Eye,
  Zap
} from 'lucide-react';

interface ATSOptimizerProps {
  resumeData: any;
}

const ATSOptimizer: React.FC<ATSOptimizerProps> = ({ resumeData }) => {
  const [optimizationScore] = useState(78);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const formatChecks = [
    { id: '1', aspect: 'File Format', status: 'passed', message: 'PDF format is ATS-friendly' },
    { id: '2', aspect: 'Font Usage', status: 'passed', message: 'Standard fonts detected' },
    { id: '3', aspect: 'Section Headers', status: 'warning', message: 'Use conventional section names', fix: 'Replace "Work History" with "Experience"' },
    { id: '4', aspect: 'Contact Information', status: 'passed', message: 'All required fields present' },
    { id: '5', aspect: 'Keywords Density', status: 'warning', message: 'Low keyword density detected', fix: 'Add 3-5 more relevant keywords' }
  ];

  const keywordAnalysis = [
    { keyword: 'Project Management', frequency: 3, relevance: 95, suggestion: 'Add PMI or Agile certifications' },
    { keyword: 'Leadership', frequency: 2, relevance: 88, suggestion: 'Include specific team sizes managed' },
    { keyword: 'Digital Transformation', frequency: 1, relevance: 92, suggestion: 'Expand on digital initiatives led' }
  ];

  const recommendations = [
    { priority: 'high', category: 'Keywords', message: 'Add "Stakeholder Management" - appears in 85% of similar roles' },
    { priority: 'medium', category: 'Format', message: 'Use bullet points consistently throughout experience section' },
    { priority: 'medium', category: 'Content', message: 'Include 2-3 more quantified achievements' },
    { priority: 'low', category: 'Skills', message: 'Consider adding emerging tech skills relevant to your industry' }
  ];

  const handleOptimize = () => {
    setIsOptimizing(true);
    setTimeout(() => setIsOptimizing(false), 2000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return null;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">ATS Optimization</h2>
        <p className="text-gray-600">
          Ensure your resume passes through Applicant Tracking Systems
        </p>
      </div>

      {/* Score Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            ATS Compatibility Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium">Overall Score</span>
              <span className="text-2xl font-bold text-ehrdc-teal">{optimizationScore}%</span>
            </div>
            <Progress value={optimizationScore} className="h-3" />
            <p className="text-sm text-gray-600">
              Good score! Your resume should pass most ATS systems. Implement the suggestions below to reach 90%+.
            </p>
            <Button 
              onClick={handleOptimize}
              disabled={isOptimizing}
              className="w-full bg-ehrdc-teal hover:bg-ehrdc-teal/90"
            >
              {isOptimizing ? (
                <>
                  <Zap className="h-4 w-4 mr-2 animate-spin" />
                  Optimizing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Auto-Optimize Resume
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="formatting" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="formatting">Format Check</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="formatting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Formatting Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formatChecks.map((check) => (
                <div key={check.id} className="flex items-start gap-3 p-4 border rounded-lg">
                  {getStatusIcon(check.status)}
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{check.aspect}</h3>
                    <p className="text-sm text-gray-600">{check.message}</p>
                    {check.fix && (
                      <p className="text-sm text-ehrdc-teal mt-1">Fix: {check.fix}</p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keywords" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Keyword Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {keywordAnalysis.map((keyword, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{keyword.keyword}</h3>
                    <Badge variant="outline">{keyword.relevance}% relevant</Badge>
                  </div>
                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-sm text-gray-600">Used {keyword.frequency} times</span>
                    <Progress value={(keyword.frequency / 5) * 100} className="flex-1 h-2" />
                  </div>
                  <p className="text-sm text-ehrdc-teal">{keyword.suggestion}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Optimization Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recommendations.map((rec, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <Badge className={getPriorityColor(rec.priority)}>
                      {rec.priority}
                    </Badge>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">{rec.category}</h3>
                      <p className="text-sm text-gray-600">{rec.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ATSOptimizer;
