
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to calculate skill match score
function calculateSkillMatch(resumeSkills, jobSkills)  {
  if (!resumeSkills || !jobSkills || !Array.isArray(resumeSkills) || !Array.isArray(jobSkills)) {
    return { score: 0, matched: [], missing: [] }
  }
  
  const resumeSkillNames = resumeSkills.map(skill => 
    typeof skill === 'string' ? skill.toLowerCase() : skill.name.toLowerCase()
  )
  
  const requiredJobSkills = jobSkills.filter(skill => skill.required)
  const preferredJobSkills = jobSkills.filter(skill => !skill.required)
  
  const matchedRequired = []
  const missingRequired = []
  const matchedPreferred = []
  
  // Check required skills
  for (const skill of requiredJobSkills) {
    const skillName = skill.name.toLowerCase()
    if (resumeSkillNames.some(name => name.includes(skillName) || skillName.includes(name))) {
      matchedRequired.push(skill.name)
    } else {
      missingRequired.push(skill.name)
    }
  }
  
  // Check preferred skills
  for (const skill of preferredJobSkills) {
    const skillName = skill.name.toLowerCase()
    if (resumeSkillNames.some(name => name.includes(skillName) || skillName.includes(name))) {
      matchedPreferred.push(skill.name)
    }
  }
  
  // Calculate score
  const requiredWeight = 0.7
  const preferredWeight = 0.3
  
  let requiredScore = requiredJobSkills.length > 0 
    ? (matchedRequired.length / requiredJobSkills.length) * 100 
    : 100
    
  let preferredScore = preferredJobSkills.length > 0 
    ? (matchedPreferred.length / preferredJobSkills.length) * 100 
    : 100
  
  const totalScore = (requiredScore * requiredWeight) + (preferredScore * preferredWeight)
  
  return {
    score: Math.round(totalScore),
    matched: [...matchedRequired, ...matchedPreferred],
    missing: missingRequired
  }
}

// Helper function to calculate experience match score
function calculateExperienceMatch(resumeExperience, jobExperience) {
  if (!resumeExperience || !jobExperience || !Array.isArray(resumeExperience) || !Array.isArray(jobExperience)) {
    return { score: 0, details: 'No experience data available' }
  }
  
  // Calculate total years of experience from resume
  const totalYears = resumeExperience.reduce((total, exp) => {
    // Try to extract years from dates or duration
    let years = 0
    if (exp.years) {
      years = exp.years
    } else if (exp.duration) {
      const yearMatch = exp.duration.match(/(\d+)\s*year/)
      if (yearMatch) years = parseInt(yearMatch[1])
    } else if (exp.startDate && exp.endDate) {
      const start = new Date(exp.startDate)
      const end = exp.endDate.toLowerCase() === 'present' ? new Date() : new Date(exp.endDate)
      years = (end.getFullYear() - start.getFullYear()) + 
              (end.getMonth() - start.getMonth()) / 12
    }
    return total + years
  }, 0)
  
  // Check against job requirements
  let matchScore = 0
  let details = []
  
  for (const req of jobExperience) {
    if (req.years && totalYears >= req.years) {
      matchScore += req.required ? 70 : 30
      details.push(`Meets ${req.years} years of experience requirement in ${req.field || 'relevant field'}`)
    } else if (req.years) {
      details.push(`Does not meet ${req.years} years of experience requirement in ${req.field || 'relevant field'}`)
    }
  }
  
  return {
    score: Math.min(100, matchScore),
    details: details.join('; ') || 'Experience requirements evaluation completed'
  }
}

