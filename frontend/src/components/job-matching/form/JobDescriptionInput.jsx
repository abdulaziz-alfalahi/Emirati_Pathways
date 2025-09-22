
import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

export function JobDescriptionInput({ 
  jobDescription, 
  setJobDescription, 
  handleSubmit, 
  isLoading 
}) {
  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Enter Job Description
        </label>
        <Textarea
          placeholder="Paste job description here..."
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          className="min-h-[200px]"
        />
      </div>
      <div className="flex flex-col gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Parsing...
            </>
          ) : (
            'Parse Job Description'
          )}
        </Button>
      </div>
    </form>
  );
}
