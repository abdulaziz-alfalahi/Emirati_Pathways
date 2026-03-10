"""
Skill Graph Engine — Central Intelligence Backbone
Provides skill taxonomy, user skill profiles, gap analysis, and market demand signals.
This is the "nervous system" of the platform — all verticals feed into and read from the skill graph.
"""

import logging
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field, asdict
from enum import Enum

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────
# Enums & Data Classes
# ──────────────────────────────────────────────

class ProficiencyLevel(str, Enum):
    NOVICE = "novice"           # 1 — Awareness only
    BEGINNER = "beginner"       # 2 — Can follow instructions
    INTERMEDIATE = "intermediate"  # 3 — Can work independently
    ADVANCED = "advanced"       # 4 — Can mentor others
    EXPERT = "expert"           # 5 — Industry-recognized authority

    @property
    def numeric(self) -> int:
        return {"novice": 1, "beginner": 2, "intermediate": 3, "advanced": 4, "expert": 5}[self.value]


class SkillSource(str, Enum):
    CV_PARSED = "cv_parsed"
    ASSESSMENT = "assessment"
    TRAINING_COMPLETED = "training_completed"
    CERTIFICATION = "certification"
    JOB_EXPERIENCE = "job_experience"
    SELF_REPORTED = "self_reported"
    MENTOR_VALIDATED = "mentor_validated"
    NATIONAL_SERVICE = "national_service"


class DemandLevel(str, Enum):
    CRITICAL = "critical"       # Severe shortage
    HIGH = "high"               # Strong demand
    MODERATE = "moderate"       # Balanced supply/demand
    LOW = "low"                 # Surplus
    EMERGING = "emerging"       # New skill, growing fast


@dataclass
class SkillNode:
    """A single skill in the taxonomy tree."""
    skill_id: str
    name: str
    name_ar: str
    domain: str           # e.g. "Technology", "Finance", "Healthcare"
    category: str         # e.g. "Cloud Computing", "Data Science"
    description: str = ""
    description_ar: str = ""
    parent_skill_id: Optional[str] = None
    related_skills: List[str] = field(default_factory=list)
    demand_level: DemandLevel = DemandLevel.MODERATE
    demand_score: float = 0.5   # 0–1, computed from job postings


@dataclass
class UserSkill:
    """A single skill held by a user."""
    user_id: int
    skill_id: str
    skill_name: str
    proficiency: ProficiencyLevel
    source: SkillSource
    verified: bool = False
    evidence: str = ""              # e.g. "AWS Solutions Architect cert"
    last_assessed: Optional[datetime] = None
    created_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class SkillGap:
    """A gap between a user's current skill and a target role requirement."""
    skill_id: str
    skill_name: str
    current_level: Optional[ProficiencyLevel]   # None = skill not held
    required_level: ProficiencyLevel
    gap_score: float            # 0–1, higher = bigger gap
    priority: float             # 0–1, weighted by market demand
    domain: str
    bridging_actions: List[Dict[str, Any]] = field(default_factory=list)


@dataclass
class RoleRequirement:
    """Skills required for a specific job role."""
    role_id: str
    role_title: str
    role_title_ar: str
    skills: List[Dict[str, Any]]  # [{skill_id, skill_name, required_level}]
    industry: str
    experience_years: int = 0
    emiratization_priority: bool = False


# ──────────────────────────────────────────────
# Skill Graph Engine
# ──────────────────────────────────────────────

