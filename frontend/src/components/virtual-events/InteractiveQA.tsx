
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, ThumbsUp, Clock, Send } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface QAQuestion {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  question: string;
  answer?: string;
  answered_by?: string;
  answered_at?: string;
  votes: number;
  user_voted: boolean;
  status: 'pending' | 'answered' | 'live';
  created_at: string;
}

interface InteractiveQAProps {
  sessionId: string;
  eventId: string;
  isModerator?: boolean;
}

const InteractiveQA: React.FC<InteractiveQAProps> = ({ 
  sessionId, 
  eventId, 
  isModerator = false 
}) => {
  const [questions, setQuestions] = useState<QAQuestion[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'answered'>('all');

  useEffect(() => {
    loadQuestions();
  }, [sessionId]);

  const loadQuestions = async () => {
    try {
      // In a real implementation, this would fetch from a session_questions table
      const mockQuestions: QAQuestion[] = [
        {
          id: '1',
          user_id: 'user1',
          user_name: 'Sarah Ahmed',
          question: 'What are the key skills needed for data science in the UAE market?',
          votes: 12,
          user_voted: false,
          status: 'pending',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          user_id: 'user2',
          user_name: 'Mohamed Ali',
          question: 'How important are certifications vs practical experience?',
          answer: 'Both are important, but practical experience often carries more weight. However, certifications can help you get through initial screening processes.',
          answered_by: 'Dr. Layla Hassan',
          answered_at: new Date().toISOString(),
          votes: 8,
          user_voted: true,
          status: 'answered',
          created_at: new Date().toISOString()
        }
      ];
      setQuestions(mockQuestions);
    } catch (error) {
      console.error('Failed to load questions:', error);
    }
  };

  const submitQuestion = async () => {
    if (!newQuestion.trim()) return;

    try {
      setIsLoading(true);
      
      const question: QAQuestion = {
        id: Date.now().toString(),
        user_id: 'current-user',
        user_name: 'Current User',
        question: newQuestion,
        votes: 0,
        user_voted: false,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      setQuestions(prev => [...prev, question]);
      setNewQuestion('');

      toast({
        title: "Question submitted",
        description: "Your question has been submitted and is waiting for the speaker to answer",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit question",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const voteQuestion = async (questionId: string) => {
    try {
      setQuestions(prev => 
        prev.map(q => 
          q.id === questionId 
            ? { 
                ...q, 
                votes: q.user_voted ? q.votes - 1 : q.votes + 1,
                user_voted: !q.user_voted 
              }
            : q
        )
      );

      toast({
        title: "Vote recorded",
        description: "Your vote has been recorded",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record vote",
        variant: "destructive",
      });
    }
  };

  const filteredQuestions = questions
    .filter(q => filter === 'all' || q.status === filter)
    .sort((a, b) => {
      if (a.status === 'live' && b.status !== 'live') return -1;
      if (b.status === 'live' && a.status !== 'live') return 1;
      return b.votes - a.votes;
    });

  const getStatusBadge = (status: QAQuestion['status']) => {
    switch (status) {
      case 'live':
        return <Badge className="bg-red-500 animate-pulse">LIVE</Badge>;
      case 'answered':
        return <Badge variant="secondary">Answered</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center">
          <MessageSquare className="h-5 w-5 mr-2" />
          Q&A Session
        </CardTitle>
        <CardDescription>
          Ask questions and vote on others' questions
        </CardDescription>
        
        <div className="flex space-x-2">
          {(['all', 'pending', 'answered'] as const).map((filterOption) => (
            <Button
              key={filterOption}
              variant={filter === filterOption ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(filterOption)}
              className="capitalize"
            >
              {filterOption}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <div className="px-4 pb-4">
          <div className="flex space-x-2">
            <Input
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Ask a question..."
              onKeyPress={(e) => e.key === 'Enter' && submitQuestion()}
              disabled={isLoading}
            />
            <Button 
              onClick={submitQuestion} 
              disabled={isLoading || !newQuestion.trim()}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 pb-4">
            {filteredQuestions.map((question) => (
              <div key={question.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={question.user_avatar} />
                      <AvatarFallback className="text-xs">
                        {question.user_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{question.user_name}</span>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(question.created_at).toLocaleTimeString('en-AE', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  {getStatusBadge(question.status)}
                </div>

                <p className="text-sm mb-3">{question.question}</p>

                {question.answer && (
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-3">
                    <p className="text-sm text-blue-800">{question.answer}</p>
                    {question.answered_by && (
                      <p className="text-xs text-blue-600 mt-1">
                        - {question.answered_by}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => voteQuestion(question.id)}
                    className={question.user_voted ? 'text-blue-600' : ''}
                  >
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    {question.votes}
                  </Button>
                  
                  {isModerator && question.status === 'pending' && (
                    <Button variant="outline" size="sm">
                      Answer Live
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default InteractiveQA;
