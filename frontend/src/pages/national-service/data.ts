/* ──────────────────────────────────────────────────────────
   National Service & Sustainability — Data
   Extracted from NationalServicePage.tsx to keep the
   component file focused on rendering logic
   ────────────────────────────────────────────────────────── */

export const servicePrograms = [
    {
        title: 'Alternative National Service — Sustainability Track',
        org: 'NSRA + Emirati Pathways',
        duration: '12 months',
        icon: '🌱',
        status: 'Enrolling' as const,
        spots: 120,
        desc: 'Serve your nation through sustainability — work placements in renewable energy, environmental conservation, and green infrastructure projects across all Emirates.',
        tags: ['Sustainability', 'Green Energy', 'Conservation'],
        highlights: ['Government entity placements', 'Sustainability certification', 'Career pathway into green sector'],
    },
    {
        title: 'Al Nokhba Programme',
        org: 'NSRA + Khalifa University',
        duration: '24 months',
        icon: '🎓',
        status: 'Open' as const,
        spots: 80,
        desc: 'Elite academic programme combining national service with advanced STEM education at Khalifa University — 5th cohort now enrolling. Graduates earn dual credentials.',
        tags: ['STEM', 'Research', 'Khalifa University'],
        highlights: ['Advanced degree pathway', 'Research opportunities', 'Industry partnerships'],
    },
    {
        title: 'Data Science & Engineering Track',
        org: 'NSRA + SCAD (Statistics Centre Abu Dhabi)',
        duration: '9 months',
        icon: '📊',
        status: 'Open' as const,
        spots: 60,
        desc: 'Develop national talent in data science and data engineering through hands-on training with real government datasets — in partnership with SCAD.',
        tags: ['Data Science', 'Analytics', 'Government Data'],
        highlights: ['Python & R training', 'Real-world datasets', 'SCAD placement opportunity'],
    },
    {
        title: 'Emergency & Crisis Management Service',
        org: 'NSRA + ADCMC',
        duration: '12 months',
        icon: '🛡️',
        status: 'Open' as const,
        spots: 100,
        desc: 'Alternative national service recruits deployed to Abu Dhabi Crises and Disasters Management Centre — building emergency preparedness and climate resilience skills.',
        tags: ['Crisis Management', 'Climate Resilience', 'Civil Defence'],
        highlights: ['Emergency response certification', 'Climate resilience training', 'Government career track'],
    },
    {
        title: 'Special Education Teaching Programme',
        org: 'NSRA + Zayed Higher Organization',
        duration: '18 months',
        icon: '📚',
        status: 'Enrolling' as const,
        spots: 40,
        desc: 'Recruit UAE Nationals into special educational needs teaching roles — serve the nation while building a meaningful career in inclusive education.',
        tags: ['Education', 'Special Needs', 'Teaching'],
        highlights: ['Teaching qualification', 'ZHO mentorship', 'Permanent career pathway'],
    },
    {
        title: 'Renewable Energy Field Operations',
        org: 'NSRA + Masdar',
        duration: '12 months',
        icon: '⚡',
        status: 'Open' as const,
        spots: 50,
        desc: 'Field-based sustainability service at Masdar City and solar farms — gain practical skills in solar, wind, and hydrogen energy systems.',
        tags: ['Solar', 'Wind', 'Hydrogen'],
        highlights: ['Masdar City placement', 'Technical certifications', 'Clean energy career pathway'],
    },
];

export const sustainabilityOpportunities = [
    { title: 'Marine Conservation Officer', location: 'Abu Dhabi Coastline', org: 'Environment Agency Abu Dhabi', type: 'Full-time', sector: 'Conservation', desc: 'Protect coral reefs and marine ecosystems along the UAE coastline through monitoring, research, and community education.' },
    { title: 'Solar Farm Operations Technician', location: 'Al Dhafra, Abu Dhabi', org: 'Masdar / EWEC', type: 'Full-time', sector: 'Renewable Energy', desc: 'Maintain and operate solar PV systems at one of the world\'s largest solar farms — hands-on clean energy work.' },
    { title: 'Sustainability Data Analyst', location: 'Abu Dhabi / Remote', org: 'SCAD', type: 'Full-time', sector: 'Data & Analytics', desc: 'Analyse environmental and sustainability data for government reporting — carbon tracking, resource usage, and impact metrics.' },
    { title: 'Green Building Inspector', location: 'Dubai', org: 'Dubai Municipality', type: 'Full-time', sector: 'Built Environment', desc: 'Inspect and certify buildings for Estidama/Al Sa\'fat sustainability standards — ensuring UAE\'s built environment meets green targets.' },
    { title: 'Climate Resilience Planner', location: 'All Emirates', org: 'Ministry of Climate Change', type: 'Full-time', sector: 'Climate Policy', desc: 'Work on UAE\'s National Climate Change Plan — flood risk, heat resilience, and adaptation strategies for critical infrastructure.' },
    { title: 'Mangrove Restoration Coordinator', location: 'Abu Dhabi / Umm Al Quwain', org: 'Mangrove Initiative', type: 'Contract', sector: 'Ecosystem Restoration', desc: 'Lead planting and monitoring of 100 million mangrove trees — the UAE\'s flagship nature-based climate solution.' },
];

export const nsraPartners = [
    { name: 'Khalifa University', role: 'Al Nokhba Programme — STEM education track', logo: '🏛️' },
    { name: 'SCAD (Statistics Centre Abu Dhabi)', role: 'Data science & data engineering training', logo: '📈' },
    { name: 'Masdar', role: 'Renewable energy field placements', logo: '⚡' },
    { name: 'Zayed Higher Organization', role: 'Special education teaching recruitment', logo: '📖' },
    { name: 'Abu Dhabi Crises & Disasters Centre', role: 'Emergency management service placements', logo: '🛡️' },
    { name: 'Environment Agency Abu Dhabi', role: 'Marine conservation & environmental protection', logo: '🐬' },
];

export const recentMilestones = [
    { event: 'Graduation of 18th Cohort of UAE National Service Programme', detail: 'Attended by H.H. Khaled bin Mohamed bin Zayed', date: '2025' },
    { event: '5th Cohort of Al Nokhba Programme — Khalifa University Graduation', detail: 'Advanced STEM graduates entering government and private sector', date: '2025' },
    { event: 'SCAD–NSRA MOU for Data Science Training', detail: 'Statistical training programme for Alternative National Service recruits', date: '2024' },
    { event: '4th Batch of Alternative National Service deployed to Government Entities', detail: 'Abu Dhabi Crises & Disasters Management Centre placements', date: '2024' },
    { event: 'ZHO–NSRA Special Education Teaching Programme Launched', detail: 'Recruiting Nationals into special educational needs teaching roles', date: '2024' },
];

export const sustainabilityImpact = [
    { value: '50,000+', label: 'Trees Planted', icon: '🌳' },
    { value: '2,500 tons', label: 'Waste Collected', icon: '♻️' },
    { value: '15 MW', label: 'Solar Capacity Added', icon: '☀️' },
    { value: '500 km', label: 'Coastline Protected', icon: '🐬' },
];

export const enrolmentSteps = [
    { step: 1, title: 'Register via NSRA', desc: 'Complete your national service registration through official NSRA channels' },
    { step: 2, title: 'Choose Your Track', desc: 'Select from military, sustainability, academic, or community service tracks' },
    { step: 3, title: 'Complete Training', desc: 'Attend orientation and track-specific training programme' },
    { step: 4, title: 'Begin Service', desc: 'Start your placement and build skills for your future career' },
];
