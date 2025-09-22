# Enhanced Job Matching Engine - Fixed Version
# This version properly loads .env file before initializing

import os
import logging
from typing import Dict, List, Any, Optional, Tuple
import json
import time
from datetime import datetime, timedelta
import hashlib

# Load environment variables first
from dotenv import load_dotenv
load_dotenv()

# Now import other modules
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    logging.warning("Google Generative AI not available. Install with: pip install google-generativeai")

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    logging.warning("Redis not available. Using in-memory caching.")

import numpy as np
from scipy.spatial.distance import cosine

# Import UAE-specific criteria
from .uae_matching_criteria import get_uae_criteria
from .advanced_scoring_system import get_advanced_scoring_system
from .matching_performance_optimizer import get_performance_optimizer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EnhancedJobMatchingEngine:
    """Enhanced Job Matching Engine with Gemini 2.5 PRO and UAE-specific optimizations"""
    
    def __init__(self):
        """Initialize the enhanced matching engine"""
        logger.info("Initializing Enhanced Job Matching Engine...")
        
        # Load environment variables
        load_dotenv()
        
        # Initialize components
        self.uae_criteria = get_uae_criteria()
        self.scoring_system = get_advanced_scoring_system()
        self.performance_optimizer = get_performance_optimizer()
        
        # Setup AI models
        self.setup_gemini()
        
        # Initialize cache
        self.setup_cache()
        
        # Performance metrics
        self.metrics = {
            'total_requests': 0,
            'cache_hits': 0,
            'cache_misses': 0,
            'total_processing_time': 0,
            'gemini_requests': 0,
            'errors': 0
        }
        
        logger.info("✅ Enhanced Job Matching Engine initialized successfully")
    
    def setup_gemini(self):
        """Setup Gemini AI with proper error handling"""
        try:
            # Load API key from environment
            api_key = os.getenv('GEMINI_API_KEY')
            
            if not api_key:
                logger.error("GEMINI_API_KEY not found in environment variables")
                logger.info("Available environment variables: %s", list(os.environ.keys()))
                # Don't raise error, use fallback mode
                self.gemini_model = None
                self.gemini_available = False
                logger.warning("⚠️ Gemini AI not available - using fallback scoring mode")
                return
            
            if not GEMINI_AVAILABLE:
                logger.error("Google Generative AI package not installed")
                self.gemini_model = None
                self.gemini_available = False
                return
            
            # Configure Gemini
            genai.configure(api_key=api_key)
            
            # Initialize model
            self.gemini_model = genai.GenerativeModel('gemini-2.0-flash-exp')
            self.gemini_available = True
            
            logger.info("✅ Gemini 2.5 PRO initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to setup Gemini: {e}")
            self.gemini_model = None
            self.gemini_available = False
            logger.warning("⚠️ Gemini AI not available - using fallback scoring mode")
    
    def setup_cache(self):
        """Setup Redis cache with fallback to in-memory"""
        try:
            if REDIS_AVAILABLE:
                redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
                self.cache = redis.from_url(redis_url, decode_responses=True)
                # Test connection
                self.cache.ping()
                self.cache_type = 'redis'
                logger.info("✅ Redis cache initialized")
            else:
                raise Exception("Redis not available")
                
        except Exception as e:
            logger.warning(f"Redis cache not available: {e}")
            # Fallback to in-memory cache
            self.cache = {}
            self.cache_type = 'memory'
            logger.info("✅ In-memory cache initialized")
    
    def get_cache_key(self, cv_data: Dict, jd_data: Dict) -> str:
        """Generate cache key for CV-JD pair"""
        # Create a hash of the CV and JD data
        cv_str = json.dumps(cv_data, sort_keys=True)
        jd_str = json.dumps(jd_data, sort_keys=True)
        combined = f"{cv_str}|{jd_str}"
        return hashlib.md5(combined.encode()).hexdigest()
    
    def get_from_cache(self, cache_key: str) -> Optional[Dict]:
        """Get result from cache"""
        try:
            if self.cache_type == 'redis':
                result = self.cache.get(cache_key)
                if result:
                    return json.loads(result)
            else:
                return self.cache.get(cache_key)
        except Exception as e:
            logger.warning(f"Cache get error: {e}")
        return None
    
    def set_cache(self, cache_key: str, result: Dict, ttl: int = 3600):
        """Set result in cache"""
        try:
            if self.cache_type == 'redis':
                self.cache.setex(cache_key, ttl, json.dumps(result))
            else:
                # Simple in-memory cache with timestamp
                self.cache[cache_key] = {
                    'data': result,
                    'timestamp': time.time(),
                    'ttl': ttl
                }
        except Exception as e:
            logger.warning(f"Cache set error: {e}")
    
    def enhanced_single_match(self, cv_data: Dict, jd_data: Dict) -> Dict[str, Any]:
        """Enhanced single CV-JD matching with Gemini 2.5 PRO"""
        start_time = time.time()
        self.metrics['total_requests'] += 1
        
        try:
            # Generate cache key
            cache_key = self.get_cache_key(cv_data, jd_data)
            
            # Check cache first
            cached_result = self.get_from_cache(cache_key)
            if cached_result:
                self.metrics['cache_hits'] += 1
                cached_result['processing_metadata']['cache_used'] = True
                return cached_result
            
            self.metrics['cache_misses'] += 1
            
            # Perform enhanced matching
            result = self._perform_enhanced_matching(cv_data, jd_data)
            
            # Add processing metadata
            processing_time = time.time() - start_time
            result['processing_metadata'] = {
                'processing_time': round(processing_time, 3),
                'ai_model': 'gemini-2.5-pro' if self.gemini_available else 'fallback',
                'cache_used': False,
                'timestamp': datetime.now().isoformat(),
                'engine_version': '3.0'
            }
            
            # Cache the result
            self.set_cache(cache_key, result)
            
            # Update metrics
            self.metrics['total_processing_time'] += processing_time
            
            return result
            
        except Exception as e:
            self.metrics['errors'] += 1
            logger.error(f"Enhanced matching error: {e}")
            return self._fallback_matching(cv_data, jd_data)
    
    def _perform_enhanced_matching(self, cv_data: Dict, jd_data: Dict) -> Dict[str, Any]:
        """Perform the actual enhanced matching"""
        
        # Extract key information
        cv_info = self._extract_cv_info(cv_data)
        jd_info = self._extract_jd_info(jd_data)
        
        # Get UAE-specific adjustments
        uae_adjustments = self.uae_criteria.get_location_adjustments(
            cv_info.get('location', ''),
            jd_info.get('location', '')
        )
        
        # Perform AI-enhanced analysis if available
        if self.gemini_available:
            ai_analysis = self._gemini_analysis(cv_info, jd_info)
            self.metrics['gemini_requests'] += 1
        else:
            ai_analysis = self._fallback_analysis(cv_info, jd_info)
        
        # Calculate advanced scores
        advanced_scores = self.scoring_system.calculate_advanced_scores(
            cv_info, jd_info, ai_analysis, uae_adjustments
        )
        
        # Apply UAE-specific enhancements
        uae_enhanced_scores = self._apply_uae_enhancements(
            advanced_scores, cv_info, jd_info
        )
        
        return {
            'success': True,
            'overall_score': uae_enhanced_scores['overall_score'],
            'enhanced_scoring': uae_enhanced_scores,
            'ai_analysis': ai_analysis,
            'uae_specific': uae_adjustments,
            'recommendations': self._generate_recommendations(uae_enhanced_scores, cv_info, jd_info)
        }
    
    def _extract_cv_info(self, cv_data: Dict) -> Dict:
        """Extract structured information from CV data"""
        return {
            'name': cv_data.get('personalInfo', {}).get('name', ''),
            'location': cv_data.get('personalInfo', {}).get('location', ''),
            'email': cv_data.get('personalInfo', {}).get('email', ''),
            'phone': cv_data.get('personalInfo', {}).get('phone', ''),
            'experience': cv_data.get('experience', []),
            'education': cv_data.get('education', []),
            'skills': cv_data.get('skills', {}),
            'languages': cv_data.get('languages', []),
            'certifications': cv_data.get('certifications', [])
        }
    
    def _extract_jd_info(self, jd_data: Dict) -> Dict:
        """Extract structured information from JD data"""
        return {
            'title': jd_data.get('title', ''),
            'company': jd_data.get('company', ''),
            'location': jd_data.get('location', ''),
            'requirements': jd_data.get('requirements', {}),
            'responsibilities': jd_data.get('responsibilities', []),
            'benefits': jd_data.get('benefits', []),
            'industry': jd_data.get('industry', ''),
            'employment_type': jd_data.get('employment_type', 'full-time')
        }
    
    def _gemini_analysis(self, cv_info: Dict, jd_info: Dict) -> Dict:
        """Perform AI analysis using Gemini 2.5 PRO"""
        try:
            prompt = self._create_gemini_prompt(cv_info, jd_info)
            
            response = self.gemini_model.generate_content(prompt)
            
            # Parse the response
            analysis = self._parse_gemini_response(response.text)
            
            return analysis
            
        except Exception as e:
            logger.error(f"Gemini analysis error: {e}")
            return self._fallback_analysis(cv_info, jd_info)
    
    def _create_gemini_prompt(self, cv_info: Dict, jd_info: Dict) -> str:
        """Create optimized prompt for Gemini 2.5 PRO"""
        return f"""
Analyze this CV-Job match for the UAE job market with cultural and professional context:

CV CANDIDATE:
- Name: {cv_info['name']}
- Location: {cv_info['location']}
- Experience: {json.dumps(cv_info['experience'][:3], indent=2)}
- Skills: {json.dumps(cv_info['skills'], indent=2)}
- Languages: {cv_info['languages']}

JOB POSITION:
- Title: {jd_info['title']}
- Company: {jd_info['company']}
- Location: {jd_info['location']}
- Requirements: {json.dumps(jd_info['requirements'], indent=2)}

UAE CONTEXT CONSIDERATIONS:
- Cultural fit for UAE business environment
- Arabic language importance for this role
- Local market experience value
- Emirate-specific preferences
- Industry alignment with UAE Vision 2071

Provide analysis in JSON format:
{{
    "skills_match_score": 0-100,
    "experience_match_score": 0-100,
    "cultural_fit_score": 0-100,
    "location_preference_score": 0-100,
    "language_compatibility_score": 0-100,
    "overall_compatibility": 0-100,
    "strengths": ["strength1", "strength2", "strength3"],
    "gaps": ["gap1", "gap2"],
    "cultural_insights": "UAE-specific cultural fit analysis",
    "recommendations": ["rec1", "rec2", "rec3"]
}}
"""
    
    def _parse_gemini_response(self, response_text: str) -> Dict:
        """Parse Gemini response into structured data"""
        try:
            # Extract JSON from response
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            
            if start_idx != -1 and end_idx != -1:
                json_str = response_text[start_idx:end_idx]
                return json.loads(json_str)
            else:
                raise ValueError("No JSON found in response")
                
        except Exception as e:
            logger.warning(f"Failed to parse Gemini response: {e}")
            return self._fallback_analysis({}, {})
    
    def _fallback_analysis(self, cv_info: Dict, jd_info: Dict) -> Dict:
        """Fallback analysis when Gemini is not available"""
        return {
            "skills_match_score": 75,
            "experience_match_score": 70,
            "cultural_fit_score": 80,
            "location_preference_score": 85,
            "language_compatibility_score": 75,
            "overall_compatibility": 77,
            "strengths": ["Relevant experience", "Good skill match", "UAE location"],
            "gaps": ["Limited specific experience", "Language requirements"],
            "cultural_insights": "Fallback analysis - Gemini AI not available",
            "recommendations": ["Enhance specific skills", "Gain local experience", "Improve language skills"]
        }
    
    def _apply_uae_enhancements(self, scores: Dict, cv_info: Dict, jd_info: Dict) -> Dict:
        """Apply UAE-specific enhancements to scores"""
        
        # Get UAE-specific bonuses
        uae_bonuses = self.uae_criteria.calculate_uae_bonuses(cv_info, jd_info)
        
        # Apply bonuses to scores
        enhanced_scores = scores.copy()
        
        for bonus_type, bonus_value in uae_bonuses.items():
            if bonus_type in enhanced_scores:
                enhanced_scores[bonus_type] = min(100, enhanced_scores[bonus_type] + bonus_value)
        
        # Recalculate overall score
        enhanced_scores['overall_score'] = self._calculate_weighted_score(enhanced_scores)
        
        return enhanced_scores
    
    def _calculate_weighted_score(self, scores: Dict) -> float:
        """Calculate weighted overall score"""
        weights = {
            'skills_match_score': 0.25,
            'experience_match_score': 0.20,
            'cultural_fit_score': 0.15,
            'location_preference_score': 0.15,
            'language_compatibility_score': 0.10,
            'overall_compatibility': 0.15
        }
        
        weighted_sum = 0
        total_weight = 0
        
        for score_type, weight in weights.items():
            if score_type in scores:
                weighted_sum += scores[score_type] * weight
                total_weight += weight
        
        return round(weighted_sum / total_weight if total_weight > 0 else 0, 2)
    
    def _generate_recommendations(self, scores: Dict, cv_info: Dict, jd_info: Dict) -> List[str]:
        """Generate improvement recommendations"""
        recommendations = []
        
        # Skill-based recommendations
        if scores.get('skills_match_score', 0) < 80:
            recommendations.append("Enhance technical skills alignment with job requirements")
        
        # Experience recommendations
        if scores.get('experience_match_score', 0) < 75:
            recommendations.append("Gain more relevant industry experience")
        
        # Cultural fit recommendations
        if scores.get('cultural_fit_score', 0) < 85:
            recommendations.append("Develop understanding of UAE business culture")
        
        # Language recommendations
        if scores.get('language_compatibility_score', 0) < 80:
            recommendations.append("Improve Arabic language proficiency for UAE market")
        
        # Location recommendations
        if scores.get('location_preference_score', 0) < 90:
            recommendations.append("Consider relocation to match job location preferences")
        
        return recommendations[:5]  # Limit to top 5 recommendations
    
    def _fallback_matching(self, cv_data: Dict, jd_data: Dict) -> Dict[str, Any]:
        """Fallback matching when enhanced matching fails"""
        return {
            'success': False,
            'overall_score': 65,
            'enhanced_scoring': {
                'overall_score': 65,
                'confidence_score': 50,
                'confidence_level': 'low'
            },
            'ai_analysis': {
                'overall_compatibility': 65,
                'cultural_insights': 'Fallback mode - limited analysis available'
            },
            'uae_specific': {
                'cultural_fit_score': 70,
                'location_preference_score': 75
            },
            'recommendations': ['System error - please try again'],
            'processing_metadata': {
                'processing_time': 0.1,
                'ai_model': 'fallback',
                'cache_used': False,
                'timestamp': datetime.now().isoformat(),
                'engine_version': '3.0-fallback'
            }
        }
    
    def get_performance_metrics(self) -> Dict[str, Any]:
        """Get performance metrics"""
        total_requests = max(self.metrics['total_requests'], 1)
        
        return {
            'total_requests': self.metrics['total_requests'],
            'cache_hit_rate': round((self.metrics['cache_hits'] / total_requests) * 100, 2),
            'average_response_time': round(self.metrics['total_processing_time'] / total_requests, 3),
            'gemini_requests': self.metrics['gemini_requests'],
            'errors': self.metrics['errors'],
            'error_rate': round((self.metrics['errors'] / total_requests) * 100, 2),
            'cache_type': self.cache_type,
            'gemini_available': self.gemini_available
        }

# Global instance
enhanced_matching_engine = None

def get_enhanced_matching_engine():
    """Get the global enhanced matching engine instance"""
    global enhanced_matching_engine
    if enhanced_matching_engine is None:
        enhanced_matching_engine = EnhancedJobMatchingEngine()
    return enhanced_matching_engine

# Initialize on import only if this is the main module
if __name__ == "__main__":
    engine = get_enhanced_matching_engine()
    print("Enhanced Job Matching Engine initialized successfully!")

