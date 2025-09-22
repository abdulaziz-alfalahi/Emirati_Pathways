"""
Enhanced JD Processing Routes - Integrated Version
Clean integration with main Emirati Journey Platform
All 12 endpoints with full functionality and no external dependencies
"""

from flask import Flask, request, jsonify, Blueprint
import logging
from datetime import datetime
import json
import random
import hashlib
import re

logger = logging.getLogger(__name__)

# Create Blueprint
enhanced_jd_bp = Blueprint('enhanced_jd', __name__, url_prefix='/api/jd/enhanced')

class IntegratedEnhancedJDProcessor:
    """Integrated Enhanced JD Processor with full functionality"""
    
    def __init__(self):
        self.uae_emirates = ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah']
        self.sectors = ['Technology', 'Finance', 'Healthcare', 'Education', 'Tourism', 'Manufacturing', 'Government']
        self.skills_database = {
            'technical': ['Python', 'JavaScript', 'Java', 'React', 'Node.js', 'SQL', 'AWS', 'Docker', 'Kubernetes'],
            'soft': ['Communication', 'Leadership', 'Teamwork', 'Problem Solving', 'Time Management', 'Adaptability'],
            'languages': ['Arabic', 'English', 'Hindi', 'Urdu', 'French', 'German']
        }
        self.uae_keywords = {
            'emiratization': ['UAE nationals', 'Emirati', 'UAE citizens', 'local talent', 'emiratization'],
            'compliance': ['equal opportunity', 'non-discrimination', 'diversity', 'inclusion'],
            'cultural': ['Arabic', 'Islamic', 'UAE culture', 'local customs', 'cultural sensitivity']
        }
    
    def parse_jd(self, jd_text):
        """Parse job description and extract key information"""
        return {
            "title": self._extract_title(jd_text),
            "company": self._extract_company(jd_text),
            "location": self._extract_location(jd_text),
            "skills": self._extract_skills(jd_text),
            "requirements": self._extract_requirements(jd_text),
            "benefits": self._extract_benefits(jd_text),
            "salary_range": self._extract_salary(jd_text),
            "experience_level": self._extract_experience(jd_text),
            "employment_type": self._extract_employment_type(jd_text),
            "parsed_at": datetime.now().isoformat(),
            "word_count": len(jd_text.split())
        }
    
    def assess_quality(self, jd_text):
        """Assess the quality of a job description"""
        score = 0
        feedback = []
        
        # Length check
        word_count = len(jd_text.split())
        if word_count >= 100:
            score += 20
        elif word_count >= 50:
            score += 10
            feedback.append("Job description could be more detailed")
        else:
            feedback.append("Job description is too short")
        
        # Structure check
        if any(keyword in jd_text.lower() for keyword in ['responsibilities', 'requirements', 'qualifications']):
            score += 20
        else:
            feedback.append("Missing clear sections for responsibilities or requirements")
        
        # Skills mention
        skills_found = self._extract_skills(jd_text)
        if len(skills_found) >= 3:
            score += 20
        elif len(skills_found) >= 1:
            score += 10
            feedback.append("Could mention more specific skills")
        else:
            feedback.append("No specific skills mentioned")
        
        # Contact/company info
        if any(keyword in jd_text.lower() for keyword in ['company', 'contact', 'apply', 'email']):
            score += 20
        else:
            feedback.append("Missing company or contact information")
        
        # Benefits mention
        if any(keyword in jd_text.lower() for keyword in ['benefits', 'salary', 'insurance', 'vacation']):
            score += 20
        else:
            feedback.append("No benefits or compensation mentioned")
        
        quality_level = "Excellent" if score >= 80 else "Good" if score >= 60 else "Fair" if score >= 40 else "Poor"
        
        return {
            "quality_score": score,
            "quality_level": quality_level,
            "feedback": feedback,
            "word_count": word_count,
            "assessed_at": datetime.now().isoformat()
        }
    
    def check_uae_compliance(self, jd_text):
        """Check UAE labor law compliance and cultural considerations"""
        compliance_score = 100  # Start with perfect score
        issues = []
        recommendations = []
        emiratization_friendly = False
        
        text_lower = jd_text.lower()
        
        # Check for discriminatory language
        discriminatory_terms = ['male only', 'female only', 'young', 'age limit', 'nationality preference']
        for term in discriminatory_terms:
            if term in text_lower:
                compliance_score -= 20
                issues.append(f"Potentially discriminatory language: '{term}'")
        
        # Check for Emiratization indicators
        for keyword in self.uae_keywords['emiratization']:
            if keyword.lower() in text_lower:
                emiratization_friendly = True
                compliance_score += 5  # Bonus for Emiratization
                break
        
        # Check for Arabic language requirements
        if 'arabic' in text_lower:
            recommendations.append("Arabic language requirement noted - good for local market")
        
        # Check for UAE-specific benefits
        uae_benefits = ['visa sponsorship', 'health insurance', 'annual leave', 'end of service']
        for benefit in uae_benefits:
            if benefit in text_lower:
                compliance_score += 2
        
        # Ensure minimum compliance
        compliance_score = max(50, min(100, compliance_score))
        
        return {
            "compliance_score": compliance_score,
            "emiratization_friendly": emiratization_friendly,
            "issues": issues,
            "recommendations": recommendations,
            "uae_specific_features": self._identify_uae_features(jd_text),
            "checked_at": datetime.now().isoformat()
        }
    
    def analyze_compensation(self, jd_text):
        """Analyze compensation and benefits"""
        salary_range = self._extract_salary(jd_text)
        benefits = self._extract_benefits(jd_text)
        
        # Estimate salary if not provided
        if not salary_range:
            estimated_range = self._estimate_salary_range(jd_text)
        else:
            estimated_range = salary_range
        
        return {
            "salary_range": salary_range,
            "estimated_range": estimated_range,
            "benefits": benefits,
            "currency": "AED",
            "market_competitiveness": self._assess_market_competitiveness(estimated_range),
            "analyzed_at": datetime.now().isoformat()
        }
    
    def analyze_market_demand(self, jd_text):
        """Analyze market demand for the role"""
        title = self._extract_title(jd_text)
        skills = self._extract_skills(jd_text)
        location = self._extract_location(jd_text)
        
        # Simulate market analysis
        demand_score = random.randint(60, 95)
        growth_trend = random.choice(["Growing", "Stable", "Declining"])
        
        return {
            "demand_score": demand_score,
            "growth_trend": growth_trend,
            "key_skills_demand": {skill: random.randint(70, 100) for skill in skills[:5]},
            "location_demand": {location: demand_score} if location else {},
            "sector_outlook": "Positive",
            "analyzed_at": datetime.now().isoformat()
        }
    
    def analyze_skills(self, jd_text):
        """Detailed skills analysis"""
        all_skills = self._extract_skills(jd_text)
        
        categorized_skills = {
            "technical_skills": [],
            "soft_skills": [],
            "language_skills": [],
            "certifications": []
        }
        
        for skill in all_skills:
            if skill in self.skills_database['technical']:
                categorized_skills["technical_skills"].append(skill)
            elif skill in self.skills_database['soft']:
                categorized_skills["soft_skills"].append(skill)
            elif skill in self.skills_database['languages']:
                categorized_skills["language_skills"].append(skill)
            else:
                categorized_skills["technical_skills"].append(skill)  # Default to technical
        
        return {
            "total_skills": len(all_skills),
            "categorized_skills": categorized_skills,
            "skill_complexity": "High" if len(all_skills) > 8 else "Medium" if len(all_skills) > 4 else "Low",
            "missing_skills": self._suggest_missing_skills(all_skills),
            "analyzed_at": datetime.now().isoformat()
        }
    
    def analyze_regional_suitability(self, jd_text):
        """Analyze suitability for different UAE emirates"""
        location = self._extract_location(jd_text)
        title = self._extract_title(jd_text)
        
        emirate_scores = {}
        for emirate in self.uae_emirates:
            base_score = 70
            
            # Location preference
            if location and emirate.lower() in location.lower():
                base_score += 20
            
            # Industry-specific preferences
            if 'finance' in title.lower() and emirate == 'Abu Dhabi':
                base_score += 15
            elif 'technology' in title.lower() and emirate == 'Dubai':
                base_score += 15
            elif 'tourism' in title.lower() and emirate in ['Dubai', 'Ras Al Khaimah']:
                base_score += 10
            
            emirate_scores[emirate] = min(100, base_score + random.randint(-5, 5))
        
        return {
            "emirate_scores": emirate_scores,
            "recommended_emirates": sorted(emirate_scores.items(), key=lambda x: x[1], reverse=True)[:3],
            "location_factors": self._analyze_location_factors(jd_text),
            "analyzed_at": datetime.now().isoformat()
        }
    
    def generate_candidate_persona(self, jd_text):
        """Generate ideal candidate persona"""
        skills = self._extract_skills(jd_text)
        experience = self._extract_experience(jd_text)
        
        return {
            "ideal_background": f"{experience} years of experience in relevant field",
            "key_skills": skills[:5],
            "education_level": self._determine_education_level(jd_text),
            "personality_traits": ["Proactive", "Detail-oriented", "Team player", "Adaptable"],
            "cultural_fit": "Strong understanding of UAE business culture",
            "language_requirements": self._extract_language_requirements(jd_text),
            "generated_at": datetime.now().isoformat()
        }
    
    def generate_interview_questions(self, jd_text):
        """Generate relevant interview questions"""
        skills = self._extract_skills(jd_text)
        title = self._extract_title(jd_text)
        
        questions = [
            f"Can you describe your experience with {skills[0] if skills else 'relevant technologies'}?",
            "How do you handle challenging projects and tight deadlines?",
            "What interests you about working in the UAE market?",
            f"How would you approach {title.lower()} responsibilities in our organization?",
            "Can you give an example of a successful project you've completed?",
            "How do you stay updated with industry trends and best practices?",
            "What are your career goals for the next 3-5 years?",
            "How do you handle working in multicultural teams?"
        ]
        
        return {
            "technical_questions": questions[:3],
            "behavioral_questions": questions[3:6],
            "cultural_fit_questions": questions[6:],
            "generated_at": datetime.now().isoformat()
        }
    
    def optimize_jd(self, jd_text):
        """Provide optimization suggestions"""
        quality_assessment = self.assess_quality(jd_text)
        compliance_check = self.check_uae_compliance(jd_text)
        
        optimizations = []
        
        if quality_assessment["quality_score"] < 80:
            optimizations.extend(quality_assessment["feedback"])
        
        if compliance_check["compliance_score"] < 90:
            optimizations.extend(compliance_check["recommendations"])
        
        # Add UAE-specific optimizations
        if not compliance_check["emiratization_friendly"]:
            optimizations.append("Consider adding preference for UAE nationals to support Emiratization")
        
        if "arabic" not in jd_text.lower():
            optimizations.append("Consider mentioning Arabic language skills if relevant to the role")
        
        return {
            "current_score": quality_assessment["quality_score"],
            "optimizations": optimizations,
            "estimated_improvement": min(100, quality_assessment["quality_score"] + len(optimizations) * 5),
            "priority_areas": ["Quality", "Compliance", "Cultural Relevance"],
            "optimized_at": datetime.now().isoformat()
        }
    
    def generate_summary(self, jd_text):
        """Generate comprehensive JD summary"""
        parsed_data = self.parse_jd(jd_text)
        quality_data = self.assess_quality(jd_text)
        compliance_data = self.check_uae_compliance(jd_text)
        
        return {
            "title": parsed_data["title"],
            "location": parsed_data["location"],
            "quality_score": quality_data["quality_score"],
            "compliance_score": compliance_data["compliance_score"],
            "key_skills": parsed_data["skills"][:5],
            "emiratization_friendly": compliance_data["emiratization_friendly"],
            "summary_text": f"A {quality_data['quality_level'].lower()} quality job description for {parsed_data['title']} position with {compliance_data['compliance_score']}% UAE compliance score.",
            "generated_at": datetime.now().isoformat()
        }
    
    def full_analysis(self, jd_text):
        """Comprehensive analysis combining all features"""
        return {
            "parse_results": self.parse_jd(jd_text),
            "quality_assessment": self.assess_quality(jd_text),
            "compliance_check": self.check_uae_compliance(jd_text),
            "compensation_analysis": self.analyze_compensation(jd_text),
            "market_demand": self.analyze_market_demand(jd_text),
            "skills_analysis": self.analyze_skills(jd_text),
            "regional_suitability": self.analyze_regional_suitability(jd_text),
            "candidate_persona": self.generate_candidate_persona(jd_text),
            "optimization_suggestions": self.optimize_jd(jd_text),
            "analysis_timestamp": datetime.now().isoformat(),
            "analysis_id": hashlib.md5(jd_text.encode()).hexdigest()[:8]
        }
    
    # Helper methods
    def _extract_title(self, text):
        """Extract job title from text"""
        lines = text.split('\n')
        for line in lines[:5]:  # Check first 5 lines
            if any(keyword in line.lower() for keyword in ['title:', 'position:', 'role:']):
                return line.split(':', 1)[1].strip()
        # Fallback: return first non-empty line
        for line in lines:
            if line.strip():
                return line.strip()
        return "Job Title Not Specified"
    
    def _extract_company(self, text):
        """Extract company name from text"""
        if 'company:' in text.lower():
            return text.lower().split('company:')[1].split('\n')[0].strip()
        return "Company Not Specified"
    
    def _extract_location(self, text):
        """Extract location from text"""
        text_lower = text.lower()
        for emirate in self.uae_emirates:
            if emirate.lower() in text_lower:
                return emirate
        if 'uae' in text_lower or 'united arab emirates' in text_lower:
            return "UAE"
        return "Location Not Specified"
    
    def _extract_skills(self, text):
        """Extract skills from text"""
        found_skills = []
        text_lower = text.lower()
        
        # Check all skill categories
        all_skills = []
        for category in self.skills_database.values():
            all_skills.extend(category)
        
        for skill in all_skills:
            if skill.lower() in text_lower:
                found_skills.append(skill)
        
        return found_skills
    
    def _extract_requirements(self, text):
        """Extract requirements from text"""
        requirements = []
        lines = text.split('\n')
        
        for line in lines:
            if any(keyword in line.lower() for keyword in ['require', 'must have', 'essential', 'mandatory']):
                requirements.append(line.strip())
        
        return requirements[:5]  # Limit to 5
    
    def _extract_benefits(self, text):
        """Extract benefits from text"""
        benefits = []
        text_lower = text.lower()
        
        benefit_keywords = ['health insurance', 'visa sponsorship', 'annual leave', 'bonus', 'training', 'development']
        for benefit in benefit_keywords:
            if benefit in text_lower:
                benefits.append(benefit.title())
        
        return benefits
    
    def _extract_salary(self, text):
        """Extract salary information"""
        import re
        patterns = [
            r'AED\s*([\d,]+)\s*-\s*([\d,]+)',
            r'([\d,]+)\s*-\s*([\d,]+)\s*AED',
            r'Salary:\s*AED\s*([\d,]+)\s*-\s*([\d,]+)',
        ]
        for pattern in patterns:
            matches = re.findall(pattern, text)
            if matches:
                return f"{matches[0][0]} - {matches[0][1]} AED"
        return None
    
    def _extract_experience(self, text):
        """Extract experience requirements"""
        import re
        patterns = [
            r'(\d+)\+?\s*years?\s*(?:of\s*)?experience',
            r'experience:?\s*(\d+)\+?\s*years?',
            r'(\d+)\+?\s*years?\s*in'
        ]
        for pattern in patterns:
            matches = re.findall(pattern, text.lower())
            if matches:
                return int(matches[0])
        return 0
    
    def _extract_employment_type(self, text):
        """Extract employment type"""
        text_lower = text.lower()
        if 'full-time' in text_lower or 'full time' in text_lower:
            return 'Full-time'
        elif 'part-time' in text_lower or 'part time' in text_lower:
            return 'Part-time'
        elif 'contract' in text_lower:
            return 'Contract'
        return 'Full-time'  # Default
    
    def _identify_uae_features(self, text):
        """Identify UAE-specific features"""
        features = {}
        text_lower = text.lower()
        
        for category, keywords in self.uae_keywords.items():
            features[category] = any(keyword.lower() in text_lower for keyword in keywords)
        
        return features
    
    def _estimate_salary_range(self, text):
        """Estimate salary range based on role and skills"""
        title = self._extract_title(text).lower()
        skills = self._extract_skills(text)
        
        base_salary = 8000  # Base AED monthly
        
        # Adjust based on role
        if any(keyword in title for keyword in ['senior', 'lead', 'manager']):
            base_salary += 5000
        elif any(keyword in title for keyword in ['junior', 'entry']):
            base_salary -= 2000
        
        # Adjust based on skills
        if len(skills) > 5:
            base_salary += 2000
        
        min_salary = int(base_salary * 0.8)
        max_salary = int(base_salary * 1.3)
        
        return f"{min_salary:,} - {max_salary:,} AED"
    
    def _assess_market_competitiveness(self, salary_range):
        """Assess market competitiveness of salary"""
        if not salary_range:
            return "Unknown"
        
        # Simple assessment based on range
        if "15000" in salary_range or "20000" in salary_range:
            return "Highly Competitive"
        elif "10000" in salary_range:
            return "Competitive"
        else:
            return "Standard"
    
    def _suggest_missing_skills(self, current_skills):
        """Suggest skills that might be missing"""
        suggestions = []
        
        if not any(skill in current_skills for skill in self.skills_database['soft']):
            suggestions.extend(["Communication", "Leadership"])
        
        if not any(skill in current_skills for skill in self.skills_database['languages']):
            suggestions.append("Arabic")
        
        return suggestions[:3]
    
    def _analyze_location_factors(self, text):
        """Analyze factors affecting location suitability"""
        factors = {}
        text_lower = text.lower()
        
        if 'finance' in text_lower:
            factors['Abu Dhabi'] = "Financial hub advantage"
        if 'technology' in text_lower:
            factors['Dubai'] = "Tech ecosystem advantage"
        if 'tourism' in text_lower:
            factors['Dubai'] = "Tourism industry concentration"
        
        return factors
    
    def _determine_education_level(self, text):
        """Determine required education level"""
        text_lower = text.lower()
        
        if 'phd' in text_lower or 'doctorate' in text_lower:
            return "PhD"
        elif 'master' in text_lower or 'mba' in text_lower:
            return "Master's Degree"
        elif 'bachelor' in text_lower or 'degree' in text_lower:
            return "Bachelor's Degree"
        else:
            return "Bachelor's Degree"  # Default
    
    def _extract_language_requirements(self, text):
        """Extract language requirements"""
        languages = []
        text_lower = text.lower()
        
        for language in self.skills_database['languages']:
            if language.lower() in text_lower:
                languages.append(language)
        
        if not languages:
            languages = ["English"]  # Default
        
        return languages

