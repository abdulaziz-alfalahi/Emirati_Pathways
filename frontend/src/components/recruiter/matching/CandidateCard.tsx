
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, ThumbsDown, ThumbsUp, Video } from 'lucide-react';

interface Candidate {
  id: string;
  name: string;
  matchScore: number;
  skills: string[];
  experience: string;
  education: string;
  location: string;
  status?: 'shortlisted' | 'rejected' | 'pending' | 'hired';
}

interface CandidateCardProps {
  candidate: Candidate;
  onAction: (candidateId: string, action: 'shortlist' | 'reject' | 'message' | 'interview') => void;
}

const CandidateCard = ({ candidate, onAction }: CandidateCardProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  return (
    <div 
      className={`border rounded-lg p-4 ${
        candidate.status === 'shortlisted' 
          ? 'border-green-200 bg-green-50 dark:bg-green-950/20' 
          : candidate.status === 'rejected' 
            ? 'border-red-200 bg-red-50 dark:bg-red-950/20'
            : 'border-gray-200'
      }`}
    >
      <div className="flex flex-col md:flex-row justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg">{candidate.name}</h3>
            {candidate.status === 'shortlisted' && (
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                Shortlisted
              </Badge>
            )}
            {candidate.status === 'rejected' && (
              <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                Rejected
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {candidate.skills.slice(0, 5).map((skill, index) => (
              <Badge key={index} variant="secondary">{skill}</Badge>
            ))}
            {candidate.skills.length > 5 && (
              <Badge variant="outline">+{candidate.skills.length - 5} more</Badge>
            )}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <span className="text-muted-foreground">Experience:</span>
            <span>{candidate.experience}</span>
            <span className="text-muted-foreground">Education:</span>
            <span>{candidate.education}</span>
            <span className="text-muted-foreground">Location:</span>
            <span>{candidate.location}</span>
          </div>
        </div>
        
        <div className="flex flex-col items-center justify-center mt-4 md:mt-0">
          <div className="text-2xl font-bold">{candidate.matchScore}%</div>
          <div className="w-16 h-2 mt-2 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getScoreColor(candidate.matchScore)}`} 
              style={{ width: `${candidate.matchScore}%` }}
            ></div>
          </div>
          <div className="text-xs text-muted-foreground mt-1">Match Score</div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mt-4 justify-end">
        {candidate.status !== 'rejected' && (
          <Button 
            size="sm" 
            variant="destructive" 
            onClick={() => onAction(candidate.id, 'reject')}
          >
            <ThumbsDown className="h-4 w-4 me-1" /> Reject
          </Button>
        )}
        
        {candidate.status !== 'shortlisted' && (
          <Button 
            size="sm" 
            variant="default" 
            onClick={() => onAction(candidate.id, 'shortlist')}
          >
            <ThumbsUp className="h-4 w-4 me-1" /> Shortlist
          </Button>
        )}
        
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => onAction(candidate.id, 'message')}
        >
          <MessageSquare className="h-4 w-4 me-1" /> Message
        </Button>
        
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => onAction(candidate.id, 'interview')}
        >
          <Video className="h-4 w-4 me-1" /> Schedule Interview
        </Button>
      </div>
    </div>
  );
};

export default CandidateCard;
