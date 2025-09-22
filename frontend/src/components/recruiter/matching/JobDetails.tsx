
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Json } from '@/integrations/supabase/types';

interface JobDetailsProps {
  jobDescription: any;
  matchThreshold: number;
  setMatchThreshold: (value: number) => void;
  handleFindMatches: () => void;
  isMatching: boolean;
}

const JobDetails = ({ 
  jobDescription, 
  matchThreshold, 
  setMatchThreshold,
  handleFindMatches,
  isMatching 
}: JobDetailsProps) => {

  // Function to safely render job description fields that might be in different formats
  const renderJobDescriptionText = (text: any): string => {
    if (typeof text === 'string') return text;
    if (Array.isArray(text)) return text.map(item => String(item)).join(', ');
    if (text && typeof text === 'object') return JSON.stringify(text);
    return 'No description available.';
  };

  // Function to safely render requirement items
  const renderRequirements = () => {
    if (!jobDescription?.requirements) return null;
    
    let requirements: string[] = [];
    
    // Handle different formats of requirements data
    if (Array.isArray(jobDescription.requirements)) {
      // Convert all items to strings to handle Json array that might contain numbers
      requirements = (jobDescription.requirements as Json[]).map(item => String(item));
    } else if (typeof jobDescription.requirements === 'string') {
      requirements = [jobDescription.requirements];
    } else if (jobDescription.requirements && typeof jobDescription.requirements === 'object') {
      // Try to extract an array if possible
      const reqObj = jobDescription.requirements as Record<string, Json>;
      if (reqObj.skills && Array.isArray(reqObj.skills)) {
        requirements = (reqObj.skills as Json[]).map((skill: Json) => 
          typeof skill === 'string' ? skill : 
          typeof skill === 'object' && skill !== null && 'name' in skill ? String(skill.name) : 
          String(skill)
        );
      } else {
        // If it's an object but not in the expected format, convert to string
        requirements = [JSON.stringify(jobDescription.requirements)];
      }
    }
    
    if (requirements.length === 0) return null;
    
    return (
      <div>
        <h3 className="font-medium mb-2">Requirements</h3>
        <ul className="list-disc pl-5 text-sm space-y-1">
          {requirements.map((req, index) => (
            <li key={index}>{req}</li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{jobDescription?.title || 'Job Description'}</CardTitle>
        <CardDescription>
          {jobDescription?.company ? `at ${jobDescription.company}` : ''} 
          {jobDescription?.location ? ` • ${jobDescription.location}` : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Job Description</h3>
            <p className="text-sm">{renderJobDescriptionText(jobDescription?.description)}</p>
          </div>
          
          {renderRequirements()}
          
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <label className="text-sm font-medium">Minimum Match Score: {matchThreshold}%</label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={matchThreshold}
                onChange={(e) => setMatchThreshold(parseInt(e.target.value))}
                className="w-full max-w-xs"
              />
            </div>
            
            <Button 
              onClick={handleFindMatches} 
              disabled={isMatching}
            >
              {isMatching ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Finding...
                </>
              ) : (
                <>Refresh Matches</>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default JobDetails;
