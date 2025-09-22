
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Award,
  FileText,
  Eye,
  CheckCircle2
} from 'lucide-react';

interface ResumeAnalyticsProps {
  resumeData: any;
}

const ResumeAnalytics: React.FC<ResumeAnalyticsProps> = ({ resumeData }) => {
  const completionScore = 85;
  const atsCompatibility = 78;
  const readabilityScore = 92;
  const keywordDensity = 65;

  const sectionAnalysis = [
    { section: 'Personal Info', wordCount: 45, completeness: 100, quality: 95 },
    { section: 'Summary', wordCount: 120, completeness: 90, quality: 88 },
    { section: 'Experience', wordCount: 340, completeness: 85, quality: 82 },
    { section: 'Education', wordCount: 80, completeness: 100, quality: 90 },
    { section: 'Skills', wordCount: 60, completeness: 75, quality: 85 }
  ];

  const recommendations = [
    { priority: 'high', category: 'Experience', message: 'Add 2-3 more quantified achievements to strengthen impact', action: 'Add metrics to job descriptions' },
    { priority: 'medium', category: 'Skills', message: 'Include 3-5 more technical skills relevant to your target role', action: 'Expand skills section' },
    { priority: 'medium', category: 'Keywords', message: 'Increase keyword density by 10-15%', action: 'Add industry-specific terms' },
    { priority: 'low', category: 'Format', message: 'Consider adding a certifications section', action: 'Create new section' }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Resume Analytics</h2>
        <p className="text-gray-600">
          Comprehensive analysis of your resume's performance and areas for improvement
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-ehrdc-teal" />
            <div className={`text-2xl font-bold ${getScoreColor(completionScore)}`}>
              {completionScore}%
            </div>
            <div className="text-sm text-gray-600">Completion</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <div className={`text-2xl font-bold ${getScoreColor(atsCompatibility)}`}>
              {atsCompatibility}%
            </div>
            <div className="text-sm text-gray-600">ATS Compatible</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Eye className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <div className={`text-2xl font-bold ${getScoreColor(readabilityScore)}`}>
              {readabilityScore}%
            </div>
            <div className="text-sm text-gray-600">Readability</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <div className={`text-2xl font-bold ${getScoreColor(keywordDensity)}`}>
              {keywordDensity}%
            </div>
            <div className="text-sm text-gray-600">Keyword Density</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sections" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sections">Section Analysis</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="sections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Section Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sectionAnalysis.map((section, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">{section.section}</h3>
                    <span className="text-sm text-gray-600">{section.wordCount} words</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Completeness</span>
                      <span className={getScoreColor(section.completeness)}>{section.completeness}%</span>
                    </div>
                    <Progress value={section.completeness} className="h-2" />
                    
                    <div className="flex items-center justify-between text-sm">
                      <span>Quality</span>
                      <span className={getScoreColor(section.quality)}>{section.quality}%</span>
                    </div>
                    <Progress value={section.quality} className="h-2" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Improvement Recommendations
              </CardTitle>
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
                      <p className="text-sm text-gray-600 mb-2">{rec.message}</p>
                      <p className="text-sm text-ehrdc-teal font-medium">{rec.action}</p>
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

export default ResumeAnalytics;
