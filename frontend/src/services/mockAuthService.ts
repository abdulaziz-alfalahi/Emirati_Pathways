/**
 * Mock Authentication Service for Development
 * Provides realistic user personas for testing different roles and dashboards
 */

export interface MockUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  user_type: string;
  role: string;
  phone: string;
  emirate: string;
  nationality: string;
  is_verified: boolean;
  profile_data: any;
  avatar?: string;
}

export const MOCK_USERS: Record<string, MockUser> = {
  candidate: {
    id: '1',
    email: 'ahmed.almansouri@gmail.com',
    first_name: 'Ahmed',
    last_name: 'Al Mansouri',
    full_name: 'Ahmed Al Mansouri',
    user_type: 'candidate',
    role: 'candidate',
    phone: '+971 50 123 4567',
    emirate: 'Dubai',
    nationality: 'UAE',
    is_verified: true,
    profile_data: {
      bio: 'Experienced software engineer passionate about AI and blockchain technology',
      skills: ['Python', 'React', 'AI/ML', 'Cloud Computing', 'Blockchain'],
      experience_years: 5,
      education: 'Bachelor of Computer Science - UAE University',
      location: 'Dubai, UAE',
      linkedin: 'https://linkedin.com/in/ahmed-almansouri',
      github: 'https://github.com/ahmed-almansouri',
      portfolio: 'https://ahmed-portfolio.ae'
    },
    avatar: 'AAE'
  },

  hr_manager: {
    id: '2',
    email: 'sarah.alzahra@company.ae',
    first_name: 'Sarah',
    last_name: 'Al Zahra',
    full_name: 'Sarah Al Zahra',
    user_type: 'hr_manager',
    role: 'hr_manager',
    phone: '+971 50 234 5678',
    emirate: 'Abu Dhabi',
    nationality: 'UAE',
    is_verified: true,
    profile_data: {
      bio: 'Senior HR Manager with 8+ years experience in talent acquisition and development',
      department: 'Human Resources',
      company: 'Emirates National Bank',
      specializations: ['Talent Acquisition', 'Performance Management', 'UAE Nationals Development'],
      certifications: ['CIPD Level 7', 'UAE HR Excellence Certificate'],
      location: 'Abu Dhabi, UAE',
      linkedin: 'https://linkedin.com/in/sarah-alzahra'
    },
    avatar: 'SAZ'
  },

  recruiter: {
    id: '3',
    email: 'omar.alrashid@recruitment.ae',
    first_name: 'Omar',
    last_name: 'Al Rashid',
    full_name: 'Omar Al Rashid',
    user_type: 'recruiter',
    role: 'recruiter',
    phone: '+971 50 345 6789',
    emirate: 'Sharjah',
    nationality: 'UAE',
    is_verified: true,
    profile_data: {
      bio: 'Specialized recruiter focusing on UAE National talent placement in technology sector',
      company: 'UAE Talent Solutions',
      specializations: ['Tech Recruitment', 'UAE Nationals', 'Executive Search'],
      active_positions: 24,
      placements_this_year: 156,
      location: 'Sharjah, UAE',
      linkedin: 'https://linkedin.com/in/omar-alrashid'
    },
    avatar: 'OAR'
  },

  educator: {
    id: '4',
    email: 'dr.fatima.alqasimi@university.ae',
    first_name: 'Dr. Fatima',
    last_name: 'Al Qasimi',
    full_name: 'Dr. Fatima Al Qasimi',
    user_type: 'educator',
    role: 'educator',
    phone: '+971 50 456 7890',
    emirate: 'Ras Al Khaimah',
    nationality: 'UAE',
    is_verified: true,
    profile_data: {
      bio: 'Professor of Computer Science specializing in AI and Machine Learning education',
      institution: 'American University of Ras Al Khaimah',
      department: 'Computer Science & Engineering',
      qualifications: ['PhD Computer Science - MIT', 'MSc AI - Stanford'],
      courses: ['Machine Learning', 'Data Science', 'AI Ethics'],
      research_areas: ['AI in Education', 'Natural Language Processing'],
      publications: 45,
      location: 'Ras Al Khaimah, UAE'
    },
    avatar: 'FAQ'
  },

  mentor: {
    id: '5',
    email: 'khalid.almaktoum@mentor.ae',
    first_name: 'Khalid',
    last_name: 'Al Maktoum',
    full_name: 'Khalid Al Maktoum',
    user_type: 'mentor',
    role: 'mentor',
    phone: '+971 50 567 8901',
    emirate: 'Dubai',
    nationality: 'UAE',
    is_verified: true,
    profile_data: {
      bio: 'Senior Technology Executive and Mentor with 15+ years in fintech and blockchain',
      current_role: 'CTO - Dubai Islamic Bank',
      mentorship_areas: ['Technology Leadership', 'Fintech Innovation', 'Career Development'],
      mentees_count: 28,
      success_stories: 15,
      expertise: ['Blockchain', 'Fintech', 'Digital Transformation', 'Leadership'],
      location: 'Dubai, UAE',
      linkedin: 'https://linkedin.com/in/khalid-almaktoum'
    },
    avatar: 'KAM'
  },

  assessor: {
    id: '6',
    email: 'mariam.alnuaimi@assessment.ae',
    first_name: 'Mariam',
    last_name: 'Al Nuaimi',
    full_name: 'Mariam Al Nuaimi',
    user_type: 'assessor',
    role: 'assessor',
    phone: '+971 50 678 9012',
    emirate: 'Ajman',
    nationality: 'UAE',
    is_verified: true,
    profile_data: {
      bio: 'Certified Skills Assessor specializing in technical and soft skills evaluation',
      organization: 'UAE Skills Assessment Authority',
      certifications: ['Certified Professional Assessor', 'Technical Skills Evaluator'],
      assessment_areas: ['Software Development', 'Project Management', 'Communication Skills'],
      assessments_completed: 1250,
      average_rating: 4.8,
      location: 'Ajman, UAE'
    },
    avatar: 'MAN'
  },

  admin: {
    id: '7',
    email: 'admin@emiratijourney.ae',
    first_name: 'System',
    last_name: 'Administrator',
    full_name: 'System Administrator',
    user_type: 'admin',
    role: 'admin',
    phone: '+971 50 789 0123',
    emirate: 'Dubai',
    nationality: 'UAE',
    is_verified: true,
    profile_data: {
      bio: 'Platform Administrator managing the Emirati Journey ecosystem',
      department: 'Platform Operations',
      permissions: ['Full System Access', 'User Management', 'Analytics', 'Configuration'],
      managed_users: 15420,
      system_uptime: '99.9%',
      location: 'Dubai, UAE'
    },
    avatar: 'ADM'
  }
};

