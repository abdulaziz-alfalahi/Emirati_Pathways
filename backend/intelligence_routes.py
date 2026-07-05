"""
Intelligence Routes — API Endpoints for the Platform Intelligence Backbone.
Exposes Skill Graph, Recommendation Engine, and Career Lifecycle Navigator.
"""

from flask import Blueprint, request, jsonify
import logging
from functools import wraps

logger = logging.getLogger(__name__)

intelligence_bp = Blueprint('intelligence', __name__, url_prefix='/api/intelligence')


def get_db():
    """Get database connection from Flask app context (per-request, same as app.py)."""
    from flask import g
    if 'intelligence_db' not in g.__dict__:
        try:
            import psycopg2
            import os
            db_config = {
                'host': os.getenv('DB_HOST', '127.0.0.1'),
                'port': os.getenv('DB_PORT', '5432'),
                'dbname': os.getenv('DB_NAME', 'emirati_journey'),
                'user': os.getenv('DB_USER', 'emirati_user'),
                'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
            }
            g.intelligence_db = psycopg2.connect(**db_config)
        except Exception as e:
            logger.error(f"Intelligence DB connection failed: {e}")
            g.intelligence_db = None
    return g.intelligence_db


def get_user_id_from_token():
    """Extract user ID from JWT token."""
    try:
        from flask import g
        return getattr(g, 'user_id', None)
    except:
        return None


def require_auth(f):
    """Simple auth decorator — reuses existing auth middleware."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({"error": "Authentication required"}), 401
        try:
            from auth.auth_manager import AuthManager
            auth = AuthManager()
            user_data = auth.verify_token(token)
            if not user_data:
                return jsonify({"error": "Invalid token"}), 401
            from flask import g
            g.user_id = user_data.get('user_id') or user_data.get('id')
            g.user_role = user_data.get('role', 'candidate')
        except Exception as e:
            logger.warning(f"Auth error: {e}")
            # Fallback: try to extract user_id from token payload
            try:
                import jwt
                payload = jwt.decode(token, options={"verify_signature": False})
                from flask import g
                g.user_id = payload.get('user_id') or payload.get('sub')
                g.user_role = payload.get('role', 'candidate')
            except:
                return jsonify({"error": "Authentication required"}), 401
        return f(*args, **kwargs)
    return decorated


def _get_engines():
    """Lazy-initialize intelligence engines."""
    db = get_db()
    from skill_graph_engine import SkillGraphEngine
    from recommendation_engine import RecommendationEngine
    from career_lifecycle_engine import CareerLifecycleEngine

    skill_graph = SkillGraphEngine(db_connection=db)
    recommendation = RecommendationEngine(db_connection=db, skill_graph=skill_graph)
    lifecycle = CareerLifecycleEngine(db_connection=db)
    return skill_graph, recommendation, lifecycle


@intelligence_bp.teardown_app_request
def close_intelligence_db(exception=None):
    """Close the intelligence DB connection at end of request."""
    from flask import g
    db = g.__dict__.pop('intelligence_db', None)
    if db is not None:
        try:
            if exception:
                db.rollback()
            db.close()
        except Exception:
            pass


# ═══════════════════════════════════════════
# SKILL GRAPH ENDPOINTS
# ═══════════════════════════════════════════

@intelligence_bp.route('/taxonomy', methods=['GET'])
def get_skill_taxonomy():
    """Get the full skill taxonomy."""
    try:
        skill_graph, _, _ = _get_engines()
        domain = request.args.get('domain')
        taxonomy = skill_graph.get_taxonomy()
        if domain:
            taxonomy = [s for s in taxonomy if s.get('domain', '').lower() == domain.lower()]
        return jsonify({"skills": taxonomy, "total": len(taxonomy)})
    except Exception as e:
        logger.error(f"Error fetching taxonomy: {e}")
        return jsonify({"error": str(e)}), 500


@intelligence_bp.route('/taxonomy/seed', methods=['POST'])
@require_auth
def seed_taxonomy():
    """Seed the skill taxonomy (admin only)."""
    try:
        skill_graph, _, _ = _get_engines()
        count = skill_graph.seed_taxonomy()
        return jsonify({"status": "seeded", "skills_inserted": count})
    except Exception as e:
        logger.error(f"Error seeding taxonomy: {e}")
        return jsonify({"error": str(e)}), 500


@intelligence_bp.route('/skills', methods=['GET'])
@require_auth
def get_user_skills():
    """Get the current user's skill profile."""
    try:
        from flask import g
        user_id = g.user_id
        skill_graph, _, _ = _get_engines()
        skills = skill_graph.get_user_skills(user_id)
        return jsonify({"user_id": user_id, "skills": skills, "total": len(skills)})
    except Exception as e:
        logger.error(f"Error fetching user skills: {e}")
        return jsonify({"error": str(e)}), 500


