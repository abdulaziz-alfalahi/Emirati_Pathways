import logging
from datetime import datetime
from backend.models.profile.candidate_profile_models import CandidateProfile, CandidateExperience, CandidateEducation, CandidateSkill, CandidateCertification
from backend.extensions import db

logger = logging.getLogger(__name__)

class ProfileV2Service:
    """
    Service to handle business logic for Profile V2.
    Key responsibility: Bridging Parsed CV Data -> SQL Models.
    """
    
    @staticmethod
    def populate_from_cv_data(user_id: str, cv_data: dict) -> bool:
        """
        Populate or update the CandidateProfile and related tables from parsed CV data.
        """
        try:
            # DEBUG LOG
            try:
                with open("backend_profile_debug.log", "a", encoding="utf-8") as f:
                    f.write(f"{datetime.now().isoformat()} - POPULATE START: UserID='{user_id}'\n")
            except: pass

            # Ensure user_id is string
            user_id = str(user_id).strip()
            
            # 1. Get or Create Profile
            profile = CandidateProfile.query.filter_by(user_id=user_id).first()
            if not profile:
                profile = CandidateProfile(user_id=user_id)
                db.session.add(profile)
            
            # 2. Extract Data (Handle both nested 'data' key and flat structure)
            data = cv_data.get('data')
            if not data or not isinstance(data, dict):
                # If 'data' key is missing or not a dict, assume flat structure
                data = cv_data

            personal = data.get('personal_info', {}) or data.get('personalInfo', {})

            
            # 2. Update Core Identity (Only if empty or explicitly overwriting - here we overwrite for sync)
            profile.full_name = personal.get('full_name') or f"{personal.get('first_name', '')} {personal.get('last_name', '')}".strip() or profile.full_name
            
            # [FIX] Extract professional summary and properly truncate to avoid DB varchar limits
            prof_summary = data.get('professional_summary', '') or data.get('objective', '') or ''
            # Headline: First 150 chars of summary
            profile.headline = prof_summary[:150] if prof_summary else profile.headline
            # Bio: Full summary but truncate if extremely long (database text field limit ~10K typically)
            # Most DBs support TEXT type which is fine, but let's be safe
            profile.bio = prof_summary[:5000] if prof_summary else profile.bio
            
            profile.phone = personal.get('phone', profile.phone)
            profile.location = personal.get('location') or personal.get('address', profile.location)
            
            # 3. Clear existing entries to avoid duplication (Simplest sync strategy)
            # In a more advanced version, we might try to merge, but for "Import CV" replace is standard.
            CandidateExperience.query.filter_by(profile_id=profile.id).delete()
            CandidateEducation.query.filter_by(profile_id=profile.id).delete()
            CandidateSkill.query.filter_by(profile_id=profile.id).delete()
            CandidateCertification.query.filter_by(profile_id=profile.id).delete()
            
            # 4. Add Experience
            for exp in data.get('experience', []):
                new_exp = CandidateExperience(
                    profile_id=profile.id,
                    job_title=exp.get('position', 'Unknown Role'),
                    company=exp.get('company', 'Unknown Company'),
                    location=exp.get('location', ''),
                    description=exp.get('description', ''),
                    start_date=ProfileV2Service._parse_date(exp.get('start_date')),
                    end_date=ProfileV2Service._parse_date(exp.get('end_date')),
                    is_current=exp.get('is_current', False)
                )
                db.session.add(new_exp)
                
            # 5. Add Education
            for edu in data.get('education', []):
                new_edu = CandidateEducation(
                    profile_id=profile.id,
                    institution=edu.get('institution', 'Unknown Institution'),
                    degree=edu.get('degree', 'Unknown Degree'),
                    field_of_study=edu.get('field_of_study', ''),
                    start_date=ProfileV2Service._parse_date(edu.get('start_date')),
                    end_date=ProfileV2Service._parse_date(edu.get('end_date'))
                )
                db.session.add(new_edu)
                
            # 6. Add Skills
            for skill in data.get('skills', []):
                # Handle both list of strings and list of objects
                skill_name = skill.get('name') if isinstance(skill, dict) else str(skill)
                if skill_name:
                    new_skill = CandidateSkill(
                        profile_id=profile.id,
                        name=skill_name,
                        category=skill.get('category', 'General') if isinstance(skill, dict) else 'General',
                        level=skill.get('level', 'Intermediate') if isinstance(skill, dict) else 'Intermediate'
                    )
                    db.session.add(new_skill)

            db.session.commit()
            logger.info(f"✅ Profile V2 populated for user {user_id} from CV data")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to populate Profile V2: {e}")
            db.session.rollback()
            return False

    @staticmethod
    def update_skills_from_assessment(user_id: int, assessment_results: dict) -> bool:
        """
        Updates candidate skills based on assessment results.
        Marks skills as verified and adds the assessment score.
        """
        try:
            profile = CandidateProfile.query.filter_by(user_id=user_id).first()
            if not profile:
                logger.warning(f"Profile not found for user {user_id} during assessment sync")
                return False

            # Extract skill analysis from results
            # Structure: results['detailed_results']['skill_analysis'] -> { 'python': { 'proficiency_level': 'expert' ... } }
            detailed_results = assessment_results.get('detailed_results', {})
            skill_analysis = detailed_results.get('skill_analysis', {})
            
            # Also check for direct score if it's a specific skill assessment
            # This depends on how granular the assessment tagging is
            
            for skill_name, analysis in skill_analysis.items():
                if not skill_name: continue
                
                # Normalize name
                skill_name_clean = skill_name.lower().strip()
                
                # Find existing skill or create new
                candidate_skill = CandidateSkill.query.filter(
                    CandidateSkill.profile_id == profile.id,
                    db.func.lower(CandidateSkill.name) == skill_name_clean
                ).first()
                
                score = int(analysis.get('average_score', 0))
                level = analysis.get('proficiency_level', 'Unrated').title()
                
                if candidate_skill:
                    candidate_skill.is_verified = True
                    candidate_skill.assessment_score = score
                    candidate_skill.level = level # Update level based on strict assessment
                    logger.info(f"Updated skill {skill_name} for user {user_id} with score {score}")
                else:
                    # Add new verified skill
                    new_skill = CandidateSkill(
                        profile_id=profile.id,
                        name=skill_name.title(),
                        category='Technical', # Default failing better detection
                        level=level,
                        is_verified=True,
                        assessment_score=score
                    )
                    db.session.add(new_skill)
                    logger.info(f"Added new verified skill {skill_name} for user {user_id}")
            
            db.session.commit()
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to sync assessment results to profile: {e}")
            db.session.rollback()
            return False

    @staticmethod
    def get_matching_profile_data(user_id: int):
        """
        Adapts the SQL CandidateProfile to the dataclass format required by EnhancedMatchingEngine.
        Returns CandidateProfile (dataclass) or None.
        """
        # Import local to avoid circular imports if any
        from backend.services.enhanced_matching_service import CandidateProfile as MatchingProfile
        
        try:
            sql_profile = CandidateProfile.query.filter_by(user_id=user_id).first()
            if not sql_profile:
                return None
            
            # 1. Skills
            skills_list = [s.name for s in sql_profile.skills]
            
            # 2. Experience Years (Approximate from SQL data if not explicit)
            # Assuming we might store a computed value or sum intervals
            # 2. Experience Years & Career Level
            experience_years = 0
            for exp in sql_profile.experience:
                start = exp.start_date
                end = exp.end_date or datetime.now()
                if start:
                    days = (end - start).days
                    experience_years += days / 365.25
            
            if experience_years <= 2:
                career_level = 'Entry_Level'
            elif experience_years <= 5:
                career_level = 'Mid_Level'
            elif experience_years <= 10:
                career_level = 'Senior_Level'
            else:
                career_level = 'Executive'
            
            # 3. Education Level (Highest)
            # Simple heuristic mapping
            edu_levels = {'phd': 5, 'doctorate': 5, 'master': 4, 'mba': 4, 'bachelor': 3, 'bsc': 3, 'diploma': 2, 'associate': 2, 'high school': 1}
            highest_edu = 'High School'
            highest_score = 0
            
            for edu in sql_profile.education:
                deg_lower = edu.degree.lower()
                for key, val in edu_levels.items():
                    if key in deg_lower:
                        if val > highest_score:
                            highest_score = val
                            highest_edu = key.title()
            
            # 4. Location
            loc_data = {'emirate': sql_profile.location} if sql_profile.location else {}
            
            # 5. Salary (Parse range string if possible)
            salary_data = {}
            if sql_profile.expected_salary_range:
                try:
                    txt = sql_profile.expected_salary_range.lower().replace('aed', '').replace(',', '').strip()
                    if '-' in txt:
                        parts = txt.split('-')
                        salary_data = {'min_salary': int(float(parts[0].strip())), 'max_salary': int(float(parts[1].strip()))}
                    elif '+' in txt:
                        val = int(float(txt.replace('+', '').strip()))
                        # For 100k+, min is 100k. Max is virtually unlimited.
                        salary_data = {'min_salary': val, 'max_salary': 999999} 
                    elif txt.isdigit(): # Single number treated as target/min
                         val = int(txt)
                         salary_data = {'min_salary': val, 'max_salary': int(val * 1.2)}
                except:
                    pass
            
            # 6. Infer Industries (Keyword matching)
            industries = set()
            industry_keywords = {
                'Technology': ['software', 'developer', 'engineer', 'data', 'it', 'tech', 'digital', 'cyber'],
                'Finance': ['finance', 'bank', 'accountant', 'audit', 'investment', 'capital'],
                'Healthcare': ['medical', 'nurse', 'doctor', 'health', 'clinic', 'pharmacy'],
                'Education': ['teacher', 'professor', 'school', 'university', 'academic', 'training'],
                'Construction': ['construction', 'civil', 'architect', 'site', 'engineering'],
                'Government': ['government', 'public', 'ministry', 'municipality', 'federal'],
                'Tourism': ['hotel', 'tourism', 'hospitality', 'travel', 'events']
            }
            
            # Combine text for search
            combined_text = (sql_profile.headline or '') + ' ' + (sql_profile.bio or '')
            for exp in sql_profile.experience:
                combined_text += ' ' + (exp.job_title or '') + ' ' + (exp.company or '') + ' ' + (exp.description or '')
            combined_text = combined_text.lower()
            
            for ind, keywords in industry_keywords.items():
                if any(k in combined_text for k in keywords):
                    industries.add(ind)
            
            # 7. Languages
            languages = set()
            if sql_profile.nationality and sql_profile.nationality.lower() in ['uae', 'emirati']:
                languages.add('Arabic')
            languages.add('English') # Assume English as base
            
            # Scan skills for specific languages
            lang_keywords = ['arabic', 'english', 'french', 'spanish', 'urdu', 'hindi', 'mandarin', 'german']
            for skill in sql_profile.skills:
                s_name = skill.name.lower()
                if s_name in lang_keywords:
                    languages.add(s_name.title())

            return MatchingProfile(
                id=str(sql_profile.user_id),
                skills=skills_list,
                experience_years=int(experience_years),
                education_level=highest_edu,
                location=loc_data,
                salary_expectation=salary_data,
                languages=list(languages),
                industry_experience=list(industries),
                career_level=career_level,
                is_uae_national=(sql_profile.nationality and sql_profile.nationality.lower() in ['uae', 'emirati']),
                preferences={} # Can be expanded if profile has preference fields
            )

        except Exception as e:
            logger.error(f"❌ Failed to adapt profile for matching: {e}")
            return None

    @staticmethod
    def get_assessments(profile_id: int) -> list:
        """
        Get all assessments for a profile.
        """
        profile = CandidateProfile.query.get(profile_id)
        if not profile:
            return []
        return [a.to_dict() for a in profile.assessments]

    @staticmethod
    def sync_assessment_result(user_id: str, result_data: dict) -> dict:
        """
        Syncs an assessment result from the engine to the profile database.
        """
        profile = CandidateProfile.query.filter_by(user_id=str(user_id)).first()
        if not profile:
            return {'error': 'Profile not found'}

        new_assessment = CandidateAssessment(
            profile_id=profile.id,
            assessment_type=result_data.get('assessment_type'),
            title=result_data.get('title'),
            score=result_data.get('score'),
            max_score=result_data.get('max_score'),
            status='completed',
            d33_sector=result_data.get('d33_sector')
        )
        
        db.session.add(new_assessment)
        db.session.commit()
        
        return new_assessment.to_dict()

    @staticmethod
    def _parse_date(date_str):
        """
        Helper to parse varied date formats from CV parser.
        Supports: ISO (YYYY-MM-DD), Year-Only (YYYY), Month-Year (Jan 2022).
        """
        if not date_str: return None
        
        # Clean string
        date_str = str(date_str).strip().replace('Z', '')
        
        # Handle 'Present' or 'Current'
        if date_str.lower() in ['present', 'current', 'now']:
            return None # None means current implies ongoing/no end date
            
        try:
            # 1. Try ISO format (YYYY-MM-DD)
            return datetime.fromisoformat(date_str)
        except:
            pass
            
        try:
            # 2. Try Year Only (YYYY) -> Default to Jan 1st
            import re
            if re.match(r'^\d{4}$', date_str):
                return datetime(int(date_str), 1, 1)
        except:
            pass
            
        try:
            # 3. Try Month Year (Jan 2020, January 2020) -> Default to 1st of month
            # datetime.strptime can handle %b (Jan) or %B (January)
            for fmt in ['%b %Y', '%B %Y', '%m/%Y', '%Y/%m']:
                try:
                    return datetime.strptime(date_str, fmt)
                except:
                    continue
        except:
            pass
            
        return None # Fail silently/gracefully implies empty field rather than 1970