export class MockAuthService {
  private static currentUser: MockUser | null = null;
  private static readonly STORAGE_KEY = 'mock_current_user';

  static initialize() {
    // Load saved user from localStorage
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        this.currentUser = JSON.parse(saved);
      } catch (error) {
        console.warn('Failed to load saved mock user:', error);
        this.setUser('candidate'); // Default to candidate
      }
    } else {
      this.setUser('candidate'); // Default to candidate
    }
  }

  static setUser(userType: string): MockUser {
    const user = MOCK_USERS[userType];
    if (!user) {
      throw new Error(`Mock user type "${userType}" not found`);
    }
    
    this.currentUser = user;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem('access_token', `mock_token_${user.id}`);
    localStorage.setItem('user', JSON.stringify(user));
    
    console.log(`🎭 Mock Auth: Switched to ${user.full_name} (${user.user_type})`);
    return user;
  }

  static getCurrentUser(): MockUser | null {
    return this.currentUser;
  }

  static isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  static getUserRole(): string | null {
    return this.currentUser?.user_type || null;
  }

  static logout() {
    this.currentUser = null;
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    console.log('🎭 Mock Auth: Logged out');
  }

  static getAllUserTypes(): Array<{key: string, user: MockUser}> {
    return Object.entries(MOCK_USERS).map(([key, user]) => ({key, user}));
  }

  static getDashboardRoute(userType?: string): string {
    const type = userType || this.currentUser?.user_type;
    
    switch (type) {
      case 'candidate':
      case 'job_seeker':
        return '/candidate-dashboard';
      case 'hr_manager':
      case 'hr':
        return '/hr-dashboard';
      case 'recruiter':
        return '/recruiter-dashboard';
      case 'educator':
        return '/educator-dashboard';
      case 'mentor':
        return '/mentor-dashboard';
      case 'assessor':
        return '/assessor-dashboard';
      case 'admin':
      case 'administrator':
        return '/admin-dashboard';
      default:
        return '/candidate-dashboard';
    }
  }
}

// Initialize on import
MockAuthService.initialize();
