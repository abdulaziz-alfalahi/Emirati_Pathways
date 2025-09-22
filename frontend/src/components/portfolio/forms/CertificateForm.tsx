
import { useForm } from "react-hook-form";
import { Certificate } from "@/types/portfolio";
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
import { addCertificate, updateCertificate } from "@/services/portfolioService";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";

const formSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  issuer: z.string().min(2, "Issuer must be at least 2 characters"),
  issue_date: z.string().min(1, "Issue date is required"),
  expiry_date: z.string().optional(),
  credential_id: z.string().optional(),
  credential_url: z.string().url("Must be a valid URL").or(z.string().length(0)).optional(),
  description: z.string().optional(),
});

interface CertificateFormProps {
  certificate?: Certificate;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CertificateForm: React.FC<CertificateFormProps> = ({
  certificate,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: certificate?.title || "",
      issuer: certificate?.issuer || "",
      issue_date: certificate?.issue_date 
        ? new Date(certificate.issue_date).toISOString().split("T")[0] 
        : new Date().toISOString().split("T")[0],
      expiry_date: certificate?.expiry_date
        ? new Date(certificate.expiry_date).toISOString().split("T")[0]
        : "",
      credential_id: certificate?.credential_id || "",
      credential_url: certificate?.credential_url || "",
      description: certificate?.description || "",
    },
  });

  const isEditMode = !!certificate;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (!user?.id) {
        toast({
          title: "Authentication required",
          description: "You must be logged in to save certificates",
          variant: "destructive",
        });
        return;
      }

      if (isEditMode && certificate) {
        await updateCertificate(certificate.id, {
          ...values,
          expiry_date: values.expiry_date || null,
          credential_id: values.credential_id || null,
          credential_url: values.credential_url || null,
          description: values.description || null,
        });
        
        toast({
          title: "Certificate updated",
          description: "Your certificate has been updated successfully",
        });
      } else {
        await addCertificate({
          user_id: user.id,
          title: values.title,
          issuer: values.issuer,
          issue_date: values.issue_date,
          expiry_date: values.expiry_date || null,
          credential_id: values.credential_id || null,
          credential_url: values.credential_url || null,
          description: values.description || null,
        });
        
        toast({
          title: "Certificate added",
          description: "Your certificate has been added successfully",
        });
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving certificate:", error);
      toast({
        title: "Error",
        description: "There was an error saving your certificate",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Certificate" : "Add New Certificate"}
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
                    <FormLabel>Certificate Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. AWS Certified Solutions Architect" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="issuer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issuing Organization</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Amazon Web Services" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="issue_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="expiry_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date (optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>Leave blank if no expiry</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="credential_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credential ID (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. ABC123XYZ" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="credential_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credential URL (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormDescription>Link to verify your credential</FormDescription>
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
                        placeholder="Add details about your certification..." 
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
                {isEditMode ? "Update" : "Add"} Certificate
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CertificateForm;
