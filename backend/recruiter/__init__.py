"""
Recruiter Services Module
Emirati Journey Platform - Comprehensive Recruiter/HR Services

This module provides:
- Job Description Builder with wizard UX
- Interview Management System
- Offer Management System
- Analytics and Reporting
- AI-Powered Candidate Matching
- Export Functionality
"""

__version__ = "1.0.0"
__author__ = "Emirati Journey Platform"

# Import core components for easy access
from .recruiter_engine import RecruiterEngine, get_recruiter_engine
from .jd_builder_engine import JDBuilderEngine, get_jd_builder_engine

__all__ = [
    'RecruiterEngine',
    'JDBuilderEngine',
    'get_recruiter_engine',
    'get_jd_builder_engine',
]

