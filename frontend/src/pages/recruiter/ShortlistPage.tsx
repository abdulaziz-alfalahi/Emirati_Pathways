import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShortlistManager } from '@/components/recruiter/shortlist/ShortlistManager';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Shortlist Page
 * Displays the shortlist manager for a specific job description
 */
const ShortlistPage: React.FC = () => {
  const { jdId } = useParams<{ jdId: string }>();
  const navigate = useNavigate();

  if (!jdId) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">No job description ID provided</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 pt-3 pb-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/recruiter')}
          className="gap-1 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
      <ShortlistManager jdId={jdId} />
    </div>
  );
};

export default ShortlistPage;
