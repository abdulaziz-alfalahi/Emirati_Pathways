
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Play, Square, RotateCcw, Video, Mic, MicOff, VideoOff, Star } from 'lucide-react';

export const InterviewSimulator: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [sessionProgress, setSessionProgress] = useState(0);

  const questions = [
    {
      type: 'Behavioral',
      text: 'Tell me about a time when you had to work under pressure to meet a deadline.',
      tips: 'Use the STAR method: Situation, Task, Action, Result'
    },
    {
      type: 'Technical',
      text: 'How would you approach solving a complex problem in your field?',
      tips: 'Break down your thought process step by step'
    },
    {
      type: 'Cultural',
      text: 'How do you handle working in a multicultural environment like the UAE?',
      tips: 'Highlight your cultural awareness and adaptability'
    }
  ];

  const industries = [
    'Banking & Finance', 'Technology', 'Healthcare', 'Government', 
    'Oil & Gas', 'Aviation', 'Tourism', 'Real Estate'
  ];

  const previousSessions = [
    { date: '2024-02-10', score: 85, industry: 'Banking', feedback: 'Excellent communication skills' },
    { date: '2024-02-08', score: 78, industry: 'Technology', feedback: 'Improve technical explanations' },
    { date: '2024-02-05', score: 92, industry: 'Government', feedback: 'Strong cultural awareness' }
  ];

  return (
    <div className="space-y-6">
      {/* Session Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="text-ehrdc-teal">AI Interview Simulator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Industry</label>
                <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your target industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((industry) => (
                      <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium">Interview Duration</label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">15 min</Button>
                  <Button variant="outline" size="sm">30 min</Button>
                  <Button variant="outline" size="sm" className="bg-ehrdc-teal text-white">45 min</Button>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Session Features:</h4>
                <ul className="text-sm space-y-1">
                  <li>✓ Video recording for self-assessment</li>
                  <li>✓ Real-time feedback on communication</li>
                  <li>✓ Industry-specific questions</li>
                  <li>✓ Progress tracking</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <Button className="bg-ehrdc-teal hover:bg-ehrdc-teal/90" disabled={!selectedIndustry}>
              <Play className="h-4 w-4 me-2" />
              Start Practice Session
            </Button>
            <Button variant="outline">
              <Video className="h-4 w-4 me-2" />
              Quick Practice
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Session */}
      {selectedIndustry && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Practice Session - {selectedIndustry}</CardTitle>
              <Badge variant="outline">Question {currentQuestion + 1} of {questions.length}</Badge>
            </div>
            <Progress value={sessionProgress} className="w-full" />
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <Badge className="mb-2">{questions[currentQuestion].type}</Badge>
                  <h3 className="font-semibold text-lg mb-2">{questions[currentQuestion].text}</h3>
                  <p className="text-sm text-gray-600">{questions[currentQuestion].tips}</p>
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    variant={isRecording ? "destructive" : "default"} 
                    onClick={() => setIsRecording(!isRecording)}
                    className={isRecording ? "" : "bg-ehrdc-teal hover:bg-ehrdc-teal/90"}
                  >
                    {isRecording ? <Square className="h-4 w-4 me-2" /> : <Play className="h-4 w-4 me-2" />}
                    {isRecording ? 'Stop Recording' : 'Start Recording'}
                  </Button>
                  <Button variant="outline">
                    <RotateCcw className="h-4 w-4 me-2" />
                    Retry
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-black rounded-lg aspect-video flex items-center justify-center">
                  <div className="text-white text-center">
                    <Video className="h-12 w-12 mx-auto mb-2" />
                    <p>Video Recording Area</p>
                    {isRecording && <div className="text-red-500 mt-2">● Recording...</div>}
                  </div>
                </div>
                
                <div className="flex justify-center gap-2">
                  <Button variant="outline" size="sm">
                    <Mic className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Video className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Previous Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-ehrdc-teal">Practice History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {previousSessions.map((session, index) => (
              <div key={index} className="flex justify-between items-center p-4 border rounded-lg">
                <div>
                  <div className="font-medium">{session.industry} Practice</div>
                  <div className="text-sm text-gray-600">{session.date}</div>
                  <div className="text-sm text-gray-600">{session.feedback}</div>
                </div>
                <div className="text-end">
                  <div className="flex items-center gap-1 mb-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{session.score}/100</span>
                  </div>
                  <Button variant="outline" size="sm">Review</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