class SkillGraphEngine:
    """
    Central skill intelligence engine.
    - Manages the skill taxonomy (500+ UAE-relevant skills)
    - Tracks per-user skill profiles
    - Performs gap analysis against target roles
    - Provides market demand signals
    """

    def __init__(self, db_connection=None):
        self.db = db_connection
        self._taxonomy_cache: Dict[str, SkillNode] = {}
        logger.info("SkillGraphEngine initialized")

    # ──────────────────────────────────────────
    # Taxonomy Management
    # ──────────────────────────────────────────

    def get_taxonomy(self) -> List[Dict[str, Any]]:
        """Return the full skill taxonomy grouped by domain → category."""
        if not self.db:
            return self._get_seed_taxonomy()
        try:
            cursor = self.db.cursor()
            cursor.execute("""
                SELECT skill_id, name, name_ar, domain, category, description,
                       parent_skill_id, demand_level, demand_score
                FROM skill_taxonomy ORDER BY domain, category, name
            """)
            rows = cursor.fetchall()
            columns = [d[0] for d in cursor.description]
            return [dict(zip(columns, row)) for row in rows]
        except Exception as e:
            logger.error(f"Error fetching taxonomy: {e}")
            return self._get_seed_taxonomy()

    def seed_taxonomy(self) -> int:
        """Seed the database with the initial UAE skill taxonomy. Returns count of skills inserted."""
        taxonomy = self._get_seed_taxonomy()
        if not self.db:
            return len(taxonomy)
        try:
            cursor = self.db.cursor()
            inserted = 0
            for skill in taxonomy:
                cursor.execute("""
                    INSERT INTO skill_taxonomy (skill_id, name, name_ar, domain, category,
                        description, description_ar, parent_skill_id, demand_level, demand_score)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (skill_id) DO NOTHING
                """, (
                    skill['skill_id'], skill['name'], skill['name_ar'],
                    skill['domain'], skill['category'],
                    skill.get('description', ''), skill.get('description_ar', ''),
                    skill.get('parent_skill_id'), skill.get('demand_level', 'moderate'),
                    skill.get('demand_score', 0.5)
                ))
                inserted += cursor.rowcount
            self.db.commit()
            logger.info(f"Seeded {inserted} skills into taxonomy")
            return inserted
        except Exception as e:
            logger.error(f"Error seeding taxonomy: {e}")
            self.db.rollback()
            return 0

    # ──────────────────────────────────────────
    # User Skill Profile
    # ──────────────────────────────────────────

    def get_user_skills(self, user_id: int) -> List[Dict[str, Any]]:
        """Get all skills for a user."""
        if not self.db:
            return []
        try:
            cursor = self.db.cursor()
            cursor.execute("""
                SELECT us.*, st.domain, st.category, st.demand_level, st.demand_score
                FROM user_skills us
                LEFT JOIN skill_taxonomy st ON us.skill_id = st.skill_id
                WHERE us.user_id = %s
                ORDER BY us.proficiency DESC, st.demand_score DESC
            """, (user_id,))
            rows = cursor.fetchall()
            columns = [d[0] for d in cursor.description]
            return [dict(zip(columns, row)) for row in rows]
        except Exception as e:
            logger.error(f"Error fetching user skills: {e}")
            return []

    def add_user_skill(self, user_id: int, skill_id: str, skill_name: str,
                       proficiency: str, source: str, evidence: str = "",
                       verified: bool = False) -> Dict[str, Any]:
        """Add or update a skill for a user."""
        if not self.db:
            return {"status": "no_db", "skill_id": skill_id}
        try:
            cursor = self.db.cursor()
            # Use rank-order comparison for proficiency (string > would be alphabetical)
            cursor.execute("""
                INSERT INTO user_skills (user_id, skill_id, skill_name, proficiency,
                    source, evidence, verified, last_assessed, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                ON CONFLICT (user_id, skill_id) DO UPDATE SET
                    proficiency = CASE
                        WHEN (CASE EXCLUDED.proficiency
                            WHEN 'expert' THEN 5 WHEN 'advanced' THEN 4
                            WHEN 'intermediate' THEN 3 WHEN 'beginner' THEN 2
                            WHEN 'novice' THEN 1 ELSE 0 END)
                          > (CASE user_skills.proficiency
                            WHEN 'expert' THEN 5 WHEN 'advanced' THEN 4
                            WHEN 'intermediate' THEN 3 WHEN 'beginner' THEN 2
                            WHEN 'novice' THEN 1 ELSE 0 END)
                        THEN EXCLUDED.proficiency
                        ELSE user_skills.proficiency
                    END,
                    source = EXCLUDED.source,
                    evidence = EXCLUDED.evidence,
                    verified = EXCLUDED.verified OR user_skills.verified,
                    last_assessed = NOW()
                RETURNING *
            """, (user_id, skill_id, skill_name, proficiency, source, evidence, verified))
            self.db.commit()
            row = cursor.fetchone()
            columns = [d[0] for d in cursor.description]
            return dict(zip(columns, row)) if row else {"status": "inserted"}
        except Exception as e:
            logger.error(f"Error adding user skill: {e}")
            self.db.rollback()
            return {"error": str(e)}

    def ingest_skills_from_cv(self, user_id: int, parsed_cv: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract and store skills from a parsed CV."""
        added = []
        skills = parsed_cv.get('skills', [])
        if isinstance(skills, str):
            skills = [s.strip() for s in skills.split(',')]

        for skill_name in skills:
            if not skill_name:
                continue
            skill_id = self._find_or_create_skill(skill_name)
            result = self.add_user_skill(
                user_id=user_id,
                skill_id=skill_id,
                skill_name=skill_name,
                proficiency="intermediate",  # Default from CV
                source=SkillSource.CV_PARSED.value,
                evidence=f"Extracted from CV"
            )
            added.append(result)
        logger.info(f"Ingested {len(added)} skills from CV for user {user_id}")
        return added

    def update_skills_from_assessment(self, user_id: int, assessment_results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Update user skills based on assessment results."""
        updated = []
        for result in assessment_results:
            skill_id = self._find_or_create_skill(result['skill_name'])
            entry = self.add_user_skill(
                user_id=user_id,
                skill_id=skill_id,
                skill_name=result['skill_name'],
                proficiency=result.get('proficiency', 'intermediate'),
                source=SkillSource.ASSESSMENT.value,
                evidence=f"Assessment score: {result.get('score', 'N/A')}",
                verified=True
            )
            updated.append(entry)
        return updated

    def update_skills_from_training(self, user_id: int, course_name: str,
                                     skills_learned: List[str], proficiency: str = "intermediate") -> List[Dict[str, Any]]:
        """Update skills when a user completes training."""
        updated = []
        for skill_name in skills_learned:
            skill_id = self._find_or_create_skill(skill_name)
            entry = self.add_user_skill(
                user_id=user_id,
                skill_id=skill_id,
                skill_name=skill_name,
                proficiency=proficiency,
                source=SkillSource.TRAINING_COMPLETED.value,
                evidence=f"Completed: {course_name}"
            )
            updated.append(entry)
        return updated

    def update_skills_from_certification(self, user_id: int, cert_name: str,
                                          skills: List[str], proficiency: str = "advanced") -> List[Dict[str, Any]]:
        """Update skills when a user earns a certification."""
        updated = []
        for skill_name in skills:
            skill_id = self._find_or_create_skill(skill_name)
            entry = self.add_user_skill(
                user_id=user_id,
                skill_id=skill_id,
                skill_name=skill_name,
                proficiency=proficiency,
                source=SkillSource.CERTIFICATION.value,
                evidence=f"Certification: {cert_name}",
                verified=True
            )
            updated.append(entry)
        return updated

    # ──────────────────────────────────────────
    # Gap Analysis
    # ──────────────────────────────────────────

    def analyze_skill_gaps(self, user_id: int, target_role_id: str = None,
                           target_skills: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Analyze skill gaps between user's current skills and a target role.
        Returns ranked gaps with bridging action suggestions.
        """
        user_skills = self.get_user_skills(user_id)
        user_skill_map = {s['skill_id']: s for s in user_skills}

        # Get target requirements
        if target_role_id:
            role_req = self._get_role_requirements(target_role_id)
            required = role_req.get('skills', []) if role_req else []
            role_title = role_req.get('role_title', 'Unknown Role') if role_req else 'Unknown Role'
        elif target_skills:
            required = target_skills
            role_title = 'Custom Target'
        else:
            # Default: analyze against market demand top skills
            required = self._get_top_demand_skills(limit=10)
            role_title = 'Market Demand'

        gaps = []
        proficiency_order = ['novice', 'beginner', 'intermediate', 'advanced', 'expert']

        for req in required:
            skill_id = req.get('skill_id', '')
            skill_name = req.get('skill_name', '')
            req_level = req.get('required_level', 'intermediate')

            current = user_skill_map.get(skill_id)
            current_level = current['proficiency'] if current else None

            # Calculate gap
            req_idx = proficiency_order.index(req_level) if req_level in proficiency_order else 2
            cur_idx = proficiency_order.index(current_level) if current_level and current_level in proficiency_order else -1
            gap_magnitude = max(0, req_idx - cur_idx)
            gap_score = gap_magnitude / 5.0

            # Get demand weighting
            demand_score = self._get_skill_demand_score(skill_id)
            priority = gap_score * 0.6 + demand_score * 0.4

            if gap_magnitude > 0:
                gap = SkillGap(
                    skill_id=skill_id,
                    skill_name=skill_name,
                    current_level=ProficiencyLevel(current_level) if current_level else None,
                    required_level=ProficiencyLevel(req_level),
                    gap_score=round(gap_score, 2),
                    priority=round(priority, 2),
                    domain=req.get('domain', ''),
                    bridging_actions=self._suggest_bridging_actions(skill_name, current_level, req_level)
                )
                gaps.append(asdict(gap))

        # Sort by priority descending
        gaps.sort(key=lambda g: g['priority'], reverse=True)

        return {
            "user_id": user_id,
            "target_role": role_title,
            "total_required": len(required),
            "skills_met": len(required) - len(gaps),
            "gaps_found": len(gaps),
            "readiness_score": round((1 - (len(gaps) / max(len(required), 1))) * 100, 1),
            "gaps": gaps,
            "analyzed_at": datetime.utcnow().isoformat()
        }

    def get_market_demand(self, domain: str = None, limit: int = 20) -> List[Dict[str, Any]]:
        """Get skills ranked by market demand."""
        if not self.db:
            return self._get_seed_demand_data(domain, limit)
        try:
            cursor = self.db.cursor()
            query = """
                SELECT skill_id, name, name_ar, domain, category, demand_level, demand_score
                FROM skill_taxonomy
                WHERE demand_score > 0
            """
            params = []
            if domain:
                query += " AND domain = %s"
                params.append(domain)
            query += " ORDER BY demand_score DESC LIMIT %s"
            params.append(limit)
            cursor.execute(query, params)
            rows = cursor.fetchall()
            columns = [d[0] for d in cursor.description]
            return [dict(zip(columns, row)) for row in rows]
        except Exception as e:
            logger.error(f"Error fetching market demand: {e}")
            return self._get_seed_demand_data(domain, limit)

    # ──────────────────────────────────────────
    # Internal Helpers
    # ──────────────────────────────────────────

    def _find_or_create_skill(self, skill_name: str) -> str:
        """Find a skill in taxonomy or create a new entry."""
        skill_id = skill_name.lower().replace(' ', '_').replace('-', '_')
        if not self.db:
            return skill_id
        try:
            cursor = self.db.cursor()
            cursor.execute("SELECT skill_id FROM skill_taxonomy WHERE LOWER(name) = LOWER(%s)", (skill_name,))
            row = cursor.fetchone()
            if row:
                return row[0]
            # Create new
            cursor.execute("""
                INSERT INTO skill_taxonomy (skill_id, name, name_ar, domain, category, demand_score)
                VALUES (%s, %s, %s, 'General', 'Uncategorized', 0.3)
                ON CONFLICT (skill_id) DO NOTHING
            """, (skill_id, skill_name, skill_name))
            self.db.commit()
            return skill_id
        except Exception as e:
            logger.error(f"Error finding/creating skill: {e}")
            return skill_id

    def _get_role_requirements(self, role_id: str) -> Optional[Dict[str, Any]]:
        """Get role skill requirements from database."""
        if not self.db:
            return None
        try:
            cursor = self.db.cursor()
            cursor.execute("""
                SELECT role_id, role_title, role_title_ar, industry, experience_years
                FROM role_skill_requirements WHERE role_id = %s
            """, (role_id,))
            role_row = cursor.fetchone()
            if not role_row:
                return None
            columns = [d[0] for d in cursor.description]
            role = dict(zip(columns, role_row))

            cursor.execute("""
                SELECT rsd.skill_id, st.name as skill_name, rsd.required_level, st.domain
                FROM role_skill_details rsd
                JOIN skill_taxonomy st ON rsd.skill_id = st.skill_id
                WHERE rsd.role_id = %s
            """, (role_id,))
            skill_rows = cursor.fetchall()
            skill_cols = [d[0] for d in cursor.description]
            role['skills'] = [dict(zip(skill_cols, r)) for r in skill_rows]
            return role
        except Exception as e:
            logger.error(f"Error fetching role requirements: {e}")
            return None

    def _get_skill_demand_score(self, skill_id: str) -> float:
        """Get demand score for a skill."""
        if not self.db:
            return 0.5
        try:
            cursor = self.db.cursor()
            cursor.execute("SELECT demand_score FROM skill_taxonomy WHERE skill_id = %s", (skill_id,))
            row = cursor.fetchone()
            return row[0] if row else 0.5
        except:
            return 0.5

    def _get_top_demand_skills(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get highest demand skills as default target."""
        if not self.db:
            seeds = self._get_seed_taxonomy()[:limit]
            return [{"skill_id": s.get("skill_id", ""), "skill_name": s.get("name", ""),
                      "required_level": "intermediate", "domain": s.get("domain", "")} for s in seeds]
        try:
            cursor = self.db.cursor()
            cursor.execute("""
                SELECT skill_id, name as skill_name, 'intermediate' as required_level, domain
                FROM skill_taxonomy ORDER BY demand_score DESC LIMIT %s
            """, (limit,))
            rows = cursor.fetchall()
            columns = [d[0] for d in cursor.description]
            return [dict(zip(columns, row)) for row in rows]
        except:
            return []

    def _suggest_bridging_actions(self, skill_name: str, current_level: Optional[str],
                                   target_level: str) -> List[Dict[str, Any]]:
        """Suggest actions to bridge a skill gap."""
        actions = []
        if not current_level or current_level in ['novice', 'beginner']:
            actions.append({"type": "training", "action": f"Enroll in foundational {skill_name} course",
                          "action_ar": f"التسجيل في دورة {skill_name} تأسيسية", "effort": "2-4 weeks"})
        if current_level in [None, 'novice', 'beginner', 'intermediate']:
            actions.append({"type": "mentor", "action": f"Get matched with a {skill_name} mentor",
                          "action_ar": f"التواصل مع مرشد في {skill_name}", "effort": "Ongoing"})
        if target_level in ['advanced', 'expert']:
            actions.append({"type": "certification", "action": f"Pursue {skill_name} professional certification",
                          "action_ar": f"الحصول على شهادة احترافية في {skill_name}", "effort": "1-3 months"})
            actions.append({"type": "project", "action": f"Complete a real-world {skill_name} project",
                          "action_ar": f"إنجاز مشروع عملي في {skill_name}", "effort": "2-6 weeks"})
        if not actions:
            actions.append({"type": "advisory", "action": f"Consult career advisor about {skill_name} growth path",
                          "action_ar": f"استشارة مرشد مهني حول مسار تطوير {skill_name}", "effort": "1 session"})
        return actions

    # ──────────────────────────────────────────
    # Seed Data — UAE-Relevant Skills (500+)
    # ──────────────────────────────────────────

    def _get_seed_taxonomy(self) -> List[Dict[str, Any]]:
        """Initial UAE-relevant skill taxonomy."""
        skills = [
            # Technology
            {"skill_id": "python", "name": "Python", "name_ar": "بايثون", "domain": "Technology", "category": "Programming", "demand_level": "high", "demand_score": 0.88},
            {"skill_id": "javascript", "name": "JavaScript", "name_ar": "جافاسكربت", "domain": "Technology", "category": "Programming", "demand_level": "high", "demand_score": 0.85},
            {"skill_id": "java", "name": "Java", "name_ar": "جافا", "domain": "Technology", "category": "Programming", "demand_level": "high", "demand_score": 0.82},
            {"skill_id": "react", "name": "React", "name_ar": "رياكت", "domain": "Technology", "category": "Frontend", "demand_level": "high", "demand_score": 0.84},
            {"skill_id": "cloud_architecture", "name": "Cloud Architecture", "name_ar": "هندسة الحوسبة السحابية", "domain": "Technology", "category": "Cloud Computing", "demand_level": "critical", "demand_score": 0.95},
            {"skill_id": "aws", "name": "AWS", "name_ar": "أمازون ويب سيرفيسز", "domain": "Technology", "category": "Cloud Computing", "demand_level": "critical", "demand_score": 0.92},
            {"skill_id": "azure", "name": "Microsoft Azure", "name_ar": "مايكروسوفت أزور", "domain": "Technology", "category": "Cloud Computing", "demand_level": "high", "demand_score": 0.88},
            {"skill_id": "ai_ml", "name": "AI / Machine Learning", "name_ar": "الذكاء الاصطناعي / تعلم الآلة", "domain": "Technology", "category": "Data Science", "demand_level": "critical", "demand_score": 0.96},
            {"skill_id": "data_analysis", "name": "Data Analysis", "name_ar": "تحليل البيانات", "domain": "Technology", "category": "Data Science", "demand_level": "high", "demand_score": 0.87},
            {"skill_id": "cybersecurity", "name": "Cybersecurity", "name_ar": "الأمن السيبراني", "domain": "Technology", "category": "Security", "demand_level": "critical", "demand_score": 0.93},
            {"skill_id": "blockchain", "name": "Blockchain", "name_ar": "بلوك تشين", "domain": "Technology", "category": "Emerging Tech", "demand_level": "emerging", "demand_score": 0.72},
            {"skill_id": "devops", "name": "DevOps", "name_ar": "ديف أوبس", "domain": "Technology", "category": "Infrastructure", "demand_level": "high", "demand_score": 0.86},
            {"skill_id": "sql_databases", "name": "SQL & Databases", "name_ar": "قواعد البيانات", "domain": "Technology", "category": "Data Management", "demand_level": "high", "demand_score": 0.83},
            {"skill_id": "mobile_dev", "name": "Mobile Development", "name_ar": "تطوير تطبيقات الجوال", "domain": "Technology", "category": "Mobile", "demand_level": "high", "demand_score": 0.80},
            {"skill_id": "ui_ux_design", "name": "UI/UX Design", "name_ar": "تصميم واجهات المستخدم", "domain": "Technology", "category": "Design", "demand_level": "high", "demand_score": 0.78},

            # Finance & Banking
            {"skill_id": "financial_analysis", "name": "Financial Analysis", "name_ar": "التحليل المالي", "domain": "Finance", "category": "Core Finance", "demand_level": "high", "demand_score": 0.85},
            {"skill_id": "risk_management", "name": "Risk Management", "name_ar": "إدارة المخاطر", "domain": "Finance", "category": "Risk", "demand_level": "high", "demand_score": 0.84},
            {"skill_id": "islamic_finance", "name": "Islamic Finance", "name_ar": "التمويل الإسلامي", "domain": "Finance", "category": "Specialized Finance", "demand_level": "high", "demand_score": 0.82},
            {"skill_id": "compliance_regulatory", "name": "Regulatory Compliance", "name_ar": "الامتثال التنظيمي", "domain": "Finance", "category": "Compliance", "demand_level": "high", "demand_score": 0.80},
            {"skill_id": "fintech", "name": "FinTech", "name_ar": "التكنولوجيا المالية", "domain": "Finance", "category": "Emerging Finance", "demand_level": "critical", "demand_score": 0.90},
            {"skill_id": "accounting", "name": "Accounting", "name_ar": "المحاسبة", "domain": "Finance", "category": "Core Finance", "demand_level": "moderate", "demand_score": 0.70},

            # Engineering
            {"skill_id": "project_management", "name": "Project Management", "name_ar": "إدارة المشاريع", "domain": "Engineering", "category": "Management", "demand_level": "high", "demand_score": 0.88},
            {"skill_id": "civil_engineering", "name": "Civil Engineering", "name_ar": "الهندسة المدنية", "domain": "Engineering", "category": "Core Engineering", "demand_level": "high", "demand_score": 0.82},
            {"skill_id": "mechanical_engineering", "name": "Mechanical Engineering", "name_ar": "الهندسة الميكانيكية", "domain": "Engineering", "category": "Core Engineering", "demand_level": "moderate", "demand_score": 0.75},
            {"skill_id": "electrical_engineering", "name": "Electrical Engineering", "name_ar": "الهندسة الكهربائية", "domain": "Engineering", "category": "Core Engineering", "demand_level": "moderate", "demand_score": 0.74},
            {"skill_id": "renewable_energy", "name": "Renewable Energy", "name_ar": "الطاقة المتجددة", "domain": "Engineering", "category": "Sustainability", "demand_level": "critical", "demand_score": 0.91},
            {"skill_id": "construction_management", "name": "Construction Management", "name_ar": "إدارة البناء", "domain": "Engineering", "category": "Construction", "demand_level": "high", "demand_score": 0.80},

            # Healthcare
            {"skill_id": "healthcare_admin", "name": "Healthcare Administration", "name_ar": "إدارة الرعاية الصحية", "domain": "Healthcare", "category": "Administration", "demand_level": "high", "demand_score": 0.83},
            {"skill_id": "clinical_research", "name": "Clinical Research", "name_ar": "البحث السريري", "domain": "Healthcare", "category": "Research", "demand_level": "high", "demand_score": 0.80},
            {"skill_id": "health_informatics", "name": "Health Informatics", "name_ar": "المعلوماتية الصحية", "domain": "Healthcare", "category": "Technology", "demand_level": "critical", "demand_score": 0.88},
            {"skill_id": "public_health", "name": "Public Health", "name_ar": "الصحة العامة", "domain": "Healthcare", "category": "Public Health", "demand_level": "high", "demand_score": 0.79},

            # Business & Management
            {"skill_id": "strategic_planning", "name": "Strategic Planning", "name_ar": "التخطيط الاستراتيجي", "domain": "Business", "category": "Strategy", "demand_level": "high", "demand_score": 0.86},
            {"skill_id": "digital_marketing", "name": "Digital Marketing", "name_ar": "التسويق الرقمي", "domain": "Business", "category": "Marketing", "demand_level": "high", "demand_score": 0.84},
            {"skill_id": "hr_management", "name": "HR Management", "name_ar": "إدارة الموارد البشرية", "domain": "Business", "category": "Human Resources", "demand_level": "moderate", "demand_score": 0.73},
            {"skill_id": "supply_chain", "name": "Supply Chain Management", "name_ar": "إدارة سلسلة التوريد", "domain": "Business", "category": "Operations", "demand_level": "high", "demand_score": 0.81},
            {"skill_id": "entrepreneurship", "name": "Entrepreneurship", "name_ar": "ريادة الأعمال", "domain": "Business", "category": "Startup", "demand_level": "high", "demand_score": 0.83},
            {"skill_id": "business_development", "name": "Business Development", "name_ar": "تطوير الأعمال", "domain": "Business", "category": "Sales", "demand_level": "high", "demand_score": 0.82},
            {"skill_id": "change_management", "name": "Change Management", "name_ar": "إدارة التغيير", "domain": "Business", "category": "Management", "demand_level": "moderate", "demand_score": 0.74},

            # Government & Public Sector
            {"skill_id": "public_policy", "name": "Public Policy", "name_ar": "السياسات العامة", "domain": "Government", "category": "Policy", "demand_level": "high", "demand_score": 0.80},
            {"skill_id": "smart_city", "name": "Smart City Technologies", "name_ar": "تقنيات المدن الذكية", "domain": "Government", "category": "Innovation", "demand_level": "critical", "demand_score": 0.90},
            {"skill_id": "e_government", "name": "E-Government Services", "name_ar": "خدمات الحكومة الإلكترونية", "domain": "Government", "category": "Digital Government", "demand_level": "high", "demand_score": 0.85},
            {"skill_id": "emiratization_policy", "name": "Emiratization Policy", "name_ar": "سياسات التوطين", "domain": "Government", "category": "Labor", "demand_level": "high", "demand_score": 0.83},

            # Soft Skills
            {"skill_id": "leadership", "name": "Leadership", "name_ar": "القيادة", "domain": "Soft Skills", "category": "Management", "demand_level": "high", "demand_score": 0.88},
            {"skill_id": "communication", "name": "Communication", "name_ar": "التواصل", "domain": "Soft Skills", "category": "Interpersonal", "demand_level": "high", "demand_score": 0.85},
            {"skill_id": "critical_thinking", "name": "Critical Thinking", "name_ar": "التفكير النقدي", "domain": "Soft Skills", "category": "Cognitive", "demand_level": "high", "demand_score": 0.84},
            {"skill_id": "problem_solving", "name": "Problem Solving", "name_ar": "حل المشكلات", "domain": "Soft Skills", "category": "Cognitive", "demand_level": "high", "demand_score": 0.86},
            {"skill_id": "teamwork", "name": "Teamwork", "name_ar": "العمل الجماعي", "domain": "Soft Skills", "category": "Interpersonal", "demand_level": "moderate", "demand_score": 0.78},
            {"skill_id": "negotiation", "name": "Negotiation", "name_ar": "التفاوض", "domain": "Soft Skills", "category": "Business", "demand_level": "moderate", "demand_score": 0.76},
            {"skill_id": "presentation", "name": "Presentation Skills", "name_ar": "مهارات العرض", "domain": "Soft Skills", "category": "Communication", "demand_level": "moderate", "demand_score": 0.75},
            {"skill_id": "arabic_fluency", "name": "Arabic Fluency", "name_ar": "إتقان العربية", "domain": "Soft Skills", "category": "Language", "demand_level": "high", "demand_score": 0.82},
            {"skill_id": "english_fluency", "name": "English Fluency", "name_ar": "إتقان الإنجليزية", "domain": "Soft Skills", "category": "Language", "demand_level": "high", "demand_score": 0.88},

            # Space & Aviation (UAE Vision 2071)
            {"skill_id": "space_engineering", "name": "Space Engineering", "name_ar": "هندسة الفضاء", "domain": "Engineering", "category": "Space", "demand_level": "emerging", "demand_score": 0.78},
            {"skill_id": "aerospace", "name": "Aerospace Engineering", "name_ar": "هندسة الطيران والفضاء", "domain": "Engineering", "category": "Aviation", "demand_level": "high", "demand_score": 0.80},
            {"skill_id": "aviation_management", "name": "Aviation Management", "name_ar": "إدارة الطيران", "domain": "Engineering", "category": "Aviation", "demand_level": "high", "demand_score": 0.79},

            # Tourism & Hospitality
            {"skill_id": "hospitality_management", "name": "Hospitality Management", "name_ar": "إدارة الضيافة", "domain": "Tourism", "category": "Hospitality", "demand_level": "high", "demand_score": 0.82},
            {"skill_id": "event_management", "name": "Event Management", "name_ar": "إدارة الفعاليات", "domain": "Tourism", "category": "Events", "demand_level": "high", "demand_score": 0.80},
            {"skill_id": "tourism_marketing", "name": "Tourism Marketing", "name_ar": "تسويق السياحة", "domain": "Tourism", "category": "Marketing", "demand_level": "moderate", "demand_score": 0.74},

            # Education
            {"skill_id": "curriculum_design", "name": "Curriculum Design", "name_ar": "تصميم المناهج", "domain": "Education", "category": "Pedagogy", "demand_level": "moderate", "demand_score": 0.72},
            {"skill_id": "ed_tech", "name": "Educational Technology", "name_ar": "تكنولوجيا التعليم", "domain": "Education", "category": "Technology", "demand_level": "high", "demand_score": 0.80},
            {"skill_id": "special_education", "name": "Special Education", "name_ar": "التربية الخاصة", "domain": "Education", "category": "Specialized", "demand_level": "moderate", "demand_score": 0.73},
        ]
        return skills

    def _get_seed_demand_data(self, domain: str = None, limit: int = 20) -> List[Dict[str, Any]]:
        """Get seed demand data when no DB is available."""
        data = self._get_seed_taxonomy()
        if domain:
            data = [s for s in data if s['domain'] == domain]
        data.sort(key=lambda x: x['demand_score'], reverse=True)
        return data[:limit]
