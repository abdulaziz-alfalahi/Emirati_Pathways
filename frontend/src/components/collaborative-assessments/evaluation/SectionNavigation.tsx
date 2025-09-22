
import React from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { AssessmentSection } from '@/types/collaborativeAssessments';
import { CollaborativeCursors } from '../realtime/CollaborativeCursors';
import { CollaborationSession } from '@/services/collaborativeAssessments/realtimeCollaborationService';

interface SectionNavigationProps {
  currentSection: AssessmentSection;
  currentSectionIndex: number;
  totalSections: number;
  sectionProgress: number;
  evaluatedCriteria: number;
  totalCriteria: number;
  onPreviousSection: () => void;
  onNextSection: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  activeCollaborators: CollaborationSession[];
}

export const SectionNavigation: React.FC<SectionNavigationProps> = ({
  currentSection,
  currentSectionIndex,
  totalSections,
  sectionProgress,
  evaluatedCriteria,
  totalCriteria,
  onPreviousSection,
  onNextSection,
  canGoPrevious,
  canGoNext,
  activeCollaborators
}) => {
  return (
    <div className="bg-white border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onPreviousSection}
            disabled={!canGoPrevious}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          <div>
            <h2 className="text-xl font-semibold">{currentSection.title}</h2>
            <p className="text-sm text-muted-foreground">
              Section {currentSectionIndex + 1} of {totalSections}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onNextSection}
          disabled={!canGoNext}
        >
          Next
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {currentSection.description && (
        <p className="text-muted-foreground mb-4">{currentSection.description}</p>
      )}

      {/* Show collaborative cursors for current section */}
      <CollaborativeCursors
        collaborators={activeCollaborators}
        currentSectionId={currentSection.id}
        className="mb-4"
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Progress:</span>
            <Progress value={sectionProgress} className="w-32" />
            <span className="text-sm text-muted-foreground">
              {Math.round(sectionProgress)}%
            </span>
          </div>
          
          <Badge variant="outline">
            {evaluatedCriteria} of {totalCriteria} criteria evaluated
          </Badge>
        </div>
      </div>
    </div>
  );
};
