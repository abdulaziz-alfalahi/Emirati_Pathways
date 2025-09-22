
import { supabase } from '@/integrations/supabase/client';

interface InvitationEmailData {
  recipientEmail: string;
  recipientName?: string;
  senderName: string;
  assessmentTitle: string;
  role: string;
  invitationUrl: string;
}

export const sendInvitationEmail = async (data: InvitationEmailData) => {
  try {
    const { error } = await supabase.functions.invoke('send-invitation-email', {
      body: data
    });

    if (error) {
      console.error('Error sending invitation email:', error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to send invitation email:', error);
    throw error;
  }
};

export const generateInvitationUrl = (assessmentId: string, collaboratorId: string) => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/collaborative-assessments/invite?assessment=${assessmentId}&collaborator=${collaboratorId}`;
};
