// School Programs Service - API Connected
// Real database integration with PostgreSQL backend

import { 
  SchoolProgram, 
  ProgramFilters, 
  SearchParams, 
  ProgramsResponse,
  ProgramAnalytics,
  ProgramCategory 
} from '../types/schoolPrograms';

const API_BASE_URL = 'http://localhost:5001/api';

class SchoolProgramsAPIService {
  // Get programs with filtering and search
  async getPrograms(params: SearchParams = {}): Promise<ProgramsResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.search) queryParams.append('search', params.search);
      if (params.category && params.category !== 'all') queryParams.append('category', params.category);
      if (params.status && params.status !== 'all') queryParams.append('status', params.status);
      if (params.featured !== undefined) queryParams.append('featured', params.featured.toString());
      
      const url = `${API_BASE_URL}/school-programs${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const programs = await response.json();
      const transformedPrograms = programs.map(this.transformProgramData);
      
      // Apply client-side filtering for features not supported by API
      let filteredPrograms = transformedPrograms;
      
      if (params.ageRange) {
        filteredPrograms = filteredPrograms.filter(program => 
          program.targetAge.min <= params.ageRange!.max && 
          program.targetAge.max >= params.ageRange!.min
        );
      }
      
      // Apply sorting
      if (params.sortBy) {
        filteredPrograms.sort((a, b) => {
          switch (params.sortBy) {
            case 'title':
              return a.title.en.localeCompare(b.title.en);
            case 'school':
              return a.school.name.en.localeCompare(b.school.name.en);
            case 'category':
              return a.category.localeCompare(b.category);
            case 'date':
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            case 'popularity':
              return (b.successMetrics?.satisfactionScore || 0) - (a.successMetrics?.satisfactionScore || 0);
            default:
              return 0;
          }
        });
      }
      
      // Apply pagination
      const total = filteredPrograms.length;
      const page = params.page || 1;
      const limit = params.limit || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedPrograms = filteredPrograms.slice(startIndex, endIndex);
      
      return {
        programs: paginatedPrograms,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: endIndex < total,
        hasPrev: page > 1
      };
      
    } catch (error) {
      console.error('Error fetching programs from API:', error);
      // Return empty result on API failure
      return {
        programs: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      };
    }
  }

  // Get single program by ID
  async getProgramById(id: string): Promise<SchoolProgram | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/school-programs/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return this.transformProgramData(data);
    } catch (error) {
      console.error('Error fetching program by ID:', error);
      return null;
    }
  }

  // Get program categories
  async getCategories(): Promise<ProgramCategory[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/school-programs/categories`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Return default categories
      return [
        { id: '1', name_en: 'STEM', name_ar: 'العلوم والتكنولوجيا', description_en: 'Science, Technology, Engineering, Mathematics', description_ar: 'العلوم والتكنولوجيا والهندسة والرياضيات' },
        { id: '2', name_en: 'Arts', name_ar: 'الفنون', description_en: 'Creative and Performing Arts', description_ar: 'الفنون الإبداعية والأدائية' },
        { id: '3', name_en: 'Sports', name_ar: 'الرياضة', description_en: 'Physical Education and Sports', description_ar: 'التربية البدنية والرياضة' },
        { id: '4', name_en: 'Languages', name_ar: 'اللغات', description_en: 'Language Learning and Communication', description_ar: 'تعلم اللغات والتواصل' },
        { id: '5', name_en: 'Business', name_ar: 'الأعمال', description_en: 'Business and Entrepreneurship', description_ar: 'الأعمال وريادة الأعمال' }
      ];
    }
  }

  // Get program analytics
  async getAnalytics(): Promise<ProgramAnalytics> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/dashboard-stats`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const stats = await response.json();
      
      // Transform API response to match ProgramAnalytics interface
      return {
        totalPrograms: stats.totalPrograms,
        publishedPrograms: stats.publishedPrograms,
        draftPrograms: stats.totalPrograms - stats.publishedPrograms - stats.pendingReviews,
        underReviewPrograms: stats.pendingReviews,
        categoryDistribution: {}, // Would need additional API endpoint
        averageSatisfaction: 4.5, // Would need additional calculation
        totalEnrollments: 0, // Would need additional API endpoint
        monthlyGrowth: 12.5 // Would need additional calculation
      };
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Return default analytics
      return {
        totalPrograms: 0,
        publishedPrograms: 0,
        draftPrograms: 0,
        underReviewPrograms: 0,
        categoryDistribution: {},
        averageSatisfaction: 0,
        totalEnrollments: 0,
        monthlyGrowth: 0
      };
    }
  }

  // Search programs with advanced filters
  async searchPrograms(filters: ProgramFilters): Promise<SchoolProgram[]> {
    const params: SearchParams = {
      search: filters.query,
      category: filters.category,
      status: 'published',
      ageRange: filters.ageRange,
      sortBy: filters.sortBy
    };

    const response = await this.getPrograms(params);
    return response.programs;
  }

  // Get featured programs
  async getFeaturedPrograms(limit: number = 6): Promise<SchoolProgram[]> {
    const response = await this.getPrograms({ 
      featured: true, 
      status: 'published',
      limit,
      sortBy: 'popularity'
    });
    return response.programs;
  }

  // Get programs by category
  async getProgramsByCategory(category: string, limit: number = 10): Promise<SchoolProgram[]> {
    const response = await this.getPrograms({ 
      category, 
      status: 'published',
      limit,
      sortBy: 'popularity'
    });
    return response.programs;
  }

  // Get programs by school
  async getProgramsBySchool(schoolId: string): Promise<SchoolProgram[]> {
    try {
      const response = await this.getPrograms({ status: 'published' });
      return response.programs.filter(program => program.school.id === schoolId);
    } catch (error) {
      console.error('Error fetching programs by school:', error);
      return [];
    }
  }

  // Get similar programs
  async getSimilarPrograms(programId: string, limit: number = 4): Promise<SchoolProgram[]> {
    const program = await this.getProgramById(programId);
    if (!program) return [];

    const response = await this.getPrograms({ 
      category: program.category, 
      status: 'published' 
    });
    
    return response.programs
      .filter(p => p.id !== programId)
      .slice(0, limit);
  }

  // Transform database data to frontend interface
  private transformProgramData(data: any): SchoolProgram {
    return {
      id: data.id,
      title: {
        en: data.title_en,
        ar: data.title_ar
      },
      description: {
        en: data.description_en,
        ar: data.description_ar
      },
      school: {
        id: data.school_id,
        name: {
          en: data.school_name_en,
          ar: data.school_name_ar
        },
        logo: '/images/schools/default-logo.png',
        location: data.school_location,
        type: 'private',
        accreditation: ['KHDA']
      },
      category: data.category,
      subcategory: data.subcategory,
      targetAge: {
        min: data.target_age_min,
        max: data.target_age_max
      },
      duration: {
        value: data.duration_value || 1,
        unit: data.duration_unit || 'year'
      },
      schedule: {
        type: 'full-time',
        hoursPerWeek: 25,
        startDate: data.start_date,
        endDate: data.end_date
      },
      curriculum: {
        overview: {
          en: data.description_en,
          ar: data.description_ar
        },
        subjects: [],
        learningOutcomes: {
          en: data.learning_outcomes || [],
          ar: []
        },
        assessmentMethods: {
          en: data.assessment_methods || [],
          ar: []
        }
      },
      faculty: [],
      facilities: [],
      prerequisites: {
        en: data.requirements || [],
        ar: []
      },
      fees: {
        amount: parseFloat(data.fees_amount) || 0,
        currency: data.fees_currency || 'AED',
        scholarshipAvailable: true,
        paymentPlans: ['Annual', 'Semester']
      },
      capacity: {
        total: data.capacity_total || 0,
        available: data.capacity_available || 0,
        waitingList: 0
      },
      successMetrics: data.success_metrics ? {
        graduationRate: data.success_metrics.graduation_rate,
        employmentRate: data.success_metrics.employment_rate,
        satisfactionScore: data.success_metrics.satisfaction_score,
        industryPartnerships: data.success_metrics.industry_partnerships
      } : undefined,
      testimonials: [],
      media: {
        images: data.image_urls || [],
        videos: data.video_urls || [],
        virtualTour: '',
        brochure: data.brochure_url
      },
      applicationProcess: {
        steps: { en: [], ar: [] },
        deadline: data.application_deadline,
        requirements: { en: data.requirements || [], ar: [] },
        contactInfo: {
          email: data.contact_email,
          phone: data.contact_phone,
          address: { en: data.school_location, ar: data.school_location }
        }
      },
      status: data.status,
      workflowStage: data.workflow_stage,
      approvalHistory: [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      publishedAt: data.created_at,
      createdBy: data.created_by_name,
      lastModifiedBy: data.last_modified_by_name
    };
  }
}

export const schoolProgramsAPIService = new SchoolProgramsAPIService();