@intelligence_bp.route('/skills', methods=['POST'])
@require_auth
def add_skill():
    """Add or update a skill for the current user."""
    try:
        from flask import g
        user_id = g.user_id
        data = request.get_json()
        skill_graph, _, _ = _get_engines()
        result = skill_graph.add_user_skill(
            user_id=user_id,
            skill_id=data.get('skill_id', ''),
            skill_name=data.get('skill_name', ''),
            proficiency=data.get('proficiency', 'intermediate'),
            source=data.get('source', 'self_reported'),
            evidence=data.get('evidence', ''),
            verified=data.get('verified', False)
        )
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error adding skill: {e}")
        return jsonify({"error": str(e)}), 500


@intelligence_bp.route('/skills/ingest-cv', methods=['POST'])
@require_auth
def ingest_cv_skills():
    """Ingest skills from a parsed CV."""
    try:
        from flask import g
        user_id = g.user_id
        data = request.get_json()
        skill_graph, _, _ = _get_engines()
        results = skill_graph.ingest_skills_from_cv(user_id, data)
        return jsonify({"ingested": len(results), "skills": results})
    except Exception as e:
        logger.error(f"Error ingesting CV skills: {e}")
        return jsonify({"error": str(e)}), 500


@intelligence_bp.route('/skills/update-from-training', methods=['POST'])
@require_auth
def update_from_training():
    """Update skills after completing training."""
    try:
        from flask import g
        user_id = g.user_id
        data = request.get_json()
        skill_graph, _, _ = _get_engines()
        results = skill_graph.update_skills_from_training(
            user_id=user_id,
            course_name=data.get('course_name', ''),
            skills_learned=data.get('skills', []),
            proficiency=data.get('proficiency', 'intermediate')
        )
        return jsonify({"updated": len(results), "skills": results})
    except Exception as e:
        logger.error(f"Error updating from training: {e}")
        return jsonify({"error": str(e)}), 500


@intelligence_bp.route('/skills/update-from-certification', methods=['POST'])
@require_auth
def update_from_certification():
    """Update skills after earning a certification."""
    try:
        from flask import g
        user_id = g.user_id
        data = request.get_json()
        skill_graph, _, _ = _get_engines()
        results = skill_graph.update_skills_from_certification(
            user_id=user_id,
            cert_name=data.get('cert_name', ''),
            skills=data.get('skills', []),
            proficiency=data.get('proficiency', 'advanced')
        )
        return jsonify({"updated": len(results), "skills": results})
    except Exception as e:
        logger.error(f"Error updating from certification: {e}")
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════
# GAP ANALYSIS ENDPOINTS
# ═══════════════════════════════════════════

@intelligence_bp.route('/skill-gap-analysis', methods=['POST'])
@require_auth
def analyze_gaps():
    """Analyze skill gaps for the current user against a target role."""
    try:
        from flask import g
        user_id = g.user_id
        data = request.get_json() or {}
        skill_graph, _, _ = _get_engines()
        result = skill_graph.analyze_skill_gaps(
            user_id=user_id,
            target_role_id=data.get('target_role_id'),
            target_skills=data.get('target_skills')
        )
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error analyzing gaps: {e}")
        return jsonify({"error": str(e)}), 500


