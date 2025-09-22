
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/components/ui/use-toast';
import { fetchCareerAdvisors } from '@/services/careerAdvisory';
import { scheduleInterview } from '@/services/careerAdvisory/advisorySessionService';
import { useAuth } from '@/context/AuthContext';
import { useForm } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { CareerAdvisor } from '@/types/careerAdvisory';
import { useQuery } from '@tanstack/react-query';

interface InterviewFormValues {
  advisorId: string;
  scheduledDate: Date;
  topic: string;
  details: string;
  interviewType: "mock" | "practice" | "technical" | "behavioral";
}

const ScheduleInterviewPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InterviewFormValues>({
    defaultValues: {
      advisorId: '',
      scheduledDate: new Date(),
      topic: '',
      details: '',
      interviewType: 'mock',
    },
  });

  // Fetch advisors
  const { data: advisors = [], isLoading: isLoadingAdvisors } = useQuery({
    queryKey: ['advisors'],
    queryFn: fetchCareerAdvisors,
  });

  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to schedule an interview",
        variant: "destructive",
      });
      navigate('/auth');
    }
  }, [user, navigate, toast]);

  const onSubmit = async (values: InterviewFormValues) => {
    if (!user?.id) {
      toast({
        title: "Authentication required",
        description: "Please sign in to schedule an interview",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      await scheduleInterview(
        user.id,
        values.advisorId,
        values.scheduledDate,
        values.topic,
        values.details,
        values.interviewType
      );
      
      toast({
        title: "Interview scheduled",
        description: "Your interview has been scheduled successfully",
      });
      
      navigate('/career-advisory/interviews');
    } catch (error) {
      console.error("Error scheduling interview:", error);
      toast({
        title: "Error",
        description: "Failed to schedule the interview. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const interviewTypes = [
    { value: 'mock', label: 'Mock Interview', description: 'Simulate a real job interview with general questions' },
    { value: 'practice', label: 'Practice Interview', description: 'Focus on improving your interview skills' },
    { value: 'technical', label: 'Technical Interview', description: 'Technical questions specific to your field' },
    { value: 'behavioral', label: 'Behavioral Interview', description: 'Questions about past experiences and behaviors' },
  ];

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Schedule an Interview</h1>
        
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Interview Details</CardTitle>
            <CardDescription>
              Schedule an online interview with one of our career advisors
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="interviewType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interview Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select interview type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {interviewTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex flex-col">
                                <span>{type.label}</span>
                                <span className="text-xs text-muted-foreground">
                                  {type.description}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="advisorId"
                  rules={{ required: "Please select an advisor" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Career Advisor</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        disabled={isLoadingAdvisors || isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an advisor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {advisors.map((advisor: CareerAdvisor) => (
                            <SelectItem key={advisor.id} value={advisor.id}>
                              <div className="flex flex-col">
                                <span>
                                  {advisor.user_profiles?.full_name || 'Unnamed Advisor'}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {advisor.specialization}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="scheduledDate"
                  rules={{ required: "Please select a date and time" }}
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date and Time</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              disabled={isSubmitting}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => date && field.onChange(date)}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Select the date for your interview. We'll suggest available time slots.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="topic"
                  rules={{ required: "Please enter a topic" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interview Topic</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="E.g., Frontend Developer Position"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter the position or topic you'd like to focus on
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Details</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Share any specific areas you'd like to focus on during the interview"
                          className="min-h-[100px]"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormDescription>
                        This will help the advisor prepare relevant questions for you
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormItem className="flex flex-col gap-2">
                  <FormDescription>
                    The interview will be conducted via video call. You'll receive a link to join when the session begins.
                  </FormDescription>
                </FormItem>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Scheduling...' : 'Schedule Interview'}
                </Button>
              </form>
            </Form>
          </CardContent>
          
          <CardFooter className="flex justify-between border-t p-6">
            <Button variant="ghost" onClick={() => navigate('/career-advisory/interviews')}>
              Cancel
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default ScheduleInterviewPage;
