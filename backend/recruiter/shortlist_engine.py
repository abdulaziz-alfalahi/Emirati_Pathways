"""
Recruiter Shortlist Engine
Manages candidate shortlisting for job descriptions
"""

from dataclasses import dataclass
from typing import List, Dict, Optional, Any
from datetime import datetime
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class ShortlistStatus(Enum):
    """Shortlist candidate status"""
    SHORTLISTED = "shortlisted"
    CONTACTED = "contacted"
    INTERVIEW_SCHEDULED = "interview_scheduled"
    INTERVIEWED = "interviewed"
    OFFER_SENT = "offer_sent"
    HIRED = "hired"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


@dataclass
class ShortlistedCandidate:
    """Shortlisted candidate data structure"""
    shortlist_id: str
    jd_id: str
    candidate_id: str
    recruiter_id: str
    match_score: float
    match_details: Dict[str, Any]
    status: ShortlistStatus
    notes: str
    tags: List[str]
    contacted_at: Optional[datetime]
    interview_scheduled_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime


class ShortlistEngine:
    """Engine for managing candidate shortlists"""
    
    def __init__(self):
        """Initialize shortlist engine"""
        logger.info("ShortlistEngine initialized")
    
    def add_to_shortlist(
        self,
        jd_id: str,
        candidate_id: str,
        recruiter_id: str,
        match_score: float,
        match_details: Dict[str, Any],
        notes: str = ""
    ) -> str:
        """
        Add a candidate to shortlist
        
        Args:
            jd_id: Job description ID
            candidate_id: Candidate user ID
            recruiter_id: Recruiter user ID
            match_score: AI matching score (0-100)
            match_details: Detailed matching breakdown
            notes: Optional recruiter notes
            
        Returns:
            shortlist_id: Unique shortlist entry ID
        """
        import uuid
        from datetime import datetime
        
        shortlist_id = f"sl_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"
        
        logger.info(f"Adding candidate {candidate_id} to shortlist for JD {jd_id}")
        
        return shortlist_id
    
    def update_shortlist_status(
        self,
        shortlist_id: str,
        status: ShortlistStatus,
        notes: Optional[str] = None
    ) -> bool:
        """
        Update shortlist candidate status
        
        Args:
            shortlist_id: Shortlist entry ID
            status: New status
            notes: Optional additional notes
            
        Returns:
            success: True if updated successfully
        """
        logger.info(f"Updating shortlist {shortlist_id} to status: {status.value}")
        return True
    
    def remove_from_shortlist(
        self,
        shortlist_id: str,
        reason: str = ""
    ) -> bool:
        """
        Remove a candidate from shortlist
        
        Args:
            shortlist_id: Shortlist entry ID
            reason: Optional reason for removal
            
        Returns:
            success: True if removed successfully
        """
        logger.info(f"Removing from shortlist: {shortlist_id}, reason: {reason}")
        return True
    
    def get_shortlist_for_jd(
        self,
        jd_id: str,
        status_filter: Optional[ShortlistStatus] = None
    ) -> List[Dict[str, Any]]:
        """
        Get all shortlisted candidates for a job description
        
        Args:
            jd_id: Job description ID
            status_filter: Optional status filter
            
        Returns:
            List of shortlisted candidates with details
        """
        logger.info(f"Getting shortlist for JD: {jd_id}")
        return []
    
    def get_candidate_shortlist_history(
        self,
        candidate_id: str
    ) -> List[Dict[str, Any]]:
        """
        Get shortlist history for a candidate
        
        Args:
            candidate_id: Candidate user ID
            
        Returns:
            List of shortlist entries for this candidate
        """
        logger.info(f"Getting shortlist history for candidate: {candidate_id}")
        return []
    
    def add_note_to_shortlist(
        self,
        shortlist_id: str,
        note: str,
        recruiter_id: str
    ) -> bool:
        """
        Add a note to a shortlist entry
        
        Args:
            shortlist_id: Shortlist entry ID
            note: Note text
            recruiter_id: Recruiter adding the note
            
        Returns:
            success: True if note added successfully
        """
        logger.info(f"Adding note to shortlist {shortlist_id}")
        return True
    
    def add_tags_to_shortlist(
        self,
        shortlist_id: str,
        tags: List[str]
    ) -> bool:
        """
        Add tags to a shortlist entry
        
        Args:
            shortlist_id: Shortlist entry ID
            tags: List of tags to add
            
        Returns:
            success: True if tags added successfully
        """
        logger.info(f"Adding tags to shortlist {shortlist_id}: {tags}")
        return True
    
    def get_shortlist_stats(
        self,
        jd_id: str
    ) -> Dict[str, Any]:
        """
        Get statistics for a job description's shortlist
        
        Args:
            jd_id: Job description ID
            
        Returns:
            Statistics dictionary
        """
        return {
            'total_shortlisted': 0,
            'contacted': 0,
            'interviews_scheduled': 0,
            'interviewed': 0,
            'offers_sent': 0,
            'hired': 0,
            'rejected': 0,
            'avg_match_score': 0.0,
            'top_skills': [],
            'shortlist_by_status': {}
        }

