
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bookmark, Trash2 } from 'lucide-react';
import ProgramCard from './ProgramCard';

const SavedPrograms: React.FC = () => {
  // Mock saved programs - replace with actual data from your backend
  const [savedPrograms, setSavedPrograms] = useState([
    {
      id: '1',
      university_name: 'United Arab Emirates University',
      program_name: 'Master of Science in Computer Science',
      degree_level: 'Master',
      field_of_study: 'Computer Science',
      description: 'Advanced computer science program focusing on AI and machine learning',
      duration_years: 2,
      application_deadline: '2024-08-15',
      program_url: 'https://www.uaeu.ac.ae/en/programs/cs-ms',
      is_active: true,
      created_at: '2024-01-01',
      saved_date: '2024-01-10'
    },
    {
      id: '2',
      university_name: 'American University of Sharjah',
      program_name: 'Bachelor of Architecture',
      degree_level: 'Bachelor',
      field_of_study: 'Architecture',
      description: 'Five-year professional program focusing on design and theory',
      duration_years: 5,
      application_deadline: '2024-09-01',
      program_url: 'https://www.aus.edu/architecture',
      is_active: true,
      created_at: '2024-01-01',
      saved_date: '2024-01-12'
    }
  ]);

  const handleRemoveFromSaved = (programId: string) => {
    setSavedPrograms(prev => prev.filter(program => program.id !== programId));
  };

  const handleApply = (programId: string) => {
    console.log('Apply to program:', programId);
    // Implement application logic
  };

  if (savedPrograms.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Saved Programs</h3>
            <p className="text-muted-foreground mb-4">
              Save programs you're interested in to easily find them later.
            </p>
            <Button>Browse Programs</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Your Saved Programs</h3>
        <div className="text-sm text-muted-foreground">
          {savedPrograms.length} program{savedPrograms.length !== 1 ? 's' : ''} saved
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {savedPrograms.map((program) => (
          <div key={program.id} className="relative">
            <ProgramCard
              program={program}
              onApply={handleApply}
              isSaved={true}
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={() => handleRemoveFromSaved(program.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="text-center">
            <h4 className="font-semibold text-blue-900 mb-2">Ready to Apply?</h4>
            <p className="text-sm text-blue-700 mb-4">
              Review your saved programs and start your applications before the deadlines.
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700">
              Start Applications
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SavedPrograms;
