import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  MessageSquare, 
  Send, 
  User, 
  Briefcase, 
  Building, 
  Star,
  AlertCircle
} from 'lucide-react';
import { messagingService } from '@/services/messagingService';
import { useToast } from '@/hooks/use-toast';

interface QuickMessageDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  recipientId: string;
  recipientName: string;
  recipientRole: string;
  context?: {
    type: 'job_application' | 'job_inquiry' | 'mentorship' | 'general';
    jobId?: string;
    jobTitle?: string;
    applicationId?: string;
    companyName?: string;
  };
  onMessageSent?: () => void;
}

const QuickMessageDialog: React.FC<QuickMessageDialogProps> = ({
  isOpen,
  onOpenChange,
  recipientId,
  recipientName,
  recipientRole,
  context,
  onMessageSent
}) => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    setIsLoading(true);
    try {
      // First create a conversation
      const conversationTitle = context?.jobTitle 
        ? `${context.jobTitle} - ${getContextLabel()}`
        : `Conversation with ${recipientName}`;

      const conversationResponse = await messagingService.createConversation({
        participants: [recipientId],
        application_id: context?.applicationId,
        job_id: context?.jobId,
        title: conversationTitle
      });

      if (conversationResponse.success) {
        // Then send the message
        const messageResponse = await messagingService.sendMessage(
          conversationResponse.data.id,
          {
            content: message.trim(),
            message_type: 'text'
          }
        );

        if (messageResponse.success) {
          toast({
            title: "Message Sent!",
            description: `Your message has been sent to ${recipientName}.`,
          });
          
          setMessage('');
          onOpenChange(false);
          onMessageSent?.();
        } else {
          throw new Error(messageResponse.error || 'Failed to send message');
        }
      } else {
        throw new Error(conversationResponse.error || 'Failed to create conversation');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getContextLabel = () => {
    switch (context?.type) {
      case 'job_application': return 'Application Inquiry';
      case 'job_inquiry': return 'Job Inquiry';
      case 'mentorship': return 'Mentorship Request';
      default: return 'Message';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'recruiter': return <Briefcase className="h-4 w-4" />;
      case 'mentor': return <Star className="h-4 w-4" />;
      case 'employer_admin': return <Building className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'recruiter': return 'bg-blue-100 text-blue-800';
      case 'mentor': return 'bg-purple-100 text-purple-800';
      case 'employer_admin': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getSuggestedMessage = () => {
    switch (context?.type) {
      case 'job_application':
        return `Hello ${recipientName},\n\nI hope this message finds you well. I recently submitted my application for the ${context.jobTitle} position${context.companyName ? ` at ${context.companyName}` : ''}. I am very excited about this opportunity and would love to discuss how my skills and experience align with your requirements.\n\nI am particularly interested in contributing to D33 and Talent33 initiatives and would appreciate the chance to learn more about the role and your team.\n\nThank you for your time and consideration.\n\nBest regards`;
      
      case 'job_inquiry':
        return `Hello ${recipientName},\n\nI hope you're doing well. I came across the ${context.jobTitle} position${context.companyName ? ` at ${context.companyName}` : ''} and I'm very interested in learning more about this opportunity.\n\nCould you please provide more details about the role requirements and the application process? I believe my background would be a great fit for this position.\n\nThank you for your time.\n\nBest regards`;
      
      case 'mentorship':
        return `Hello ${recipientName},\n\nI hope this message finds you well. I am reaching out to inquire about potential mentorship opportunities. I am very interested in advancing my career in the UAE and would greatly value your guidance and expertise.\n\nWould you be available for a brief conversation to discuss how we might work together?\n\nThank you for considering my request.\n\nBest regards`;
      
      default:
        return `Hello ${recipientName},\n\nI hope you're doing well. I wanted to reach out to connect and discuss potential opportunities.\n\nThank you for your time.\n\nBest regards`;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <span>Send Message</span>
          </DialogTitle>
          <DialogDescription>
            Start a conversation with {recipientName} about {getContextLabel().toLowerCase()}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Recipient Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {getInitials(recipientName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold">{recipientName}</h3>
                    <Badge className={getRoleColor(recipientRole)}>
                      <div className="flex items-center space-x-1">
                        {getRoleIcon(recipientRole)}
                        <span className="capitalize">{recipientRole}</span>
                      </div>
                    </Badge>
                  </div>
                  {context?.companyName && (
                    <p className="text-sm text-gray-600">{context.companyName}</p>
                  )}
                  {context?.jobTitle && (
                    <p className="text-sm text-gray-500">{context.jobTitle}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Context Info */}
          {context && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">Message Context</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {context.type === 'job_application' && 'This message is related to your job application.'}
                      {context.type === 'job_inquiry' && 'This message is an inquiry about a job posting.'}
                      {context.type === 'mentorship' && 'This message is a mentorship request.'}
                      {context.type === 'general' && 'This is a general message.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Message Input */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="message" className="text-sm font-medium">
                Your Message
              </Label>
              <Textarea
                id="message"
                placeholder={getSuggestedMessage()}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={8}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Be professional and specific about your inquiry or interest.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMessage(getSuggestedMessage())}
              >
                Use Suggested Message
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMessage('')}
              >
                Clear
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSendMessage}
              disabled={isLoading || !message.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white me-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 me-2" />
                  Send Message
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickMessageDialog;