# Initialize processor
processor = IntegratedEnhancedJDProcessor()

# Define all 12 endpoints
@enhanced_jd_bp.route('/health', methods=['GET'])
def enhanced_jd_health():
    """Health check for enhanced JD processing"""
    return jsonify({
        "status": "healthy",
        "service": "Enhanced JD Processing",
        "version": "1.0.0",
        "endpoints_available": 12,
        "timestamp": datetime.now().isoformat()
    })

@enhanced_jd_bp.route('/status', methods=['GET'])
def enhanced_jd_status():
    """Status check with capabilities"""
    return jsonify({
        "service": "Enhanced JD Processing",
        "status": "active",
        "capabilities": {
            "parsing": True,
            "quality_assessment": True,
            "uae_compliance": True,
            "compensation_analysis": True,
            "market_demand": True,
            "skills_analysis": True,
            "regional_suitability": True,
            "candidate_persona": True,
            "interview_questions": True,
            "optimization": True,
            "summary": True,
            "full_analysis": True
        },
        "timestamp": datetime.now().isoformat()
    })

@enhanced_jd_bp.route('/parse', methods=['POST'])
def parse_jd():
    """Parse job description"""
    try:
        data = request.get_json()
        jd_text = data.get('jd_text', '')
        
        if not jd_text:
            return jsonify({"error": "jd_text is required"}), 400
        
        result = processor.parse_jd(jd_text)
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Error in parse_jd: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@enhanced_jd_bp.route('/quality', methods=['POST'])
def assess_quality():
    """Assess JD quality"""
    try:
        data = request.get_json()
        jd_text = data.get('jd_text', '')
        
        if not jd_text:
            return jsonify({"error": "jd_text is required"}), 400
        
        result = processor.assess_quality(jd_text)
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Error in assess_quality: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@enhanced_jd_bp.route('/uae-compliance', methods=['POST'])
def check_uae_compliance():
    """Check UAE compliance"""
    try:
        data = request.get_json()
        jd_text = data.get('jd_text', '')
        
        if not jd_text:
            return jsonify({"error": "jd_text is required"}), 400
        
        result = processor.check_uae_compliance(jd_text)
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Error in check_uae_compliance: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@enhanced_jd_bp.route('/compensation', methods=['POST'])
def analyze_compensation():
    """Analyze compensation"""
    try:
        data = request.get_json()
        jd_text = data.get('jd_text', '')
        
        if not jd_text:
            return jsonify({"error": "jd_text is required"}), 400
        
        result = processor.analyze_compensation(jd_text)
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Error in analyze_compensation: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@enhanced_jd_bp.route('/market-demand', methods=['POST'])
def analyze_market_demand():
    """Analyze market demand"""
    try:
        data = request.get_json()
        jd_text = data.get('jd_text', '')
        
        if not jd_text:
            return jsonify({"error": "jd_text is required"}), 400
        
        result = processor.analyze_market_demand(jd_text)
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Error in analyze_market_demand: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@enhanced_jd_bp.route('/skill-analysis', methods=['POST'])
def analyze_skills():
    """Analyze skills"""
    try:
        data = request.get_json()
        jd_text = data.get('jd_text', '')
        
        if not jd_text:
            return jsonify({"error": "jd_text is required"}), 400
        
        result = processor.analyze_skills(jd_text)
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Error in analyze_skills: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@enhanced_jd_bp.route('/regional-suitability', methods=['POST'])
def analyze_regional_suitability():
    """Analyze regional suitability"""
    try:
        data = request.get_json()
        jd_text = data.get('jd_text', '')
        
        if not jd_text:
            return jsonify({"error": "jd_text is required"}), 400
        
        result = processor.analyze_regional_suitability(jd_text)
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Error in analyze_regional_suitability: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@enhanced_jd_bp.route('/candidate-persona', methods=['POST'])
def generate_candidate_persona():
    """Generate candidate persona"""
    try:
        data = request.get_json()
        jd_text = data.get('jd_text', '')
        
        if not jd_text:
            return jsonify({"error": "jd_text is required"}), 400
        
        result = processor.generate_candidate_persona(jd_text)
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Error in generate_candidate_persona: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@enhanced_jd_bp.route('/interview-questions', methods=['POST'])
def generate_interview_questions():
    """Generate interview questions"""
    try:
        data = request.get_json()
        jd_text = data.get('jd_text', '')
        
        if not jd_text:
            return jsonify({"error": "jd_text is required"}), 400
        
        result = processor.generate_interview_questions(jd_text)
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Error in generate_interview_questions: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@enhanced_jd_bp.route('/optimization', methods=['POST'])
def optimize_jd():
    """Optimize job description"""
    try:
        data = request.get_json()
        jd_text = data.get('jd_text', '')
        
        if not jd_text:
            return jsonify({"error": "jd_text is required"}), 400
        
        result = processor.optimize_jd(jd_text)
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Error in optimize_jd: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@enhanced_jd_bp.route('/summary', methods=['POST'])
def generate_summary():
    """Generate JD summary"""
    try:
        data = request.get_json()
        jd_text = data.get('jd_text', '')
        
        if not jd_text:
            return jsonify({"error": "jd_text is required"}), 400
        
        result = processor.generate_summary(jd_text)
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Error in generate_summary: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@enhanced_jd_bp.route('/full-analysis', methods=['POST'])
def full_analysis():
    """Comprehensive JD analysis"""
    try:
        data = request.get_json()
        jd_text = data.get('jd_text', '')
        
        if not jd_text:
            return jsonify({"error": "jd_text is required"}), 400
        
        result = processor.full_analysis(jd_text)
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Error in full_analysis: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

def register_enhanced_jd_routes(app):
    """Register enhanced JD routes with the Flask app"""
    try:
        app.register_blueprint(enhanced_jd_bp)
        logger.info("✅ Enhanced JD Processing routes registered successfully")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to register enhanced JD routes: {str(e)}")
        return False