@intelligence_bp.route('/market-demand', methods=['GET'])
def get_market_demand():
    """Get market demand for skills."""
    try:
        skill_graph, _, _ = _get_engines()
        domain = request.args.get('domain')
        limit = int(request.args.get('limit', 20))
        result = skill_graph.get_market_demand(domain=domain, limit=limit)
        return jsonify({"skills": result, "total": len(result)})
    except Exception as e:
        logger.error(f"Error fetching demand: {e}")
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════
# RECOMMENDATION ENDPOINTS
# ═══════════════════════════════════════════

@intelligence_bp.route('/recommendations', methods=['GET'])
@require_auth
def get_recommendations():
    """Get personalized recommendations for the current user."""
    try:
        from flask import g
        user_id = g.user_id
        rec_type = request.args.get('type')
        limit = int(request.args.get('limit', 20))
        _, recommendation, _ = _get_engines()
        results = recommendation.get_user_recommendations(user_id, rec_type=rec_type, limit=limit)
        return jsonify({"user_id": user_id, "recommendations": results})
    except Exception as e:
        logger.error(f"Error fetching recommendations: {e}")
        return jsonify({"error": str(e)}), 500


@intelligence_bp.route('/recommendations/generate', methods=['POST'])
@require_auth
def generate_recommendations():
    """Generate fresh recommendations based on current skill gaps."""
    try:
        from flask import g
        user_id = g.user_id
        data = request.get_json() or {}
        _, recommendation, _ = _get_engines()
        results = recommendation.generate_recommendations(
            user_id=user_id,
            gap_analysis=data.get('gap_analysis'),
            max_per_type=int(data.get('max_per_type', 5))
        )
        return jsonify(results)
    except Exception as e:
        logger.error(f"Error generating recommendations: {e}")
        return jsonify({"error": str(e)}), 500


@intelligence_bp.route('/recommendations/<recommendation_id>/feedback', methods=['POST'])
@require_auth
def recommendation_feedback(recommendation_id):
    """Record user feedback on a recommendation."""
    try:
        from flask import g
        user_id = g.user_id
        data = request.get_json()
        _, recommendation, _ = _get_engines()
        result = recommendation.record_feedback(
            user_id=user_id,
            recommendation_id=recommendation_id,
            action=data.get('action', 'viewed'),
            notes=data.get('notes', '')
        )
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error recording feedback: {e}")
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════
# CAREER LIFECYCLE ENDPOINTS
# ═══════════════════════════════════════════

@intelligence_bp.route('/career-stage', methods=['GET'])
@require_auth
def get_career_stage():
    """Get the current user's career lifecycle stage."""
    try:
        from flask import g
        user_id = g.user_id
        _, _, lifecycle = _get_engines()
        result = lifecycle.get_user_stage(user_id)
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error getting career stage: {e}")
        return jsonify({"error": str(e)}), 500


@intelligence_bp.route('/career-stage/initialize', methods=['POST'])
@require_auth
def initialize_career_stage():
    """Initialize career stage for a new user."""
    try:
        from flask import g
        user_id = g.user_id
        data = request.get_json() or {}
        _, _, lifecycle = _get_engines()
        result = lifecycle.initialize_user_stage(user_id, role=data.get('role', g.user_role))
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error initializing stage: {e}")
        return jsonify({"error": str(e)}), 500


@intelligence_bp.route('/career-stage/milestone', methods=['POST'])
@require_auth
def complete_milestone():
    """Complete a lifecycle milestone."""
    try:
        from flask import g
        user_id = g.user_id
        data = request.get_json()
        _, _, lifecycle = _get_engines()
        result = lifecycle.complete_milestone(user_id, milestone_id=data.get('milestone_id'))
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error completing milestone: {e}")
        return jsonify({"error": str(e)}), 500


@intelligence_bp.route('/career-stage/advance', methods=['POST'])
@require_auth
def advance_career_stage():
    """Manually advance career stage."""
    try:
        from flask import g
        user_id = g.user_id
        data = request.get_json()
        _, _, lifecycle = _get_engines()
        result = lifecycle.advance_stage(user_id, new_stage=data.get('stage'))
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error advancing stage: {e}")
        return jsonify({"error": str(e)}), 500


