
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText, Calendar, Mail, Shield } from 'lucide-react';

interface StakeholderReportsTabProps {
  stakeholderView: string;
  timeRange: string;
}

// Mock report data
const reportTemplates = {
  government: [
    { id: 'gov_quarterly', name: 'Quarterly Performance Report', description: 'Comprehensive platform metrics and outcomes', frequency: 'Quarterly' },
    { id: 'gov_policy', name: 'Policy Impact Assessment', description: 'Analysis of policy effectiveness and citizen outcomes', frequency: 'Bi-annual' },
    { id: 'gov_compliance', name: 'Compliance and Security Report', description: 'Security metrics and regulatory compliance status', frequency: 'Monthly' },
  ],
  education: [
    { id: 'edu_outcomes', name: 'Educational Outcomes Report', description: 'Student progress and educational achievement metrics', frequency: 'Semester' },
    { id: 'edu_engagement', name: 'Institution Engagement Report', description: 'Platform usage and collaboration metrics', frequency: 'Monthly' },
    { id: 'edu_workforce', name: 'Workforce Readiness Report', description: 'Skills gap analysis and career preparation metrics', frequency: 'Quarterly' },
  ],
  employers: [
    { id: 'emp_talent', name: 'Talent Pipeline Report', description: 'Available talent and skills matching analytics', frequency: 'Monthly' },
    { id: 'emp_hiring', name: 'Hiring Success Report', description: 'Recruitment outcomes and candidate quality metrics', frequency: 'Quarterly' },
    { id: 'emp_trends', name: 'Industry Trends Report', description: 'Market trends and workforce development insights', frequency: 'Bi-annual' },
  ],
  communities: [
    { id: 'com_engagement', name: 'Community Engagement Report', description: 'Citizen participation and community program effectiveness', frequency: 'Monthly' },
    { id: 'com_impact', name: 'Social Impact Report', description: 'Community outcomes and social program effectiveness', frequency: 'Quarterly' },
    { id: 'com_resources', name: 'Resource Utilization Report', description: 'Community resource usage and optimization opportunities', frequency: 'Quarterly' },
  ],
};

export const StakeholderReportsTab: React.FC<StakeholderReportsTabProps> = ({
  stakeholderView,
  timeRange
}) => {
  const [selectedReport, setSelectedReport] = useState('');
  const [reportFormat, setReportFormat] = useState('pdf');

  const currentReports = reportTemplates[stakeholderView as keyof typeof reportTemplates] || [];

  const generateReport = (reportId: string) => {
    console.log('Generating report:', reportId, 'in format:', reportFormat);
    // Mock report generation
  };

  const scheduleReport = (reportId: string) => {
    console.log('Scheduling automated report:', reportId);
    // Mock report scheduling
  };

  return (
    <div className="space-y-6">
      {/* Report Generation Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium">Generate Report:</span>
            
            <Select value={selectedReport} onValueChange={setSelectedReport}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select Report Template" />
              </SelectTrigger>
              <SelectContent>
                {currentReports.map((report) => (
                  <SelectItem key={report.id} value={report.id}>
                    {report.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={reportFormat} onValueChange={setReportFormat}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              onClick={() => generateReport(selectedReport)} 
              disabled={!selectedReport}
            >
              <Download className="h-4 w-4 mr-2" />
              Generate
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Available Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Available Report Templates</CardTitle>
            <CardDescription>
              Pre-configured reports for {stakeholderView} stakeholders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentReports.map((report) => (
                <div key={report.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{report.name}</h4>
                    <Badge variant="outline">{report.frequency}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {report.description}
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => generateReport(report.id)}
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      Generate
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => scheduleReport(report.id)}
                    >
                      <Calendar className="h-3 w-3 mr-1" />
                      Schedule
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Automated Report Schedule</CardTitle>
            <CardDescription>
              Scheduled reports and delivery preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                <div>
                  <div className="font-medium">Monthly Performance Report</div>
                  <div className="text-sm text-muted-foreground">Next: Dec 1, 2024</div>
                </div>
                <Badge variant="default" className="bg-green-600">Active</Badge>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                <div>
                  <div className="font-medium">Quarterly Outcomes Report</div>
                  <div className="text-sm text-muted-foreground">Next: Jan 15, 2025</div>
                </div>
                <Badge variant="default" className="bg-blue-600">Active</Badge>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <div className="font-medium">Annual Compliance Report</div>
                  <div className="text-sm text-muted-foreground">Next: Mar 30, 2025</div>
                </div>
                <Badge variant="outline">Scheduled</Badge>
              </div>

              <Button variant="outline" className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                Configure Delivery Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Privacy and Compliance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy and Data Protection
          </CardTitle>
          <CardDescription>
            Report generation follows strict privacy and compliance guidelines
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium">Data Anonymization</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Personal identifiers automatically removed</li>
                <li>• Aggregated data with minimum thresholds</li>
                <li>• Statistical disclosure control applied</li>
                <li>• Differential privacy for sensitive metrics</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Compliance Standards</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• UAE Data Protection Law compliance</li>
                <li>• ISO 27001 security standards</li>
                <li>• Audit trail for all report generation</li>
                <li>• Role-based access controls</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>
            Previously generated reports and download history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 border rounded">
              <div>
                <div className="font-medium">Quarterly Performance Report Q3 2024</div>
                <div className="text-sm text-muted-foreground">Generated on Nov 15, 2024</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
                <Badge variant="secondary">PDF</Badge>
              </div>
            </div>
            
            <div className="flex justify-between items-center p-3 border rounded">
              <div>
                <div className="font-medium">Monthly Engagement Report Oct 2024</div>
                <div className="text-sm text-muted-foreground">Generated on Nov 1, 2024</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
                <Badge variant="secondary">Excel</Badge>
              </div>
            </div>
            
            <div className="flex justify-between items-center p-3 border rounded">
              <div>
                <div className="font-medium">Policy Impact Assessment Sep 2024</div>
                <div className="text-sm text-muted-foreground">Generated on Oct 15, 2024</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
                <Badge variant="secondary">PDF</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
