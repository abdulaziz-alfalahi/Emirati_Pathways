import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Download, FileText, Users, Calendar, Award, BarChart3 } from 'lucide-react';
import { restClient } from '@/utils/api';
import toast from 'react-hot-toast';

interface ExportReportsDialogProps {
  open: boolean;
  onClose: () => void;
}

type ReportType = 'pipeline' | 'candidates' | 'interviews' | 'offers' | 'performance';
type ExportFormat = 'json' | 'csv';

const ExportReportsDialog: React.FC<ExportReportsDialogProps> = ({ open, onClose }) => {
  const [reportType, setReportType] = useState<ReportType>('pipeline');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const reportTypes = [
    { value: 'pipeline', label: 'Recruitment Pipeline Report', icon: FileText },
    { value: 'candidates', label: 'Candidate Status Report', icon: Users },
    { value: 'interviews', label: 'Interview Feedback Report', icon: Calendar },
    { value: 'offers', label: 'Offer Statistics Report', icon: Award },
    { value: 'performance', label: 'Performance Metrics Report', icon: BarChart3 },
  ];

  const handleExport = async () => {
    try {
      setLoading(true);

      // Build query parameters
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      params.append('format', exportFormat);

      // Use restClient instead of manual fetch
      const response = await restClient.get(
        `/api/recruiter/reports/${reportType}?${params.toString()}`,
        { responseType: exportFormat === 'csv' ? 'blob' : 'json' }
      );

      if (response.data) {
        if (exportFormat === 'csv') {
          // Download CSV file
          const blob = new Blob([response.data], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } else {
          // Download JSON file
          const jsonData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2);
          const blob = new Blob([jsonData], { type: 'application/json' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }

        toast.success('Report exported successfully!');
        onClose();
      } else {
        throw new Error('Failed to generate report');
      }
    } catch (error: any) {
      console.error('Error exporting report:', error);
      toast.error(error.message || 'Failed to export report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Reports
          </DialogTitle>
          <DialogDescription>
            Select a report type and date range to export recruitment data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Report Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="reportType">Report Type</Label>
            <Select value={reportType} onValueChange={(value) => setReportType(value as ReportType)}>
              <SelectTrigger id="reportType">
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                {reportTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Export Format Selection */}
          <div className="space-y-2">
            <Label htmlFor="exportFormat">Export Format</Label>
            <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as ExportFormat)}>
              <SelectTrigger id="exportFormat">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (Excel Compatible)</SelectItem>
                <SelectItem value="json">JSON (Data Format)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date (Optional)</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date (Optional)</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Report Description */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
            <p className="font-medium text-blue-900 mb-1">
              {reportTypes.find((t) => t.value === reportType)?.label}
            </p>
            <p className="text-blue-700">
              {reportType === 'pipeline' && 'Overview of all recruitment pipelines with candidate counts and status.'}
              {reportType === 'candidates' && 'Detailed list of all candidates with their current status and progress.'}
              {reportType === 'interviews' && 'Interview records with feedback, ratings, and recommendations.'}
              {reportType === 'offers' && 'Offer statistics including acceptance rates and compensation details.'}
              {reportType === 'performance' && 'Key performance metrics including placements, time to fill, and success rates.'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={loading}>
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportReportsDialog;