// Helper function to calculate education match score
function calculateEducationMatch(resumeEducation, jobEducation) {
  if (!resumeEducation || !jobEducation || !Array.isArray(resumeEducation) || !Array.isArray(jobEducation)) {
    return { score: 0, details: 'No education data available' }
  }
  
  // Define education levels and their relative values
  const educationLevels = {
    'high school': 1,
    'associate': 2,
    'bachelor': 3,
    'undergraduate': 3,
    'master': 4,
    'graduate': 4,
    'phd': 5,
    'doctorate': 5
  }
  
  // Get highest education level from resume
  let highestLevel = 0
  let field = ''
  
  for (const edu of resumeEducation) {
    let level = 0
    const degreeText = (edu.degree || '').toLowerCase()
    
    // Check for education level in degree text
    for (const [levelName, levelValue] of Object.entries(educationLevels)) {
      if (degreeText.includes(levelName)) {
        level = levelValue
        break
      }
    }
    
    if (level > highestLevel) {
      highestLevel = level
      field = edu.field || edu.area || ''
    }
  }
  
  // Check against job requirements
  let matchScore = 0
  let details = []
  
  for (const req of jobEducation) {
    let requiredLevel = 0
    const reqLevelText = (req.level || '').toLowerCase()
    
    // Check for education level in requirement text
    for (const [levelName, levelValue] of Object.entries(educationLevels)) {
      if (reqLevelText.includes(levelName)) {
        requiredLevel = levelValue
        break
      }
    }
    
    if (highestLevel >= requiredLevel) {
      matchScore += req.required ? 70 : 30
      details.push(`Meets ${req.level} education requirement`)
      
      // Check field match if specified
      if (req.field && field) {
        const reqField = req.field.toLowerCase()
        if (field.toLowerCase().includes(reqField) || reqField.includes(field.toLowerCase())) {
          matchScore += req.required ? 30 : 10
          details.push(`Field of study (${field}) matches required field (${req.field})`)
        }
      }
    } else {
      details.push(`Does not meet ${req.level} education requirement`)
    }
  }
  
  return {
    score: Math.min(100, matchScore),
    details: details.join('; ') || 'Education requirements evaluation completed'
  }
}

