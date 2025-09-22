
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req)  => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { fileContent } = await req.json()
    
    if (!fileContent) {
      return new Response(
        JSON.stringify({ error: 'File content is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Clean up PDF header content if present (filter out PDF artifacts)
    let textContent = fileContent
    if (textContent.startsWith('%PDF')) {
      console.log('PDF header detected, cleaning up content')
      // Remove PDF header markers and other non-text content
      textContent = textContent.replace(/%PDF-[\d.]+/, '')
                              .replace(/\b\d+\s+\d+\s+obj\b/g, '')
                              .replace(/endobj|endstream|xref|trailer|startxref/g, '')
                              .replace(/<<.*?>>/gs, '')
    }

    // Call OpenAI API to parse the resume
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API key not configured',
          fallbackToRegex: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a resume parsing assistant. Extract structured information from the resume text provided.'
          },
          {
            role: 'user',
            content: `Parse the following resume and extract structured information in JSON format. Include the following fields if available: personal_info (name, email, phone, location) , summary, experience (array of positions with company, title, dates, description), education (array with institution, degree, dates), skills (array), languages (array with language and proficiency), certifications (array), projects (array). If you encounter content that appears to be PDF artifacts or non-textual content, ignore it and focus only on extracting valid resume information. Resume text: ${textContent}`
          }
        ],
        temperature: 0.1
      })
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json()
      console.error('OpenAI API error:', JSON.stringify(errorData))
      
      return new Response(
        JSON.stringify({ 
          error: `OpenAI API error: ${errorData.error?.message || 'Unknown error'}`,
          fallbackToRegex: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const openaiData = await openaiResponse.json()
    
    // Extract the JSON from the OpenAI response
    const assistantMessage = openaiData.choices[0].message.content
    let parsedResume
    
    try {
      // Try to extract JSON from the response
      const jsonMatch = assistantMessage.match(/```json\n([\s\S]*?)\n```/) || 
                        assistantMessage.match(/{[\s\S]*}/)
      
      if (jsonMatch) {
        parsedResume = JSON.parse(jsonMatch[1] || jsonMatch[0])
      } else {
        parsedResume = JSON.parse(assistantMessage)
      }
      
      // Ensure personal info doesn't contain PDF artifacts
      if (parsedResume.personal_info) {
        // Convert to our expected format and clean up name field
        parsedResume.personal = {
          fullName: cleanPersonalField(parsedResume.personal_info.name),
          jobTitle: cleanPersonalField(parsedResume.personal_info.title || ''),
          email: parsedResume.personal_info.email || '',
          phone: parsedResume.personal_info.phone || '',
          location: parsedResume.personal_info.location || '',
          linkedin: parsedResume.personal_info.linkedin || '',
          website: parsedResume.personal_info.website || ''
        }
        delete parsedResume.personal_info
      } else if (!parsedResume.personal) {
        parsedResume.personal = {
          fullName: '',
          jobTitle: '',
          email: '',
          phone: '',
          location: '',
          linkedin: '',
          website: ''
        }
      } else {
        // Clean existing personal fields if present
        parsedResume.personal.fullName = cleanPersonalField(parsedResume.personal.fullName || '')
        parsedResume.personal.jobTitle = cleanPersonalField(parsedResume.personal.jobTitle || '')
      }
      
      // Add IDs to array items
      if (parsedResume.experience) {
        parsedResume.experience = parsedResume.experience.map((exp: any) => ({...exp, id: crypto.randomUUID()}))
      }
      if (parsedResume.education) {
        parsedResume.education = parsedResume.education.map((edu: any) => ({...edu, id: crypto.randomUUID()}))
      }
      if (parsedResume.skills) {
        parsedResume.skills = parsedResume.skills.map((skill: any) => {
          // If skill is just a string, convert to object with id
          if (typeof skill === 'string') {
            return { name: skill, level: 'intermediate', id: crypto.randomUUID() }
          }
          return {...skill, id: crypto.randomUUID()}
        })
      }
      if (parsedResume.languages) {
        parsedResume.languages = parsedResume.languages.map((lang: any) => {
          // If language is just a string, convert to object with id
          if (typeof lang === 'string') {
            return { language: lang, proficiency: 'conversational', id: crypto.randomUUID() }
          }
          return {...lang, id: crypto.randomUUID()}
        })
      }
      
      // Add metadata
      parsedResume.metadata = {
        parsingMethod: 'enhanced-edge-function',
        parsedAt: new Date().toISOString(),
        model: 'gpt-3.5-turbo'
      }
      
    } catch (error) {
      console.error('Error parsing JSON from OpenAI response:', error)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to parse resume data', 
          raw_response: assistantMessage,
          fallbackToRegex: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify(parsedResume),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error processing resume:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error occurred',
        fallbackToRegex: true 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

// Helper function to clean personal fields from PDF artifacts
function cleanPersonalField(value: string): string {
  if (!value) return '';
  
  // Remove PDF artifacts and common unwanted patterns
  return value
    .replace(/%PDF-[\d.]+/g, '')
    .replace(/\b\d+\s+\d+\s+obj\b/g, '')
    .replace(/endobj|endstream|xref|trailer|startxref/g, '')
    .replace(/<<.*?>>/g, '')
    .trim();
}
