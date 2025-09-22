
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvitationEmailData {
  recipientEmail: string;
  recipientName?: string;
  senderName: string;
  assessmentTitle: string;
  role: string;
  invitationUrl: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      recipientEmail,
      recipientName,
      senderName,
      assessmentTitle,
      role,
      invitationUrl
    }: InvitationEmailData = await req.json();

    // For demo purposes, we'll just log the email data
    // In a real implementation, you would integrate with an email service like Resend
    console.log('Sending invitation email:', {
      to: recipientEmail,
      subject: `Invitation to collaborate on "${assessmentTitle}"`,
      content: {
        recipientName: recipientName || recipientEmail,
        senderName,
        assessmentTitle,
        role,
        invitationUrl
      }
    });

    // Here you would typically:
    // 1. Use an email service like Resend to send the actual email
    // 2. Include a properly formatted HTML email template
    // 3. Handle email delivery status and errors

    // For now, return success
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invitation email sent successfully',
        details: {
          recipient: recipientEmail,
          assessment: assessmentTitle,
          role: role
        }
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error sending invitation email:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send invitation email',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
