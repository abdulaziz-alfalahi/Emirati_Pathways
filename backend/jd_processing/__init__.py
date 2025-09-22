"""
JD Processing Package Initialization
Makes the jd_processing directory a Python package
"""

# This file makes the jd_processing directory a Python package
# and allows imports from the enhanced_jd_routes module

from .enhanced_jd_routes import register_enhanced_jd_routes

__all__ = ['register_enhanced_jd_routes']
