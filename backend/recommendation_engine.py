"""
Recommendation Engine — Cross-Vertical Intelligence
Takes skill gaps and produces actionable recommendations across ALL platform verticals:
training, mentors, certifications, advisors, jobs, communities.
"""

import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from enum import Enum

logger = logging.getLogger(__name__)


class RecommendationType(str, Enum):
    TRAINING = "training"
    MENTOR = "mentor"
    CERTIFICATION = "certification"
    ADVISORY = "advisory"
    JOB = "job"
    COMMUNITY = "community"
    INTERNSHIP = "internship"
    GIG = "gig"
    PROJECT = "project"


class RecommendationEngine:
    """
    Cross-vertical recommendation engine.
    Consumes skill gaps from SkillGraphEngine and produces ranked recommendations
    across training, mentors, certifications, advisors, jobs, and communities.
    """

    def __init__(self, db_connection=None, skill_graph=None):
        self.db = db_connection
        self.skill_graph = skill_graph
        logger.info("RecommendationEngine initialized")

    # ──────────────────────────────────────────
    # Generate Recommendations
    # ──────────────────────────────────────────

    def generate_recommendations(self, user_id: int, gap_analysis: Dict[str, Any] = None,
                                  max_per_type: int = 5) -> Dict[str, Any]:
        """
        Generate comprehensive recommendations based on skill gaps.
        If no gap_analysis is provided, fetches from SkillGraphEngine.
        """
        if not gap_analysis and self.skill_graph:
            gap_analysis = self.skill_graph.analyze_skill_gaps(user_id)

        gaps = gap_analysis.get('gaps', []) if gap_analysis else []
        recommendations = {
            "user_id": user_id,
            "generated_at": datetime.utcnow().isoformat(),
            "gap_summary": {
                "total_gaps": len(gaps),
                "readiness_score": gap_analysis.get('readiness_score', 0) if gap_analysis else 0,
                "target_role": gap_analysis.get('target_role', 'General') if gap_analysis else 'General'
            },
            "recommendations": [],
            "quick_wins": [],     # Things user can do today
            "long_term": [],      # Strategic career moves
        }

        for gap in gaps:
            skill_name = gap.get('skill_name', '')
            gap_score = gap.get('gap_score', 0)
            priority = gap.get('priority', 0)
            domain = gap.get('domain', '')
            current_level = gap.get('current_level')

            # Generate recommendations for this gap
            recs = []

            # 1. Training recommendations
            training_recs = self._find_training(skill_name, current_level, domain)
            for t in training_recs[:max_per_type]:
                t['gap_skill'] = skill_name
                t['priority'] = priority
                recs.append(t)

            # 2. Mentor recommendations
            mentor_recs = self._find_mentors(skill_name, domain)
            for m in mentor_recs[:max_per_type]:
                m['gap_skill'] = skill_name
                m['priority'] = priority
                recs.append(m)

            # 3. Certification path
            if gap_score >= 0.4:  # Significant gap
                cert_recs = self._find_certifications(skill_name, domain)
                for c in cert_recs[:max_per_type]:
                    c['gap_skill'] = skill_name
                    c['priority'] = priority
                    recs.append(c)

            # 4. Advisory session (for high-priority gaps)
            if priority >= 0.6:
                recs.append({
                    "type": RecommendationType.ADVISORY.value,
                    "title": f"Career Advisory: {skill_name} Development Path",
                    "title_ar": f"استشارة مهنية: مسار تطوير {skill_name}",
                    "description": f"Book a session with a career advisor to plan your {skill_name} growth strategy",
                    "description_ar": f"احجز جلسة مع مستشار مهني لتخطيط استراتيجية تطوير مهارة {skill_name}",
                    "gap_skill": skill_name,
                    "priority": priority,
                    "effort": "1 session",
                    "action_url": "/career-advisory"
                })

            # 5. Job/gig opportunities that build this skill
            if current_level and current_level not in ['novice']:
                job_recs = self._find_skill_building_jobs(skill_name, domain)
                for j in job_recs[:2]:
                    j['gap_skill'] = skill_name
                    j['priority'] = priority * 0.8
                    recs.append(j)

            # 6. Community
            community_rec = self._find_community(skill_name, domain)
            if community_rec:
                community_rec['gap_skill'] = skill_name
                community_rec['priority'] = priority * 0.5
                recs.append(community_rec)

            recommendations['recommendations'].extend(recs)

        # Sort all recommendations by priority
        recommendations['recommendations'].sort(key=lambda r: r.get('priority', 0), reverse=True)

        # Categorize quick wins vs long term
        for rec in recommendations['recommendations']:
            effort = rec.get('effort', '')
            if any(w in effort.lower() for w in ['1 session', '1 week', '1 day', 'immediate']):
                recommendations['quick_wins'].append(rec)
            elif any(w in effort.lower() for w in ['month', 'year', 'ongoing']):
                recommendations['long_term'].append(rec)

        # Store recommendations
        self._store_recommendations(user_id, recommendations)

        return recommendations

    def get_user_recommendations(self, user_id: int, rec_type: str = None,
                                  limit: int = 20) -> List[Dict[str, Any]]:
        """Fetch stored recommendations for a user."""
        if not self.db:
            return []
        try:
            cursor = self.db.cursor()
            query = """
                SELECT * FROM recommendations
                WHERE user_id = %s AND dismissed = FALSE
            """
            params = [user_id]
            if rec_type:
                query += " AND type = %s"
                params.append(rec_type)
            query += " ORDER BY priority DESC, created_at DESC LIMIT %s"
            params.append(limit)
            cursor.execute(query, params)
            rows = cursor.fetchall()
            columns = [d[0] for d in cursor.description]
            return [dict(zip(columns, row)) for row in rows]
        except Exception as e:
            logger.error(f"Error fetching recommendations: {e}")
            return []

    def record_feedback(self, user_id: int, recommendation_id: str,
                        action: str, notes: str = "") -> Dict[str, Any]:
        """Record user feedback on a recommendation (accepted, dismissed, completed)."""
        if not self.db:
            return {"status": "no_db"}
        try:
            cursor = self.db.cursor()
            cursor.execute("""
                INSERT INTO recommendation_feedback (user_id, recommendation_id, action, notes, created_at)
                VALUES (%s, %s, %s, %s, NOW())
            """, (user_id, recommendation_id, action, notes))

            # Mark as dismissed/completed in recommendations table
            if action in ['dismissed', 'completed']:
                cursor.execute("""
                    UPDATE recommendations SET dismissed = TRUE, updated_at = NOW()
                    WHERE id = %s AND user_id = %s
                """, (recommendation_id, user_id))

            self.db.commit()

            # If completed, potentially update skill graph
            if action == 'completed' and self.skill_graph:
                cursor.execute("SELECT type, gap_skill FROM recommendations WHERE id = %s", (recommendation_id,))
                rec = cursor.fetchone()
                if rec and rec[0] == 'training':
                    self.skill_graph.update_skills_from_training(
                        user_id, f"Recommendation {recommendation_id}", [rec[1]]
                    )

            return {"status": "recorded", "action": action}
        except Exception as e:
            logger.error(f"Error recording feedback: {e}")
            self.db.rollback()
            return {"error": str(e)}

    # ──────────────────────────────────────────
    # Internal: Find recommendations by type
    # ──────────────────────────────────────────

    def _find_training(self, skill_name: str, current_level: Optional[str],
                       domain: str) -> List[Dict[str, Any]]:
        """Find training courses that address a skill gap."""
        # Try database first
        if self.db:
            try:
                cursor = self.db.cursor()
                cursor.execute("""
                    SELECT id, title, title_ar, provider, duration, level, url
                    FROM training_programs
                    WHERE (LOWER(title) LIKE %s OR LOWER(skills_covered) LIKE %s)
                      AND active = TRUE
                    ORDER BY relevance_score DESC LIMIT 5
                """, (f"%{skill_name.lower()}%", f"%{skill_name.lower()}%"))
                rows = cursor.fetchall()
                if rows:
                    columns = [d[0] for d in cursor.description]
                    return [{
                        "type": RecommendationType.TRAINING.value,
                        "title": row[1],
                        "title_ar": row[2] or row[1],
                        "description": f"Offered by {row[3]}",
                        "provider": row[3],
                        "effort": row[4] or "2-4 weeks",
                        "level": row[5] or "intermediate",
                        "action_url": row[6] or "/training"
                    } for row in rows]
            except Exception:
                pass

        # Fallback: generate contextual recommendations
        level_label = "beginner" if not current_level or current_level in ['novice'] else "advanced"
        return [{
            "type": RecommendationType.TRAINING.value,
            "title": f"{skill_name} — {level_label.title()} Course",
            "title_ar": f"دورة {skill_name} — {level_label}",
            "description": f"Build your {skill_name} skills from {current_level or 'scratch'} to {level_label}",
            "description_ar": f"طوّر مهاراتك في {skill_name}",
            "effort": "2-4 weeks",
            "level": level_label,
            "action_url": "/training"
        }]

    def _find_mentors(self, skill_name: str, domain: str) -> List[Dict[str, Any]]:
        """Find mentors with expertise in the skill."""
        if self.db:
            try:
                cursor = self.db.cursor()
                cursor.execute("""
                    SELECT u.id, u.first_name, u.last_name, u.email,
                           mp.expertise_areas, mp.years_experience
                    FROM users u
                    JOIN mentor_profiles mp ON u.id = mp.user_id
                    WHERE (LOWER(mp.expertise_areas) LIKE %s OR LOWER(mp.specialization) LIKE %s)
                      AND mp.accepting_mentees = TRUE
                    LIMIT 3
                """, (f"%{skill_name.lower()}%", f"%{domain.lower()}%"))
                rows = cursor.fetchall()
                if rows:
                    return [{
                        "type": RecommendationType.MENTOR.value,
                        "title": f"Mentor: {row[1]} {row[2]}",
                        "title_ar": f"مرشد: {row[1]} {row[2]}",
                        "description": f"{row[4] or domain} expert with {row[5] or '5+'} years experience",
                        "mentor_id": row[0],
                        "effort": "Ongoing",
                        "action_url": "/mentorship"
                    } for row in rows]
            except Exception:
                pass

        return [{
            "type": RecommendationType.MENTOR.value,
            "title": f"Find a {skill_name} Mentor",
            "title_ar": f"ابحث عن مرشد في {skill_name}",
            "description": f"Get matched with an experienced {domain} professional",
            "description_ar": f"تواصل مع محترف ذو خبرة في {domain}",
            "effort": "Ongoing",
            "action_url": "/mentorship"
        }]

    def _find_certifications(self, skill_name: str, domain: str) -> List[Dict[str, Any]]:
        """Find relevant professional certifications."""
        # Well-known cert mappings
        cert_map = {
            "cloud_architecture": [("AWS Solutions Architect", "AWS", "3 months"), ("Azure Solutions Architect", "Microsoft", "3 months")],
            "aws": [("AWS Certified Cloud Practitioner", "AWS", "1 month"), ("AWS Solutions Architect Associate", "AWS", "3 months")],
            "cybersecurity": [("CompTIA Security+", "CompTIA", "2 months"), ("CISSP", "ISC²", "6 months")],
            "project_management": [("PMP", "PMI", "3 months"), ("PRINCE2", "Axelos", "2 months")],
            "data_analysis": [("Google Data Analytics", "Google", "6 weeks"), ("IBM Data Analyst", "IBM", "3 months")],
            "ai_ml": [("Google AI/ML Professional", "Google", "4 months"), ("AWS Machine Learning Specialty", "AWS", "3 months")],
            "financial_analysis": [("CFA Level 1", "CFA Institute", "6 months"), ("FRM", "GARP", "4 months")],
            "hr_management": [("SHRM-CP", "SHRM", "3 months"), ("PHR", "HRCI", "3 months")],
            "digital_marketing": [("Google Digital Marketing", "Google", "6 weeks"), ("HubSpot Marketing", "HubSpot", "4 weeks")],
        }

        skill_id = skill_name.lower().replace(' ', '_').replace('/', '_')
        certs = cert_map.get(skill_id, [])

        if not certs:
            return [{
                "type": RecommendationType.CERTIFICATION.value,
                "title": f"{skill_name} Professional Certification",
                "title_ar": f"شهادة احترافية في {skill_name}",
                "description": f"Earn a recognized certification in {skill_name}",
                "effort": "2-4 months",
                "action_url": "/professional-certifications"
            }]

        return [{
            "type": RecommendationType.CERTIFICATION.value,
            "title": cert[0],
            "title_ar": cert[0],
            "description": f"Issued by {cert[1]}",
            "provider": cert[1],
            "effort": cert[2],
            "action_url": "/professional-certifications"
        } for cert in certs]

    def _find_skill_building_jobs(self, skill_name: str, domain: str) -> List[Dict[str, Any]]:
        """Find jobs or gigs that would build the skill."""
        return [{
            "type": RecommendationType.JOB.value,
            "title": f"Junior {skill_name} roles",
            "title_ar": f"وظائف مبتدئة في {skill_name}",
            "description": f"Gain practical {skill_name} experience through employment",
            "effort": "Ongoing",
            "action_url": "/job-matching"
        }]

    def _find_community(self, skill_name: str, domain: str) -> Optional[Dict[str, Any]]:
        """Find a relevant professional community."""
        return {
            "type": RecommendationType.COMMUNITY.value,
            "title": f"{domain} Professionals Community",
            "title_ar": f"مجتمع محترفي {domain}",
            "description": f"Join peers and experts in {domain}",
            "effort": "Immediate",
            "action_url": "/communities"
        }

    def _store_recommendations(self, user_id: int, recommendations: Dict[str, Any]):
        """Store generated recommendations in the database."""
        if not self.db:
            return
        try:
            cursor = self.db.cursor()
            for rec in recommendations.get('recommendations', [])[:50]:  # Cap at 50
                cursor.execute("""
                    INSERT INTO recommendations (user_id, type, title, title_ar,
                        description, gap_skill, priority, effort, action_url, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
                """, (
                    user_id, rec.get('type'), rec.get('title'), rec.get('title_ar', ''),
                    rec.get('description', ''), rec.get('gap_skill', ''),
                    rec.get('priority', 0), rec.get('effort', ''),
                    rec.get('action_url', '')
                ))
            self.db.commit()
        except Exception as e:
            logger.error(f"Error storing recommendations: {e}")
            self.db.rollback()
