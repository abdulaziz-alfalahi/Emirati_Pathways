// Enhanced Job Description Components with Production API Integration
// These components integrate with your production Flask API for job description parsing

// src/components/job-matching/JobDescriptionForm.tsx
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  FileText, 
  Wand2, 
  Save, 
  Eye, 
  CheckCircle, 
  AlertCircle,
  Building,
  MapPin,
  DollarSign,
  Clock,
  Users,
  Briefcase,
  GraduationCap,
  Award,
  Languages as LanguagesIcon,
  RefreshCw
} from 'lucide-react';
import { JobDescription, ApiResponse } from '@/types/platform';
import { jobApi, handleApiError } from '@/utils/api';
import { useJobDescription } from './hooks/useJobDescription';

interface ParsedDataDisplayProps {
  data: Partial<JobDescription>;
  onEdit: (field: string, value: any) => void;
  onSave: () => void;
  isSaving: boolean;
}

function ParsedDataDisplay({ data, onEdit, onSave, isSaving }: ParsedDataDisplayProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const handleEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue || '');
  };

  const handleSaveEdit = () => {
    if (editingField) {
      onEdit(editingField, editValue);
      setEditingField(null);
      setEditValue('');
    }
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const renderEditableField = (field: string, label: string, value: string, multiline = false) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="font-medium">{label}</Label>
        {editingField !== field && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleEdit(field, value)}
          >
            Edit
          </Button>
        )}
      </div>
      
      {editingField === field ? (
        <div className="space-y-2">
          {multiline ? (
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              rows={4}
              className="resize-none"
            />
          ) : (
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
            />
          )}
          <div className="flex space-x-2">
            <Button size="sm" onClick={handleSaveEdit}>
              <CheckCircle className="h-4 w-4 me-1" />
              Save
            </Button>
            <Button variant="outline" size="sm" onClick={handleCancelEdit}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-gray-50 rounded-md">
          <p className="text-sm">{value || 'Not specified'}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>Basic Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderEditableField('title', 'Job Title', data.title || '')}
            {renderEditableField('company', 'Company', data.company || '')}
            {renderEditableField('location', 'Location', data.location || '')}
            <div className="space-y-2">
              <Label className="font-medium">Employment Type</Label>
              <div className="p-3 bg-gray-50 rounded-md">
                <Badge variant="secondary">
                  {data.employment_type || 'Not specified'}
                </Badge>
              </div>
            </div>
          </div>
          
          {renderEditableField('description', 'Job Description', data.description || '', true)}
        </CardContent>
      </Card>

      {/* Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <span>Requirements</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Skills */}
          {data.requirements?.skills && data.requirements.skills.length > 0 && (
            <div>
              <Label className="font-medium flex items-center space-x-2 mb-3">
                <Award className="h-4 w-4" />
                <span>Required Skills</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {data.requirements.skills.map((skill, index) => (
                  <Badge 
                    key={index} 
                    variant={skill.required ? 'default' : 'secondary'}
                    className="flex items-center space-x-1"
                  >
                    <span>{skill.name}</span>
                    {skill.level && (
                      <span className="text-xs">({skill.level})</span>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Experience */}
          {data.requirements?.experience && data.requirements.experience.length > 0 && (
            <div>
              <Label className="font-medium flex items-center space-x-2 mb-3">
                <Briefcase className="h-4 w-4" />
                <span>Experience Requirements</span>
              </Label>
              <div className="space-y-2">
                {data.requirements.experience.map((exp, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {exp.years} years {exp.field && `in ${exp.field}`}
                      </span>
                      <Badge variant={exp.required ? 'default' : 'secondary'}>
                        {exp.required ? 'Required' : 'Preferred'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {data.requirements?.education && data.requirements.education.length > 0 && (
            <div>
              <Label className="font-medium flex items-center space-x-2 mb-3">
                <GraduationCap className="h-4 w-4" />
                <span>Education Requirements</span>
              </Label>
              <div className="space-y-2">
                {data.requirements.education.map((edu, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{edu.degree}</span>
                        {edu.field && <span className="text-gray-600"> in {edu.field}</span>}
                      </div>
                      <Badge variant={edu.required ? 'default' : 'secondary'}>
                        {edu.required ? 'Required' : 'Preferred'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {data.requirements?.languages && data.requirements.languages.length > 0 && (
            <div>
              <Label className="font-medium flex items-center space-x-2 mb-3">
                <LanguagesIcon className="h-4 w-4" />
                <span>Language Requirements</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {data.requirements.languages.map((lang, index) => (
                  <Badge 
                    key={index} 
                    variant={lang.required ? 'default' : 'secondary'}
                    className="flex items-center space-x-1"
                  >
                    <span>{lang.language}</span>
                    <span className="text-xs">({lang.proficiency})</span>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>Additional Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.salary && (
            <div>
              <Label className="font-medium">Salary Range</Label>
              <div className="p-3 bg-gray-50 rounded-md">
                <span className="font-medium">
                  {data.salary.currency || 'AED'} {data.salary.min?.toLocaleString()} - {data.salary.max?.toLocaleString()}
                </span>
                <span className="text-gray-600 ms-2">per {data.salary.period || 'month'}</span>
              </div>
            </div>
          )}

          {data.benefits && data.benefits.length > 0 && (
            <div>
              <Label className="font-medium">Benefits</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {data.benefits.map((benefit, index) => (
                  <Badge key={index} variant="outline">
                    {benefit}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {data.work_mode && (
            <div>
              <Label className="font-medium">Work Mode</Label>
              <div className="p-3 bg-gray-50 rounded-md">
                <Badge variant="secondary">{data.work_mode}</Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Parsing Metadata */}
      {data.parsing_metadata && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wand2 className="h-5 w-5" />
              <span>Parsing Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                Method: {data.parsing_metadata.extraction_method}
              </Badge>
              {data.parsing_metadata.confidence_score && (
                <Badge variant="outline">
                  Confidence: {data.parsing_metadata.confidence_score}%
                </Badge>
              )}
              {data.parsing_metadata.language_detected && (
                <Badge variant="outline">
                  Language: {data.parsing_metadata.language_detected}
                </Badge>
              )}
              {data.parsing_metadata.source_format && (
                <Badge variant="outline">
                  Format: {data.parsing_metadata.source_format}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={onSave}
          disabled={isSaving}
          className="bg-green-600 hover:bg-green-700"
        >
          {isSaving ? (
            <>
              <RefreshCw className="h-4 w-4 me-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 me-2" />
              Save Job Description
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export function JobDescriptionForm() {
  const {
    jobDescription,
    setJobDescription,
    parsedData,
    isLoading,
    isUploading,
    isSaving,
    apiStatus,
    errorMessage,
    manualFields,
    setManualFields,
    handleSubmit,
    handleFileUpload,
    handleSaveToDatabase,
    validation
  } = useJobDescription();

  const [activeTab, setActiveTab] = useState('text');
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(Array.from(e.dataTransfer.files));
    }
  }, [handleFileUpload]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileUpload(Array.from(e.target.files));
    }
  }, [handleFileUpload]);

  const handleEditParsedData = (field: string, value: any) => {
    // Update the parsed data - this would typically update the state in useJobDescription
    console.log(`Editing field ${field} with value:`, value);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Job Description Parser
        </h1>
        <p className="text-gray-600">
          Parse job descriptions from text or files using advanced AI processing
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="text" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Text Input</span>
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center space-x-2">
            <Upload className="h-4 w-4" />
            <span>File Upload</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Enter Job Description</CardTitle>
              <CardDescription>
                Paste the job description text below and our AI will extract structured information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="jobDescription">Job Description Text</Label>
                  <Textarea
                    id="jobDescription"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the complete job description here..."
                    rows={12}
                    className="resize-none"
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{jobDescription.length} characters</span>
                    <span>Supports Arabic and English text</span>
                  </div>
                </div>

                {/* Manual Fields Override */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="manualTitle">Job Title (Override)</Label>
                    <Input
                      id="manualTitle"
                      value={manualFields.title}
                      onChange={(e) => setManualFields({ ...manualFields, title: e.target.value })}
                      placeholder="e.g., Senior Software Engineer"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manualCompany">Company (Override)</Label>
                    <Input
                      id="manualCompany"
                      value={manualFields.company}
                      onChange={(e) => setManualFields({ ...manualFields, company: e.target.value })}
                      placeholder="e.g., Tech Solutions LLC"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manualLocation">Location (Override)</Label>
                    <Input
                      id="manualLocation"
                      value={manualFields.location}
                      onChange={(e) => setManualFields({ ...manualFields, location: e.target.value })}
                      placeholder="e.g., Dubai, UAE"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={!jobDescription.trim() || isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 me-2 animate-spin" />
                      Parsing Job Description...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 me-2" />
                      Parse Job Description
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Job Description Files</CardTitle>
              <CardDescription>
                Upload PDF, Word documents, or text files containing job descriptions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">
                    {dragActive ? 'Drop files here' : 'Upload job description files'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports PDF, Word documents, and text files
                  </p>
                  <p className="text-xs text-gray-400">
                    Maximum file size: 10MB per file
                  </p>
                </div>
                <div className="mt-4">
                  <Button variant="outline" onClick={() => document.getElementById('fileInput')?.click()}>
                    Choose Files
                  </Button>
                  <input
                    id="fileInput"
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </div>
              </div>

              {isUploading && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Processing files...</span>
                    <span>Please wait</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Error Display */}
      {errorMessage && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Error:</strong> {errorMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Success/Results Display */}
      {apiStatus === 'success' && parsedData && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <CardTitle className="text-green-800">Parsing Successful</CardTitle>
              </div>
              <Badge variant="secondary">
                {Object.keys(parsedData).length} fields extracted
              </Badge>
            </div>
            <CardDescription className="text-green-700">
              Job description has been successfully parsed and structured. Review the extracted information below.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Parsed Data Display */}
      {parsedData && (
        <ParsedDataDisplay
          data={parsedData}
          onEdit={handleEditParsedData}
          onSave={handleSaveToDatabase}
          isSaving={isSaving}
        />
      )}

      {/* Validation Summary */}
      {(Object.keys(validation.errors).length > 0 || Object.keys(validation.warnings).length > 0) && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              {Object.keys(validation.errors).length > 0 && (
                <div>
                  <p className="font-medium text-red-800">Issues found:</p>
                  <ul className="list-disc list-inside text-sm text-red-700">
                    {Object.entries(validation.errors).map(([field, error]) => (
                      <li key={field}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
              {Object.keys(validation.warnings).length > 0 && (
                <div>
                  <p className="font-medium text-yellow-800">Recommendations:</p>
                  <ul className="list-disc list-inside text-sm text-yellow-700">
                    {Object.entries(validation.warnings).map(([field, warning]) => (
                      <li key={field}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

