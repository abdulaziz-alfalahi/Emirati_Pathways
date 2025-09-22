
import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { fetchAssessments } from '@/services/assessments';
import { Assessment as ApiAssessment } from '@/types/assessments'; // Renamed import to avoid conflict

// Import smaller components
import AssessmentStatistics from './assessments/AssessmentStatistics';
import AssessmentFilterBar from './assessments/AssessmentFilterBar';
import AssessmentTable from './assessments/AssessmentTable';
import AssessmentDocumentation from './assessments/AssessmentDocumentation';
import CandidateProgress from './assessments/CandidateProgress';
import AssessmentTools from './assessments/AssessmentTools';
import CreateAssessmentDialog from './assessments/CreateAssessmentDialog';

const AssessmentsTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('active');

  // Fetch assessments from the API
  const { data: assessmentsData, isLoading } = useQuery({
    queryKey: ['assessments'],
    queryFn: fetchAssessments,
  });

  // Calculate statistics for assessment dashboard
  const totalAssessments = assessmentsData?.length || 0;
  const activeAssessments = assessmentsData?.filter(a => a.is_active)?.length || 0;
  const candidatesAssessed = 432; // Static for demonstration

  // Convert API assessments to the format expected by AssessmentTable
  const convertedAssessments = assessmentsData?.map(assessment => ({
    id: Number(assessment.id), // Convert string ID to number
    title: assessment.title,
    assessment_type: assessment.assessment_type,
    duration_minutes: assessment.duration_minutes || undefined,
    is_active: assessment.is_active || false,
    candidates: 0, // Default value, would need to be populated from real data
    date: assessment.created_at || '',
    type: assessment.assessment_type,
    passingScore: 0, // Default value, would need to be populated from real data
    duration: assessment.duration_minutes || 0
  })) || [];

  const filteredAssessments = convertedAssessments.filter(assessment => {
    // Filter by search query
    if (searchQuery && !assessment.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Filter by active/inactive status
    if (selectedTab === 'active' && !assessment.is_active) {
      return false;
    }
    
    if (selectedTab === 'inactive' && assessment.is_active) {
      return false;
    }
    
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Dashboard Statistics */}
      <AssessmentStatistics 
        totalAssessments={totalAssessments}
        activeAssessments={activeAssessments}
        candidatesAssessed={candidatesAssessed}
      />

      {/* Assessment Center Management */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Assessment Management</CardTitle>
              <CardDescription>Create and manage your assessment programs</CardDescription>
            </div>
            <CreateAssessmentDialog />
          </div>
        </CardHeader>
        <CardContent>
          <AssessmentFilterBar 
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedTab={selectedTab}
            onTabChange={setSelectedTab}
          />

          <AssessmentTable 
            assessments={filteredAssessments}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
      
      {/* Documentation Section */}
      <AssessmentDocumentation />
      
      {/* Progress Monitoring */}
      <CandidateProgress />
      
      {/* Quick Access Tools */}
      <AssessmentTools />
    </div>
  );
};

export default AssessmentsTab;
