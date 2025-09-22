
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { AssessmentType } from '@/types/assessments';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, UploadCloud } from 'lucide-react';

const formSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  assessment_type: z.enum(['skills', 'behaviors', 'capabilities'] as const),
  duration_minutes: z.coerce.number().min(0), // Coerce string to number
  price_amount: z.coerce.number().min(0), // Coerce string to number
  skills_tested: z.string(),
  requirements: z.string(),
  is_active: z.boolean().default(true),
});

export const AssessmentUpload: React.FC = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assessmentFile, setAssessmentFile] = useState<File | null>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      assessment_type: 'skills',
      duration_minutes: 60, // Change from string to number
      price_amount: 0, // Change from string to number
      skills_tested: '',
      requirements: '',
      is_active: true,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast.error('You must be logged in to upload assessments');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Process skills tested into array
      const skillsArray = values.skills_tested.split(',').map(skill => skill.trim()).filter(Boolean);
      
      // Create the assessment record
      const { data: assessment, error } = await supabase
        .from('assessments')
        .insert({
          title: values.title,
          description: values.description,
          assessment_type: values.assessment_type,
          duration_minutes: values.duration_minutes,
          price_amount: values.price_amount,
          skills_tested: skillsArray,
          requirements: values.requirements,
          is_active: values.is_active,
          center_id: user.id,
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Handle file upload if provided
      if (assessmentFile && assessment) {
        const fileExt = assessmentFile.name.split('.').pop();
        const filePath = `assessments/${assessment.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('assessment-materials')
          .upload(filePath, assessmentFile);
          
        if (uploadError) throw uploadError;
      }
      
      toast.success('Assessment uploaded successfully');
      form.reset();
      setAssessmentFile(null);
    } catch (error) {
      console.error('Error uploading assessment:', error);
      toast.error('Failed to upload assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAssessmentFile(e.target.files[0]);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assessment Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter assessment title" {...field} />
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
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="skills">Skills Assessment</SelectItem>
                        <SelectItem value="behaviors">Behavioral Assessment</SelectItem>
                        <SelectItem value="capabilities">Capabilities Assessment</SelectItem>
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
                      placeholder="Provide a detailed description of the assessment" 
                      {...field} 
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid gap-6 md:grid-cols-2">
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
                    <FormLabel>Price (AED)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter 0 for free assessments
                    </FormDescription>
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
                      placeholder="Enter skills separated by commas (e.g., communication, leadership, problem-solving)" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    List the skills evaluated in this assessment
                  </FormDescription>
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
                      placeholder="List any requirements for taking this assessment" 
                      {...field} 
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="border rounded-md p-4">
              <FormLabel className="block mb-2">Assessment Materials</FormLabel>
              <Input 
                type="file" 
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Upload supporting documents or assessment materials (optional)
              </p>
            </div>
            
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Publish Assessment
                    </FormLabel>
                    <FormDescription>
                      Make this assessment visible to users
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
            
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Upload Assessment
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
