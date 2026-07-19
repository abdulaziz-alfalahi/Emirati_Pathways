
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PageHeader = () => {
  const navigate = useNavigate();
  
  return (
    <div className="flex items-center gap-2 mb-6">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => navigate('/recruiter')}
      >
        <ChevronLeft className="h-4 w-4 me-1" /> Back
      </Button>
      <h1 className="text-3xl font-bold">Matching Candidates</h1>
    </div>
  );
};

export default PageHeader;
