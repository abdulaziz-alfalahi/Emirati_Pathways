import { toast } from '@/hooks/use-toast';

export const handleServiceError = (error: any, defaultMessage: string) => {
  console.error('Service error:', error);
  
  const message = error?.message || defaultMessage;
  
  toast({
    title: "Error",
    description: message,
    variant: "destructive",
  });
};

export const transformEnrollment = (data: any) => ({
  ...data,
  // Add any transformation logic here
});
