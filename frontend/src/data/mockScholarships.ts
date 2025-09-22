
import { Scholarship } from "@/types/scholarships";

export const mockScholarships: Scholarship[] = [
  {
    id: "SCH001",
    title: "UAE Future Leaders Scholarship",
    description: "A comprehensive scholarship program for outstanding Emirati students pursuing higher education in strategic fields including technology, engineering, and business administration.",
    provider: "UAE Ministry of Education",
    provider_type: "government",
    eligibility_criteria: {
      nationality: "UAE National",
      gpa_minimum: 3.5,
      age_range: "18-25"
    },
    amount: 150000,
    currency: "AED",
    application_deadline: "2024-12-31T23:59:59Z",
    requirements: [
      "UAE National status",
      "Minimum GPA of 3.5",
      "Letter of recommendation",
      "Personal statement",
      "Academic transcripts"
    ],
    contact_email: "scholarships@moe.gov.ae",
    contact_phone: "+971 2 123 4567",
    website_url: "https://www.moe.gov.ae/scholarships",
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
    created_by: "gov-admin-001"
  },
  {
    id: "SCH002",
    title: "Emirates Innovation Excellence Grant",
    description: "Supporting innovative minds in pursuing advanced degrees in STEM fields, with focus on AI, renewable energy, and space technology.",
    provider: "Emirates Foundation",
    provider_type: "private_sector",
    eligibility_criteria: {
      nationality: "UAE National",
      field_of_study: ["Engineering", "Computer Science", "Physics", "Mathematics"],
      innovation_project_required: true
    },
    amount: 200000,
    currency: "AED",
    application_deadline: "2024-11-30T23:59:59Z",
    requirements: [
      "UAE citizenship",
      "STEM field of study",
      "Innovation project proposal",
      "Academic excellence record",
      "Interview participation"
    ],
    contact_email: "grants@emiratesfoundation.ae",
    website_url: "https://www.emiratesfoundation.ae/innovation-grants",
    is_active: true,
    created_at: "2024-01-15T00:00:00Z",
    created_by: "foundation-001"
  },
  {
    id: "SCH003",
    title: "American University of Sharjah Merit Scholarship",
    description: "Merit-based scholarship for exceptional students demonstrating academic excellence and leadership potential in various undergraduate programs.",
    provider: "American University of Sharjah",
    provider_type: "university",
    eligibility_criteria: {
      nationality: "Any",
      gpa_minimum: 3.7,
      leadership_experience: true
    },
    amount: 80000,
    currency: "AED",
    application_deadline: "2024-10-15T23:59:59Z",
    requirements: [
      "Outstanding academic record",
      "Leadership experience",
      "Community service involvement",
      "English proficiency",
      "University entrance exam scores"
    ],
    contact_email: "admissions@aus.edu",
    contact_phone: "+971 6 515 0000",
    website_url: "https://www.aus.edu/scholarships",
    is_active: true,
    created_at: "2024-02-01T00:00:00Z",
    created_by: "aus-admin-001"
  },
  {
    id: "SCH004",
    title: "Dubai Future Accelerators Professional Development",
    description: "Professional development scholarship for working professionals looking to advance their careers in emerging technologies and digital transformation.",
    provider: "Dubai Future Foundation",
    provider_type: "government",
    eligibility_criteria: {
      work_experience_years: 2,
      UAE_resident: true,
      technology_background: true
    },
    amount: 75000,
    currency: "AED",
    application_deadline: "2024-09-30T23:59:59Z",
    requirements: [
      "UAE residency",
      "Minimum 2 years work experience",
      "Technology or business background",
      "Career development plan",
      "Employer endorsement"
    ],
    contact_email: "programs@dubaifuture.ae",
    website_url: "https://www.dubaifuture.ae/professional-development",
    is_active: true,
    created_at: "2024-02-15T00:00:00Z",
    created_by: "dubai-future-001"
  },
  {
    id: "SCH005",
    title: "Etisalat Digital Skills Advancement Grant",
    description: "Supporting individuals in acquiring cutting-edge digital skills and certifications in telecommunications, cybersecurity, and digital marketing.",
    provider: "Etisalat Group",
    provider_type: "private_sector",
    eligibility_criteria: {
      age_range: "21-35",
      UAE_resident: true,
      digital_aptitude_test: true
    },
    amount: 45000,
    currency: "AED",
    application_deadline: "2024-12-15T23:59:59Z",
    requirements: [
      "UAE residency",
      "Age between 21-35",
      "Pass digital aptitude assessment",
      "Career goals alignment",
      "Commitment to program completion"
    ],
    contact_email: "digitalskills@etisalat.ae",
    contact_phone: "+971 800 101",
    website_url: "https://www.etisalat.ae/skills-grants",
    is_active: true,
    created_at: "2024-03-01T00:00:00Z",
    created_by: "etisalat-hr-001"
  },
  {
    id: "SCH006",
    title: "ADNOC Energy Sector Leadership Program",
    description: "Comprehensive scholarship and training program for aspiring leaders in the energy sector, covering both traditional and renewable energy domains.",
    provider: "ADNOC Group",
    provider_type: "private_sector",
    eligibility_criteria: {
      nationality: "UAE National",
      field_of_study: ["Engineering", "Business", "Environmental Science"],
      leadership_potential: true
    },
    amount: 180000,
    currency: "AED",
    application_deadline: "2024-08-31T23:59:59Z",
    requirements: [
      "UAE National status",
      "Relevant field of study",
      "Leadership assessment",
      "Energy sector interest",
      "Long-term commitment"
    ],
    contact_email: "careers@adnoc.ae",
    website_url: "https://www.adnoc.ae/leadership-program",
    is_active: true,
    created_at: "2024-03-15T00:00:00Z",
    created_by: "adnoc-hr-001"
  }
];