// Main matching function
function matchResumeToJob(resumeData, jobData) {
  // Define category weights
  const weights = {
    skills: 0.35,
    experience: 0.25,
    education: 0.20,
    location: 0.10,
    languages: 0.10
  }
  
  // Calculate category scores
  const skillsMatch = calculateSkillMatch(
    resumeData.skills, 
    jobData.requirements?.skills
  )
  
  const experienceMatch = calculateExperienceMatch(
    resumeData.experience, 
    jobData.requirements?.experience
  )
  
  const educationMatch = calculateEducationMatch(
    resumeData.education, 
    jobData.requirements?.education
  )
  
  // Simple location match (could be enhanced with geo-distance)
  let locationScore = 0
  let locationDetails = 'Location not specified'
  
  if (resumeData.personal_info?.location && jobData.location) {
    const resumeLocation = resumeData.personal_info.location.toLowerCase()
    const jobLocation = jobData.location.toLowerCase()
    
    if (resumeLocation.includes(jobLocation) || jobLocation.includes(resumeLocation)) {
      locationScore = 100
      locationDetails = 'Location matches'
    } else if (jobData.work_mode && 
              (jobData.work_mode.toLowerCase().includes('remote') || 
               jobData.work_mode.toLowerCase().includes('hybrid'))) {
      locationScore = 80
      locationDetails = `Remote/hybrid position compatible with candidate location`
    } else {
      locationScore = 0
      locationDetails = `Location mismatch: Job in ${jobData.location}, candidate in ${resumeData.personal_info.location}`
    }
  }
  
  // Languages match
  let languageScore = 0
  let languageDetails = 'Language requirements not specified'
  
  if (resumeData.languages && jobData.requirements?.languages) {
    const resumeLanguages = resumeData.languages.map(l => 
      typeof l === 'string' ? { language: l.toLowerCase(), proficiency: 'unknown' } : 
      { language: l.language.toLowerCase(), proficiency: (l.proficiency || 'unknown').toLowerCase() }
    )
    
    const jobLanguages = jobData.requirements.languages
    const matchedLanguages = []
    const missingLanguages = []
    
    for (const reqLang of jobLanguages) {
      const langName = reqLang.language.toLowerCase()
      const matchedLang = resumeLanguages.find(l => l.language.includes(langName) || langName.includes(l.language))
      
      if (matchedLang) {
        matchedLanguages.push(reqLang.language)
      } else {
        missingLanguages.push(reqLang.language)
      }
    }
    
    languageScore = jobLanguages.length > 0 ? 
      (matchedLanguages.length / jobLanguages.length) * 100 : 100
      
    languageDetails = matchedLanguages.length > 0 ? 
      `Matched languages: ${matchedLanguages.join(', ')}` : 'No language matches'
      
    if (missingLanguages.length > 0) {
      languageDetails += `. Missing languages: ${missingLanguages.join(', ')}`
    }
  }
  
  // Calculate overall score
  const categoryScores = {
    skills: skillsMatch.score,
    experience: experienceMatch.score,
    education: educationMatch.score,
    location: locationScore,
    languages: languageScore
  }
  
  const overallScore = Math.round(
    (categoryScores.skills * weights.skills) +
    (categoryScores.experience * weights.experience) +
    (categoryScores.education * weights.education) +
    (categoryScores.location * weights.location) +
    (categoryScores.languages * weights.languages)
  )
  
  // Prepare match details
  const matchDetails = {
    skills: {
      matched: skillsMatch.matched,
      missing: skillsMatch.missing
    },
    experience: experienceMatch.details,
    education: educationMatch.details,
    location: locationDetails,
    languages: languageDetails
  }
  
  return {
    overallScore,
    categoryScores,
    matchDetails
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  const url = new URL(req.url)
  const path = url.pathname.split('/').pop()
  
  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    
    const { data: { user } } = await supabaseClient.auth.getUser()
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }
    
    const { resumeData, resumeId, jobData, jobId, limit = 10, threshold = 50 } = await req.json()
    
    if (path === 'candidate-to-jobs') {
      // Match a candidate to jobs
      if (!resumeData) {
        return new Response(
          JSON.stringify({ error: 'Resume data is required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
      
      // Get active job descriptions
      const { data: jobs, error: jobsError } = await supabaseClient
        .from('job_descriptions')
        .select('*')
        .eq('is_active', true)
      
      if (jobsError) {
        return new Response(
          JSON.stringify({ error: 'Error fetching jobs', details: jobsError }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }
      
      // Match resume against each job
      const matches = jobs.map(job => {
        const match = matchResumeToJob(resumeData, job)
        return {
          jobId: job.id,
          jobTitle: job.title,
          company: job.company,
          location: job.location,
          ...match
        }
      })
      
      // Filter and sort matches
      const filteredMatches = matches
        .filter(match => match.overallScore >= threshold)
        .sort((a, b) => b.overallScore - a.overallScore)
        .slice(0, limit)
      
      // Save match results if resumeId is provided
      if (resumeId) {
        for (const match of filteredMatches) {
          await supabaseClient.rpc('update_job_match', {
            _job_id: match.jobId,
            _profile_id: resumeId,
            _overall_score: match.overallScore,
            _category_scores: match.categoryScores,
            _match_details: match.matchDetails
          })
        }
      }
      
      return new Response(
        JSON.stringify(filteredMatches),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
      
    } else if (path === 'job-to-candidates') {
      // Match a job to candidates
      if (!jobData) {
        return new Response(
          JSON.stringify({ error: 'Job data is required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
      
      // Get profiles with resume data
      const { data: profiles, error: profilesError } = await supabaseClient
        .from('profiles')
        .select('id, full_name, resume_data')
        .not('resume_data', 'is', null)
      
      if (profilesError) {
        return new Response(
          JSON.stringify({ error: 'Error fetching profiles', details: profilesError }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }
      
      // Match job against each resume
      const matches = profiles.map(profile => {
        const match = matchResumeToJob(profile.resume_data, jobData)
        return {
          candidateId: profile.id,
          candidateName: profile.full_name,
          ...match
        }
      })
      
      // Filter and sort matches
      const filteredMatches = matches
        .filter(match => match.overallScore >= threshold)
        .sort((a, b) => b.overallScore - a.overallScore)
        .slice(0, limit)
      
      // Save match results if jobId is provided
      if (jobId) {
        for (const match of filteredMatches) {
          await supabaseClient.rpc('update_job_match', {
            _job_id: jobId,
            _profile_id: match.candidateId,
            _overall_score: match.overallScore,
            _category_scores: match.categoryScores,
            _match_details: match.matchDetails
          })
        }
      }
      
      return new Response(
        JSON.stringify(filteredMatches),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid endpoint' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
  } catch (error) {
    console.error('Error in matching function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
