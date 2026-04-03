import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Target,
  Languages,
  Globe,
  Zap,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface BilingualCVData {
  // keep loose shape so this compiles regardless of parser details
  [key: string]: any;
  _bilingual_data?: {
    metadata?: {
      original_language?: string;
      supported_languages?: string[];
      translation_status?: Record<string, string>;
      processing_info?: {
        parsing_time?: number;
        translation_time?: number;
        total_time?: number;
      };
    };
  };
  _language_info?: {
    original_language?: string;
    translation_included?: boolean;
    target_language?: string;
  };
}

interface CVUploadParserProps {
  onParsedData?: (data: BilingualCVData) => void;
  className?: string;
}

const CVUploadParser: React.FC<CVUploadParserProps> = ({ onParsedData, className = '' }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parseProgress, setParseProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parseStatus, setParseStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<boolean | null>(null);
  const [detectedLanguage, setDetectedLanguage] = useState<string>('');
  const [includeTranslation, setIncludeTranslation] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState<'en' | 'ar'>('ar');
  const [processingStats, setProcessingStats] = useState<{
    parsing_time?: number;
    translation_time?: number;
    total_time?: number;
  }>({});

  const simulateProgress = (setter: (v: number) => void, duration = 2000) =>
    new Promise<void>((resolve) => {
      let v = 0;
      const id = setInterval(() => {
        v += Math.random() * 15;
        if (v >= 100) {
          v = 100;
          setter(v);
          clearInterval(id);
          resolve();
        } else {
          setter(v);
        }
      }, duration / 10);
    });

  // Optional connectivity probe — keeps state as boolean (fixes the previous SetStateAction<boolean> error)
  const checkConnection = async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/health', { method: 'GET' });
      const ok = res.ok;
      setConnectionStatus(ok); // ✅ boolean, not an object
      return ok;
    } catch {
      setConnectionStatus(false);
      return false;
    }
  };

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;

    const file = files[0];
    setUploadedFile(file);
    setIsUploading(true);
    setUploadProgress(0);
    setParseStatus('idle');
    setErrorMessage('');
    setDetectedLanguage('');
    setProcessingStats({});

    try {
      // Upload simulation
      await simulateProgress(setUploadProgress, 1500);
      setIsUploading(false);

      setIsParsing(true);
      setParseProgress(0);

      // Check connection (optional)
      await checkConnection();

      // Parsing progress simulation
      const progressPromise = simulateProgress(setParseProgress, 8000);

      // Call your API (kept generic)
      const apiUrl = includeTranslation
        ? `/api/cv/upload?translate_to=${targetLanguage}`
        : '/api/cv/upload';

      const formData = new FormData();
      formData.append('cv_file', file);

      // Get auth token
      let authHeaders: Record<string, string> = {};
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        if (token) {
          authHeaders['Authorization'] = `Bearer ${token}`;
        }
      } catch { /* localStorage may not be available */ }

      const response = await fetch(apiUrl, { method: 'POST', headers: authHeaders, body: formData });

      await progressPromise;

      if (!response.ok) {
        let err = 'Parsing failed';
        try {
          const data = await response.json();
          err = data?.error || err;
        } catch {
          // ignore
        }
        throw new Error(err);
      }

      const result = (await response.json()) as {
        success?: boolean;
        data?: BilingualCVData;
        error?: string;
      };

      if (!result?.success || !result?.data) {
        throw new Error(result?.error || 'Parsing failed');
      }

      const cvData = result.data;

      const languageInfo = cvData._language_info;
      const bilingualData = cvData._bilingual_data;

      if (languageInfo?.original_language) {
        setDetectedLanguage(languageInfo.original_language);
      }
      if (bilingualData?.metadata?.processing_info) {
        setProcessingStats(bilingualData.metadata.processing_info);
      }

      setIsParsing(false);
      setParseStatus('success');

      onParsedData?.(cvData);

      toast.success(
        `CV parsed successfully${languageInfo?.original_language ? ` (${languageInfo.original_language.toUpperCase()})` : ''}${
          languageInfo?.translation_included ? ` + ${targetLanguage.toUpperCase()} translation` : ''
        }`
      );
    } catch (error) {
      setIsUploading(false);
      setIsParsing(false);
      setParseStatus('error');
      const msg = error instanceof Error ? error.message : 'Unknown error occurred';
      setErrorMessage(msg);
      toast.error(`Parsing failed: ${msg}`);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileUpload,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    maxSize: 16 * 1024 * 1024, // 16MB
  });

  const statusIcon = () => {
    if (isUploading || isParsing) {
      return <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />;
    }
    switch (parseStatus) {
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-6 w-6 text-red-600" />;
      default:
        return <Upload className="h-6 w-6 text-gray-400" />;
    }
  };

  const statusText = () => {
    if (isUploading) return 'Uploading file...';
    if (isParsing) return 'Parsing CV with AI...';
    switch (parseStatus) {
      case 'success':
        return `✅ Successfully parsed CV${detectedLanguage ? ` (${detectedLanguage.toUpperCase()})` : ''}`;
      case 'error':
        return `❌ Parsing failed: ${errorMessage}`;
      default:
        return 'Ready to upload CV';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Bilingual Settings */}
      <Card className="border-dashed border-2 border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Languages className="h-4 w-4" />
            Bilingual Processing Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="include-translation" className="text-sm font-medium">
                Include Translation
              </Label>
              <p className="text-xs text-muted-foreground">
                Automatically translate CV to target language during parsing
              </p>
            </div>
            <Switch
              id="include-translation"
              checked={includeTranslation}
              onCheckedChange={setIncludeTranslation}
            />
          </div>

          {includeTranslation && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Target Language</Label>
              <div className="flex gap-2">
                <Button
                  variant={targetLanguage === 'en' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTargetLanguage('en')}
                  className="flex items-center gap-1"
                >
                  <Globe className="h-3 w-3" />
                  English
                </Button>
                <Button
                  variant={targetLanguage === 'ar' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTargetLanguage('ar')}
                  className="flex items-center gap-1"
                >
                  <Globe className="h-3 w-3" />
                  العربية
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive
                ? 'border-blue-500 bg-blue-50'
                : parseStatus === 'success'
                ? 'border-green-500 bg-green-50'
                : parseStatus === 'error'
                ? 'border-red-500 bg-red-50'
                : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
              }
            `}
          >
            <input {...getInputProps()} />

            <div className="space-y-4">
              <div className="flex justify-center">{statusIcon()}</div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {isDragActive ? 'Drop your CV here' : 'Upload CV for Parsing'}
                </h3>
                <p className="text-gray-600 mt-1">{statusText()}</p>
              </div>

              {!isUploading && !isParsing && (
                <div className="text-sm text-gray-500">
                  <p>Drag & drop your CV here, or click to select</p>
                  <p className="mt-1">Supports PDF, DOC, DOCX, TXT (Max 16MB)</p>
                </div>
              )}

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}

              {isParsing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      AI Processing...
                    </span>
                    <span>{Math.round(parseProgress)}%</span>
                  </div>
                  <Progress value={parseProgress} className="w-full" />
                </div>
              )}

              {uploadedFile && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">{uploadedFile.name}</span>
                    <Badge variant="secondary">
                      {(uploadedFile.size / 1024 / 1024).toFixed(1)} MB
                    </Badge>
                  </div>
                </div>
              )}

              {detectedLanguage && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-900">
                      Detected Language: {detectedLanguage.toUpperCase()}
                    </span>
                  </div>
                </div>
              )}

              {Object.keys(processingStats).length > 0 && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {processingStats.parsing_time !== undefined && (
                      <div className="flex items-center gap-1">
                        <Zap className="h-3 w-3 text-green-600" />
                        <span>Parsing: {processingStats.parsing_time.toFixed(1)}s</span>
                      </div>
                    )}
                    {processingStats.translation_time !== undefined && (
                      <div className="flex items-center gap-1">
                        <Languages className="h-3 w-3 text-green-600" />
                        <span>Translation: {processingStats.translation_time.toFixed(1)}s</span>
                      </div>
                    )}
                    {processingStats.total_time !== undefined && (
                      <div className="flex items-center gap-1 col-span-2">
                        <Clock className="h-3 w-3 text-green-600" />
                        <span className="font-medium">Total: {processingStats.total_time.toFixed(1)}s</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {connectionStatus !== null && (
                <div
                  className={`mt-4 p-3 rounded-lg ${
                    connectionStatus ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm">
                    {connectionStatus ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-green-800">✅ API Connection: Healthy</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <span className="text-red-800">❌ API Connection: Failed</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <Target className="h-4 w-4" />
          <span>High Accuracy Parsing</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Languages className="h-4 w-4" />
          <span>Bilingual Support</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Sparkles className="h-4 w-4" />
          <span>AI-Powered Extraction</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Zap className="h-4 w-4" />
          <span>Fast Processing</span>
        </div>
      </div>
    </div>
  );
};

export default CVUploadParser;

