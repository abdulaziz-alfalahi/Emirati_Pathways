
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Code, FileText, Presentation, Users, Clock, CheckCircle } from 'lucide-react';

export const TechnicalAssessment: React.FC = () => {
  const [selectedField, setSelectedField] = useState('');

  const technicalFields = [
    {
      field: 'Software Engineering',
      assessments: [
        {
          type: 'Coding Challenge',
          description: 'Live coding session with algorithm and data structure problems',
          duration: '45-60 minutes',
          tips: ['Practice on platforms like LeetCode', 'Think out loud', 'Test your code']
        },
        {
          type: 'System Design',
          description: 'Design scalable systems and explain architecture decisions',
          duration: '60-90 minutes',
          tips: ['Start with requirements', 'Draw diagrams', 'Discuss trade-offs']
        }
      ]
    },
    {
      field: 'Finance',
      assessments: [
        {
          type: 'Financial Modeling',
          description: 'Build and present financial models using Excel/Python',
          duration: '90-120 minutes',
          tips: ['Double-check formulas', 'Explain assumptions', 'Use clear formatting']
        },
        {
          type: 'Case Study',
          description: 'Analyze business scenarios and provide recommendations',
          duration: '60-90 minutes',
          tips: ['Structure your analysis', 'Use frameworks like SWOT', 'Quantify impact']
        }
      ]
    },
    {
      field: 'Engineering',
      assessments: [
        {
          type: 'Technical Design',
          description: 'Design technical solutions and explain engineering principles',
          duration: '90-120 minutes',
          tips: ['Show calculations', 'Consider safety factors', 'Explain material choices']
        },
        {
          type: 'Problem Solving',
          description: 'Solve real-world engineering problems step by step',
          duration: '60-90 minutes',
          tips: ['Break down complex problems', 'Show work clearly', 'Verify results']
        }
      ]
    }
  ];

  const caseStudyApproach = [
    {
      step: 1,
      title: 'Understand the Problem',
      description: 'Read carefully, ask clarifying questions, identify key issues',
      timeAllocation: '10-15%'
    },
    {
      step: 2,
      title: 'Structure Your Approach',
      description: 'Outline your methodology, create framework for analysis',
      timeAllocation: '15-20%'
    },
    {
      step: 3,
      title: 'Analyze & Research',
      description: 'Gather relevant data, apply analytical frameworks',
      timeAllocation: '40-50%'
    },
    {
      step: 4,
      title: 'Develop Solutions',
      description: 'Generate alternatives, evaluate options, select best approach',
      timeAllocation: '15-20%'
    },
    {
      step: 5,
      title: 'Present & Defend',
      description: 'Clearly communicate findings and recommendations',
      timeAllocation: '10-15%'
    }
  ];

  const presentationTips = [
    {
      category: 'Structure',
      tips: [
        'Start with clear agenda and objectives',
        'Use logical flow: problem → analysis → solution',
        'Include executive summary for business cases',
        'End with clear call to action'
      ]
    },
    {
      category: 'Visual Design',
      tips: [
        'Use consistent formatting and fonts',
        'Limit text per slide (6x6 rule)',
        'Include relevant charts and diagrams',
        'Ensure slides are readable from distance'
      ]
    },
    {
      category: 'Delivery',
      tips: [
        'Practice timing and transitions',
        'Maintain eye contact with audience',
        'Use gestures appropriately',
        'Prepare for questions and interruptions'
      ]
    }
  ];

  const groupExerciseStrategies = [
    'Listen actively to all team members',
    'Build on others\' ideas constructively',
    'Take initiative without dominating',
    'Ask clarifying questions when needed',
    'Help manage time and keep group focused',
    'Summarize key points and decisions',
    'Ensure everyone has a chance to contribute',
    'Stay calm under pressure and time constraints'
  ];

  return (
    <div className="space-y-6">
      {/* Field Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-ehrdc-teal">Technical Assessment Preparation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Your Field</label>
              <Select value={selectedField} onValueChange={setSelectedField}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose your technical field" />
                </SelectTrigger>
                <SelectContent>
                  {technicalFields.map((field) => (
                    <SelectItem key={field.field} value={field.field}>{field.field}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Field-Specific Assessments */}
      {selectedField && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedField} - Assessment Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {technicalFields
                .find(f => f.field === selectedField)
                ?.assessments.map((assessment, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-lg">{assessment.type}</h3>
                    <Badge variant="outline">{assessment.duration}</Badge>
                  </div>
                  
                  <p className="text-gray-600 mb-4">{assessment.description}</p>
                  
                  <div>
                    <h4 className="font-medium mb-2">Success Tips:</h4>
                    <div className="space-y-2">
                      {assessment.tips.map((tip, tipIndex) => (
                        <div key={tipIndex} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Case Study Approach */}
      <Card>
        <CardHeader>
          <CardTitle className="text-ehrdc-teal">Case Study Analysis Framework</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {caseStudyApproach.map((step) => (
              <div key={step.step} className="flex gap-4 p-4 border rounded-lg">
                <div className="bg-ehrdc-teal text-white rounded-full w-8 h-8 flex items-center justify-center font-semibold flex-shrink-0">
                  {step.step}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{step.title}</h3>
                    <Badge variant="outline">{step.timeAllocation}</Badge>
                  </div>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Presentation Skills */}
      <Card>
        <CardHeader>
          <CardTitle className="text-ehrdc-teal">Presentation Excellence Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            {presentationTips.map((category, index) => (
              <div key={index}>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Presentation className="h-5 w-5 text-ehrdc-teal" />
                  {category.category}
                </h3>
                <div className="space-y-3">
                  {category.tips.map((tip, tipIndex) => (
                    <div key={tipIndex} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Group Exercise Strategies */}
      <Card>
        <CardHeader>
          <CardTitle className="text-ehrdc-teal">Group Exercise Success Strategies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {groupExerciseStrategies.map((strategy, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <Users className="h-5 w-5 text-ehrdc-teal mt-0.5 flex-shrink-0" />
                <span className="text-sm">{strategy}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Time Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-ehrdc-teal">Assessment Time Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-2">Before Starting</h3>
              <ul className="text-sm space-y-1">
                <li>Read all instructions carefully</li>
                <li>Plan your time allocation</li>
                <li>Ask clarifying questions</li>
              </ul>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Code className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-2">During Assessment</h3>
              <ul className="text-sm space-y-1">
                <li>Monitor time regularly</li>
                <li>Start with easier tasks</li>
                <li>Show your working</li>
              </ul>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-2">Before Submitting</h3>
              <ul className="text-sm space-y-1">
                <li>Review your work</li>
                <li>Check calculations</li>
                <li>Ensure completeness</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
