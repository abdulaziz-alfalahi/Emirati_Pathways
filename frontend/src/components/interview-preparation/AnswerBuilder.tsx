
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export const AnswerBuilder: React.FC = () => {
  const [selectedQuestion, setSelectedQuestion] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [currentStep, setCurrentStep] = useState('situation');

  const starSteps = [
    { key: 'situation', label: 'Situation', description: 'Set the context and background' },
    { key: 'task', label: 'Task', description: 'Describe what needed to be done' },
    { key: 'action', label: 'Action', description: 'Explain what you did' },
    { key: 'result', label: 'Result', description: 'Share the outcome and impact' }
  ];

  const sampleQuestions = [
    "Tell me about a time you had to meet a challenging deadline",
    "Describe a situation where you had to work with a difficult team member",
    "Give me an example of when you showed leadership",
    "Tell me about a time you made a mistake and how you handled it"
  ];

  const culturalTips = [
    "Emphasize collaboration and respect for hierarchy in UAE workplace culture",
    "Highlight your ability to work in multicultural environments",
    "Show understanding of Islamic values and traditions in professional settings",
    "Demonstrate commitment to UAE's national development goals"
  ];

  const strengthsWeaknesses = {
    strengths: [
      "Adaptability in multicultural environments",
      "Strong analytical and problem-solving skills",
      "Excellent communication in Arabic and English",
      "Deep understanding of UAE market and culture"
    ],
    weaknesses: [
      "Sometimes focus too much on details (but learning to delegate)",
      "Used to prefer working independently (but now value teamwork more)",
      "Tendency to be overly critical of my own work (but it drives continuous improvement)"
    ]
  };

  return (
    <div className="space-y-6">
      {/* Question Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-ehrdc-teal">Interactive Answer Builder</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select a Question to Practice</label>
              <Select value={selectedQuestion} onValueChange={setSelectedQuestion}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a question to build your answer" />
                </SelectTrigger>
                <SelectContent>
                  {sampleQuestions.map((question, index) => (
                    <SelectItem key={index} value={question}>{question}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedQuestion && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Selected Question:</h3>
                <p className="text-gray-800">{selectedQuestion}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* STAR Method Builder */}
      {selectedQuestion && (
        <Card>
          <CardHeader>
            <CardTitle>Build Your Answer Using STAR Method</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Step Navigation */}
              <div className="flex flex-wrap gap-2">
                {starSteps.map((step) => (
                  <Button
                    key={step.key}
                    variant={currentStep === step.key ? "default" : "outline"}
                    onClick={() => setCurrentStep(step.key)}
                    className={currentStep === step.key ? "bg-ehrdc-teal" : ""}
                  >
                    {step.label}
                  </Button>
                ))}
              </div>
              
              {/* Current Step */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">
                    {starSteps.find(s => s.key === currentStep)?.label}
                  </h3>
                  <p className="text-gray-600">
                    {starSteps.find(s => s.key === currentStep)?.description}
                  </p>
                </div>
                
                <Textarea
                  placeholder={`Write the ${currentStep} part of your answer here...`}
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  className="min-h-32"
                />
                
                <div className="flex gap-3 mt-4">
                  <Button className="bg-ehrdc-teal hover:bg-ehrdc-teal/90">
                    <Save className="h-4 w-4 mr-2" />
                    Save & Continue
                  </Button>
                  <Button variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cultural Context Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-ehrdc-teal">UAE Workplace Cultural Context</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h3 className="font-semibold">Key Cultural Points to Include:</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {culturalTips.map((tip, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <span className="text-sm">{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strengths & Weaknesses Helper */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Strength Examples</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {strengthsWeaknesses.strengths.map((strength, index) => (
                <div key={index} className="p-3 bg-green-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span className="text-sm">{strength}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-orange-600">Weakness Examples (with Growth)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {strengthsWeaknesses.weaknesses.map((weakness, index) => (
                <div key={index} className="p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                    <span className="text-sm">{weakness}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
