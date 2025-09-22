
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Define the expected structure for job description data
interface JobDescription {
  title: string;
  company: string;
  location: string;
  employment_type: string;
  work_mode: string;
  description: string;
  responsibilities: string[];
  requirements: {
    skills: Array<{name: string, level: string, required: boolean}>;
    experience: Array<{years: number, field: string, required: boolean}>;
    education: Array<{level: string, field: string, required: boolean}>;
    languages: Array<{language: string, proficiency: string}>;
  };
  benefits: string[];
  salary: {
    min?: number;
    max?: number;
    currency?: string;
    period?: string;
  };
  application_deadline?: string;
  posted_date?: string;
  keywords: string[];
}

// Validate the job description data structure
function validateJobDescription(data: any) : { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  
  // Check required top-level fields
  const requiredFields = ['title', 'company', 'description', 'requirements'];
  for (const field of requiredFields) {
    if (!data[field]) {
      missing.push(field);
    }
  }
  
  // Check requirements structure
  if (data.requirements) {
    if (!data.requirements.skills || !Array.isArray(data.requirements.skills)) {
      missing.push('requirements.skills');
    }
  }
  
  return { 
    valid: missing.length === 0,
    missing 
  };
}

// Ensure the job description has the correct structure
function ensureValidStructure(data: any): JobDescription {
  // Create a base structure with default values
  const validStructure: JobDescription = {
    title: data.title || '',
    company: data.company || '',
    location: data.location || '',
    employment_type: data.employment_type || '',
    work_mode: data.work_mode || '',
    description: data.description || '',
    responsibilities: Array.isArray(data.responsibilities) ? data.responsibilities : [],
    requirements: {
      skills: Array.isArray(data.requirements?.skills) ? data.requirements.skills : [],
      experience: Array.isArray(data.requirements?.experience) ? data.requirements.experience : [],
      education: Array.isArray(data.requirements?.education) ? data.requirements.education : [],
      languages: Array.isArray(data.requirements?.languages) ? data.requirements.languages : [],
    },
    benefits: Array.isArray(data.benefits) ? data.benefits : [],
    salary: {
      min: data.salary?.min || null,
      max: data.salary?.max || null,
      currency: data.salary?.currency || null,
      period: data.salary?.period || null,
    },
    application_deadline: data.application_deadline || null,
    posted_date: data.posted_date || null,
    keywords: Array.isArray(data.keywords) ? data.keywords : [],
  };
  
  return validStructure;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    const { fileContent } = await req.json()
    
    if (!fileContent) {
      return new Response(
        JSON.stringify({ error: 'Job description content is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    
    // Extract text content from the file
    const textContent = fileContent
    
    // Call OpenAI API to parse the job description
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }
    
    // Improved prompt with explicit structure requirements
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo', // Changed from 'gpt-4' to 'gpt-3.5-turbo'
        messages: [
          {
            role: 'system',
            content: 'You are a job description parsing assistant. Extract structured information from the job description text provided. Always return valid JSON without markdown formatting. Ensure all required fields are included in your response.'
          },
          {
            role: 'user',
            content: `Parse the following job description and extract structured information in JSON format. 
            
Your response MUST be a valid JSON object with the following structure:
{
  "title": "string",
  "company": "string",
  "location": "string",
  "employment_type": "string",
  "work_mode": "string",
  "description": "string",
  "responsibilities": ["string"],
  "requirements": {
    "skills": [{"name": "string", "level": "string", "required": boolean}],
    "experience": [{"years": number, "field": "string", "required": boolean}],
    "education": [{"level": "string", "field": "string", "required": boolean}],
    "languages": [{"language": "string", "proficiency": "string"}]
  },
  "benefits": ["string"],
  "salary": {
    "min": number,
    "max": number,
    "currency": "string",
    "period": "string"
  },
  "application_deadline": "string",
  "posted_date": "string",
  "keywords": ["string"]
}

If any field is not found in the job description, include it with a null value or empty array as appropriate. Do not include any explanatory text or markdown formatting in your response, only the JSON object.

Job description text: ${textContent}`
          }
        ],
        temperature: 0.1
      }) 
    })
    
    const openaiData = await openaiResponse.json()
    
    // Check if OpenAI API returned an error
    if (openaiData.error) {
      console.error('OpenAI API error:', openaiData.error)
      return new Response(
        JSON.stringify({ error: `OpenAI API error: ${openaiData.error.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }
    
    // Extract the JSON from the OpenAI response
    const assistantMessage = openaiData.choices[0].message.content
    let parsedJobDescription
    
    try {
      // Try to extract JSON from the response
      const jsonMatch = assistantMessage.match(/```json\n([\s\S]*?)\n```/) || 
                        assistantMessage.match(/{[\s\S]*}/)
      
      if (jsonMatch) {
        parsedJobDescription = JSON.parse(jsonMatch[1] || jsonMatch[0])
      } else {
        parsedJobDescription = JSON.parse(assistantMessage)
      }
      
      // Validate the parsed job description
      const validation = validateJobDescription(parsedJobDescription)
      
      if (!validation.valid) {
        console.warn('Incomplete job description data. Missing fields:', validation.missing)
        
        // Ensure the structure is valid even if some fields are missing
        parsedJobDescription = ensureValidStructure(parsedJobDescription)
        
        return new Response(
          JSON.stringify({
            data: parsedJobDescription,
            warning: `Job description was parsed but some fields were missing: ${validation.missing.join(', ')}`,
            complete: false
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      // Ensure consistent structure
      parsedJobDescription = ensureValidStructure(parsedJobDescription)
      
      return new Response(
        JSON.stringify({
          data: parsedJobDescription,
          complete: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (error) {
      console.error('Error parsing JSON from OpenAI response:', error)
      console.error('Raw response:', assistantMessage)
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to parse job description data', 
          details: error.message,
          raw_response: assistantMessage 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }
  } catch (error) {
    console.error('Error processing job description:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
