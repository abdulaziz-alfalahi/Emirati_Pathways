import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  File, 
  FileText, 
  X, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  FileUp,
  FilePlus
} from 'lucide-react';
import { apiClient } from '@/utils/apiClient';

interface JDFileUploadProps {
  recruiterId: string;
  companyId: string;
  onParsed: (parsedData: any, jdId?: string) => void;
  onCancel?: () => void;
  allowBatch?: boolean;
  className?: string;
}

const JDFileUpload: React.FC<JDFileUploadProps> = ({
  recruiterId,
  companyId,
  onParsed,
  onCancel,
  allowBatch = false,
  className = ''
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedExtensions = ['pdf', 'docx', 'doc', 'txt'];
  const maxFileSize = 10 * 1024 * 1024; // 10MB

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Validate files
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      
      if (!ext || !allowedExtensions.includes(ext)) {
        errors.push(`${file.name}: Invalid file type. Allowed: ${allowedExtensions.join(', ')}`);
        return;
      }
      
      if (file.size > maxFileSize) {
        errors.push(`${file.name}: File too large (max 10MB)`);
        return;
      }
      
      validFiles.push(file);
    });

    if (errors.length > 0) {
      setError(errors.join('\n'));
      return;
    }

    if (!allowBatch && validFiles.length > 1) {
      setError('Only one file allowed. Enable batch mode for multiple files.');
      return;
    }

    setSelectedFiles(validFiles);
    setError(null);
    setSuccess(null);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    
    // Create a fake event to reuse validation logic
    const fakeEvent = {
      target: { files }
    } as any;
    
    handleFileSelect(fakeEvent);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadAndParse = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one file');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      
      if (allowBatch && selectedFiles.length > 1) {
        // Batch upload
        selectedFiles.forEach(file => {
          formData.append('files[]', file);
        });
        formData.append('recruiter_id', recruiterId);
        formData.append('company_id', companyId);
        formData.append('create_drafts', 'true');

        // FormData uploads need special handling
        const baseUrl = apiClient.getBaseURL();
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${baseUrl}/api/recruiter/jd/upload/batch`, {
          method: 'POST',
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: formData
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const data = await response.json();
        setUploadProgress(100);
        setSuccess(`Successfully processed ${data.success_count} out of ${data.total_files} files`);
        
        // Return first successful result
        const firstSuccess = data.results.find((r: any) => r.success);
        if (firstSuccess) {
          onParsed(firstSuccess.jd_data, firstSuccess.jd_id);
        }
      } else {
        // Single file upload
        formData.append('file', selectedFiles[0]);
        formData.append('recruiter_id', recruiterId);
        formData.append('company_id', companyId);
        formData.append('create_draft', 'true');

        // FormData uploads need special handling
        const baseUrl = apiClient.getBaseURL();
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${baseUrl}/api/recruiter/jd/upload/parse`, {
          method: 'POST',
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: formData
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const data = await response.json();
        setUploadProgress(100);
        setSuccess(`Successfully parsed ${selectedFiles[0].name}`);
        
        // Call callback with complete JD data (not just parsed_data)
        onParsed(data.jd_data, data.jd_id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload and parse file');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-500" />;
      case 'docx':
      case 'doc':
        return <FileText className="h-8 w-8 text-blue-500" />;
      case 'txt':
        return <File className="h-8 w-8 text-gray-500" />;
      default:
        return <File className="h-8 w-8 text-gray-500" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileUp className="h-5 w-5" />
          Upload Job Description
        </CardTitle>
        <CardDescription>
          Upload a job description document (PDF, DOCX, TXT) and let AI auto-fill the wizard
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drag & Drop Area */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-gray-50 transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple={allowBatch}
            accept={allowedExtensions.map(ext => `.${ext}`).join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="flex flex-col items-center gap-4">
            {allowBatch ? (
              <FilePlus className="h-12 w-12 text-gray-400" />
            ) : (
              <Upload className="h-12 w-12 text-gray-400" />
            )}
            
            <div>
              <p className="text-lg font-medium text-gray-700">
                {allowBatch ? 'Drop files here or click to browse' : 'Drop file here or click to browse'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Supported formats: {allowedExtensions.join(', ').toUpperCase()}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Maximum file size: 10MB
              </p>
            </div>
          </div>
        </div>

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Selected Files:</h4>
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getFileIcon(file.name)}
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                
                {!uploading && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Upload Progress */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Uploading and parsing...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {success && (
          <Alert className="border-green-500 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={uploadAndParse}
            disabled={selectedFiles.length === 0 || uploading}
            className="flex-1"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload & Parse
              </>
            )}
          </Button>
          
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={uploading}
            >
              Cancel
            </Button>
          )}
        </div>

        {/* Info */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• AI will automatically extract job title, description, requirements, and more</p>
          <p>• You can review and edit the extracted information in the wizard</p>
          <p>• Supports English and Arabic content</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default JDFileUpload;

