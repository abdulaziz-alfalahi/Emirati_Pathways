// Enhanced Supabase Edge Function Integration
// This file shows how to integrate your existing Supabase edge functions with the new unified data structures

// supabase/functions/enhanced-cv-parser/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface CVData {
  personal_info: {
    name: string;
    email: string;
    phone: string;
    location?: string;
    linkedin?: string;
    website?: string;
  };
  summary?: string;
  experience: Array<{
    title: string;
    company: string;
    location?: string;
    start_date: string;
    end_date?: string;
    is_current?: boolean;
    description?: string;
    responsibilities?: string[];
    achievements?: string[];
    skills_used?: string[];
  }>;
  skills: Array<{
    name: string;
    level?: string;
    years_experience?: number;
    verified?: boolean;
    category?: string;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field?: string;
    start_date?: string;
    end_date?: string;
    level?: string;
  }>;
  languages: Array<{
    language: string;
    proficiency: string;
    reading?: string;
    writing?: string;
    speaking?: string;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    issue_date?: string;
    expiry_date?: string;
    credential_id?: string;
  }>;
  parsing_metadata?: {
    extraction_method: string;
    confidence_score?: number;
    language_detected?: string;
    character_normalization_applied?: boolean;
    ocr_used?: boolean;
    processing_time?: number;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  metadata?: {
    timestamp: string;
    request_id: string;
    processing_time?: number;
  };
}

class CVParsingService {
  private flaskApiUrl: string;
  
  constructor() {
    this.flaskApiUrl = Deno.env.get('FLASK_API_URL') || 'http://localhost:5000';
  }

