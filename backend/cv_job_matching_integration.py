#!/usr/bin/env python3
"""
CV-Job Matching Integration System
Emirati Journey Platform - Seamless integration between CV parsing and job matching
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
import uuid

# Qwen / DashScope client (replaces google.generativeai)
try:
    from backend.services.qwen_client import chat_completion, QwenParsingError, QwenClientError
    from backend.config.qwen_config import DASHSCOPE_API_KEY
    _qwen_available = bool(DASHSCOPE_API_KEY)
except ImportError:
    _qwen_available = False
# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CVJobMatchingIntegration:
    """Integrates CV parsing with job matching and profile completion"""
    
    def __init__(self):
        """Initialize the integration system"""
        self.api_key = DASHSCOPE_API_KEY
        pass  # Qwen client is module-level, no instance model
        if not self.api_key:
            logger.warning("⚠️ DASHSCOPE_API_KEY not found. Job matching AI features will be disabled.")
        else:
            try:
                # Configure Gemini
                # [FIX] Use 2026-available model (matching cv_parser.py)
                # AI model initialized via qwen_client (lazy-loaded)
                logger.info("✅ CV-Job Matching Integration initialized with Qwen / DashScope")
            except Exception as e:
                logger.error(f"❌ Failed to initialize Gemini for matching: {e}")
        
        logger.info("✅ CV-Job Matching Integration initialized")
    
    def process_cv_for_job_matching(self, cv_data: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """Process CV data for enhanced job matching"""
        try:
            # Extract key information for job matching
            matching_profile = self._extract_matching_profile(cv_data)
            
            # Generate job search keywords
            keywords = self._generate_job_keywords(cv_data)
            
            # Calculate experience level
            experience_level = self._calculate_experience_level(cv_data)
            
            # Identify preferred job types
            job_preferences = self._identify_job_preferences(cv_data)
            
            # Generate salary expectations
            salary_range = self._estimate_salary_range(cv_data)
            
            # Create matching criteria
            matching_criteria = {
                'user_id': user_id,
                'profile': matching_profile,
                'keywords': keywords,
                'experience_level': experience_level,
                'job_preferences': job_preferences,
                'salary_range': salary_range,
                'location_preferences': self._extract_location_preferences(cv_data),
                'industry_preferences': self._extract_industry_preferences(cv_data),
                'skills_matrix': self._create_skills_matrix(cv_data),
                'uae_specific_factors': self._extract_uae_factors(cv_data)
            }
            
            return {
                'success': True,
                'matching_criteria': matching_criteria,
                'message': 'CV processed for job matching successfully'
            }
            
        except Exception as e:
            logger.error(f"CV job matching processing error: {str(e)}")
            return {
                'success': False,
                'message': f'Processing failed: {str(e)}'
            }
    
    def find_job_matches(self, matching_criteria: Dict[str, Any], limit: int = 20) -> Dict[str, Any]:
        """Find job matches based on CV analysis"""
        try:
            # This would typically query a job database
            # For now, we'll generate mock job matches based on the criteria
            
            job_matches = self._generate_job_matches(matching_criteria, limit)
            
            # Score and rank matches
            scored_matches = self._score_job_matches(job_matches, matching_criteria)
            
            # Sort by match score
            scored_matches.sort(key=lambda x: x['match_score'], reverse=True)
            
            return {
                'success': True,
                'matches': scored_matches[:limit],
                'total_matches': len(scored_matches),
                'matching_criteria_used': matching_criteria,
                'generated_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Job matching error: {str(e)}")
            return {
                'success': False,
                'message': f'Job matching failed: {str(e)}'
            }
    
    def complete_profile_from_cv(self, cv_data: Dict[str, Any], existing_profile: Dict[str, Any] = None) -> Dict[str, Any]:
        """Complete user profile using CV data"""
        try:
            profile = existing_profile or {}
            
            # Update personal information
            if cv_data.get('data', {}).get('personal_info'):
                personal_info = cv_data['data']['personal_info']
                profile.update({
                    'full_name': personal_info.get('full_name'),
                    'email': personal_info.get('email'),
                    'phone': personal_info.get('phone'),
                    'address': personal_info.get('address'),
                    'nationality': personal_info.get('nationality'),
                    'emirate': personal_info.get('emirate'),
                    'linkedin': personal_info.get('linkedin'),
                    'portfolio': personal_info.get('portfolio')
                })
            
            # Update professional summary
            if cv_data.get('data', {}).get('professional_summary'):
                profile['professional_summary'] = cv_data['data']['professional_summary']
            
            # Update experience
            if cv_data.get('data', {}).get('experience'):
                profile['experience'] = cv_data['data']['experience']
                profile['total_experience_years'] = self._calculate_total_experience(cv_data['data']['experience'])
            
            # Update education
            if cv_data.get('data', {}).get('education'):
                profile['education'] = cv_data['data']['education']
                profile['highest_education'] = self._get_highest_education(cv_data['data']['education'])
            
            # Update skills
            if cv_data.get('data', {}).get('skills'):
                profile['skills'] = cv_data['data']['skills']
                profile['skill_categories'] = self._categorize_skills(cv_data['data']['skills'])
            
            # Update languages
            if cv_data.get('data', {}).get('languages'):
                profile['languages'] = cv_data['data']['languages']
            
            # Update certifications
            if cv_data.get('data', {}).get('certifications'):
                profile['certifications'] = cv_data['data']['certifications']
            
            # Add CV analysis insights
            if cv_data.get('analysis'):
                profile['cv_analysis'] = cv_data['analysis']
            
            # Add UAE-specific information
            if cv_data.get('data', {}).get('uae_analysis'):
                profile['uae_analysis'] = cv_data['data']['uae_analysis']
            
            # Calculate profile completion percentage
            profile['completion_percentage'] = self._calculate_profile_completion(profile)
            
            # Add metadata
            profile['last_updated'] = datetime.utcnow().isoformat()
            profile['updated_from_cv'] = True
            
            return {
                'success': True,
                'profile': profile,
                'completion_percentage': profile['completion_percentage'],
                'message': 'Profile updated from CV successfully'
            }
            
        except Exception as e:
            logger.error(f"Profile completion error: {str(e)}")
            return {
                'success': False,
                'message': f'Profile completion failed: {str(e)}'
            }
    
    def generate_job_application_insights(self, cv_data: Dict[str, Any], job_description: str) -> Dict[str, Any]:
        """Generate insights for job application based on CV and job description"""
        try:
            prompt = f"""
            Analyze the following CV data against this job description and provide detailed insights:

            JOB DESCRIPTION:
            {job_description}

            CV DATA:
            {json.dumps(cv_data.get('data', {}), indent=2)}

            Provide analysis in JSON format with:
            1. Match percentage (0-100)
            2. Matching skills and experience
            3. Missing requirements
            4. Strengths for this role
            5. Areas to improve
            6. Suggested cover letter points
            7. Interview preparation tips
            8. UAE-specific advantages

            Return only valid JSON.
            """
            
            messages = [

            
                {"role": "system", "content": "You are an expert AI assistant for the UAE job market. Return ONLY raw, valid JSON. No markdown, no code fences."},

            
                {"role": "user", "content": prompt},

            
            ]

            
            response = chat_completion(task_type="match", messages=messages, response_format={"type": "json_object"})
            
            if not response or not response:
                return {
                    'success': False,
                    'message': 'Failed to generate insights'
                }
            
            # Parse response
            insights_text = str(response) if isinstance(response, dict) else response
            if insights_text.startswith('```json'):
                insights_text = insights_text[7:]
            if insights_text.startswith('```'):
                insights_text = insights_text[3:]
            if insights_text.endswith('```'):
                insights_text = insights_text[:-3]
            
            insights = json.loads(insights_text)
            
            return {
                'success': True,
                'insights': insights,
                'generated_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Job application insights error: {str(e)}")
            return {
                'success': False,
                'message': f'Insights generation failed: {str(e)}'
            }
    
    def _extract_matching_profile(self, cv_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract key profile information for job matching"""
        data = cv_data.get('data', {})
        
        return {
            'name': data.get('personal_info', {}).get('full_name', ''),
            'title': self._extract_current_title(data.get('experience', [])),
            'summary': data.get('professional_summary', ''),
            'location': data.get('personal_info', {}).get('address', ''),
            'nationality': data.get('personal_info', {}).get('nationality', ''),
            'total_experience': self._calculate_total_experience(data.get('experience', [])),
            'current_company': self._get_current_company(data.get('experience', [])),
            'education_level': self._get_highest_education(data.get('education', [])),
            'key_skills': [skill.get('name', '') for skill in data.get('skills', [])[:10]]
        }
    
    def _generate_job_keywords(self, cv_data: Dict[str, Any]) -> List[str]:
        """Generate job search keywords from CV"""
        keywords = set()
        data = cv_data.get('data', {})
        
        # Add skills
        for skill in data.get('skills', []):
            if skill.get('name'):
                keywords.add(skill['name'].lower())
        
        # Add job titles
        for exp in data.get('experience', []):
            if exp.get('position'):
                keywords.add(exp['position'].lower())
        
        # Add industries
        for exp in data.get('experience', []):
            if exp.get('industry'):
                keywords.add(exp['industry'].lower())
        
        # Add education fields
        for edu in data.get('education', []):
            if edu.get('field_of_study'):
                keywords.add(edu['field_of_study'].lower())
        
        return list(keywords)[:20]  # Limit to top 20 keywords
    
    def _calculate_experience_level(self, cv_data: Dict[str, Any]) -> str:
        """Calculate experience level from CV"""
        total_years = self._calculate_total_experience(cv_data.get('data', {}).get('experience', []))
        
        if total_years < 2:
            return 'Entry Level'
        elif total_years < 5:
            return 'Mid Level'
        elif total_years < 10:
            return 'Senior Level'
        else:
            return 'Executive Level'
    
    def _identify_job_preferences(self, cv_data: Dict[str, Any]) -> Dict[str, Any]:
        """Identify job preferences from CV"""
        data = cv_data.get('data', {})
        experience = data.get('experience', [])
        
        # Analyze recent positions for preferences
        recent_positions = experience[:3] if experience else []
        
        job_types = []
        industries = []
        company_sizes = []
        
        for exp in recent_positions:
            if exp.get('position'):
                job_types.append(exp['position'])
            if exp.get('industry'):
                industries.append(exp['industry'])
        
        return {
            'preferred_job_types': list(set(job_types)),
            'preferred_industries': list(set(industries)),
            'remote_work_experience': self._has_remote_experience(experience),
            'leadership_experience': self._has_leadership_experience(experience),
            'startup_experience': self._has_startup_experience(experience)
        }
    
    def _estimate_salary_range(self, cv_data: Dict[str, Any]) -> Dict[str, Any]:
        """Estimate salary range based on CV"""
        data = cv_data.get('data', {})
        experience_years = self._calculate_total_experience(data.get('experience', []))
        education_level = self._get_highest_education(data.get('education', []))
        uae_experience = data.get('uae_analysis', {}).get('uae_experience_years', 0)
        
        # Base salary calculation (simplified)
        base_salary = 5000  # AED per month
        
        # Experience multiplier
        base_salary += experience_years * 1000
        
        # Education bonus
        if 'master' in education_level.lower():
            base_salary += 2000
        elif 'bachelor' in education_level.lower():
            base_salary += 1000
        
        # UAE experience bonus
        base_salary += uae_experience * 500
        
        return {
            'min_salary': int(base_salary * 0.8),
            'max_salary': int(base_salary * 1.3),
            'currency': 'AED',
            'period': 'monthly',
            'estimated': True
        }
    
    def _extract_location_preferences(self, cv_data: Dict[str, Any]) -> List[str]:
        """Extract location preferences from CV"""
        data = cv_data.get('data', {})
        locations = set()
        
        # Current location
        current_location = data.get('personal_info', {}).get('address', '')
        if current_location:
            locations.add(current_location)
        
        # Work locations
        for exp in data.get('experience', []):
            if exp.get('location'):
                locations.add(exp['location'])
        
        # Education locations
        for edu in data.get('education', []):
            if edu.get('location'):
                locations.add(edu['location'])
        
        return list(locations)
    
    def _extract_industry_preferences(self, cv_data: Dict[str, Any]) -> List[str]:
        """Extract industry preferences from CV"""
        data = cv_data.get('data', {})
        industries = set()
        
        for exp in data.get('experience', []):
            if exp.get('industry'):
                industries.add(exp['industry'])
        
        return list(industries)
    
    def _create_skills_matrix(self, cv_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a skills matrix for matching"""
        data = cv_data.get('data', {})
        skills = data.get('skills', [])
        
        matrix = {
            'technical': [],
            'soft': [],
            'languages': [],
            'certifications': []
        }
        
        for skill in skills:
            category = skill.get('category', 'technical').lower()
            if category in matrix:
                matrix[category].append({
                    'name': skill.get('name', ''),
                    'proficiency': skill.get('proficiency', ''),
                    'years': skill.get('years_experience', 0)
                })
        
        # Add languages
        for lang in data.get('languages', []):
            matrix['languages'].append({
                'name': lang.get('language', ''),
                'proficiency': lang.get('proficiency', '')
            })
        
        # Add certifications
        for cert in data.get('certifications', []):
            matrix['certifications'].append({
                'name': cert.get('name', ''),
                'issuer': cert.get('issuer', '')
            })
        
        return matrix
    
    def _extract_uae_factors(self, cv_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract UAE-specific factors"""
        data = cv_data.get('data', {})
        uae_analysis = data.get('uae_analysis', {})
        
        return {
            'is_uae_national': uae_analysis.get('is_uae_national', False),
            'uae_experience_years': uae_analysis.get('uae_experience_years', 0),
            'has_uae_education': uae_analysis.get('has_uae_education', False),
            'has_arabic_language': uae_analysis.get('has_arabic_language', False),
            'emiratization_eligible': uae_analysis.get('emiratization_eligible', False),
            'current_emirate': data.get('personal_info', {}).get('emirate', '')
        }
    
    def _generate_job_matches(self, criteria: Dict[str, Any], limit: int) -> List[Dict[str, Any]]:
        """Find job matches from the recruiter_vacancies database table"""
        try:
            import psycopg2
            import psycopg2.extras
            
            db_config = {
                'dbname': os.getenv('DB_NAME', 'emirati_journey'),
                'user': os.getenv('DB_USER', 'emirati_user'),
                'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
                'host': os.getenv('DB_HOST', 'localhost'),
                'port': os.getenv('DB_PORT', 5432)
            }
            
            conn = psycopg2.connect(**db_config)
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            # Fetch active vacancies
            cur.execute('''
                SELECT id, title, employer, location, description, requirements, tags, created_at
                FROM recruiter_vacancies
                ORDER BY created_at DESC
                LIMIT %s
            ''', (limit * 3,))  # Fetch extra to allow scoring/filtering
            
            rows = cur.fetchall()
            cur.close()
            conn.close()
            
            if not rows:
                logger.info("No vacancies in DB, using fallback mock data")
                return self._get_fallback_mock_jobs()
            
            jobs = []
            for row in rows:
                # Parse JSONB fields
                requirements = row.get('requirements', [])
                if isinstance(requirements, str):
                    try:
                        requirements = json.loads(requirements)
                    except:
                        requirements = []
                
                tags = row.get('tags', [])
                if isinstance(tags, str):
                    try:
                        tags = json.loads(tags)
                    except:
                        tags = []
                
                jobs.append({
                    'job_id': str(row['id']),
                    'title': row.get('title', ''),
                    'company': row.get('employer', ''),
                    'location': row.get('location', 'UAE'),
                    'description': row.get('description', ''),
                    'required_skills': [r if isinstance(r, str) else r.get('name', '') for r in requirements],
                    'tags': tags,
                    'experience_required': '',
                    'industry': '',
                    'job_type': 'Full-time',
                    'remote_allowed': False,
                    'emiratization_priority': True,
                    'salary_range': {'min': 8000, 'max': 20000, 'currency': 'AED'},
                    'posted_at': str(row.get('created_at', ''))
                })
            
            logger.info(f"✅ Found {len(jobs)} vacancies from database for matching")
            return jobs
            
        except Exception as e:
            logger.warning(f"DB query failed, using fallback mock jobs: {e}")
            return self._get_fallback_mock_jobs()
    
    def _get_fallback_mock_jobs(self) -> List[Dict[str, Any]]:
        """Fallback mock jobs when DB is unavailable"""
        return [
            {
                'job_id': str(uuid.uuid4()),
                'title': 'Senior Software Engineer',
                'company': 'Emirates NBD',
                'location': 'Dubai, UAE',
                'salary_range': {'min': 15000, 'max': 25000, 'currency': 'AED'},
                'required_skills': ['Python', 'React', 'AWS'],
                'experience_required': '3-5 years',
                'industry': 'Banking',
                'job_type': 'Full-time',
                'remote_allowed': False,
                'emiratization_priority': True
            },
            {
                'job_id': str(uuid.uuid4()),
                'title': 'Data Scientist',
                'company': 'ADNOC',
                'location': 'Abu Dhabi, UAE',
                'salary_range': {'min': 18000, 'max': 30000, 'currency': 'AED'},
                'required_skills': ['Python', 'Machine Learning', 'SQL'],
                'experience_required': '2-4 years',
                'industry': 'Oil & Gas',
                'job_type': 'Full-time',
                'remote_allowed': True,
                'emiratization_priority': True
            }
        ]
    
    def _score_job_matches(self, jobs: List[Dict[str, Any]], criteria: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Score job matches based on criteria"""
        scored_jobs = []
        
        for job in jobs:
            score = self._calculate_match_score(job, criteria)
            job['match_score'] = score
            job['match_reasons'] = self._generate_match_reasons(job, criteria)
            scored_jobs.append(job)
        
        return scored_jobs
    
    def _calculate_match_score(self, job: Dict[str, Any], criteria: Dict[str, Any]) -> float:
        """Calculate match score between job and criteria"""
        score = 0.0
        max_score = 100.0
        
        # Skills matching (40% weight)
        skills_score = self._calculate_skills_match(job.get('required_skills', []), criteria.get('skills_matrix', {}))
        score += skills_score * 0.4
        
        # Experience level matching (20% weight)
        exp_score = self._calculate_experience_match(job.get('experience_required', ''), criteria.get('experience_level', ''))
        score += exp_score * 0.2
        
        # Location matching (15% weight)
        location_score = self._calculate_location_match(job.get('location', ''), criteria.get('location_preferences', []))
        score += location_score * 0.15
        
        # Industry matching (15% weight)
        industry_score = self._calculate_industry_match(job.get('industry', ''), criteria.get('industry_preferences', []))
        score += industry_score * 0.15
        
        # UAE factors (10% weight)
        uae_score = self._calculate_uae_match(job, criteria.get('uae_specific_factors', {}))
        score += uae_score * 0.1
        
        return min(score, max_score)
    
    def _calculate_skills_match(self, required_skills: List[str], skills_matrix: Dict[str, Any]) -> float:
        """Calculate skills matching score"""
        if not required_skills:
            return 50.0
        
        user_skills = []
        for category in skills_matrix.values():
            if isinstance(category, list):
                user_skills.extend([skill.get('name', '').lower() for skill in category])
        
        matched_skills = 0
        for req_skill in required_skills:
            if req_skill.lower() in user_skills:
                matched_skills += 1
        
        return (matched_skills / len(required_skills)) * 100 if required_skills else 0
    
    def _calculate_experience_match(self, required_exp: str, user_exp_level: str) -> float:
        """Calculate experience level matching"""
        exp_mapping = {
            'entry level': 1,
            'mid level': 2,
            'senior level': 3,
            'executive level': 4
        }
        
        user_level = exp_mapping.get(user_exp_level.lower(), 2)
        
        # Simple matching logic
        if 'entry' in required_exp.lower() and user_level >= 1:
            return 100.0
        elif 'mid' in required_exp.lower() and user_level >= 2:
            return 100.0
        elif 'senior' in required_exp.lower() and user_level >= 3:
            return 100.0
        elif 'executive' in required_exp.lower() and user_level >= 4:
            return 100.0
        
        return 50.0
    
    def _calculate_location_match(self, job_location: str, user_locations: List[str]) -> float:
        """Calculate location matching score"""
        if not job_location or not user_locations:
            return 50.0
        
        for user_loc in user_locations:
            if job_location.lower() in user_loc.lower() or user_loc.lower() in job_location.lower():
                return 100.0
        
        return 30.0
    
    def _calculate_industry_match(self, job_industry: str, user_industries: List[str]) -> float:
        """Calculate industry matching score"""
        if not job_industry or not user_industries:
            return 50.0
        
        for user_ind in user_industries:
            if job_industry.lower() in user_ind.lower() or user_ind.lower() in job_industry.lower():
                return 100.0
        
        return 40.0
    
    def _calculate_uae_match(self, job: Dict[str, Any], uae_factors: Dict[str, Any]) -> float:
        """Calculate UAE-specific matching score"""
        score = 50.0
        
        if job.get('emiratization_priority') and uae_factors.get('is_uae_national'):
            score += 30.0
        
        if uae_factors.get('uae_experience_years', 0) > 0:
            score += 20.0
        
        return min(score, 100.0)
    
    def _generate_match_reasons(self, job: Dict[str, Any], criteria: Dict[str, Any]) -> List[str]:
        """Generate reasons for job match"""
        reasons = []
        
        # Skills match
        user_skills = []
        for category in criteria.get('skills_matrix', {}).values():
            if isinstance(category, list):
                user_skills.extend([skill.get('name', '').lower() for skill in category])
        
        matched_skills = []
        for req_skill in job.get('required_skills', []):
            if req_skill.lower() in user_skills:
                matched_skills.append(req_skill)
        
        if matched_skills:
            reasons.append(f"Skills match: {', '.join(matched_skills)}")
        
        # Experience match
        if criteria.get('experience_level'):
            reasons.append(f"Experience level: {criteria['experience_level']}")
        
        # UAE factors
        uae_factors = criteria.get('uae_specific_factors', {})
        if job.get('emiratization_priority') and uae_factors.get('is_uae_national'):
            reasons.append("Emiratization priority candidate")
        
        if uae_factors.get('uae_experience_years', 0) > 0:
            reasons.append(f"UAE experience: {uae_factors['uae_experience_years']} years")
        
        return reasons
    
    # Helper methods for profile completion
    def _calculate_total_experience(self, experience: List[Dict[str, Any]]) -> float:
        """Calculate total years of experience"""
        total_years = 0.0
        for exp in experience:
            duration = exp.get('duration', '')
            if 'year' in duration.lower():
                try:
                    years = float(duration.split()[0])
                    total_years += years
                except:
                    total_years += 1
        return total_years
    
    def _get_highest_education(self, education: List[Dict[str, Any]]) -> str:
        """Get highest education level"""
        if not education:
            return 'Not specified'
        
        # Simple ranking
        education_ranking = {
            'phd': 5, 'doctorate': 5,
            'master': 4, 'mba': 4,
            'bachelor': 3, 'degree': 3,
            'diploma': 2,
            'certificate': 1
        }
        
        highest_rank = 0
        highest_education = 'Not specified'
        
        for edu in education:
            degree = edu.get('degree', '').lower()
            for key, rank in education_ranking.items():
                if key in degree and rank > highest_rank:
                    highest_rank = rank
                    highest_education = edu.get('degree', '')
        
        return highest_education
    
    def _categorize_skills(self, skills: List[Dict[str, Any]]) -> Dict[str, List[str]]:
        """Categorize skills by type"""
        categories = {}
        for skill in skills:
            category = skill.get('category', 'Other')
            if category not in categories:
                categories[category] = []
            categories[category].append(skill.get('name', ''))
        return categories
    
    def _calculate_profile_completion(self, profile: Dict[str, Any]) -> float:
        """Calculate profile completion percentage"""
        required_fields = [
            'full_name', 'email', 'phone', 'professional_summary',
            'experience', 'education', 'skills'
        ]
        
        completed_fields = 0
        for field in required_fields:
            if profile.get(field):
                completed_fields += 1
        
        return (completed_fields / len(required_fields)) * 100
    
    def _extract_current_title(self, experience: List[Dict[str, Any]]) -> str:
        """Extract current job title"""
        if not experience:
            return ''
        
        # Assume first experience is most recent
        current_exp = experience[0]
        return current_exp.get('position', '')
    
    def _get_current_company(self, experience: List[Dict[str, Any]]) -> str:
        """Get current company"""
        if not experience:
            return ''
        
        current_exp = experience[0]
        return current_exp.get('company', '')
    
    def _has_remote_experience(self, experience: List[Dict[str, Any]]) -> bool:
        """Check if candidate has remote work experience"""
        for exp in experience:
            description = exp.get('description', '').lower()
            if 'remote' in description or 'work from home' in description:
                return True
        return False
    
    def _has_leadership_experience(self, experience: List[Dict[str, Any]]) -> bool:
        """Check if candidate has leadership experience"""
        for exp in experience:
            position = exp.get('position', '').lower()
            description = exp.get('description', '').lower()
            if any(keyword in position or keyword in description for keyword in 
                   ['manager', 'director', 'lead', 'head', 'supervisor', 'team lead']):
                return True
        return False
    
    def _has_startup_experience(self, experience: List[Dict[str, Any]]) -> bool:
        """Check if candidate has startup experience"""
        for exp in experience:
            company = exp.get('company', '').lower()
            description = exp.get('description', '').lower()
            if 'startup' in company or 'startup' in description:
                return True
        return False

# Export singleton instance
cv_job_matching_integration = CVJobMatchingIntegration()
