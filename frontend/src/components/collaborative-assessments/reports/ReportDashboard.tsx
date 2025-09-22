
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateAssessmentReport, exportAssessmentReport } from '@/services/collaborativeAssessments/reportService';
import { AssessmentOverviewChart } from './charts/AssessmentOverviewChart';
import { SectionPerformanceChart } from './charts/SectionPerformanceChart';
import { CollaboratorInsightsChart } from './charts/CollaboratorInsightsChart';
import { ProgressTimelineChart } from './charts/ProgressTimelineChart';
import { ReportSummary } from './ReportSummary';
import { ExportOptions } from './ExportOptions';
import { Download, TrendingUp, Users, Clock, BarChart3 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ReportDashboardProps {
  assessmentId: string;
}

export const ReportDashboard: React.FC<ReportDashboardProps> = ({ assessmentId }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel'>('pdf');
  const [isExporting, setIsExporting] = useState(false);

  const { data: report, isLoading, error, refetch } = useQuery({
    queryKey: ['assessment-report', assessmentId],
    queryFn: () => generateAssessmentReport(assessmentId),
    refetchOnWindowFocus: false
  });

  const handleExport = async () => {
    if (!report) return;

    try {
      setIsExporting(true);
      const exportData = await exportAssessmentReport(assessmentId, exportFormat);
      
      // Create download link
      const link = document.createElement('a');
      link.href = exportData.downloadUrl;
      link.download = exportData.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Report exported",
        description: `Report exported as ${exportFormat.toUpperCase()} successfully.`
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "Failed to export report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Report refreshed",
      description: "Assessment report data has been updated."
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Generating report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <p className="text-destructive">Failed to generate report</p>
          <Button onClick={handleRefresh}>Try Again</Button>
        </div>
      </div>
    );
  }

  const getMetricsCards = () => [
    {
      title: "Overall Score",
      value: `${report.percentage_score.toFixed(1)}%`,
      subtitle: `${report.overall_score}/${report.max_possible_score}`,
      icon: TrendingUp,
      color: "text-green-600"
    },
    {
      title: "Collaborators",
      value: report.collaborator_insights.length.toString(),
      subtitle: "Active evaluators",
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "Sections",
      value: report.section_scores.length.toString(),
      subtitle: "Assessment areas",
      icon: BarChart3,
      color: "text-purple-600"
    },
    {
      title: "Generated",
      value: new Date(report.generated_at).toLocaleDateString(),
      subtitle: new Date(report.generated_at).toLocaleTimeString(),
      icon: Clock,
      color: "text-orange-600"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{report.template_title}</h2>
          <p className="text-muted-foreground">Assessment Report</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={exportFormat} onValueChange={(value: 'pdf' | 'excel') => setExportFormat(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={handleExport} 
            disabled={isExporting}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>{isExporting ? 'Exporting...' : 'Export'}</span>
          </Button>
          <Button variant="outline" onClick={handleRefresh}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {getMetricsCards().map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                  <p className="text-2xl font-bold">{metric.value}</p>
                  <p className="text-xs text-muted-foreground">{metric.subtitle}</p>
                </div>
                <metric.icon className={`h-8 w-8 ${metric.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sections">Section Analysis</TabsTrigger>
          <TabsTrigger value="collaborators">Collaborator Insights</TabsTrigger>
          <TabsTrigger value="timeline">Progress Timeline</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Score Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <AssessmentOverviewChart report={report} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Section Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <SectionPerformanceChart sections={report.section_scores} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sections" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Section Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <SectionPerformanceChart 
                sections={report.section_scores} 
                detailed={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="collaborators" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Collaborator Contributions</CardTitle>
            </CardHeader>
            <CardContent>
              <CollaboratorInsightsChart insights={report.collaborator_insights} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <ProgressTimelineChart assessmentId={assessmentId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-6">
          <ReportSummary report={report} />
          <ExportOptions 
            report={report}
            onExport={handleExport}
            isExporting={isExporting}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
