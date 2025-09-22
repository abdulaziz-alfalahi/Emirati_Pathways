
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { AffindaAPI, AffindaCredential } from "https://esm.sh/@affinda/affinda@3.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req)  => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the Affinda API key directly from the environment variables
    const affindaApiKey = Deno.env.get('AFFINDA_API_KEY') || '';
    
    // If no API key, return error
    if (!affindaApiKey) {
      console.error('No Affinda API key found in environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'Affinda API key not found in environment variables. Please add it in Supabase Edge Function secrets.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    console.log('Using Affinda API key from environment:', affindaApiKey ? 'Key found' : 'Key not found');
    
    // Get the file data from the request
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (jsonError) {
      console.error('Error parsing request JSON:', jsonError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    const { fileData, fileName, fileType } = requestBody;
    
    if (!fileData) {
      console.error('No file data provided in request');
      return new Response(
        JSON.stringify({ error: 'No file data provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Initialize the Affinda client
    const credential = new AffindaCredential(affindaApiKey);
    const client = new AffindaAPI(credential);
    
    // Call Affinda API
    console.log('Calling Affinda API for file:', fileName, fileType);
    console.log('File data length:', fileData.length);
    
    try {
      // Validate the base64 content format
      if (!fileData.includes('base64')) {
        throw new Error('Invalid file data format - base64 encoding required');
      }
      
      const base64Content = fileData.split(',')[1]; // Remove the data:application/pdf;base64, part
      
      if (!base64Content) {
        throw new Error('Invalid base64 content');
      }
      
      // Create Affinda document request - removed collection parameter
      const response = await client.createDocument({
        file: base64Content,
        fileName: fileName || 'resume.pdf',
        wait: 'true' // String 'true' as required by Affinda API
      });
      
      if (!response || !response.data) {
        console.error('Empty or invalid response from Affinda');
        throw new Error('No data in Affinda response');
      }
      
      const data = response.data;
      console.log('Affinda API response received for:', fileName);
      console.log('Response data keys:', Object.keys(data));
      
      // Map Affinda response to your ResumeData structure
      const resumeData = {
        personal: {
          fullName: data.name?.raw || '',
          jobTitle: data.profession?.raw || '',
          email: data.emails?.[0] || '',
          phone: data.phoneNumbers?.[0]?.raw || '',
          location: data.location?.raw || '',
          linkedin: data.linkedin || '',
          website: data.websites?.[0] || ''
        },
        summary: data.summary || '',
        experience: (data.workExperience || []).map(exp => ({
          id: crypto.randomUUID(),
          company: exp.organization?.raw || '',
          position: exp.jobTitle?.raw || '',
          location: exp.location?.raw || '',
          startDate: exp.dates?.startDate || '',
          endDate: exp.dates?.endDate || null,
          current: exp.dates?.isCurrent || false,
          description: exp.jobDescription || ''
        })),
        education: (data.education || []).map(edu => ({
          id: crypto.randomUUID(),
          institution: edu.organization?.raw || '',
          degree: edu.accreditation?.education || '',
          field: edu.accreditation?.inputStr || '',
          location: edu.location?.raw || '',
          startDate: edu.dates?.startDate || '',
          endDate: edu.dates?.endDate || null,
          current: edu.dates?.isCurrent || false
        })),
        skills: (data.skills || []).map(skill => ({
          id: crypto.randomUUID(),
          name: skill.name || '',
          level: ''
        })),
        languages: (data.languages || []).map(language => ({
          id: crypto.randomUUID(),
          name: typeof language === 'string' ? language : language?.name || '',
          proficiency: 'Conversational'
        })),
        projects: [],
        certifications: [],
        metadata: {
          parsingMethod: 'affinda-api',
          parsedAt: new Date().toISOString(),
          fileType: fileType,
          processingId: `affinda_${Date.now()}`
        }
      };
      
      console.log('Resume data compiled successfully');
      
      return new Response(
        JSON.stringify(resumeData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (affindaError) {
      console.error('Error in Affinda API call:', affindaError);
      
      return new Response(
        JSON.stringify({ 
          error: 'Error calling Affinda API', 
          details: affindaError instanceof Error ? affindaError.message : String(affindaError)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in parse-resume function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error processing resume', 
        details: error instanceof Error ? error.message : String(error)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
