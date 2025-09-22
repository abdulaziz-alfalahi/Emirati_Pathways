
import { useForm } from "react-hook-form";
import { Training } from "@/types/portfolio";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { addTraining, updateTraining } from "@/services/portfolioService";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";

const formSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  provider: z.string().min(2, "Provider must be at least 2 characters"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().optional(),
  is_completed: z.boolean(),
  skills_text: z.string().optional(),
  description: z.string().optional(),
});

interface TrainingFormProps {
  training?: Training;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TrainingForm: React.FC<TrainingFormProps> = ({
  training,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isInProgress, setIsInProgress] = useState(!training?.end_date);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: training?.title || "",
      provider: training?.provider || "",
      start_date: training?.start_date 
        ? new Date(training.start_date).toISOString().split("T")[0] 
        : new Date().toISOString().split("T")[0],
      end_date: training?.end_date
        ? new Date(training.end_date).toISOString().split("T")[0]
        : "",
      is_completed: training?.is_completed ?? false,
      skills_text: training?.skills_gained ? training.skills_gained.join(", ") : "",
      description: training?.description || "",
    },
  });

  const isEditMode = !!training;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (!user?.id) {
        toast({
          title: "Authentication required",
          description: "You must be logged in to save training records",
          variant: "destructive",
        });
        return;
      }

      // Split skills by commas and trim whitespace
      const skills_gained = values.skills_text
        ? values.skills_text.split(",").map(skill => skill.trim()).filter(Boolean)
        : [];

      if (isEditMode && training) {
        await updateTraining(training.id, {
          title: values.title,
          provider: values.provider,
          start_date: values.start_date,
          end_date: isInProgress ? null : (values.end_date || null),
          is_completed: values.is_completed,
          skills_gained,
          description: values.description || null,
        });
        
        toast({
          title: "Training updated",
          description: "Your training record has been updated successfully",
        });
      } else {
        await addTraining({
          user_id: user.id,
          title: values.title,
          provider: values.provider,
          start_date: values.start_date,
          end_date: isInProgress ? null : (values.end_date || null),
          is_completed: values.is_completed,
          skills_gained,
          description: values.description || null,
        });
        
        toast({
          title: "Training added",
          description: "Your training record has been added successfully",
        });
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving training:", error);
      toast({
        title: "Error",
        description: "There was an error saving your training record",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Training" : "Add New Training"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Training Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Full Stack Web Development" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Training Provider</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Udemy, Coursera, University" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div>
                  <FormField
                    control={form.control}
                    name="end_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            disabled={isInProgress} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex items-center space-x-2 mt-2">
                    <Checkbox 
                      id="in_progress" 
                      checked={isInProgress}
                      onCheckedChange={(checked) => {
                        setIsInProgress(!!checked);
                        if (checked) {
                          form.setValue("end_date", "");
                        }
                      }} 
                    />
                    <label
                      htmlFor="in_progress"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      This training is currently in progress
                    </label>
                  </div>
                </div>
              </div>
              
              <FormField
                control={form.control}
                name="is_completed"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        I have completed this training
                      </FormLabel>
                      <FormDescription>
                        Mark this if you have successfully completed the course or training
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="skills_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skills Gained (optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. JavaScript, React, Node.js" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>Separate skills with commas</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add details about what you learned..." 
                        {...field} 
                        rows={3} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                {isEditMode ? "Update" : "Add"} Training
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default TrainingForm;