  async parseCV(file: File): Promise<ApiResponse<CVData>> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${this.flaskApiUrl}/cv/parse`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Normalize the data to match our unified structure
      const normalizedData = this.normalizeCVData(result.data || result);
      
      return {
        success: true,
        data: normalizedData,
        message: 'CV parsed successfully',
        metadata: {
          timestamp: new Date().toISOString(),
          request_id: `cv_parse_${Date.now()}`,
          processing_time: result.processing_time
        }
      };

    } catch (error) {
      console.error('CV parsing error:', error);
      return {
        success: false,
        error: error.message,
        metadata: {
          timestamp: new Date().toISOString(),
          request_id: `cv_parse_${Date.now()}`
        }
      };
    }
  }

  private normalizeCVData(rawData: any): CVData {
    return {
      personal_info: {
        name: rawData.name || rawData.personal_info?.name || '',
        email: rawData.email || rawData.personal_info?.email || '',
        phone: rawData.phone || rawData.personal_info?.phone || '',
        location: rawData.location || rawData.personal_info?.location || '',
        linkedin: rawData.linkedin || rawData.personal_info?.linkedin || '',
        website: rawData.website || rawData.personal_info?.website || ''
      },
      summary: rawData.summary || '',
      experience: this.normalizeExperience(rawData.experience || []),
      skills: this.normalizeSkills(rawData.skills || []),
      education: this.normalizeEducation(rawData.education || []),
      languages: this.normalizeLanguages(rawData.languages || []),
      certifications: this.normalizeCertifications(rawData.certifications || []),
      parsing_metadata: {
        extraction_method: rawData._extraction_method || 'supabase_edge_function',
        confidence_score: rawData._confidence_score,
        language_detected: rawData._language_detected,
        character_normalization_applied: rawData._character_normalization_applied,
        ocr_used: rawData._ocr_used,
        processing_time: rawData._processing_time
      }
    };
  }

  private normalizeExperience(experience: any[]): CVData['experience'] {
    return experience.map(exp => ({
      title: exp.title || '',
      company: exp.company || '',
      location: exp.location || '',
      start_date: exp.start_date || '',
      end_date: exp.end_date || '',
      is_current: exp.is_current || false,
      description: exp.description || '',
      responsibilities: Array.isArray(exp.responsibilities) ? exp.responsibilities : [],
      achievements: Array.isArray(exp.achievements) ? exp.achievements : [],
      skills_used: Array.isArray(exp.skills_used) ? exp.skills_used : []
    }));
  }

  private normalizeSkills(skills: any[]): CVData['skills'] {
    return skills.map(skill => {
      if (typeof skill === 'string') {
        return {
          name: skill,
          level: undefined,
          years_experience: undefined,
          verified: false
        };
      }
      return {
        name: skill.name || '',
        level: skill.level,
        years_experience: skill.years_experience,
        verified: skill.verified || false,
        category: skill.category
      };
    });
  }

  private normalizeEducation(education: any[]): CVData['education'] {
    return education.map(edu => ({
      institution: edu.institution || '',
      degree: edu.degree || '',
      field: edu.field || '',
      start_date: edu.start_date || '',
      end_date: edu.end_date || '',
      level: edu.level || ''
    }));
  }

  private normalizeLanguages(languages: any[]): CVData['languages'] {
    return languages.map(lang => {
      if (typeof lang === 'string') {
        return {
          language: lang,
          proficiency: 'conversational'
        };
      }
      return {
        language: lang.language || '',
        proficiency: lang.proficiency || 'conversational',
        reading: lang.reading,
        writing: lang.writing,
        speaking: lang.speaking
      };
    });
  }

  private normalizeCertifications(certifications: any[]): CVData['certifications'] {
    return certifications.map(cert => ({
      name: cert.name || '',
      issuer: cert.issuer || '',
      issue_date: cert.issue_date || '',
      expiry_date: cert.expiry_date || '',
      credential_id: cert.credential_id || ''
    }));
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        { 
          status: 405,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(
        JSON.stringify({ success: false, error: 'No file provided' }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    const cvParsingService = new CVParsingService();
    const result = await cvParsingService.parseCV(file);

    return new Response(
      JSON.stringify(result),
      {
        status: result.success ? 200 : 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        metadata: {
          timestamp: new Date().toISOString(),
          request_id: `error_${Date.now()}`
        }
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
});

// supabase/functions/enhanced-job-matcher/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface MatchResult {
  overall_score: number;
  category_scores: {
    skills: number;
    experience: number;
    education: number;
    location: number;
    languages: number;
  };
  match_details: {
    skills: {
      matched: string[];
      missing: string[];
    };
    experience: string;
    education: string;
    location: string;
    languages: string;
  };
  recommendations: string[];
}

interface JobMatch extends MatchResult {
  job_id: string;
  job_title: string;
  company: string;
  location: string;
  match_timestamp: string;
}

class EnhancedMatchingEngine {
  private supabase: any;

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );
  }

  async findJobsForCandidate(candidateId: string, options: any = {}): Promise<JobMatch[]> {
    try {
      // Fetch candidate CV data
      const { data: candidateData, error: candidateError } = await this.supabase
        .from('cv_data')
        .select('*')
        .eq('user_id', candidateId)
        .single();

      if (candidateError) {
        throw new Error(`Failed to fetch candidate data: ${candidateError.message}`);
      }

      // Fetch available jobs
      const { data: jobs, error: jobsError } = await this.supabase
        .from('job_descriptions')
        .select('*')
        .eq('is_active', true)
        .limit(options.limit || 50);

      if (jobsError) {
        throw new Error(`Failed to fetch jobs: ${jobsError.message}`);
      }

      // Calculate matches
      const matches: JobMatch[] = [];
      
      for (const job of jobs) {
        const matchResult = this.calculateMatch(candidateData, job);
        
        if (matchResult.overall_score >= (options.threshold || 60)) {
          matches.push({
            ...matchResult,
            job_id: job.id,
            job_title: job.title,
            company: job.company,
            location: job.location,
            match_timestamp: new Date().toISOString()
          });
        }
      }

      // Sort by overall score
      matches.sort((a, b) => b.overall_score - a.overall_score);

      return matches.slice(0, options.limit || 10);

    } catch (error) {
      console.error('Error finding job matches:', error);
      throw error;
    }
  }

  async findCandidatesForJob(jobId: string, options: any = {}): Promise<any[]> {
    try {
      // Fetch job data
      const { data: jobData, error: jobError } = await this.supabase
        .from('job_descriptions')
        .select('*')
        .eq('id', jobId)
        .single();

      if (jobError) {
        throw new Error(`Failed to fetch job data: ${jobError.message}`);
      }

      // Fetch candidates
      const { data: candidates, error: candidatesError } = await this.supabase
        .from('cv_data')
        .select('*')
        .limit(options.limit || 50);

      if (candidatesError) {
        throw new Error(`Failed to fetch candidates: ${candidatesError.message}`);
      }

      // Calculate matches
      const matches: any[] = [];
      
      for (const candidate of candidates) {
        const matchResult = this.calculateMatch(candidate, jobData);
        
        if (matchResult.overall_score >= (options.threshold || 60)) {
          matches.push({
            ...matchResult,
            candidate_id: candidate.user_id,
            candidate_name: candidate.personal_info?.name || 'Unknown',
            match_timestamp: new Date().toISOString()
          });
        }
      }

      // Sort by overall score
      matches.sort((a, b) => b.overall_score - a.overall_score);

      return matches.slice(0, options.limit || 10);

    } catch (error) {
      console.error('Error finding candidate matches:', error);
      throw error;
    }
  }

  private calculateMatch(cvData: any, jobData: any): MatchResult {
    const scores = {
      skills: 0,
      experience: 0,
      education: 0,
      location: 0,
      languages: 0
    };

    const matchDetails = {
      skills: { matched: [], missing: [] },
      experience: '',
      education: '',
      location: '',
      languages: ''
    };

    // Skills matching
    const cvSkills = (cvData.skills || []).map((s: any) => 
      typeof s === 'string' ? s.toLowerCase() : s.name?.toLowerCase()
    ).filter(Boolean);
    
    const jobSkills = (jobData.requirements?.skills || []).map((s: any) => 
      typeof s === 'string' ? s.toLowerCase() : s.name?.toLowerCase()
    ).filter(Boolean);

    if (jobSkills.length > 0) {
      const matched = jobSkills.filter(skill => cvSkills.includes(skill));
      const missing = jobSkills.filter(skill => !cvSkills.includes(skill));
      
      scores.skills = (matched.length / jobSkills.length) * 100;
      matchDetails.skills.matched = matched;
      matchDetails.skills.missing = missing;
    } else {
      scores.skills = 100;
    }

    // Experience matching
    const cvExperience = cvData.experience || [];
    const jobExperienceReq = jobData.requirements?.experience || [];
    
    if (jobExperienceReq.length > 0) {
      const totalYears = cvExperience.reduce((total: number, exp: any) => {
        return total + this.calculateYearsOfExperience(exp);
      }, 0);
      
      const requiredYears = Math.max(...jobExperienceReq.map((req: any) => req.years || 0));
      
      if (requiredYears > 0) {
        scores.experience = Math.min((totalYears / requiredYears) * 100, 100);
        matchDetails.experience = `${totalYears} years (required: ${requiredYears})`;
      } else {
        scores.experience = 100;
      }
    } else {
      scores.experience = 100;
    }

    // Education matching
    const cvEducation = cvData.education || [];
    const jobEducationReq = jobData.requirements?.education || [];
    
    if (jobEducationReq.length > 0 && cvEducation.length > 0) {
      // Simple degree level matching
      const degreeHierarchy = ['high school', 'associate', 'bachelor', 'master', 'phd', 'doctorate'];
      
      const cvMaxLevel = Math.max(...cvEducation.map((edu: any) => {
        const level = edu.level?.toLowerCase() || '';
        return degreeHierarchy.indexOf(level);
      }).filter(level => level >= 0));
      
      const reqMaxLevel = Math.max(...jobEducationReq.map((edu: any) => {
        const level = edu.level?.toLowerCase() || '';
        return degreeHierarchy.indexOf(level);
      }).filter(level => level >= 0));
      
      if (reqMaxLevel >= 0) {
        scores.education = Math.min((cvMaxLevel / reqMaxLevel) * 100, 100);
        matchDetails.education = `CV: ${degreeHierarchy[cvMaxLevel] || 'Unknown'}, Required: ${degreeHierarchy[reqMaxLevel]}`;
      } else {
        scores.education = 100;
      }
    } else {
      scores.education = jobEducationReq.length === 0 ? 100 : 50;
    }

    // Location matching
    const cvLocation = cvData.personal_info?.location?.toLowerCase() || '';
    const jobLocation = jobData.location?.toLowerCase() || '';
    
    if (cvLocation && jobLocation) {
      if (cvLocation.includes(jobLocation) || jobLocation.includes(cvLocation)) {
        scores.location = 100;
      } else if (jobLocation.includes('remote') || jobLocation.includes('anywhere')) {
        scores.location = 100;
      } else {
        scores.location = 50;
      }
      matchDetails.location = `CV: ${cvLocation}, Job: ${jobLocation}`;
    } else {
      scores.location = 75;
    }

    // Languages matching
    const cvLanguages = (cvData.languages || []).map((lang: any) => 
      typeof lang === 'string' ? lang.toLowerCase() : lang.language?.toLowerCase()
    ).filter(Boolean);
    
    const jobLanguages = (jobData.requirements?.languages || []).map((lang: any) => 
      typeof lang === 'string' ? lang.toLowerCase() : lang.language?.toLowerCase()
    ).filter(Boolean);

    if (jobLanguages.length > 0) {
      const matched = jobLanguages.filter(lang => cvLanguages.includes(lang));
      scores.languages = (matched.length / jobLanguages.length) * 100;
      matchDetails.languages = `Matched: ${matched.join(', ')}`;
    } else {
      scores.languages = 100;
    }

    // Calculate overall score (weighted average)
    const weights = {
      skills: 0.4,
      experience: 0.3,
      education: 0.15,
      location: 0.1,
      languages: 0.05
    };

    const overallScore = Object.keys(scores).reduce((total, category) => {
      return total + (scores[category as keyof typeof scores] * weights[category as keyof typeof weights]);
    }, 0);

    return {
      overall_score: Math.round(overallScore),
      category_scores: Object.fromEntries(
        Object.entries(scores).map(([key, value]) => [key, Math.round(value)])
      ) as any,
      match_details: matchDetails,
      recommendations: this.generateRecommendations(scores, matchDetails)
    };
  }

  private calculateYearsOfExperience(experience: any): number {
    try {
      const startDate = new Date(experience.start_date);
      const endDate = experience.end_date && 
        !['present', 'current'].includes(experience.end_date.toLowerCase()) 
        ? new Date(experience.end_date) 
        : new Date();
      
      const years = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      return Math.max(years, 0);
    } catch {
      return 0;
    }
  }

  private generateRecommendations(scores: any, matchDetails: any): string[] {
    const recommendations: string[] = [];

    if (scores.skills < 70 && matchDetails.skills.missing.length > 0) {
      const topMissing = matchDetails.skills.missing.slice(0, 3);
      recommendations.push(`Consider developing skills in: ${topMissing.join(', ')}`);
    }

    if (scores.experience < 70) {
      recommendations.push('Gain more relevant work experience in this field');
    }

    if (scores.education < 70) {
      recommendations.push('Consider pursuing additional education or certifications');
    }

    if (scores.location < 70) {
      recommendations.push('Consider relocation or remote work options');
    }

    if (scores.languages < 70) {
      recommendations.push('Improve language skills required for this position');
    }

    return recommendations;
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        { 
          status: 405,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    const { candidateId, jobId, options } = await req.json();
    const matchingEngine = new EnhancedMatchingEngine();

    let result;
    if (candidateId) {
      result = await matchingEngine.findJobsForCandidate(candidateId, options);
    } else if (jobId) {
      result = await matchingEngine.findCandidatesForJob(jobId, options);
    } else {
      throw new Error('Either candidateId or jobId must be provided');
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        message: `Found ${result.length} matches`,
        metadata: {
          timestamp: new Date().toISOString(),
          request_id: `match_${Date.now()}`
        }
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );

  } catch (error) {
    console.error('Matching error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        metadata: {
          timestamp: new Date().toISOString(),
          request_id: `error_${Date.now()}`
        }
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
});

