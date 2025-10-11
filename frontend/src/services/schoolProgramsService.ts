// School Programs Service
// API-connected service for real database integration with fallback to mock data

import { 
  SchoolProgram, 
  ProgramFilters, 
  SearchParams, 
  ProgramsResponse,
  ProgramAnalytics,
  ProgramCategory 
} from '../types/schoolPrograms';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL}/api` : 'http://localhost:5003/api');

// Mock data for Dubai school programs
const mockPrograms: SchoolProgram[] = [
  {
    id: 'prog-001',
    title: {
      en: 'Advanced STEM Innovation Program',
      ar: 'برنامج الابتكار المتقدم في العلوم والتكنولوجيا'
    },
    description: {
      en: 'A comprehensive STEM program focusing on robotics, AI, and sustainable technology solutions aligned with Dubai\'s smart city initiatives.',
      ar: 'برنامج شامل في العلوم والتكنولوجيا يركز على الروبوتات والذكاء الاصطناعي والحلول التكنولوجية المستدامة بما يتماشى مع مبادرات دبي الذكية.'
    },
    school: {
      id: 'school-001',
      name: {
        en: 'Dubai International Academy',
        ar: 'أكاديمية دبي الدولية'
      },
      logo: '/images/schools/dubai-international-academy.png',
      location: 'Al Barsha, Dubai',
      type: 'private',
      accreditation: ['IB', 'KHDA', 'CIS']
    },
    category: 'stem',
    subcategory: 'Robotics & AI',
    targetAge: { min: 14, max: 18 },
    duration: { value: 2, unit: 'years' },
    schedule: {
      type: 'full-time',
      hoursPerWeek: 25,
      startDate: '2024-09-01',
      endDate: '2026-06-30'
    },
    curriculum: {
      overview: {
        en: 'Integrated curriculum combining theoretical knowledge with hands-on projects in emerging technologies.',
        ar: 'منهج متكامل يجمع بين المعرفة النظرية والمشاريع العملية في التقنيات الناشئة.'
      },
      subjects: [
        {
          id: 'subj-001',
          name: { en: 'Artificial Intelligence Fundamentals', ar: 'أساسيات الذكاء الاصطناعي' },
          credits: 4,
          description: { en: 'Introduction to AI concepts and applications', ar: 'مقدمة في مفاهيم وتطبيقات الذكاء الاصطناعي' }
        },
        {
          id: 'subj-002',
          name: { en: 'Robotics Engineering', ar: 'هندسة الروبوتات' },
          credits: 6,
          description: { en: 'Design and programming of robotic systems', ar: 'تصميم وبرمجة الأنظمة الروبوتية' }
        }
      ],
      learningOutcomes: {
        en: [
          'Design and build autonomous robotic systems',
          'Develop AI-powered applications',
          'Apply sustainable technology principles',
          'Present innovative solutions to real-world problems'
        ],
        ar: [
          'تصميم وبناء أنظمة روبوتية مستقلة',
          'تطوير تطبيقات مدعومة بالذكاء الاصطناعي',
          'تطبيق مبادئ التكنولوجيا المستدامة',
          'تقديم حلول مبتكرة للمشاكل الواقعية'
        ]
      },
      assessmentMethods: {
        en: ['Project-based assessment', 'Peer review', 'Industry presentation', 'Portfolio evaluation'],
        ar: ['تقييم قائم على المشاريع', 'مراجعة الأقران', 'عرض صناعي', 'تقييم الحقيبة']
      }
    },
    faculty: [
      {
        id: 'fac-001',
        name: { en: 'Dr. Ahmed Al Mansoori', ar: 'د. أحمد المنصوري' },
        title: { en: 'Head of STEM Department', ar: 'رئيس قسم العلوم والتكنولوجيا' },
        qualifications: { en: ['PhD in Computer Science', 'MIT'], ar: ['دكتوراه في علوم الحاسوب', 'معهد ماساتشوستس للتكنولوجيا'] },
        experience: 15,
        specialization: { en: ['Artificial Intelligence', 'Machine Learning'], ar: ['الذكاء الاصطناعي', 'التعلم الآلي'] },
        bio: { en: 'Leading AI researcher with 15 years of experience in educational technology.', ar: 'باحث رائد في الذكاء الاصطناعي مع 15 عاماً من الخبرة في التكنولوجيا التعليمية.' }
      }
    ],
    facilities: [
      {
        id: 'fac-001',
        name: { en: 'Innovation Lab', ar: 'مختبر الابتكار' },
        type: 'laboratory',
        description: { en: 'State-of-the-art facility with 3D printers, robotics kits, and AI workstations.', ar: 'مرفق حديث مع طابعات ثلاثية الأبعاد ومجموعات روبوتية ومحطات عمل للذكاء الاصطناعي.' },
        capacity: 30,
        equipment: { en: ['3D Printers', 'Arduino Kits', 'AI Workstations'], ar: ['طابعات ثلاثية الأبعاد', 'مجموعات أردوينو', 'محطات عمل الذكاء الاصطناعي'] },
        images: ['/images/facilities/innovation-lab-1.jpg']
      }
    ],
    prerequisites: {
      en: ['Strong mathematics background', 'Basic programming knowledge', 'Grade 9 completion'],
      ar: ['خلفية قوية في الرياضيات', 'معرفة أساسية بالبرمجة', 'إتمام الصف التاسع']
    },
    fees: {
      amount: 45000,
      currency: 'AED',
      scholarshipAvailable: true,
      paymentPlans: ['Annual', 'Semester', 'Monthly']
    },
    capacity: {
      total: 25,
      available: 8,
      waitingList: 12
    },
    successMetrics: {
      graduationRate: 95,
      employmentRate: 88,
      satisfactionScore: 4.7,
      industryPartnerships: 15
    },
    testimonials: [
      {
        id: 'test-001',
        studentName: { en: 'Sara Al Zahra', ar: 'سارة الزهراء' },
        graduationYear: 2023,
        currentPosition: { en: 'AI Developer at Emirates NBD', ar: 'مطور ذكاء اصطناعي في بنك الإمارات دبي الوطني' },
        testimonial: { 
          en: 'This program transformed my understanding of technology and opened doors to amazing career opportunities.',
          ar: 'هذا البرنامج غيّر فهمي للتكنولوجيا وفتح أبواب فرص مهنية مذهلة.'
        },
        rating: 5
      }
    ],
    media: {
      images: [
        '/images/programs/stem-innovation-1.jpg',
        '/images/programs/stem-innovation-2.jpg'
      ],
      videos: ['/videos/stem-innovation-overview.mp4'],
      virtualTour: '/virtual-tours/stem-lab',
      brochure: '/brochures/stem-innovation-program.pdf'
    },
    applicationProcess: {
      steps: {
        en: [
          'Submit online application',
          'Provide academic transcripts',
          'Complete aptitude assessment',
          'Attend interview session',
          'Receive admission decision'
        ],
        ar: [
          'تقديم الطلب عبر الإنترنت',
          'تقديم كشوف الدرجات الأكاديمية',
          'إكمال تقييم القدرات',
          'حضور جلسة المقابلة',
          'استلام قرار القبول'
        ]
      },
      deadline: '2024-05-15',
      requirements: {
        en: ['Minimum 85% in mathematics and science', 'English proficiency certificate', 'Two recommendation letters'],
        ar: ['حد أدنى 85% في الرياضيات والعلوم', 'شهادة إجادة اللغة الإنجليزية', 'خطابا توصية']
      },
      contactInfo: {
        email: 'stem@dubaiinternational.ae',
        phone: '+971-4-123-4567',
        whatsapp: '+971-50-123-4567',
        address: {
          en: 'Al Barsha 1, Dubai, UAE',
          ar: 'البرشاء 1، دبي، الإمارات العربية المتحدة'
        },
        website: 'https://dubaiinternational.ae/stem'
      }
    },
    status: 'published',
    workflowStage: 'maintenance',
    approvalHistory: [],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-02-20T14:30:00Z',
    publishedAt: '2024-02-25T09:00:00Z',
    createdBy: 'content-creator-001',
    lastModifiedBy: 'content-manager-001'
  },
  {
    id: 'prog-002',
    title: {
      en: 'Creative Arts & Digital Media Program',
      ar: 'برنامج الفنون الإبداعية والإعلام الرقمي'
    },
    description: {
      en: 'Comprehensive arts program combining traditional Emirati culture with modern digital media techniques.',
      ar: 'برنامج فنون شامل يجمع بين الثقافة الإماراتية التقليدية وتقنيات الإعلام الرقمي الحديثة.'
    },
    school: {
      id: 'school-002',
      name: {
        en: 'Emirates Heritage Academy',
        ar: 'أكاديمية التراث الإماراتي'
      },
      logo: '/images/schools/emirates-heritage-academy.png',
      location: 'Jumeirah, Dubai',
      type: 'private',
      accreditation: ['KHDA', 'NEASC']
    },
    category: 'arts',
    subcategory: 'Digital Media',
    targetAge: { min: 12, max: 17 },
    duration: { value: 18, unit: 'months' },
    schedule: {
      type: 'part-time',
      hoursPerWeek: 15,
      startDate: '2024-09-01',
      endDate: '2026-02-28'
    },
    curriculum: {
      overview: {
        en: 'Blend of traditional Emirati arts with contemporary digital media production techniques.',
        ar: 'مزيج من الفنون الإماراتية التقليدية مع تقنيات إنتاج الإعلام الرقمي المعاصرة.'
      },
      subjects: [
        {
          id: 'subj-003',
          name: { en: 'Traditional Emirati Arts', ar: 'الفنون الإماراتية التقليدية' },
          credits: 3,
          description: { en: 'Study of traditional crafts and artistic expressions', ar: 'دراسة الحرف التقليدية والتعبيرات الفنية' }
        },
        {
          id: 'subj-004',
          name: { en: 'Digital Media Production', ar: 'إنتاج الإعلام الرقمي' },
          credits: 4,
          description: { en: 'Video, audio, and graphic design production', ar: 'إنتاج الفيديو والصوت والتصميم الجرافيكي' }
        }
      ],
      learningOutcomes: {
        en: [
          'Master traditional Emirati artistic techniques',
          'Create professional digital media content',
          'Develop cultural preservation projects',
          'Build portfolio for creative industries'
        ],
        ar: [
          'إتقان التقنيات الفنية الإماراتية التقليدية',
          'إنشاء محتوى إعلامي رقمي احترافي',
          'تطوير مشاريع الحفاظ على الثقافة',
          'بناء حقيبة أعمال للصناعات الإبداعية'
        ]
      },
      assessmentMethods: {
        en: ['Portfolio assessment', 'Creative projects', 'Cultural research', 'Public exhibitions'],
        ar: ['تقييم الحقيبة', 'المشاريع الإبداعية', 'البحث الثقافي', 'المعارض العامة']
      }
    },
    faculty: [
      {
        id: 'fac-002',
        name: { en: 'Fatima Al Zahra', ar: 'فاطمة الزهراء' },
        title: { en: 'Director of Arts Program', ar: 'مديرة برنامج الفنون' },
        qualifications: { en: ['MFA in Digital Arts', 'Cultural Heritage Specialist'], ar: ['ماجستير في الفنون الرقمية', 'أخصائية التراث الثقافي'] },
        experience: 12,
        specialization: { en: ['Digital Media', 'Cultural Arts'], ar: ['الإعلام الرقمي', 'الفنون الثقافية'] },
        bio: { en: 'Award-winning artist specializing in preserving Emirati culture through digital media.', ar: 'فنانة حائزة على جوائز متخصصة في الحفاظ على الثقافة الإماراتية من خلال الإعلام الرقمي.' }
      }
    ],
    facilities: [
      {
        id: 'fac-002',
        name: { en: 'Digital Arts Studio', ar: 'استوديو الفنون الرقمية' },
        type: 'studio',
        description: { en: 'Professional studio with video production and digital design capabilities.', ar: 'استوديو احترافي مع قدرات إنتاج الفيديو والتصميم الرقمي.' },
        capacity: 20,
        equipment: { en: ['Professional Cameras', 'Editing Suites', 'Graphics Tablets'], ar: ['كاميرات احترافية', 'أجنحة التحرير', 'أجهزة لوحية للرسوم'] },
        images: ['/images/facilities/digital-arts-studio.jpg']
      }
    ],
    prerequisites: {
      en: ['Interest in arts and culture', 'Basic computer skills', 'Grade 7 completion'],
      ar: ['اهتمام بالفنون والثقافة', 'مهارات حاسوبية أساسية', 'إتمام الصف السابع']
    },
    fees: {
      amount: 28000,
      currency: 'AED',
      scholarshipAvailable: true,
      paymentPlans: ['Annual', 'Semester']
    },
    capacity: {
      total: 20,
      available: 5,
      waitingList: 8
    },
    successMetrics: {
      graduationRate: 92,
      employmentRate: 78,
      satisfactionScore: 4.6,
      industryPartnerships: 8
    },
    testimonials: [
      {
        id: 'test-002',
        studentName: { en: 'Omar Al Rashid', ar: 'عمر الراشد' },
        graduationYear: 2023,
        currentPosition: { en: 'Digital Content Creator at Dubai Culture', ar: 'منشئ محتوى رقمي في دبي للثقافة' },
        testimonial: { 
          en: 'The program helped me connect with my heritage while building modern creative skills.',
          ar: 'ساعدني البرنامج على التواصل مع تراثي بينما أبني مهارات إبداعية حديثة.'
        },
        rating: 5
      }
    ],
    media: {
      images: [
        '/images/programs/arts-media-1.jpg',
        '/images/programs/arts-media-2.jpg'
      ],
      videos: ['/videos/arts-media-showcase.mp4'],
      virtualTour: '/virtual-tours/arts-studio'
    },
    applicationProcess: {
      steps: {
        en: [
          'Submit online application with portfolio',
          'Attend creative workshop',
          'Complete cultural knowledge assessment',
          'Interview with faculty',
          'Receive admission decision'
        ],
        ar: [
          'تقديم الطلب عبر الإنترنت مع الحقيبة',
          'حضور ورشة إبداعية',
          'إكمال تقييم المعرفة الثقافية',
          'مقابلة مع أعضاء هيئة التدريس',
          'استلام قرار القبول'
        ]
      },
      deadline: '2024-06-30',
      requirements: {
        en: ['Creative portfolio submission', 'Cultural interest statement', 'Academic transcript'],
        ar: ['تقديم حقيبة إبداعية', 'بيان الاهتمام الثقافي', 'كشف الدرجات الأكاديمي']
      },
      contactInfo: {
        email: 'arts@emiratesheritage.ae',
        phone: '+971-4-234-5678',
        address: {
          en: 'Jumeirah 2, Dubai, UAE',
          ar: 'جميرا 2، دبي، الإمارات العربية المتحدة'
        }
      }
    },
    status: 'published',
    workflowStage: 'maintenance',
    approvalHistory: [],
    createdAt: '2024-01-20T11:00:00Z',
    updatedAt: '2024-02-15T16:45:00Z',
    publishedAt: '2024-02-20T10:00:00Z',
    createdBy: 'content-creator-002',
    lastModifiedBy: 'content-manager-001'
  },
  {
    id: 'prog-003',
    title: {
      en: 'Elite Sports Academy Program',
      ar: 'برنامج أكاديمية الرياضة النخبة'
    },
    description: {
      en: 'Professional sports training program preparing athletes for national and international competitions.',
      ar: 'برنامج تدريب رياضي احترافي يعد الرياضيين للمنافسات الوطنية والدولية.'
    },
    school: {
      id: 'school-003',
      name: {
        en: 'Dubai Sports Academy',
        ar: 'أكاديمية دبي الرياضية'
      },
      logo: '/images/schools/dubai-sports-academy.png',
      location: 'Dubai Sports City',
      type: 'private',
      accreditation: ['KHDA', 'UAE Olympic Committee']
    },
    category: 'sports',
    subcategory: 'Multi-Sport Training',
    targetAge: { min: 10, max: 18 },
    duration: { value: 4, unit: 'years' },
    schedule: {
      type: 'full-time',
      hoursPerWeek: 35,
      startDate: '2024-08-15',
      endDate: '2028-06-30'
    },
    curriculum: {
      overview: {
        en: 'Comprehensive athletic development program combining sports training with academic excellence.',
        ar: 'برنامج تطوير رياضي شامل يجمع بين التدريب الرياضي والتميز الأكاديمي.'
      },
      subjects: [
        {
          id: 'subj-005',
          name: { en: 'Sports Science', ar: 'علوم الرياضة' },
          credits: 4,
          description: { en: 'Scientific principles of athletic performance', ar: 'المبادئ العلمية للأداء الرياضي' }
        },
        {
          id: 'subj-006',
          name: { en: 'Nutrition & Fitness', ar: 'التغذية واللياقة البدنية' },
          credits: 3,
          description: { en: 'Optimal nutrition and fitness strategies', ar: 'استراتيجيات التغذية واللياقة المثلى' }
        }
      ],
      learningOutcomes: {
        en: [
          'Achieve elite athletic performance levels',
          'Understand sports science principles',
          'Develop leadership and teamwork skills',
          'Prepare for professional sports careers'
        ],
        ar: [
          'تحقيق مستويات أداء رياضي نخبوي',
          'فهم مبادئ علوم الرياضة',
          'تطوير مهارات القيادة والعمل الجماعي',
          'الإعداد للمهن الرياضية المهنية'
        ]
      },
      assessmentMethods: {
        en: ['Performance testing', 'Competition results', 'Academic assessments', 'Leadership evaluation'],
        ar: ['اختبارات الأداء', 'نتائج المنافسات', 'التقييمات الأكاديمية', 'تقييم القيادة']
      }
    },
    faculty: [
      {
        id: 'fac-003',
        name: { en: 'Coach Khalid Al Mansoori', ar: 'المدرب خالد المنصوري' },
        title: { en: 'Head Coach & Athletic Director', ar: 'المدرب الرئيسي ومدير الألعاب الرياضية' },
        qualifications: { en: ['Olympic Coach Certification', 'Sports Science Degree'], ar: ['شهادة مدرب أولمبي', 'درجة علوم الرياضة'] },
        experience: 20,
        specialization: { en: ['Track & Field', 'Athletic Performance'], ar: ['ألعاب القوى', 'الأداء الرياضي'] },
        bio: { en: 'Former Olympic athlete with 20 years of coaching experience at international level.', ar: 'رياضي أولمبي سابق مع 20 عاماً من خبرة التدريب على المستوى الدولي.' }
      }
    ],
    facilities: [
      {
        id: 'fac-003',
        name: { en: 'Olympic Training Center', ar: 'مركز التدريب الأولمبي' },
        type: 'sports',
        description: { en: 'World-class training facility with Olympic-standard equipment and tracks.', ar: 'مرفق تدريب عالمي المستوى مع معدات ومضامير بمعايير أولمبية.' },
        capacity: 100,
        equipment: { en: ['Olympic Pool', 'Athletics Track', 'Gymnasium'], ar: ['مسبح أولمبي', 'مضمار ألعاب القوى', 'صالة رياضية'] },
        images: ['/images/facilities/olympic-center.jpg']
      }
    ],
    prerequisites: {
      en: ['Athletic talent assessment', 'Medical clearance', 'Academic performance standards'],
      ar: ['تقييم الموهبة الرياضية', 'التصريح الطبي', 'معايير الأداء الأكاديمي']
    },
    fees: {
      amount: 65000,
      currency: 'AED',
      scholarshipAvailable: true,
      paymentPlans: ['Annual', 'Semester']
    },
    capacity: {
      total: 50,
      available: 12,
      waitingList: 25
    },
    successMetrics: {
      graduationRate: 98,
      employmentRate: 85,
      satisfactionScore: 4.8,
      industryPartnerships: 12
    },
    testimonials: [
      {
        id: 'test-003',
        studentName: { en: 'Mariam Al Zahra', ar: 'مريم الزهراء' },
        graduationYear: 2022,
        currentPosition: { en: 'National Team Athlete', ar: 'رياضية في المنتخب الوطني' },
        testimonial: { 
          en: 'The academy provided world-class training that helped me represent UAE in international competitions.',
          ar: 'وفرت الأكاديمية تدريباً عالمي المستوى ساعدني على تمثيل الإمارات في المنافسات الدولية.'
        },
        rating: 5
      }
    ],
    media: {
      images: [
        '/images/programs/sports-academy-1.jpg',
        '/images/programs/sports-academy-2.jpg'
      ],
      videos: ['/videos/sports-academy-training.mp4'],
      virtualTour: '/virtual-tours/sports-facilities'
    },
    applicationProcess: {
      steps: {
        en: [
          'Submit application with sports achievements',
          'Attend talent assessment day',
          'Complete fitness and skill tests',
          'Medical examination',
          'Final selection interview'
        ],
        ar: [
          'تقديم الطلب مع الإنجازات الرياضية',
          'حضور يوم تقييم المواهب',
          'إكمال اختبارات اللياقة والمهارة',
          'الفحص الطبي',
          'مقابلة الاختيار النهائي'
        ]
      },
      deadline: '2024-04-30',
      requirements: {
        en: ['Sports achievement records', 'Medical fitness certificate', 'Academic transcript'],
        ar: ['سجلات الإنجازات الرياضية', 'شهادة اللياقة الطبية', 'كشف الدرجات الأكاديمي']
      },
      contactInfo: {
        email: 'admissions@dubaisports.ae',
        phone: '+971-4-345-6789',
        address: {
          en: 'Dubai Sports City, Dubai, UAE',
          ar: 'مدينة دبي الرياضية، دبي، الإمارات العربية المتحدة'
        }
      }
    },
    status: 'published',
    workflowStage: 'maintenance',
    approvalHistory: [],
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-02-10T13:20:00Z',
    publishedAt: '2024-02-15T08:00:00Z',
    createdBy: 'content-creator-003',
    lastModifiedBy: 'content-manager-001'
  }
];

// Service functions
export class SchoolProgramsService {
  private static instance: SchoolProgramsService;
  private programs: SchoolProgram[] = mockPrograms;

  public static getInstance(): SchoolProgramsService {
    if (!SchoolProgramsService.instance) {
      SchoolProgramsService.instance = new SchoolProgramsService();
    }
    return SchoolProgramsService.instance;
  }

  async getPrograms(params: SearchParams = {}): Promise<ProgramsResponse> {
    const { 
      query = '', 
      filters = {}, 
      sortBy = 'relevance', 
      sortOrder = 'desc', 
      page = 1, 
      limit = 12 
    } = params;

    let filteredPrograms = [...this.programs];

    // Apply text search
    if (query) {
      const searchTerm = query.toLowerCase();
      filteredPrograms = filteredPrograms.filter(program => 
        program.title.en.toLowerCase().includes(searchTerm) ||
        program.title.ar.includes(searchTerm) ||
        program.description.en.toLowerCase().includes(searchTerm) ||
        program.description.ar.includes(searchTerm) ||
        program.school.name.en.toLowerCase().includes(searchTerm) ||
        program.school.name.ar.includes(searchTerm)
      );
    }

    // Apply filters
    if (filters.category && filters.category.length > 0) {
      filteredPrograms = filteredPrograms.filter(program => 
        filters.category!.includes(program.category)
      );
    }

    if (filters.schoolType && filters.schoolType.length > 0) {
      filteredPrograms = filteredPrograms.filter(program => 
        filters.schoolType!.includes(program.school.type)
      );
    }

    if (filters.ageRange) {
      filteredPrograms = filteredPrograms.filter(program => 
        program.targetAge.min >= filters.ageRange!.min &&
        program.targetAge.max <= filters.ageRange!.max
      );
    }

    if (filters.availability) {
      filteredPrograms = filteredPrograms.filter(program => 
        program.capacity.available > 0
      );
    }

    if (filters.scholarshipAvailable) {
      filteredPrograms = filteredPrograms.filter(program => 
        program.fees.scholarshipAvailable
      );
    }

    // Apply sorting
    filteredPrograms.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.title.en.localeCompare(b.title.en);
          break;
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'rating':
          comparison = a.successMetrics.satisfactionScore - b.successMetrics.satisfactionScore;
          break;
        case 'fees':
          comparison = a.fees.amount - b.fees.amount;
          break;
        default: // relevance
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPrograms = filteredPrograms.slice(startIndex, endIndex);

    return {
      programs: paginatedPrograms,
      total: filteredPrograms.length,
      page,
      limit,
      hasMore: endIndex < filteredPrograms.length,
      filters
    };
  }

  async getProgramById(id: string): Promise<SchoolProgram | null> {
    return this.programs.find(program => program.id === id) || null;
  }

  async getProgramAnalytics(programId: string): Promise<ProgramAnalytics | null> {
    const program = await this.getProgramById(programId);
    if (!program) return null;

    // Mock analytics data
    return {
      programId,
      views: Math.floor(Math.random() * 5000) + 1000,
      applications: Math.floor(Math.random() * 200) + 50,
      enrollments: Math.floor(Math.random() * 50) + 10,
      completions: Math.floor(Math.random() * 40) + 8,
      userRatings: {
        average: program.successMetrics.satisfactionScore,
        count: Math.floor(Math.random() * 100) + 20,
        distribution: {
          5: 60,
          4: 25,
          3: 10,
          2: 3,
          1: 2
        }
      },
      engagementMetrics: {
        timeOnPage: Math.floor(Math.random() * 300) + 120,
        bounceRate: Math.random() * 0.3 + 0.2,
        conversionRate: Math.random() * 0.15 + 0.05
      },
      demographicData: {
        ageGroups: {
          '10-12': 20,
          '13-15': 35,
          '16-18': 45
        },
        genderDistribution: {
          'male': 55,
          'female': 45
        },
        locationDistribution: {
          'Dubai': 70,
          'Abu Dhabi': 15,
          'Sharjah': 10,
          'Other': 5
        }
      },
      periodStart: '2024-01-01',
      periodEnd: '2024-03-31'
    };
  }

  async getCategories(): Promise<{ category: ProgramCategory; count: number; label: { en: string; ar: string } }[]> {
    const categoryCounts = this.programs.reduce((acc, program) => {
      acc[program.category] = (acc[program.category] || 0) + 1;
      return acc;
    }, {} as Record<ProgramCategory, number>);

    const categoryLabels: Record<ProgramCategory, { en: string; ar: string }> = {
      stem: { en: 'STEM & Technology', ar: 'العلوم والتكنولوجيا' },
      arts: { en: 'Arts & Culture', ar: 'الفنون والثقافة' },
      sports: { en: 'Sports & Athletics', ar: 'الرياضة والألعاب الرياضية' },
      language: { en: 'Languages', ar: 'اللغات' },
      vocational: { en: 'Vocational Training', ar: 'التدريب المهني' },
      leadership: { en: 'Leadership', ar: 'القيادة' },
      entrepreneurship: { en: 'Entrepreneurship', ar: 'ريادة الأعمال' },
      cultural: { en: 'Cultural Studies', ar: 'الدراسات الثقافية' }
    };

    return Object.entries(categoryCounts).map(([category, count]) => ({
      category: category as ProgramCategory,
      count,
      label: categoryLabels[category as ProgramCategory]
    }));
  }

  async getFeaturedPrograms(limit: number = 3): Promise<SchoolProgram[]> {
    // Return programs with highest satisfaction scores
    return this.programs
      .sort((a, b) => b.successMetrics.satisfactionScore - a.successMetrics.satisfactionScore)
      .slice(0, limit);
  }

  async getSchools(): Promise<{ id: string; name: { en: string; ar: string }; programCount: number }[]> {
    const schoolCounts = this.programs.reduce((acc, program) => {
      const schoolId = program.school.id;
      if (!acc[schoolId]) {
        acc[schoolId] = {
          id: schoolId,
          name: program.school.name,
          programCount: 0
        };
      }
      acc[schoolId].programCount++;
      return acc;
    }, {} as Record<string, { id: string; name: { en: string; ar: string }; programCount: number }>);

    return Object.values(schoolCounts);
  }
}

export const schoolProgramsService = SchoolProgramsService.getInstance();