@intelligence_bp.route('/career-stage/recommendations', methods=['GET'])
@require_auth
def get_stage_recommendations():
    """Get stage-appropriate action recommendations."""
    try:
        from flask import g
        user_id = g.user_id
        _, _, lifecycle = _get_engines()
        results = lifecycle.get_stage_recommendations(user_id)
        return jsonify({"user_id": user_id, "recommendations": results})
    except Exception as e:
        logger.error(f"Error getting stage recommendations: {e}")
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════
# UNIFIED PROFILE SNAPSHOT (Dashboard One-Call)
# ═══════════════════════════════════════════

@intelligence_bp.route('/profile-snapshot', methods=['GET'])
@require_auth
def profile_snapshot():
    """
    Single endpoint for candidate dashboard overview.
    Aggregates:
      - User skill summary (top skills, total count, sources)
      - Skill gap analysis (top 5 gaps, readiness score)
      - Top recommendations (quick wins + top priority)
      - Career lifecycle stage
      - AI Career Insight text
    """
    try:
        from flask import g
        user_id = g.user_id
        db = get_db()
        skill_graph, recommendation, lifecycle = _get_engines()

        # 1. User skills summary
        all_skills = skill_graph.get_user_skills(user_id)

        # Auto-sync legacy user_skills from candidate_skills if empty
        if not all_skills and db:
            try:
                cur = db.cursor()
                cur.execute("SELECT name, category, level FROM candidate_skills WHERE user_id = %s", (str(user_id),))
                c_skills = cur.fetchall()
                if c_skills:
                    for name, category, level in c_skills:
                        skill_id = name.lower().replace(' ', '_').replace('-', '_')
                        proficiency = 'intermediate'
                        if level:
                            l_lower = level.lower()
                            if 'expert' in l_lower: proficiency = 'expert'
                            elif 'advanced' in l_lower: proficiency = 'advanced'
                            elif 'intermediate' in l_lower: proficiency = 'intermediate'
                            elif 'beginner' in l_lower: proficiency = 'beginner'
                            elif 'novice' in l_lower: proficiency = 'novice'
                        skill_graph.add_user_skill(
                            user_id=user_id,
                            skill_id=skill_id,
                            skill_name=name,
                            proficiency=proficiency,
                            source='self_reported'
                        )
                    # Re-fetch after sync
                    all_skills = skill_graph.get_user_skills(user_id)
            except Exception as e:
                logger.warning(f"Error auto-syncing user skills: {e}")
                if db:
                    try: db.rollback()
                    except: pass

        top_skills = sorted(all_skills, key=lambda s: s.get('demand_score', 0), reverse=True)[:8]
        skill_sources = {}
        for s in all_skills:
            src = s.get('source', 'self_reported')
            skill_sources[src] = skill_sources.get(src, 0) + 1

        # 2. Skill gap analysis (against market demand if no target role)
        try:
            gap_result = skill_graph.analyze_skill_gaps(user_id)
        except Exception:
            if db:
                try: db.rollback()
                except: pass
            gap_result = {"gaps": [], "readiness_score": 0, "target_role": "Market Demand", "total_required": 0, "skills_met": 0, "gaps_found": 0}
        top_gaps = gap_result.get('gaps', [])[:5]

        # 3. Generate recommendations
        try:
            rec_result = recommendation.generate_recommendations(
                user_id=user_id,
                gap_analysis=gap_result,
                max_per_type=3
            )
        except Exception:
            if db:
                try: db.rollback()
                except: pass
            rec_result = {"recommendations": [], "quick_wins": [], "long_term": []}

        # 4. Career stage
        try:
            stage_result = lifecycle.get_user_stage(user_id)
        except Exception:
            if db:
                try: db.rollback()
                except: pass
            stage_result = {"current_stage": "exploration", "progress_pct": 0}

        # 5. AI Career Insight — generate a personalized text
        insight = _generate_career_insight(top_gaps, top_skills, gap_result.get('readiness_score', 0))

        response = {
            "user_id": user_id,
            "skills": {
                "total": len(all_skills),
                "top_skills": top_skills,
                "sources": skill_sources,
                "verified_count": sum(1 for s in all_skills if s.get('verified')),
            },
            "gap_analysis": {
                "readiness_score": gap_result.get('readiness_score', 0),
                "target_role": gap_result.get('target_role', 'Market Demand'),
                "total_required": gap_result.get('total_required', 0),
                "skills_met": gap_result.get('skills_met', 0),
                "gaps_found": gap_result.get('gaps_found', 0),
                "top_gaps": top_gaps,
            },
            "recommendations": {
                "total": len(rec_result.get('recommendations', [])),
                "quick_wins": rec_result.get('quick_wins', [])[:3],
                "top_priority": rec_result.get('recommendations', [])[:5],
                "by_type": _group_recs_by_type(rec_result.get('recommendations', [])),
            },
            "career_stage": stage_result,
            "ai_insight": insight,
        }

        return jsonify(response)

    except Exception as e:
        logger.error(f"Error building profile snapshot: {e}")
        return jsonify({"error": str(e)}), 500


