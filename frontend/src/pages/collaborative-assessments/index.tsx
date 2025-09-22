
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import AssessmentDashboard from '@/components/collaborative-assessments/AssessmentDashboard';
import { TemplateBuilder } from '@/components/collaborative-assessments/TemplateBuilder';
import { TemplateLibrary } from '@/components/collaborative-assessments/templates/TemplateLibrary';
import { EvaluationInterface } from '@/components/collaborative-assessments/EvaluationInterface';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { CollaborativeAssessment, AssessmentTemplate } from '@/types/collaborativeAssessments';

type ViewMode = 'dashboard' | 'template-library' | 'create-template' | 'create-assessment' | 'view-assessment' | 'evaluate-assessment';

const CollaborativeAssessmentsPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [selectedAssessment, setSelectedAssessment] = useState<CollaborativeAssessment | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<AssessmentTemplate | null>(null);

  const handleCreateAssessment = () => {
    setViewMode('template-library');
  };

  const handleViewAssessment = (assessment: CollaborativeAssessment) => {
    setSelectedAssessment(assessment);
    setViewMode('view-assessment');
  };

  const handleEvaluateAssessment = (assessment: CollaborativeAssessment) => {
    setSelectedAssessment(assessment);
    setViewMode('evaluate-assessment');
  };

  const handleCreateTemplate = () => {
    setViewMode('create-template');
  };

  const handleTemplateSelected = (template: AssessmentTemplate) => {
    setSelectedTemplate(template);
    setViewMode('create-assessment');
  };

  const handleBackToDashboard = () => {
    setViewMode('dashboard');
    setSelectedAssessment(null);
    setSelectedTemplate(null);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {viewMode !== 'dashboard' && (
          <div className="mb-6">
            <Button variant="ghost" onClick={handleBackToDashboard}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        )}

        {viewMode === 'dashboard' && (
          <AssessmentDashboard
            onCreateAssessment={handleCreateAssessment}
            onCreateTemplate={handleCreateTemplate}
            onViewAssessment={handleViewAssessment}
            onEvaluateAssessment={handleEvaluateAssessment}
          />
        )}

        {viewMode === 'template-library' && (
          <div>
            <h1 className="text-2xl font-bold mb-6">Choose Assessment Template</h1>
            <TemplateLibrary
              onCreateAssessment={handleTemplateSelected}
              selectionMode={true}
            />
          </div>
        )}

        {viewMode === 'create-template' && (
          <div>
            <h1 className="text-2xl font-bold mb-6">Create Assessment Template</h1>
            <TemplateBuilder
              onSave={() => setViewMode('dashboard')}
              onCancel={() => setViewMode('dashboard')}
            />
          </div>
        )}

        {viewMode === 'create-assessment' && selectedTemplate && (
          <div>
            <h1 className="text-2xl font-bold mb-6">Create New Assessment</h1>
            <p className="text-muted-foreground mb-4">
              Using template: <span className="font-medium">{selectedTemplate.title}</span>
            </p>
            {/* Assessment creation form would go here */}
            <p>Assessment creation form coming soon...</p>
          </div>
        )}

        {viewMode === 'view-assessment' && selectedAssessment && (
          <div>
            <h1 className="text-2xl font-bold mb-6">{selectedAssessment.title}</h1>
            {/* Assessment view would go here */}
            <p>Assessment overview interface coming soon...</p>
          </div>
        )}

        {viewMode === 'evaluate-assessment' && selectedAssessment && (
          <EvaluationInterface
            assessmentId={selectedAssessment.id}
            onBack={handleBackToDashboard}
          />
        )}
      </div>
    </Layout>
  );
};

export default CollaborativeAssessmentsPage;
