import React from 'react';
import { useParams } from 'react-router-dom';
import ShortlistManager from '@/components/recruiter/shortlist/ShortlistManager';

/**
 * Shortlist Page
 * Displays the shortlist manager for a specific job description
 */
const ShortlistPage: React.FC = () => {
  const { jdId } = useParams<{ jdId: string }>();

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
      <ShortlistManager jdId={jdId} />
    </div>
  );
};

export default ShortlistPage;

