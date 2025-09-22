
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, 
  FileText, 
  Share2, 
  Lock, 
  Globe,
  Eye,
  Settings,
  Printer,
  Mail
} from 'lucide-react';
import { ExportOptions, ExportMetadata } from './types/advanced';

interface ExportCenterProps {
  resumeData: any;
  onExport: (options: ExportOptions) => void;
}

const ExportCenter: React.FC<ExportCenterProps> = ({
  resumeData,
  onExport
}) => {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    quality: 'high',
    watermark: false
  });

  const [shareSettings, setShareSettings] = useState({
    public: false,
    password: '',
    expiry: '30'
  });

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'pdf' | 'docx' | 'html') => {
    setIsExporting(true);
    try {
      const options: ExportOptions = {
        ...exportOptions,
        format,
        metadata: {
          title: `${resumeData?.personal?.firstName || 'Resume'} ${resumeData?.personal?.lastName || ''}`,
          author: `${resumeData?.personal?.firstName || ''} ${resumeData?.personal?.lastName || ''}`,
          subject: 'Professional Resume',
          keywords: resumeData?.skills?.technical || [],
          creator: 'EHRDC Resume Builder'
        }
      };
      
      await onExport(options);
    } finally {
      setIsExporting(false);
    }
  };

  const exportFormats = [
    {
      format: 'pdf' as const,
      name: 'PDF Document',
      description: 'Best for job applications and ATS systems',
      icon: FileText,
      recommended: true
    },
    {
      format: 'docx' as const,
      name: 'Word Document',
      description: 'Editable format for further customization',
      icon: FileText,
      recommended: false
    },
    {
      format: 'html' as const,
      name: 'Web Page',
      description: 'For online portfolios and sharing',
      icon: Globe,
      recommended: false
    }
  ];

  return (
    <div className="space-y-6">
      {/* Export Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Export Your Resume</h2>
        <p className="text-gray-600">
          Download your resume in multiple formats or share it online
        </p>
      </div>

      <Tabs defaultValue="download" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="download">Download</TabsTrigger>
          <TabsTrigger value="share">Share Online</TabsTrigger>
          <TabsTrigger value="settings">Export Settings</TabsTrigger>
        </TabsList>

        {/* Download Tab */}
        <TabsContent value="download" className="space-y-4">
          <div className="grid gap-4">
            {exportFormats.map((format) => (
              <Card 
                key={format.format}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  format.recommended ? 'ring-2 ring-ehrdc-teal border-ehrdc-teal' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-100 rounded-lg p-2">
                        <format.icon className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">{format.name}</h3>
                          {format.recommended && (
                            <Badge variant="secondary" className="bg-ehrdc-teal/10 text-ehrdc-teal">
                              Recommended
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{format.description}</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleExport(format.format)}
                      disabled={isExporting}
                      className="bg-ehrdc-teal hover:bg-ehrdc-teal/90"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" size="sm">
              <Printer className="h-4 w-4 mr-2" />
              Print Preview
            </Button>
            <Button variant="outline" size="sm">
              <Mail className="h-4 w-4 mr-2" />
              Email Resume
            </Button>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </div>
        </TabsContent>

        {/* Share Tab */}
        <TabsContent value="share" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Share Your Resume Online
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="public-share"
                    checked={shareSettings.public}
                    onCheckedChange={(checked) => 
                      setShareSettings(prev => ({ ...prev, public: checked === true }))
                    }
                  />
                  <Label htmlFor="public-share">Make resume publicly accessible</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password Protection (Optional)</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={shareSettings.password}
                    onChange={(e) => setShareSettings(prev => ({ ...prev, password: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiry">Link Expiry</Label>
                  <Select value={shareSettings.expiry} onValueChange={(value) => 
                    setShareSettings(prev => ({ ...prev, expiry: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="never">Never expire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button className="w-full bg-ehrdc-teal hover:bg-ehrdc-teal/90">
                <Share2 className="h-4 w-4 mr-2" />
                Generate Share Link
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Export Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Export Quality</Label>
                  <Select 
                    value={exportOptions.quality} 
                    onValueChange={(value: 'standard' | 'high' | 'print') => 
                      setExportOptions(prev => ({ ...prev, quality: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard (Web)</SelectItem>
                      <SelectItem value="high">High Quality</SelectItem>
                      <SelectItem value="print">Print Quality</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="watermark"
                    checked={exportOptions.watermark || false}
                    onCheckedChange={(checked) => 
                      setExportOptions(prev => ({ ...prev, watermark: checked === true }))
                    }
                  />
                  <Label htmlFor="watermark">Add EHRDC watermark</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="password-protect"
                    checked={!!exportOptions.password}
                    onCheckedChange={(checked) => 
                      setExportOptions(prev => ({ 
                        ...prev, 
                        password: checked ? 'default' : undefined 
                      }))
                    }
                  />
                  <Label htmlFor="password-protect">Password protect PDF</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExportCenter;
