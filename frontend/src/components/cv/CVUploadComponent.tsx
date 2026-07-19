import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X, Eye, Download } from 'lucide-react';
import { getAuthToken } from '@/utils/tokenUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CVUploadComponentProps {
  onUploadSuccess?: (result: any) => void;
  onUploadError?: (error: string) => void;
  maxFileSize?: number;
  allowedTypes?: string[];
}

interface UploadedFile {
  file: File;
  id: string;
  status: 'uploading' | 'success' | 'error';
  progress: number;
  result?: any;
  error?: string;
}

const CVUploadComponent: React.FC<CVUploadComponentProps> = ({
  onUploadSuccess,
  onUploadError,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  allowedTypes = ['pdf', 'docx', 'doc', 'txt']
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [cvText, setCvText] = useState('');
  const [isProcessingText, setIsProcessingText] = useState(false);
  const [activeTab, setActiveTab] = useState('file');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize) {
      return `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds maximum allowed size (${maxFileSize / 1024 / 1024}MB)`;
    }

    // Check file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !allowedTypes.includes(fileExtension)) {
      return `File type .${fileExtension} not supported. Allowed: ${allowedTypes.join(', ')}`;
    }

    return null;
  };

  const uploadFile = async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('cv_file', file);

    const response = await fetch('/api/cv/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Upload failed');
    }

    return response.json();
  };

  const uploadCVText = async (text: string): Promise<any> => {
    const response = await fetch('/api/cv/parse-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({ cv_text: text })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Text parsing failed');
    }

    return response.json();
  };

  const handleFileUpload = useCallback(async (files: FileList) => {
    const newFiles: UploadedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validationError = validateFile(file);

      if (validationError) {
        const errorFile: UploadedFile = {
          file,
          id: `${Date.now()}-${i}`,
          status: 'error',
          progress: 0,
          error: validationError
        };
        newFiles.push(errorFile);
        continue;
      }

      const uploadFile: UploadedFile = {
        file,
        id: `${Date.now()}-${i}`,
        status: 'uploading',
        progress: 0
      };
      newFiles.push(uploadFile);
    }

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Process uploads
    for (const uploadedFile of newFiles) {
      if (uploadedFile.status === 'error') continue;

      try {
        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadedFiles(prev =>
            prev.map(f =>
              f.id === uploadedFile.id
                ? { ...f, progress: Math.min(f.progress + 10, 90) }
                : f
            )
          );
        }, 200);

        const result = await uploadFile(uploadedFile.file);

        clearInterval(progressInterval);

        setUploadedFiles(prev =>
          prev.map(f =>
            f.id === uploadedFile.id
              ? { ...f, status: 'success', progress: 100, result }
              : f
          )
        );

        onUploadSuccess?.(result);
      } catch (error) {
        setUploadedFiles(prev =>
          prev.map(f =>
            f.id === uploadedFile.id
              ? { ...f, status: 'error', progress: 0, error: error.message }
              : f
          )
        );

        onUploadError?.(error.message);
      }
    }
  }, [maxFileSize, allowedTypes, onUploadSuccess, onUploadError]);

  const handleTextUpload = async () => {
    if (!cvText.trim()) {
      onUploadError?.('Please enter CV text');
      return;
    }

    if (cvText.length < 50) {
      onUploadError?.('CV text too short (minimum 50 characters)');
      return;
    }

    setIsProcessingText(true);

    try {
      const result = await uploadCVText(cvText);
      onUploadSuccess?.(result);
      setCvText('');
    } catch (error) {
      onUploadError?.(error.message);
    } finally {
      setIsProcessingText(false);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return <FileText className="h-5 w-5" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Upload className="h-5 w-5 text-blue-500 animate-pulse" />;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-6 w-6" />
          CV Upload & Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file">File Upload</TabsTrigger>
            <TabsTrigger value="text">Text Input</TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="space-y-4">
            {/* Drag and Drop Area */}
            <div
              className={`
                border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
                ${isDragOver 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                  : 'border-gray-300 hover:border-gray-400'
                }
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">
                Drop your CV here or click to browse
              </h3>
              <p className="text-gray-600 mb-4">
                Supports PDF, DOCX, DOC, and TXT files up to {maxFileSize / 1024 / 1024}MB
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="mx-auto"
              >
                <Upload className="h-4 w-4 me-2" />
                Choose Files
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={allowedTypes.map(type => `.${type}`).join(',')}
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Supported Formats */}
            <div className="flex flex-wrap gap-2 justify-center">
              {allowedTypes.map(type => (
                <Badge key={type} variant="secondary">
                  .{type.toUpperCase()}
                </Badge>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="text" className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Paste your CV content here
                </label>
                <Textarea
                  value={cvText}
                  onChange={(e) => setCvText(e.target.value)}
                  placeholder="Copy and paste your CV content here..."
                  className="min-h-[200px] resize-y"
                  maxLength={50000}
                />
                <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
                  <span>Minimum 50 characters required</span>
                  <span>{cvText.length}/50,000</span>
                </div>
              </div>
              <Button
                onClick={handleTextUpload}
                disabled={isProcessingText || cvText.length < 50}
                className="w-full"
              >
                {isProcessingText ? (
                  <>
                    <Upload className="h-4 w-4 me-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 me-2" />
                    Parse CV Text
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="mt-6 space-y-3">
            <h4 className="font-semibold">Uploaded Files</h4>
            {uploadedFiles.map((uploadedFile) => (
              <Card key={uploadedFile.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {getFileIcon(uploadedFile.file.name)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {uploadedFile.file.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {(uploadedFile.file.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                    {getStatusIcon(uploadedFile.status)}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Remove ${uploadedFile.file.name}`}
                    onClick={() => removeFile(uploadedFile.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {uploadedFile.status === 'uploading' && (
                  <div className="mt-3">
                    <Progress value={uploadedFile.progress} className="w-full" />
                    <p className="text-sm text-gray-500 mt-1">
                      Uploading... {uploadedFile.progress}%
                    </p>
                  </div>
                )}

                {uploadedFile.status === 'error' && uploadedFile.error && (
                  <Alert className="mt-3" variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{uploadedFile.error}</AlertDescription>
                  </Alert>
                )}

                {uploadedFile.status === 'success' && uploadedFile.result && (
                  <div className="mt-3 space-y-2">
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        CV processed successfully! Found {uploadedFile.result.data?.experience?.length || 0} work experiences and {uploadedFile.result.data?.skills?.length || 0} skills.
                      </AlertDescription>
                    </Alert>
                    
                    {uploadedFile.result.analysis && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 me-2" />
                          View Analysis
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 me-2" />
                          Download Report
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Help Text */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h5 className="font-semibold mb-2">Tips for better CV analysis:</h5>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Use clear section headings (Experience, Education, Skills)</li>
            <li>• Include specific dates and locations</li>
            <li>• List technical skills and certifications</li>
            <li>• Mention UAE experience and Arabic language skills</li>
            <li>• Keep formatting simple and consistent</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default CVUploadComponent;
