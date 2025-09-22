
// src/components/job-matching/JobDescriptionsList.jsx
import React from 'react';
import { JobDescriptionCard } from './components/JobDescriptionCard';
import { JobDescriptionsTable } from './components/JobDescriptionsTable';
import { JobDetailsDialog } from './components/JobDetailsDialog';
import { useJobDescriptionsList } from './hooks/useJobDescriptionsList';

export function JobDescriptionsList() {
  const {
    jobDescriptions,
    isLoading,
    selectedJob,
    isDialogOpen,
    setIsDialogOpen,
    handleDelete,
    toggleJobStatus,
    viewJobDetails,
    addNewJobDescription
  } = useJobDescriptionsList();

  return (
    <div className="container mx-auto py-8">
      <JobDescriptionCard 
        isLoading={isLoading} 
        jobDescriptions={jobDescriptions} 
        onAddNew={addNewJobDescription}
      >
        <JobDescriptionsTable 
          jobDescriptions={jobDescriptions} 
          onViewDetails={viewJobDetails}
          onToggleStatus={toggleJobStatus}
          onDelete={handleDelete}
        />
      </JobDescriptionCard>
      
      <JobDetailsDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        selectedJob={selectedJob}
      />
    </div>
  );
}
