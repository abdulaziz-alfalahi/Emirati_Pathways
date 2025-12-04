import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUp, Edit3, Eye, FolderOpen } from 'lucide-react';

import JDFileUpload from './JDFileUpload';
import JobDescriptionWizard from './JobDescriptionWizard';

interface JDWizardWithUploadProps {
  recruiterId: string;
  companyId: string;
  initialJdId?: string;
  initialData?: any;
  onComplete?: (jdId: string) => void;
  onCancel?: () => void;
}

const JDWizardWithUpload: React.FC<JDWizardWithUploadProps> = ({
  recruiterId,
  companyId,
  initialJdId,
  initialData,
  onComplete,
  onCancel
}) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'select' | 'upload' | 'manual'>(
    initialJdId || initialData ? 'manual' : 'select'
  );
  const [parsedData, setParsedData] = useState<any>(null);
  const [jdId, setJdId] = useState<string | undefined>(undefined);

  // React to prop changes
  React.useEffect(() => {
    if (initialJdId || initialData) {
      setMode('manual');
    }
  }, [initialJdId, initialData]);

  const handleParsed = (data: any, createdJdId?: string) => {
    setParsedData(data);
    setJdId(createdJdId);
    setMode('manual'); // Switch to wizard with pre-filled data
  };

  const handleManualStart = () => {
    setMode('manual');
  };

  // Selection screen
  if (mode === 'select') {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="pt-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Create Job Description</h2>
              <p className="text-muted-foreground">
                Choose how you'd like to create your job description
              </p>
            </div>

            {/* View Saved JDs Button */}
            <div className="mb-6 text-center">
              <Button 
                variant="outline" 
                onClick={() => navigate('/recruiter/jobs')}
                className="mb-4"
                aria-label="View all saved job descriptions"
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                View Saved JDs
              </Button>
              <p className="text-xs text-muted-foreground">
                Select an existing job description to edit or use as a template
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Upload Option */}
              <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary" onClick={() => setMode('upload')}>
                <CardContent className="pt-6 text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="p-4 bg-primary/10 rounded-full">
                      <FileUp className="h-12 w-12 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Upload Document</h3>
                    <p className="text-sm text-muted-foreground">
                      Upload a job description file (PDF, DOCX, TXT) and let AI auto-fill the wizard
                    </p>
                  </div>
                  <Button className="w-full" onClick={() => setMode('upload')}>
                    <FileUp className="h-4 w-4 mr-2" />
                    Upload File
                  </Button>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>✓ Fast and automated</p>
                    <p>✓ AI-powered parsing</p>
                    <p>✓ Review and edit after</p>
                  </div>
                </CardContent>
              </Card>

              {/* Manual Option */}
              <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary" onClick={handleManualStart}>
                <CardContent className="pt-6 text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="p-4 bg-green-100 rounded-full">
                      <Edit3 className="h-12 w-12 text-green-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Create Manually</h3>
                    <p className="text-sm text-muted-foreground">
                      Fill out the wizard step-by-step with guided prompts and AI assistance
                    </p>
                  </div>
                  <Button variant="outline" className="w-full" onClick={handleManualStart}>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Start from Scratch
                  </Button>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>✓ Full control</p>
                    <p>✓ Step-by-step guidance</p>
                    <p>✓ AI content generation</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {onCancel && (
              <div className="mt-6 text-center">
                <Button variant="ghost" onClick={onCancel}>
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Upload mode
  if (mode === 'upload') {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setMode('select')}>
            ← Back to Options
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate('/recruiter/jobs')}
              aria-label="View all saved job descriptions"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Saved JDs
            </Button>
            <Button variant="outline" onClick={handleManualStart}>
              Skip & Create Manually
            </Button>
          </div>
        </div>

        <JDFileUpload
          recruiterId={recruiterId}
          companyId={companyId}
          onParsed={handleParsed}
          onCancel={() => setMode('select')}
          allowBatch={false}
        />
      </div>
    );
  }

  // Manual/Wizard mode (with or without pre-filled data)
  return (
    <div>
      {parsedData && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            ✓ Job description parsed successfully! Review and edit the information below.
          </p>
        </div>
      )}
      
      <JobDescriptionWizard
        key={jdId || initialJdId || 'wizard'} // Force re-mount
        recruiterId={recruiterId}
        companyId={companyId}
        initialData={parsedData || initialData}
        initialJdId={jdId || initialJdId}
        onComplete={onComplete}
        onCancel={onCancel}
      />
    </div>
  );
};

export default JDWizardWithUpload;

