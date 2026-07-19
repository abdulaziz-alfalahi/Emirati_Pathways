
import React from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileText } from 'lucide-react';

const AssessmentDocumentation: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Assessment Documentation</CardTitle>
        <CardDescription>Manage assessment materials and resources</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Upload Documents</CardTitle>
              <CardDescription>Share assessment materials</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag and drop files here, or click to browse
                </p>
                <Button variant="outline" size="sm">Browse Files</Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Recent Documents</CardTitle>
              <CardDescription>Access recent files</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 me-2 text-blue-600" />
                    <span className="text-sm">Assessment Guidelines.pdf</span>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 me-2 text-green-600" />
                    <span className="text-sm">Scoring Matrix.xlsx</span>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 me-2 text-purple-600" />
                    <span className="text-sm">Question Bank.docx</span>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button variant="link" className="ms-auto">View All Documents</Button>
            </CardFooter>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};

export default AssessmentDocumentation;
