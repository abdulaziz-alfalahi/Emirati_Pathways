"""
Job Postings Schema Compatibility Layer
Provides backward compatibility between old and new job_postings schema
"""

def map_old_to_new(old_data):
    """
    Map old job_postings schema to new schema
    
    Old schema uses: id (UUID), created_by, company_id (UUID)
    New schema uses: jd_id, recruiter_id, company_id (VARCHAR)
    """
    return {
        'jd_id': str(old_data.get('id', '')),
        'recruiter_id': str(old_data.get('created_by', '')),
        'company_id': str(old_data.get('company_id', '')),
        'title': old_data.get('title', ''),
        'title_arabic': old_data.get('title_arabic', ''),
        'department': old_data.get('department', ''),
        'job_type': old_data.get('employment_type', 'full_time'),
        'job_level': old_data.get('experience_level', 'mid'),
        'emirate': old_data.get('location', '').split(',')[0].strip() if old_data.get('location') else '',
        'city': old_data.get('location', '').split(',')[1].strip() if old_data.get('location') and ',' in old_data.get('location', '') else '',
        'remote_option': old_data.get('remote_work_allowed', False),
        'description': old_data.get('description', ''),
        'description_arabic': old_data.get('description_arabic', ''),
        'requirements': old_data.get('requirements', []),
        'responsibilities': old_data.get('responsibilities', []),
        'benefits': old_data.get('benefits', []),
        'compensation': {
            'salary_min': old_data.get('salary_range_min'),
            'salary_max': old_data.get('salary_range_max'),
            'salary_currency': old_data.get('currency', 'AED')
        },
        'application_process': {},
        'metadata': {
            'jd_id': str(old_data.get('id', '')),
            'recruiter_id': str(old_data.get('created_by', '')),
            'company_id': str(old_data.get('company_id', '')),
            'uae_compliance_checked': old_data.get('uae_compliance_checked', False),
            'emiratization_target': old_data.get('emiratization_target', 0),
            'visa_sponsorship_available': old_data.get('visa_sponsorship_available', False),
            'tags': old_data.get('tags', []),
            'seo_keywords': old_data.get('seo_keywords', []),
            'external_job_id': old_data.get('external_job_id', '')
        },
        'status': old_data.get('status', 'draft'),
        'views_count': old_data.get('view_count', 0),
        'applications_count': old_data.get('application_count', 0),
        'created_at': old_data.get('created_at'),
        'updated_at': old_data.get('updated_at'),
        'published_at': old_data.get('published_at'),
        'closed_at': old_data.get('closed_at')
    }


def map_new_to_old(new_data):
    """
    Map new job_postings schema to old schema format
    For backward compatibility with existing HR routes
    """
    compensation = new_data.get('compensation', {})
    metadata = new_data.get('metadata', {})
    
    # Extract location from emirate and city
    location_parts = []
    if new_data.get('emirate'):
        location_parts.append(new_data['emirate'])
    if new_data.get('city'):
        location_parts.append(new_data['city'])
    location = ', '.join(location_parts) if location_parts else ''
    
    return {
        'id': new_data.get('jd_id', ''),
        'created_by': new_data.get('recruiter_id', ''),
        'company_id': new_data.get('company_id', ''),
        'title': new_data.get('title', ''),
        'title_arabic': new_data.get('title_arabic', ''),
        'description': new_data.get('description', ''),
        'description_arabic': new_data.get('description_arabic', ''),
        'requirements': new_data.get('requirements', []),
        'responsibilities': new_data.get('responsibilities', []),
        'benefits': new_data.get('benefits', []),
        'salary_range_min': compensation.get('salary_min'),
        'salary_range_max': compensation.get('salary_max'),
        'currency': compensation.get('salary_currency', 'AED'),
        'location': location,
        'remote_work_allowed': new_data.get('remote_option', False),
        'employment_type': new_data.get('job_type', 'full_time'),
        'experience_level': new_data.get('job_level', 'mid'),
        'status': new_data.get('status', 'draft'),
        'priority_level': 'normal',
        'application_deadline': None,
        'expires_at': None,
        'published_at': new_data.get('published_at'),
        'closed_at': new_data.get('closed_at'),
        'view_count': new_data.get('views_count', 0),
        'application_count': new_data.get('applications_count', 0),
        'uae_compliance_checked': metadata.get('uae_compliance_checked', False),
        'emiratization_target': metadata.get('emiratization_target', 0),
        'visa_sponsorship_available': metadata.get('visa_sponsorship_available', False),
        'tags': metadata.get('tags', []),
        'seo_keywords': metadata.get('seo_keywords', []),
        'external_job_id': metadata.get('external_job_id', ''),
        'created_at': new_data.get('created_at'),
        'updated_at': new_data.get('updated_at')
    }


def get_column_mapping():
    """
    Return column name mapping from old to new schema
    """
    return {
        'id': 'jd_id',
        'created_by': 'recruiter_id',
        'employment_type': 'job_type',
        'experience_level': 'job_level',
        'location': 'emirate',  # Note: location is split into emirate + city
        'remote_work_allowed': 'remote_option',
        'salary_range_min': 'compensation->salary_min',
        'salary_range_max': 'compensation->salary_max',
        'view_count': 'views_count',
        'application_count': 'applications_count',
        'uae_compliance_checked': 'metadata->uae_compliance_checked',
        'emiratization_target': 'metadata->emiratization_target',
        'visa_sponsorship_available': 'metadata->visa_sponsorship_available',
        'tags': 'metadata->tags',
        'seo_keywords': 'metadata->seo_keywords',
        'external_job_id': 'metadata->external_job_id'
    }

