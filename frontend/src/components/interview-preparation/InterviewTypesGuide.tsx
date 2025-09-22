
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Users, Monitor, Code, Building, CheckCircle } from 'lucide-react';

export const InterviewTypesGuide: React.FC = () => {
  const [selectedType, setSelectedType] = useState('one-on-one');

  const interviewTypes = [
    {
      id: 'one-on-one',
      name: 'One-on-One Interviews',
      icon: User,
      description: 'Traditional face-to-face interviews with a single interviewer',
      preparation: [
        'Research the interviewer\'s background on LinkedIn',
        'Prepare 5-7 questions about the role and company',
        'Practice maintaining eye contact and active listening',
        'Prepare your elevator pitch (2-3 minutes)'
      ],
      tips: [
        'Build rapport through genuine conversation',
        'Ask thoughtful questions about team dynamics',
        'Share specific examples that demonstrate your skills',
        'Follow up with a personalized thank you note'
      ]
    },
    {
      id: 'panel',
      name: 'Panel Interviews',
      icon: Users,
      description: 'Multiple interviewers from different departments or levels',
      preparation: [
        'Research each panel member\'s role and department',
        'Prepare answers that address different perspectives',
        'Practice speaking to groups and maintaining composure',
        'Prepare questions for each panel member'
      ],
      tips: [
        'Make eye contact with all panel members',
        'Address answers to the questioner but engage everyone',
        'Don\'t favor any particular panel member',
        'Take notes to remember names and follow up appropriately'
      ]
    },
    {
      id: 'assessment',
      name: 'Assessment Centers',
      icon: Building,
      description: 'Multiple activities including group exercises, presentations, and tests',
      preparation: [
        'Practice group discussion and collaboration skills',
        'Prepare a 10-minute presentation on a general topic',
        'Review case study analysis techniques',
        'Practice time management under pressure'
      ],
      tips: [
        'Show leadership without dominating group activities',
        'Listen actively and build on others\' ideas',
        'Stay calm during individual exercises',
        'Demonstrate both teamwork and individual capability'
      ]
    },
    {
      id: 'technical',
      name: 'Technical Interviews',
      icon: Code,
      description: 'Skills-based interviews with practical demonstrations',
      preparation: [
        'Review fundamental concepts in your field',
        'Practice explaining complex topics simply',
        'Prepare portfolio examples of your work',
        'Practice live coding or technical demonstrations'
      ],
      tips: [
        'Think out loud during problem-solving',
        'Ask clarifying questions before starting',
        'Explain your thought process step by step',
        'Don\'t be afraid to admit knowledge gaps honestly'
      ]
    },
    {
      id: 'virtual',
      name: 'Virtual Interviews',
      icon: Monitor,
      description: 'Online interviews via video conferencing platforms',
      preparation: [
        'Test your technology setup 24 hours before',
        'Choose a quiet, professional background',
        'Practice speaking to a camera naturally',
        'Have backup internet connection ready'
      ],
      tips: [
        'Look at the camera, not the screen, when speaking',
        'Dress professionally from head to toe',
        'Keep water nearby but mute when drinking',
        'Have your resume and notes easily accessible'
      ]
    }
  ];

  const selectedInterview = interviewTypes.find(type => type.id === selectedType);

  return (
    <div className="space-y-6">
      {/* Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-ehrdc-teal">Interview Format Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {interviewTypes.map((type) => {
              const IconComponent = type.icon;
              return (
                <Button
                  key={type.id}
                  variant={selectedType === type.id ? "default" : "outline"}
                  onClick={() => setSelectedType(type.id)}
                  className={`h-auto p-4 flex flex-col items-center gap-2 ${
                    selectedType === type.id ? "bg-ehrdc-teal" : ""
                  }`}
                >
                  <IconComponent className="h-6 w-6" />
                  <span className="text-xs text-center">{type.name}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Type Details */}
      {selectedInterview && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <selectedInterview.icon className="h-6 w-6 text-ehrdc-teal" />
                {selectedInterview.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">{selectedInterview.description}</p>
              
              <h3 className="font-semibold mb-4">Preparation Checklist:</h3>
              <div className="space-y-3">
                {selectedInterview.preparation.map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-ehrdc-teal">Success Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedInterview.tips.map((tip, index) => (
                  <div key={index} className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="text-xs mt-1">{index + 1}</Badge>
                      <span className="text-sm">{tip}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Common Challenges */}
      <Card>
        <CardHeader>
          <CardTitle className="text-ehrdc-teal">Common Interview Challenges & Solutions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-red-600">Challenge: Nervousness</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Solution:</strong> Practice deep breathing exercises</p>
                <p><strong>Tip:</strong> Arrive 10 minutes early to settle in</p>
                <p><strong>Mindset:</strong> View it as a conversation, not interrogation</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-red-600">Challenge: Difficult Questions</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Solution:</strong> Take a moment to think before answering</p>
                <p><strong>Tip:</strong> It's okay to ask for clarification</p>
                <p><strong>Mindset:</strong> Focus on what you can offer, not what you lack</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-red-600">Challenge: Technical Difficulties</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Solution:</strong> Have backup plans ready</p>
                <p><strong>Tip:</strong> Communicate proactively about any issues</p>
                <p><strong>Mindset:</strong> Stay calm and professional</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
