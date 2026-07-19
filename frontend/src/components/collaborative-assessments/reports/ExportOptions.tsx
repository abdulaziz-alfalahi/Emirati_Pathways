
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AssessmentReport } from '@/types/collaborativeAssessments';
import { Download, FileText, Table, Share } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ExportOptionsProps {
  report: AssessmentReport;
  onExport: (format: 'pdf' | 'excel') => void;
  isExporting: boolean;
}

export const ExportOptions: React.FC<ExportOptionsProps> = ({ 
  report, 
  onExport, 
  isExporting 
}) => {
  const { toast } = useToast();

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Assessment Report - ${report.template_title}`,
          text: `Assessment report with ${report.percentage_score.toFixed(1)}% overall score`,
          url: window.location.href
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied",
          description: "Report link copied to clipboard"
        });
      } catch (error) {
        toast({
          title: "Share failed",
          description: "Unable to share or copy link",
          variant: "destructive"
        });
      }
    }
  };

  const exportOptions = [
    {
      format: 'pdf' as const,
      title: 'PDF Report',
      description: 'Complete report with charts and visualizations',
      icon: FileText,
      color: 'bg-red-50 text-red-600 border-red-200'
    },
    {
      format: 'excel' as const,
      title: 'Excel Spreadsheet',
      description: 'Raw data and scores for further analysis',
      icon: Table,
      color: 'bg-green-50 text-green-600 border-green-200'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Download className="h-5 w-5" />
          <span>Export Options</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {exportOptions.map((option) => (
            <div key={option.format} className={`border rounded-lg p-4 ${option.color}`}>
              <div className="flex items-center space-x-3 mb-3">
                <option.icon className="h-6 w-6" />
                <h3 className="font-medium">{option.title}</h3>
              </div>
              <p className="text-sm mb-4">{option.description}</p>
              <Button
                onClick={() => onExport(option.format)}
                disabled={isExporting}
                className="w-full"
                variant="outline"
              >
                {isExporting ? 'Exporting...' : `Export ${option.format.toUpperCase()}`}
              </Button>
            </div>
          ))}
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Share Report</h4>
              <p className="text-sm text-muted-foreground">
                Share this report with stakeholders
              </p>
            </div>
            <Button variant="outline" onClick={handleShare}>
              <Share className="h-4 w-4 me-2" />
              Share
            </Button>
          </div>
        </div>

        <div className="mt-4 text-xs text-muted-foreground">
          <p>
            Report generated on {new Date(report.generated_at).toLocaleString()}
          </p>
          <p>
            Assessment ID: {report.assessment_id}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
