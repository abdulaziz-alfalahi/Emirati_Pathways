
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Save, Loader2 } from 'lucide-react';

export function ParsedDataForm({ 
  parsedData, 
  manualFields, 
  setManualFields, 
  handleSaveToDatabase, 
  isSaving 
}) {
  if (!parsedData) return null;
  
  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium">Parsed Job Description</h3>
      </div>
      
      <div className="space-y-4 mb-6 border p-4 rounded-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Required fields with manual input */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <Input
              value={manualFields.title}
              onChange={(e) => setManualFields({...manualFields, title: e.target.value})}
              placeholder="Job Title"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Company <span className="text-red-500">*</span>
            </label>
            <Input
              value={manualFields.company}
              onChange={(e) => setManualFields({...manualFields, company: e.target.value})}
              placeholder="Company Name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Location
            </label>
            <Input
              value={manualFields.location}
              onChange={(e) => setManualFields({...manualFields, location: e.target.value})}
              placeholder="Job Location"
            />
          </div>
        </div>
        
        <Alert className="bg-amber-50 text-amber-800 border-amber-200">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Review Required</AlertTitle>
          <AlertDescription>
            Please review and complete any missing required fields before saving.
          </AlertDescription>
        </Alert>
        
        <Button 
          onClick={handleSaveToDatabase}
          disabled={isSaving || !manualFields.title || !manualFields.company}
          className="w-full mt-4"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save to Database
            </>
          )}
        </Button>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-md">
        <h4 className="text-sm font-medium mb-2">Raw Parsed Data</h4>
        <pre className="whitespace-pre-wrap text-sm overflow-auto max-h-[400px]">
          {JSON.stringify(parsedData, null, 2)}
        </pre>
      </div>
    </div>
  );
}
