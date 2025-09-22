
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface NavigationFooterProps {
  currentSectionIndex: number;
  totalSections: number;
  onPreviousSection: () => void;
  onNextSection: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
}

export const NavigationFooter: React.FC<NavigationFooterProps> = ({
  currentSectionIndex,
  totalSections,
  onPreviousSection,
  onNextSection,
  canGoPrevious,
  canGoNext
}) => {
  return (
    <div className="flex justify-between items-center pt-6">
      <Button
        variant="outline"
        onClick={onPreviousSection}
        disabled={!canGoPrevious}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Previous Section
      </Button>
      
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Section {currentSectionIndex + 1} of {totalSections}
        </p>
      </div>

      <Button
        onClick={onNextSection}
        disabled={!canGoNext}
      >
        Next Section
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
};
