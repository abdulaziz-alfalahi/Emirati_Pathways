
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AssessmentReport } from '@/types/collaborativeAssessments';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ReportSummaryProps {
  report: AssessmentReport;
}

export const ReportSummary: React.FC<ReportSummaryProps> = ({ report }) => {
  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 90) return { level: 'Exceptional', color: 'bg-green-500', icon: TrendingUp };
    if (percentage >= 75) return { level: 'Strong', color: 'bg-blue-500', icon: TrendingUp };
    if (percentage >= 60) return { level: 'Satisfactory', color: 'bg-yellow-500', icon: Minus };
    return { level: 'Needs Improvement', color: 'bg-red-500', icon: TrendingDown };
  };

  const performance = getPerformanceLevel(report.percentage_score);
  const PerformanceIcon = performance.icon;

  const getTopPerformingSections = () => {
    return report.section_scores
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 3);
  };

  const getLowestPerformingSections = () => {
    return report.section_scores
      .sort((a, b) => a.percentage - b.percentage)
      .slice(0, 3);
  };

  return (
    <div className="space-y-6">
      {/* Overall Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PerformanceIcon className="h-5 w-5" />
            <span>Overall Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <div className="text-4xl font-bold">{report.percentage_score.toFixed(1)}%</div>
            <Badge className={`${performance.color} text-white`}>
              {performance.level}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Achieved {report.overall_score} out of {report.max_possible_score} total points
            across {report.section_scores.length} assessment sections.
          </p>
        </CardContent>
      </Card>

      {/* Section Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Top Performing Sections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getTopPerformingSections().map((section, index) => (
                <div key={section.section_id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-green-600">#{index + 1}</span>
                    <span className="text-sm">{section.section_title}</span>
                  </div>
                  <span className="font-medium">{section.percentage.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Areas for Improvement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getLowestPerformingSections().map((section, index) => (
                <div key={section.section_id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-red-600">#{index + 1}</span>
                    <span className="text-sm">{section.section_title}</span>
                  </div>
                  <span className="font-medium">{section.percentage.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {report.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm">{recommendation}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Collaborator Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Evaluation Team</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {report.collaborator_insights.map((insight) => (
              <div key={insight.collaborator_id} className="p-3 border rounded-lg">
                <div className="font-medium">{insight.collaborator_name}</div>
                <div className="text-sm text-muted-foreground capitalize">{insight.role}</div>
                <div className="text-sm">
                  {insight.sections_evaluated} sections • 
                  Avg: {insight.average_score_given.toFixed(1)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