@intelligence_bp.route('/recommended-jobs', methods=['GET'])
@require_auth
def recommended_jobs():
    """
    Return personalized job recommendations based on user's skill profile.
    Queries actual job_postings and scores them against user skills.
    Falls back to curated recommendations if no job data available.
    """
    try:
        from flask import g
        user_id = g.user_id
        db = get_db()
        skill_graph, _, _ = _get_engines()

        # Get user skills
        user_skills = skill_graph.get_user_skills(user_id)

        # Auto-sync legacy user_skills from candidate_skills if empty
        if not user_skills and db:
            try:
                cur = db.cursor()
                cur.execute("SELECT name, category, level FROM candidate_skills WHERE user_id = %s", (str(user_id),))
                c_skills = cur.fetchall()
                if c_skills:
                    for name, category, level in c_skills:
                        skill_id = name.lower().replace(' ', '_').replace('-', '_')
                        proficiency = 'intermediate'
                        if level:
                            l_lower = level.lower()
                            if 'expert' in l_lower: proficiency = 'expert'
                            elif 'advanced' in l_lower: proficiency = 'advanced'
                            elif 'intermediate' in l_lower: proficiency = 'intermediate'
                            elif 'beginner' in l_lower: proficiency = 'beginner'
                            elif 'novice' in l_lower: proficiency = 'novice'
                        skill_graph.add_user_skill(
                            user_id=user_id,
                            skill_id=skill_id,
                            skill_name=name,
                            proficiency=proficiency,
                            source='self_reported'
                        )
                    # Re-fetch after sync
                    user_skills = skill_graph.get_user_skills(user_id)
            except Exception as e:
                logger.warning(f"Error auto-syncing user skills in recommended-jobs: {e}")

        user_skill_names = set(s.get('skill_name', '').lower() for s in user_skills)

        matched_jobs = []

        if db:
            try:
                # Fetch applied job IDs
                applied_job_ids = set()
                if user_id:
                    cur = db.cursor()
                    cur.execute("""
                        SELECT job_id, status 
                        FROM job_applications 
                        WHERE candidate_id = %s
                    """, (str(user_id),))
                    for row in cur.fetchall():
                        if row[1] not in ['withdrawn', 'rejected']:
                            applied_job_ids.add(str(row[0]))

                cur = db.cursor()
                cur.execute("""
                    SELECT id, title, company_id, location, description, requirements, status, salary_range, employment_type
                    FROM job_postings 
                    WHERE status IN ('published', 'active', 'open', 'Active', 'Open', 'Published')
                    ORDER BY created_at DESC
                    LIMIT 50
                """)
                columns = [d[0] for d in cur.description]
                rows = [dict(zip(columns, r)) for r in cur.fetchall()]

                # Use EnhancedMatchingEngine for consistent scoring if candidate profile exists
                matches_dict = {}
                try:
                    from backend.services.profile_v2_service import ProfileV2Service
                    from backend.services.enhanced_matching_service import enhanced_matching_engine, JobRequirements
                    
                    candidate_profile = ProfileV2Service.get_matching_profile_data(user_id)
                    if candidate_profile:
                        job_requirements_list = []
                        for job in rows:
                            req_list = job.get('requirements') or []
                            req_skills = []
                            if isinstance(req_list, list):
                                req_skills = [str(r) for r in req_list]
                            elif isinstance(req_list, str):
                                req_skills = [r.strip() for r in req_list.split(',')]
                                
                            # Parse salary
                            sal_range = None
                            sal_str = job.get('salary_range') or ''
                            if sal_str and '-' in str(sal_str):
                                try:
                                    parts = str(sal_str).replace('AED', '').replace(',', '').split('-')
                                    sal_range = {'min_salary': int(parts[0]), 'max_salary': int(parts[1])}
                                except:
                                    pass
                            
                            # Parse experience requirement
                            min_exp_parsed = 0
                            for r in req_skills:
                                 import re
                                 m = re.search(r'(\d+)(\+|\s*-\s*\d+)?\s*years?', str(r).lower())
                                 if m:
                                     try:
                                         val = int(m.group(1))
                                         if val > min_exp_parsed and val < 30:
                                             min_exp_parsed = val
                                     except: pass
                            
                            title_lower = job['title'].lower()
                            if min_exp_parsed == 0:
                                 if 'senior' in title_lower or 'lead' in title_lower or 'manager' in title_lower or 'head' in title_lower:
                                     min_exp_parsed = 5
                                 elif 'executive' in title_lower or 'chief' in title_lower or 'director' in title_lower:
                                     min_exp_parsed = 10
                            
                            # Create JobRequirements object
                            job_req = JobRequirements(
                                id=str(job['id']),
                                required_skills=req_skills,
                                preferred_skills=[], 
                                min_experience=min_exp_parsed,
                                max_experience=min_exp_parsed + 15 if min_exp_parsed > 0 else None,
                                education_requirements=[],
                                location={'emirate': job.get('location', '')},
                                salary_range=sal_range,
                                languages=['English'],
                                industry='',
                                company_size='',
                                career_level='Mid_Level',
                                emiratization_priority=False,
                                visa_sponsorship=True
                            )
                            job_requirements_list.append(job_req)
                        
                        if job_requirements_list:
                            matches = enhanced_matching_engine.find_best_matches(candidate_profile, job_requirements_list, limit=50)
                            matches_dict = {job_req.id: score_obj.overall_score for job_req, score_obj in matches}
                except Exception as match_eng_err:
                    logger.warning(f"Could not compute consistent match scores via EnhancedMatchingEngine: {match_eng_err}")

                for job in rows:
                    job_id = str(job.get('id'))
                    
                    req_list = job.get('requirements') or []
                    req_strings = []
                    if isinstance(req_list, list):
                        for r in req_list:
                            if isinstance(r, dict):
                                req_strings.append(r.get('description', ''))
                            elif isinstance(r, str):
                                req_strings.append(r)
                    elif isinstance(req_list, str):
                        req_strings.append(req_list)
                    req_text = ' '.join(req_strings).lower() + ' ' + (job.get('description') or '').lower()

                    skill_hits = sum(1 for sk in user_skill_names if sk and sk in req_text)
                    
                    if job_id in matches_dict:
                        match_score = int(matches_dict[job_id])
                    else:
                        match_score = min(98, max(60, int(60 + (skill_hits / max(len(user_skill_names), 1)) * 38)))

                    if skill_hits > 0 or len(user_skill_names) == 0 or job_id in matches_dict:
                        company = job.get('company_id') or 'UAE Employer'
                        if company.lower() in ('unknown', 'null', ''):
                            company = 'UAE Employer'
                        matched_jobs.append({
                            "id": job.get('id'),
                            "title": job.get('title', 'Untitled'),
                            "company": company,
                            "location": job.get('location', 'UAE'),
                            "salary": job.get('salary_range') or 'Competitive',
                            "match_score": match_score,
                            "type": job.get('employment_type') or 'Full-time',
                            "skill_overlap": skill_hits,
                            "source": "live",
                            "hasApplied": job_id in applied_job_ids
                        })

                matched_jobs.sort(key=lambda j: j['match_score'], reverse=True)
                matched_jobs = matched_jobs[:6]
            except Exception as e:
                logger.warning(f"Job query error: {e}")

        # Fallback to curated recommendations if no live data
        if len(matched_jobs) == 0:
            matched_jobs = _get_fallback_recommendations(user_skill_names)

        return jsonify({"user_id": user_id, "jobs": matched_jobs, "total": len(matched_jobs), "source": "live" if any(j.get('source') == 'live' for j in matched_jobs) else "curated"})

    except Exception as e:
        logger.error(f"Error getting recommended jobs: {e}")
        return jsonify({"error": str(e)}), 500


