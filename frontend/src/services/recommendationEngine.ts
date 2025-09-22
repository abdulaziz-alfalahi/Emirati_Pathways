
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  skills: string[];
  interests: string[];
  experience_level: string;
  career_goals: string[];
  location?: string;
}

export interface JobRecommendation {
  id: string;
  title: string;
  company: string;
  location: string;
  skills_required: string[];
  experience_level: string;
  match_score: number;
  type: 'job';
  score: number;
  provider?: string;
}

export interface CourseRecommendation {
  id: string;
  title: string;
  provider: string;
  description: string;
  skills_taught: string[];
  difficulty_level: string;
  match_score: number;
  type: 'course';
  score: number;
}

export interface ScholarshipRecommendation {
  id: string;
  title: string;
  organization: string;
  description: string;
  eligibility_criteria: string[];
  amount: number;
  deadline: string;
  match_score: number;
  type: 'scholarship';
  score: number;
  provider?: string;
}

export type Recommendation = JobRecommendation | CourseRecommendation | ScholarshipRecommendation;

export interface RecommendationFilters {
  type?: 'job' | 'course' | 'scholarship';
  location?: string;
  industry?: string;
  experienceLevel?: string;
  includeJobs?: boolean;
  includeCourses?: boolean;
  includeScholarships?: boolean;
  includeTraining?: boolean;
  includeInternships?: boolean;
  minScore?: number;
  maxResults?: number;
}

export class RecommendationEngine {
  private async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data as unknown as UserProfile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  private calculateSkillMatch(userSkills: string[], requiredSkills: string[]): number {
    if (!userSkills || !requiredSkills) return 0;
    
    const intersection = userSkills.filter(skill => 
      requiredSkills.some(req => req.toLowerCase().includes(skill.toLowerCase()))
    );
    
    return intersection.length / requiredSkills.length;
  }

  private calculateExperienceMatch(userLevel: string, requiredLevel: string): number {
    const levels = ['entry', 'junior', 'mid', 'senior', 'expert'];
    const userIndex = levels.indexOf(userLevel.toLowerCase());
    const requiredIndex = levels.indexOf(requiredLevel.toLowerCase());
    
    if (userIndex === -1 || requiredIndex === -1) return 0.5;
    
    const diff = Math.abs(userIndex - requiredIndex);
    return Math.max(0, 1 - (diff * 0.2));
  }

  async getJobRecommendations(userId: string, filters?: RecommendationFilters): Promise<JobRecommendation[]> {
    // Mock implementation since job_listings table doesn't exist
    const mockJobs = [
      {
        id: '1',
        title: 'Software Developer',
        company: 'Tech Corp',
        location: 'Dubai',
        skills_required: ['JavaScript', 'React', 'Node.js'],
        experience_level: 'mid',
        type: 'job' as const,
        score: 85,
        match_score: 85,
        provider: 'Tech Corp'
      },
      {
        id: '2',
        title: 'Data Analyst',
        company: 'Data Co',
        location: 'Abu Dhabi',
        skills_required: ['Python', 'SQL', 'Excel'],
        experience_level: 'junior',
        type: 'job' as const,
        score: 78,
        match_score: 78,
        provider: 'Data Co'
      }
    ];

    return mockJobs.slice(0, 10);
  }

  async getCourseRecommendations(userId: string, limit: number = 10): Promise<CourseRecommendation[]> {
    // Mock implementation since training_programs table doesn't exist
    const mockCourses = [
      {
        id: '1',
        title: 'Advanced JavaScript',
        provider: 'CodeAcademy',
        description: 'Learn advanced JS concepts',
        skills_taught: ['JavaScript', 'ES6', 'Async Programming'],
        difficulty_level: 'intermediate',
        type: 'course' as const,
        score: 88,
        match_score: 88
      },
      {
        id: '2',
        title: 'Data Science Fundamentals',
        provider: 'DataLearn',
        description: 'Introduction to data science',
        skills_taught: ['Python', 'Statistics', 'Machine Learning'],
        difficulty_level: 'beginner',
        type: 'course' as const,
        score: 82,
        match_score: 82
      }
    ];

    return mockCourses.slice(0, limit);
  }

