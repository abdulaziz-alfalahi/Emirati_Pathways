
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, FileText } from 'lucide-react';

export function JobDescriptionCard({ isLoading, jobDescriptions, onAddNew, children }) {
  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Saved Job Descriptions</CardTitle>
            <CardDescription>
              View and manage your parsed job descriptions
            </CardDescription>
          </div>
          <Button onClick={onAddNew}>
            Add New Job Description
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingState />
        ) : jobDescriptions.length === 0 ? (
          <EmptyState onAddNew={onAddNew} />
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="flex justify-center items-center py-8">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
    </div>
  );
}

function EmptyState({ onAddNew }) {
  return (
    <div className="text-center py-8">
      <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900">No job descriptions found</h3>
      <p className="text-gray-500 mt-2">
        You haven't parsed any job descriptions yet.
      </p>
      <Button onClick={onAddNew} className="mt-4">
        Parse a Job Description
      </Button>
    </div>
  );
}
