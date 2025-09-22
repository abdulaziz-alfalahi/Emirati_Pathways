
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'multiple-select' | 'true-false';
  question: string;
  options: string[];
  correctAnswers: string[];
  explanation?: string;
}

interface InteractiveQuizProps {
  title: string;
  description?: string;
  questions: QuizQuestion[];
  timeLimit?: number; // in minutes
  onComplete: (score: number, answers: Record<string, string[]>) => void;
}

export const InteractiveQuiz: React.FC<InteractiveQuizProps> = ({
  title,
  description,
  questions,
  timeLimit,
  onComplete
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [showResults, setShowResults] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(timeLimit ? timeLimit * 60 : null);
  const [quizStarted, setQuizStarted] = useState(false);

  React.useEffect(() => {
    if (quizStarted && timeRemaining && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev && prev <= 1) {
            handleSubmitQuiz();
            return 0;
          }
          return prev ? prev - 1 : null;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [quizStarted, timeRemaining]);

  const handleAnswerChange = (questionId: string, answer: string, isChecked?: boolean) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    setAnswers(prev => {
      const currentAnswers = prev[questionId] || [];
      
      if (question.type === 'multiple-select') {
        if (isChecked) {
          return { ...prev, [questionId]: [...currentAnswers, answer] };
        } else {
          return { ...prev, [questionId]: currentAnswers.filter(a => a !== answer) };
        }
      } else {
        return { ...prev, [questionId]: [answer] };
      }
    });
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach(question => {
      const userAnswers = answers[question.id] || [];
      const correctAnswers = question.correctAnswers;
      
      if (userAnswers.length === correctAnswers.length &&
          userAnswers.every(answer => correctAnswers.includes(answer))) {
        correct++;
      }
    });
    return Math.round((correct / questions.length) * 100);
  };

  const handleSubmitQuiz = () => {
    const score = calculateScore();
    setShowResults(true);
    onComplete(score, answers);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!quizStarted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>Questions: {questions.length}</div>
            {timeLimit && <div>Time Limit: {timeLimit} minutes</div>}
          </div>
          <Button onClick={() => setQuizStarted(true)} className="w-full">
            Start Quiz
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (showResults) {
    const score = calculateScore();
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quiz Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">{score}%</div>
            <div className="text-muted-foreground">
              {score >= 70 ? 'Congratulations! You passed!' : 'Keep studying and try again!'}
            </div>
          </div>
          
          <div className="space-y-4">
            {questions.map((question, index) => {
              const userAnswers = answers[question.id] || [];
              const isCorrect = userAnswers.length === question.correctAnswers.length &&
                               userAnswers.every(answer => question.correctAnswers.includes(answer));
              
              return (
                <div key={question.id} className="border rounded-lg p-4">
                  <div className="flex items-start gap-2 mb-2">
                    {isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium">Question {index + 1}</div>
                      <div className="text-sm text-muted-foreground">{question.question}</div>
                    </div>
                  </div>
                  
                  {!isCorrect && question.explanation && (
                    <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                      <strong>Explanation:</strong> {question.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Question {currentQuestion + 1} of {questions.length}</CardTitle>
          {timeRemaining && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              {formatTime(timeRemaining)}
            </div>
          )}
        </div>
        <Progress value={progress} className="w-full" />
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="text-lg font-medium">{question.question}</div>
        
        {question.type === 'multiple-choice' || question.type === 'true-false' ? (
          <RadioGroup
            value={answers[question.id]?.[0] || ''}
            onValueChange={(value) => handleAnswerChange(question.id, value)}
          >
            {question.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                <Label htmlFor={`${question.id}-${index}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        ) : (
          <div className="space-y-2">
            {question.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`${question.id}-${index}`}
                  checked={answers[question.id]?.includes(option) || false}
                  onCheckedChange={(checked) => 
                    handleAnswerChange(question.id, option, checked as boolean)
                  }
                />
                <Label htmlFor={`${question.id}-${index}`}>{option}</Label>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>
          
          {currentQuestion === questions.length - 1 ? (
            <Button onClick={handleSubmitQuiz}>
              Submit Quiz
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentQuestion(prev => prev + 1)}
              disabled={!answers[question.id]?.length}
            >
              Next
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
