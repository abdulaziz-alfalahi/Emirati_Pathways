"""D33 and Talent33 priority skills, for ATS keyword scoring.

WHY THIS IS A VERBATIM COPY OF THE FRONTEND LIST

`CVProfile.tsx` carried these lists and scored CVs against them in the browser.
Moving scoring to the server (see `ats_scoring.py`) had to move the catalogue
too, and it is copied EXACTLY — same sectors, same skills, same order — so the
server reproduces the number candidates already see. Porting the computation and
changing the vocabulary in one step would make a shifted score indistinguishable
from a broken port.

Note there is a SECOND, older D33 list in `ai_job_matching_service.py`: a flat
sector -> keyword map used for job matching. It is deliberately not reused here.
It is coarser ('ai', 'data', 'cloud') where this one is specific ('AI/Machine
Learning', 'Data Science', 'Cloud Computing'), and scoring a CV against it would
change every candidate's keyword section. Consolidating the two is worth doing;
doing it inside a bug fix for a different defect is not.

The frontend keeps its copy for DISPLAY — sector names, icons, descriptions, and
the skill suggestions shown in the CV page. It no longer scores. So the
duplication that remains is a presentation list, not a second scorer.
"""

# Sector -> {'skills': [...]}. The wrapper dict mirrors the frontend shape so
# both sides read the same structure.
D33_SECTORS = {
    'technology': {
        'name': 'Technology & Digital Economy',
        'skills': [
            'AI/Machine Learning', 'Cloud Computing', 'Cybersecurity',
            'Data Science', 'Blockchain', 'IoT', 'Software Development',
            'DevOps', 'Full Stack Development', 'Mobile Development',
        ],
    },
    'sustainability': {
        'name': 'Green & Sustainable Economy',
        'skills': [
            'Sustainability Management', 'Renewable Energy', 'ESG Reporting',
            'Carbon Management', 'Green Building', 'Circular Economy',
            'Environmental Compliance', 'Clean Technology',
        ],
    },
    'finance': {
        'name': 'Financial Services & Fintech',
        'skills': [
            'Financial Analysis', 'Risk Management', 'Fintech',
            'Digital Banking', 'Investment Management', 'Regulatory Compliance',
            'Islamic Finance', 'Wealth Management',
        ],
    },
    'healthcare': {
        'name': 'Healthcare & Life Sciences',
        'skills': [
            'Healthcare Management', 'Clinical Research', 'Medical Technology',
            'Public Health', 'Biotechnology', 'Pharmaceutical', 'Digital Health',
            'Healthcare Analytics',
        ],
    },
    'tourism': {
        'name': 'Tourism & Hospitality',
        'skills': [
            'Hospitality Management', 'Tourism Marketing', 'Event Management',
            'Customer Experience', 'Revenue Management', 'Destination Marketing',
            'Sustainable Tourism',
        ],
    },
    'trade': {
        'name': 'Trade & Logistics',
        'skills': [
            'Supply Chain Management', 'Logistics', 'International Trade',
            'Customs & Compliance', 'E-commerce', 'Procurement',
            'Warehouse Management', 'Trade Finance',
        ],
    },
}

# Talent 2033 workforce development priorities.
TALENT33_SKILLS = {
    'leadership': [
        'Strategic Leadership', 'Change Management', 'Team Building',
        'Decision Making', 'Executive Communication',
    ],
    'digital': [
        'Digital Transformation', 'Data Analytics', 'Automation',
        'Digital Marketing', 'UX/UI Design',
    ],
    'future': [
        'Critical Thinking', 'Problem Solving', 'Adaptability', 'Creativity',
        'Emotional Intelligence', 'Cross-cultural Communication',
    ],
    'technical': [
        'Project Management', 'Agile/Scrum', 'Business Analysis',
        'Quality Assurance', 'Process Improvement',
    ],
}
