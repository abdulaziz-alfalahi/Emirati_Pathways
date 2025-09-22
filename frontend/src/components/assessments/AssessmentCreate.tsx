import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { createAssessment } from '@/services/assessmentService';
import { AssessmentFormValues } from '@/types/assessments';

// Form schema
const assessmentFormSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }),
  description: z.string().optional(),
  assessment_type: z.union([
    z.literal('skills'),
    z.literal('behaviors'),
    z.literal('capabilities'),
  ]),
  duration_minutes: z.string().transform((val) => val ? parseInt(val) : null).optional(),
  price_amount: z.string().transform((val) => val ? parseFloat(val) : null).optional(),
  price_currency: z.string().default("AED"),
  skills_tested: z.string().transform(val => val ? val.split(',').map(skill => skill.trim()).filter(Boolean) : []),
  requirements: z.string().optional(),
  eligibility_criteria: z.string().transform(val => val ? JSON.parse(val) : {}).optional(),
  is_active: z.boolean().default(true),
});

interface AssessmentCreateProps {
  onSuccess: () => void;
}

export const AssessmentCreate: React.FC<AssessmentCreateProps> = ({ onSuccess }) => {
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<AssessmentFormValues>({
    resolver: zodResolver(assessmentFormSchema),
    defaultValues: {
      title: '',
      description: '',
      assessment_type: 'skills',
      duration_minutes: null,
      price_amount: null,
      price_currency: 'AED',
      skills_tested: '',
      requirements: '',
      eligibility_criteria: '',
      is_active: true
    }
  });

  const onSubmit = async (values: AssessmentFormValues) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to create an assessment",
        variant: "destructive"
      });
      return;
    }

    try {
      // Prepare data for submission
      const assessmentData = {
        title: values.title,
        description: values.description || null,
        assessment_type: values.assessment_type,
        center_id: user.id,
        duration_minutes: values.duration_minutes,
        price_amount: values.price_amount,
        price_currency: values.price_currency,
        skills_tested: values.skills_tested ? 
          values.skills_tested.split(',').map(skill => skill.trim()).filter(Boolean) : 
          [],
        requirements: values.requirements || null,
        eligibility_criteria: values.eligibility_criteria ? 
          JSON.parse(values.eligibility_criteria as unknown as string) : 
          null,
        is_active: values.is_active,
      };

      await createAssessment(assessmentData);
      
      toast({
        title: "Assessment created",
        description: "Your assessment has been successfully created",
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error creating assessment:', error);
      toast({
        title: "Error",
        description: "Failed to create assessment. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create New Assessment</DialogTitle>
        <DialogDescription>
          Add a new assessment opportunity for students to take.
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Assessment title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assessment_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assessment Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="skills">Skills</SelectItem>
                      <SelectItem value="behaviors">Behaviors</SelectItem>
                      <SelectItem value="capabilities">Capabilities</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe the assessment" 
                    {...field} 
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="duration_minutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (minutes)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price Amount</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price_currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="AED">AED</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="skills_tested"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Skills Tested</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter skills separated by commas" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="requirements"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Requirements</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Requirements for the assessment" 
                    {...field} 
                    rows={2}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel>Active</FormLabel>
                  <FormDescription className="text-xs">
                    Make this assessment available for scheduling
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <DialogFooter>
            <Button type="submit">Create Assessment</Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
};