def _generate_career_insight(top_gaps, top_skills, readiness_score):
    """Generate a personalized AI career insight message."""
    if top_gaps:
        gap = top_gaps[0]
        skill_name = gap.get('skill_name', 'in-demand skills')
        gap_score = gap.get('gap_score', 0)
        return {
            "en": f"{skill_name} is in high demand in the UAE market — developing this skill could unlock {int(gap_score * 30 + 20)}% more top-tier roles matching your profile.",
            "ar": f"مهارة {skill_name} مطلوبة بشدة في سوق الإمارات — تطوير هذه المهارة يمكن أن يفتح لك {int(gap_score * 30 + 20)}٪ من الوظائف المتميزة الإضافية.",
        }
    elif top_skills:
        skill_name = top_skills[0].get('skill_name', 'your skills')
        return {
            "en": f"Your profile is strong in {skill_name}. Keep building your portfolio and you'll match with even more top-tier opportunities.",
            "ar": f"ملفك المهني قوي في {skill_name}. استمر في بناء محفظتك وستتطابق مع فرص أفضل.",
        }
    else:
        return {
            "en": "Upload your CV and complete your profile to get AI-powered job matches and personalized career recommendations.",
            "ar": "ارفع سيرتك الذاتية وأكمل ملفك للحصول على مطابقات وظيفية ذكية وتوصيات مهنية مخصصة.",
        }


