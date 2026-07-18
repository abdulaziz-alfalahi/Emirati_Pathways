import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
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
import { useAuth } from '@/context/AuthContext';
import { Loader2, UploadCloud } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { TrainingMaterialType } from '@/types/training-materials';

const formSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  material_type: z.enum(['document', 'video', 'presentation', 'interactive', 'assessment'] as const),
  category: z.string().min(2, { message: "Category is required" }),
  tags: z.string(),
  is_public: z.boolean().default(true),
});

export const TrainingMaterialUpload: React.FC = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [materialFile, setMaterialFile] = useState<File | null>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      material_type: 'document',
      category: '',
      tags: '',
      is_public: true,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast.error('You must be logged in to upload training materials');
      return;
    }
    
    if (!materialFile) {
      toast.error('Please select a file to upload');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Process tags into array
      const tagsArray = values.tags.split(',').map(tag => tag.trim()).filter(Boolean);
      
      // Create the training material record
      const { data: material, error } = await supabase
        .from('training_materials')
        .insert({
          title: values.title,
          description: values.description,
          material_type: values.material_type,
          category: values.category,
          tags: tagsArray,
          is_public: values.is_public,
          center_id: user.id,
          file_size: materialFile.size,
          file_type: materialFile.type,
          file_name: materialFile.name
        })
        .select()
        .single();
        
      if (error) throw error;
      
      if (material) {
        const fileExt = materialFile.name.split('.').pop();
        const filePath = `training-materials/${material.id}/${Date.now()}.${fileExt}`;
        
        // TODO: Connect to Flask API - const { error: uploadError } = await supabase.storage
          .from('training-materials')
          .upload(filePath, materialFile);
          
        if (uploadError) throw uploadError;
        
        // Update the material record with the file path
        const { error: updateError } = await supabase
          .from('training_materials')
          .update({ file_path: filePath })
          .eq('id', material.id);
          
        if (updateError) throw updateError;
      }
      
      toast.success('Training material uploaded successfully');
      form.reset();
      setMaterialFile(null);
    } catch (error) {
      console.error('Error uploading training material:', error);
      toast.error('Failed to upload training material');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMaterialFile(e.target.files[0]);
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
                    <FormLabel>Material Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter material title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="material_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material Type</FormLabel>
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
                        <SelectItem value="document">Document</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="presentation">Presentation</SelectItem>
                        <SelectItem value="interactive">Interactive Content</SelectItem>
                        <SelectItem value="assessment">Assessment Material</SelectItem>
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
                      placeholder="Provide a detailed description of the training material" 
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
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Technical, Soft Skills, Leadership" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter tags separated by commas" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Add relevant tags to help users find this material
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="border rounded-md p-4">
              <FormLabel className="block mb-2">Upload File</FormLabel>
              <Input 
                type="file" 
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.mp4,.mp3,.zip"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Upload training material file (Max size: 100MB)
              </p>
              {materialFile && (
                <p className="text-sm font-medium mt-2">
                  Selected file: {materialFile.name} ({(materialFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
            
            <FormField
              control={form.control}
              name="is_public"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Public Material
                    </FormLabel>
                    <FormDescription>
                      Make this material visible to all authorized users
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
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="me-2 h-4 w-4" />
                  Upload Material
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