  async getScholarshipRecommendations(userId: string, limit: number = 5): Promise<ScholarshipRecommendation[]> {
    // Mock implementation since scholarships table might not have all expected fields
    const mockScholarships = [
      {
        id: '1',
        title: 'Tech Excellence Scholarship',
        organization: 'UAE Tech Foundation',
        description: 'Supporting future tech leaders',
        eligibility_criteria: ['UAE resident', 'GPA > 3.5', 'Tech field'],
        amount: 50000,
        deadline: '2024-06-30',
        type: 'scholarship' as const,
        score: 90,
        match_score: 90,
        provider: 'UAE Tech Foundation'
      },
      {
        id: '2',
        title: 'Innovation Scholarship',
        organization: 'Emirates Innovation Hub',
        description: 'For innovative students',
        eligibility_criteria: ['Innovation project', 'Under 25'],
        amount: 30000,
        deadline: '2024-08-15',
        type: 'scholarship' as const,
        score: 85,
        match_score: 85,
        provider: 'Emirates Innovation Hub'
      }
    ];

    return mockScholarships.slice(0, limit);
  }

  private calculateSkillGap(userSkills: string[], courseSkills: string[]): number {
    const missingSkills = courseSkills.filter(skill => 
      !userSkills.some(userSkill => userSkill.toLowerCase().includes(skill.toLowerCase()))
    );
    
    return missingSkills.length / courseSkills.length;
  }

  private calculateDifficultyMatch(userLevel: string, courseLevel: string): number {
    const levels = ['beginner', 'intermediate', 'advanced', 'expert'];
    const userIndex = levels.indexOf(userLevel.toLowerCase());
    const courseIndex = levels.indexOf(courseLevel.toLowerCase());
    
    if (userIndex === -1 || courseIndex === -1) return 0.5;
    
    const diff = Math.abs(userIndex - courseIndex);
    return Math.max(0, 1 - (diff * 0.25));
  }

  private calculateInterestMatch(userInterests: string[], courseCategory: string): number {
    if (!userInterests || !courseCategory) return 0.5;
    
    return userInterests.some(interest => 
      interest.toLowerCase().includes(courseCategory.toLowerCase()) ||
      courseCategory.toLowerCase().includes(interest.toLowerCase())
    ) ? 1 : 0.3;
  }

  private calculateEligibilityMatch(userProfile: UserProfile, eligibilityCriteria: string[]): number {
    // Simplified eligibility matching - in real implementation, this would be more sophisticated
    return 0.8; // Placeholder
  }

  private calculateFieldMatch(userInterests: string[], fieldOfStudy: string): number {
    if (!userInterests || !fieldOfStudy) return 0.5;
    
    return userInterests.some(interest => 
      interest.toLowerCase().includes(fieldOfStudy.toLowerCase()) ||
      fieldOfStudy.toLowerCase().includes(interest.toLowerCase())
    ) ? 1 : 0.3;
  }

  // Additional methods for compatibility
  async generateRecommendations(userId: string, filters?: RecommendationFilters): Promise<Recommendation[]> {
    const jobs = await this.getJobRecommendations(userId, filters);
    const courses = await this.getCourseRecommendations(userId, 5);
    const scholarships = await this.getScholarshipRecommendations(userId, 3);
    
    const all: Recommendation[] = [...jobs, ...courses, ...scholarships];
    return all.sort((a, b) => b.match_score - a.match_score);
  }

  trackRecommendationInteraction(recommendationId: string, action: string) {
    // Mock implementation for tracking
    console.log(`Tracked interaction: ${action} on recommendation ${recommendationId}`);
  }
}

export const recommendationEngine = new RecommendationEngine();