def _group_recs_by_type(recommendations):
    """Group recommendations by type for the dashboard."""
    grouped = {}
    for rec in recommendations:
        rec_type = rec.get('type', 'other')
        if rec_type not in grouped:
            grouped[rec_type] = []
        grouped[rec_type].append(rec)
    return grouped


def _get_fallback_recommendations(user_skill_names):
    """Return curated job recommendations when no live data available."""
    jobs = [
        {"title": "Senior Project Manager", "title_ar": "مدير مشاريع أول", "company": "Emirates Group", "company_ar": "مجموعة الإمارات", "location": "Dubai", "salary": "AED 35k–45k", "match_score": 94, "type": "Full-time"},
        {"title": "Cloud Infrastructure Architect", "title_ar": "مهندس بنية سحابية", "company": "Digital Dubai", "company_ar": "دبي الرقمية", "location": "Dubai", "salary": "AED 40k–55k", "match_score": 89, "type": "Hybrid"},
        {"title": "Data Scientist", "title_ar": "عالم بيانات", "company": "Abu Dhabi Investment Authority", "company_ar": "جهاز أبوظبي للاستثمار", "location": "Abu Dhabi", "salary": "AED 30k–45k", "match_score": 86, "type": "Full-time"},
        {"title": "Cybersecurity Analyst", "title_ar": "محلل أمن سيبراني", "company": "ADNOC", "company_ar": "أدنوك", "location": "Abu Dhabi", "salary": "AED 28k–38k", "match_score": 82, "type": "Full-time"},
        {"title": "AI/ML Engineer", "title_ar": "مهندس ذكاء اصطناعي", "company": "G42", "company_ar": "جي 42", "location": "Abu Dhabi", "salary": "AED 35k–50k", "match_score": 78, "type": "Full-time"},
    ]
    # Slightly personalize match scores based on user skills
    for j in jobs:
        title_lower = j['title'].lower()
        if any(sk in title_lower for sk in user_skill_names):
            j['match_score'] = min(98, j['match_score'] + 5)
        j['source'] = 'curated'
    return jobs[:5]
