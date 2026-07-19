
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Code, FileText } from 'lucide-react';

interface ExerciseStep {
  id: string;
  title: string;
  description: string;
  type: 'code' | 'text' | 'file-upload';
  placeholder?: string;
  expectedOutput?: string;
  hints?: string[];
}

interface InteractiveExerciseProps {
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // in minutes
  steps: ExerciseStep[];
  onComplete: (answers: Record<string, string>) => void;
}

export const InteractiveExercise: React.FC<InteractiveExerciseProps> = ({
  title,
  description,
  difficulty,
  estimatedTime,
  steps,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showHints, setShowHints] = useState<Record<string, boolean>>({});
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const currentStepData = steps[currentStep];

  const handleAnswerChange = (stepId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [stepId]: value }));
  };

  const handleStepComplete = () => {
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete(answers);
    }
  };

  const toggleHints = (stepId: string) => {
    setShowHints(prev => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'code': return <Code className="h-4 w-4" />;
      case 'file-upload': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge className={getDifficultyColor(difficulty)}>
              {difficulty}
            </Badge>
            <Badge variant="outline">
              ~{estimatedTime}m
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Progress indicator */}
        <div className="flex items-center gap-2">
          {steps.map((_, index) => (
            <div key={index} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${completedSteps.has(index) 
                  ? 'bg-green-500 text-white' 
                  : index === currentStep 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }
              `}>
                {completedSteps.has(index) ? <CheckCircle className="h-4 w-4" /> : index + 1}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-8 h-0.5 ${
                  completedSteps.has(index) ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Current step */}
        <div className="border rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2">
            {getStepIcon(currentStepData.type)}
            <h3 className="text-lg font-semibold">{currentStepData.title}</h3>
          </div>
          
          <p className="text-muted-foreground">{currentStepData.description}</p>
          
          {/* Input based on step type */}
          {currentStepData.type === 'code' ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Code:</label>
              <Textarea
                value={answers[currentStepData.id] || ''}
                onChange={(e) => handleAnswerChange(currentStepData.id, e.target.value)}
                placeholder={currentStepData.placeholder || 'Enter your code here...'}
                className="font-mono text-sm min-h-[200px]"
              />
            </div>
          ) : currentStepData.type === 'file-upload' ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">Upload File:</label>
              <Input
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleAnswerChange(currentStepData.id, file.name);
                  }
                }}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Answer:</label>
              <Textarea
                value={answers[currentStepData.id] || ''}
                onChange={(e) => handleAnswerChange(currentStepData.id, e.target.value)}
                placeholder={currentStepData.placeholder || 'Enter your answer here...'}
                rows={6}
              />
            </div>
          )}

          {/* Expected output */}
          {currentStepData.expectedOutput && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-blue-900 mb-1">Expected Output:</div>
              <div className="text-sm text-blue-800 font-mono">
                {currentStepData.expectedOutput}
              </div>
            </div>
          )}

          {/* Hints */}
          {currentStepData.hints && currentStepData.hints.length > 0 && (
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleHints(currentStepData.id)}
                className="text-sm"
              >
                <AlertCircle className="h-4 w-4 me-2" />
                {showHints[currentStepData.id] ? 'Hide Hints' : 'Show Hints'}
              </Button>
              
              {showHints[currentStepData.id] && (
                <div className="space-y-2">
                  {currentStepData.hints.map((hint, index) => (
                    <div key={index} className="p-3 bg-yellow-50 rounded-lg">
                      <div className="text-sm font-medium text-yellow-900">
                        Hint {index + 1}:
                      </div>
                      <div className="text-sm text-yellow-800">{hint}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          
          <Button
            onClick={handleStepComplete}
            disabled={!answers[currentStepData.id]?.trim()}
          >
            {currentStep === steps.length - 1 ? 'Complete Exercise' : 'Next Step'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
