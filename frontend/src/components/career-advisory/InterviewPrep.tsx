
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, Video, Award } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { startInterviewSession } from '@/services/careerAdvisory/advisorySessionService';
import { AdvisorySession } from '@/types/careerAdvisory';

interface InterviewPrepProps {
  session: AdvisorySession;
  onSessionUpdate: (updatedSession: AdvisorySession) => void;
}

const InterviewPrep: React.FC<InterviewPrepProps> = ({ session, onSessionUpdate }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleStartInterview = async () => {
    try {
      setIsLoading(true);
      const updatedSession = await startInterviewSession(session.id);
      onSessionUpdate(updatedSession);
      toast({
        title: "Interview started",
        description: "The video call has been initialized.",
      });
    } catch (error) {
      console.error("Error starting interview:", error);
      toast({
        title: "Error",
        description: "Failed to start the interview session.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(date);
  };

  const getInterviewTypeBadge = () => {
    const colorMap: Record<string, string> = {
      mock: 'bg-purple-100 text-purple-800',
      practice: 'bg-blue-100 text-blue-800',
      technical: 'bg-amber-100 text-amber-800',
      behavioral: 'bg-green-100 text-green-800',
    };

    const type = session.interview_type || 'practice';
    return (
      <Badge className={colorMap[type]}>
        {type.charAt(0).toUpperCase() + type.slice(1)} Interview
      </Badge>
    );
  };

  const commonQuestions = {
    behavioral: [
      "Tell me about yourself.",
      "What are your strengths and weaknesses?",
      "Why do you want to work here?",
      "Describe a challenging situation and how you handled it.",
      "Where do you see yourself in 5 years?",
    ],
    technical: [
      "Explain a complex technical concept in simple terms.",
      "Describe a project you worked on and your role in it.",
      "What tools and technologies are you proficient in?",
      "How do you stay updated with the latest industry trends?",
      "How would you solve [specific technical problem]?",
    ],
    mock: [
      "Why should we hire you?",
      "Tell me about a time you failed and what you learned.",
      "How do you handle pressure and tight deadlines?",
      "What's your greatest professional achievement?",
      "How would your colleagues describe you?",
    ],
    practice: [
      "What interests you about this position?",
      "How do you prioritize your work?",
      "Describe your ideal work environment.",
      "What motivates you?",
      "How do you handle constructive criticism?",
    ],
  };

  const interviewType = session.interview_type || 'practice';
  const questionsToShow = session.interview_questions?.length 
    ? session.interview_questions 
    : commonQuestions[interviewType as keyof typeof commonQuestions] || [];

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Interview Preparation</CardTitle>
            <CardDescription>
              Prepare for your upcoming {session.interview_type} interview
            </CardDescription>
          </div>
          {getInterviewTypeBadge()}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="details">
          <TabsList className="mb-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="questions">Practice Questions</TabsTrigger>
            <TabsTrigger value="tips">Interview Tips</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span>{formatDate(session.scheduled_date)}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span>Duration: 30-45 minutes</span>
            </div>
            
            {session.topic && (
              <div>
                <h3 className="font-medium mb-1">Topic</h3>
                <p className="text-muted-foreground">{session.topic}</p>
              </div>
            )}
            
            {session.details && (
              <div>
                <h3 className="font-medium mb-1">Details</h3>
                <p className="text-muted-foreground">{session.details}</p>
              </div>
            )}

            {session.status === 'scheduled' && (
              <Button 
                onClick={handleStartInterview}
                disabled={isLoading}
                className="w-full mt-4"
              >
                <Video className="me-2 h-4 w-4" />
                Start Interview Now
              </Button>
            )}

            {session.status === 'in_progress' && session.video_call_url && (
              <Button 
                className="w-full mt-4" 
                onClick={() => window.open(session.video_call_url!, '_blank')}
              >
                <Video className="me-2 h-4 w-4" />
                Join Ongoing Interview
              </Button>
            )}
          </TabsContent>
          
          <TabsContent value="questions">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Review these common questions to help prepare for your {session.interview_type} interview:
              </p>
              <ul className="space-y-2">
                {questionsToShow.map((question, index) => (
                  <li key={index} className="bg-muted p-3 rounded-md">
                    {index + 1}. {question}
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>
          
          <TabsContent value="tips">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  Before the Interview
                </h3>
                <ul className="list-disc ps-5 mt-2 space-y-1 text-muted-foreground">
                  <li>Research the company and role thoroughly</li>
                  <li>Prepare examples of your achievements</li>
                  <li>Practice your responses to common questions</li>
                  <li>Test your camera and microphone</li>
                  <li>Choose a quiet, well-lit environment</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  During the Interview
                </h3>
                <ul className="list-disc ps-5 mt-2 space-y-1 text-muted-foreground">
                  <li>Maintain eye contact with the camera</li>
                  <li>Speak clearly and at a moderate pace</li>
                  <li>Use the STAR method for behavioral questions</li>
                  <li>Ask thoughtful questions at the end</li>
                  <li>Show enthusiasm for the role</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  After the Interview
                </h3>
                <ul className="list-disc ps-5 mt-2 space-y-1 text-muted-foreground">
                  <li>Send a thank-you email within 24 hours</li>
                  <li>Reflect on what went well and what to improve</li>
                  <li>Follow up if you haven't heard back within a week</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <p className="text-sm text-muted-foreground">
          Need to reschedule? Contact your career advisor directly.
        </p>
      </CardFooter>
    </Card>
  );
};

export default InterviewPrep;
