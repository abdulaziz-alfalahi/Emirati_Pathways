
import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';
import CandidateCard from './CandidateCard';

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

interface CandidatesListProps {
  candidates: Candidate[];
  isMatching: boolean;
  onCandidateAction: (candidateId: string, action: 'shortlist' | 'reject' | 'message' | 'interview') => void;
}

const CandidatesList: React.FC<CandidatesListProps> = React.memo(({ 
  candidates, 
  isMatching, 
  onCandidateAction 
}) => {
  const candidateCount = useMemo(() => candidates.length, [candidates.length]);

  return (
    <Card>
      <CandidatesHeader candidateCount={candidateCount} />
      <CardContent>
        <CandidatesContent
          candidates={candidates}
          isMatching={isMatching}
          onCandidateAction={onCandidateAction}
        />
      </CardContent>
    </Card>
  );
});

CandidatesList.displayName = 'CandidatesList';

interface CandidatesHeaderProps {
  candidateCount: number;
}

const CandidatesHeader: React.FC<CandidatesHeaderProps> = React.memo(({ candidateCount }) => (
  <CardHeader className="flex-row justify-between items-center">
    <div>
      <CardTitle>Matching Candidates</CardTitle>
      <CardDescription>{candidateCount} candidates found</CardDescription>
    </div>
    <Button variant="outline" size="sm">
      <Filter className="h-4 w-4 me-1" /> Filter
    </Button>
  </CardHeader>
));

CandidatesHeader.displayName = 'CandidatesHeader';

interface CandidatesContentProps {
  candidates: Candidate[];
  isMatching: boolean;
  onCandidateAction: (candidateId: string, action: 'shortlist' | 'reject' | 'message' | 'interview') => void;
}

const CandidatesContent: React.FC<CandidatesContentProps> = React.memo(({
  candidates,
  isMatching,
  onCandidateAction
}) => {
  if (candidates.length > 0) {
    return (
      <div className="space-y-6">
        {candidates.map((candidate) => (
          <CandidateCard
            key={candidate.id}
            candidate={candidate}
            onAction={onCandidateAction}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="py-20 text-center">
      <div className="text-muted-foreground">
        {isMatching ? <MatchingState /> : <NoResultsState />}
      </div>
    </div>
  );
});

CandidatesContent.displayName = 'CandidatesContent';

const MatchingState: React.FC = React.memo(() => (
  <div className="flex flex-col items-center">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-4"></div>
    <p>Finding matching candidates...</p>
  </div>
));

MatchingState.displayName = 'MatchingState';

const NoResultsState: React.FC = React.memo(() => (
  <p>No matching candidates found. Try adjusting the match threshold.</p>
));

NoResultsState.displayName = 'NoResultsState';

export default CandidatesList;
