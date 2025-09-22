
import { useForm } from "react-hook-form";
import { PortfolioHighlight } from "@/types/portfolio";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addPortfolioHighlight, updatePortfolioHighlight } from "@/services/portfolioService";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";

const formSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  type: z.enum(["project", "achievement", "publication", "other"]),
  date: z.string().optional(),
  url: z.string().url("Must be a valid URL").or(z.string().length(0)).optional(),
});

interface HighlightFormProps {
  highlight?: PortfolioHighlight;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const HighlightForm: React.FC<HighlightFormProps> = ({
  highlight,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: highlight?.title || "",
      description: highlight?.description || "",
      type: highlight?.type || "project",
      date: highlight?.date
        ? new Date(highlight.date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      url: highlight?.url || "",
    },
  });

  const isEditMode = !!highlight;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (!user?.id) {
        toast({
          title: "Authentication required",
          description: "You must be logged in to save portfolio highlights",
          variant: "destructive",
        });
        return;
      }

      if (isEditMode && highlight) {
        await updatePortfolioHighlight(highlight.id, {
          title: values.title,
          description: values.description,
          type: values.type,
          date: values.date || null,
          url: values.url || null,
        });
        
        toast({
          title: "Highlight updated",
          description: "Your portfolio highlight has been updated successfully",
        });
      } else {
        await addPortfolioHighlight({
          user_id: user.id,
          title: values.title,
          description: values.description,
          type: values.type,
          date: values.date || null,
          url: values.url || null,
        });
        
        toast({
          title: "Highlight added",
          description: "Your portfolio highlight has been added successfully",
        });
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving highlight:", error);
      toast({
        title: "Error",
        description: "There was an error saving your portfolio highlight",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Portfolio Highlight" : "Add New Portfolio Highlight"}
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
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Mobile App Development Project" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
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
                        <SelectItem value="project">Project</SelectItem>
                        <SelectItem value="achievement">Achievement</SelectItem>
                        <SelectItem value="publication">Publication</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose the category that best describes this highlight
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date (optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>
                      When was this accomplished or published?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe your achievement, project or publication..." 
                        {...field} 
                        rows={4} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL (optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://..." 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Link to your project, achievement, or publication
                    </FormDescription>
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
                {isEditMode ? "Update" : "Add"} Highlight
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default HighlightForm;
