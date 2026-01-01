"""
User ID Utility Functions

This module provides consistent user ID handling across all backend endpoints.
It ensures that user IDs from JWT tokens are converted to UUIDs in a consistent manner.
"""

import uuid as uuidlib
from typing import Optional, Tuple
import logging

logger = logging.getLogger(__name__)

# Default placeholder UUIDs for development/testing
DEFAULT_USER_UUID = '00000000-0000-0000-0000-000000000001'
MOCK_USER_UUID = '550e8400-e29b-41d4-a716-446655440000'

# List of known placeholder UUIDs that may be used in test data
PLACEHOLDER_UUIDS = [
    DEFAULT_USER_UUID,
    MOCK_USER_UUID,
]


def convert_user_id_to_uuid(user_id: str) -> str:
    """
    Convert a user ID to a consistent UUID format.
    
    This function handles various user ID formats:
    - If already a valid UUID, returns it as-is
    - If an integer or string number (like "21"), converts using uuid5
    - If a string (like email), converts using uuid5
    
    Args:
        user_id: The user ID from JWT token or other source
        
    Returns:
        A valid UUID string
    """
    if not user_id:
        return DEFAULT_USER_UUID
    
    user_id_str = str(user_id)
    
    # Check if already a valid UUID
    try:
        uuidlib.UUID(user_id_str)
        return user_id_str
    except ValueError:
        pass
    
    # Convert non-UUID to UUID using uuid5 for consistency
    return str(uuidlib.uuid5(uuidlib.NAMESPACE_DNS, user_id_str))


def get_all_possible_user_uuids(user_id: str) -> list:
    """
    Get all possible UUID representations for a user ID.
    
    This is useful for querying the database when we're not sure
    which UUID format was used to store the data.
    
    Args:
        user_id: The user ID from JWT token
        
    Returns:
        A list of possible UUIDs to check
    """
    possible_uuids = []
    
    if not user_id:
        return PLACEHOLDER_UUIDS.copy()
    
    user_id_str = str(user_id)
    
    # 1. Try the original user_id if it's a valid UUID
    try:
        uuidlib.UUID(user_id_str)
        possible_uuids.append(user_id_str)
    except ValueError:
        pass
    
    # 2. Try uuid5 conversion (the standard conversion)
    uuid5_result = str(uuidlib.uuid5(uuidlib.NAMESPACE_DNS, user_id_str))
    if uuid5_result not in possible_uuids:
        possible_uuids.append(uuid5_result)
    
    # 3. Add placeholder UUIDs for backward compatibility with test data
    for placeholder in PLACEHOLDER_UUIDS:
        if placeholder not in possible_uuids:
            possible_uuids.append(placeholder)
    
    return possible_uuids


def get_user_uuid_from_request(request, get_jwt_identity, verify_jwt_in_request) -> Tuple[str, str]:
    """
    Extract and convert user ID from a Flask request.
    
    Args:
        request: Flask request object
        get_jwt_identity: JWT function to get identity
        verify_jwt_in_request: JWT function to verify request
        
    Returns:
        Tuple of (user_uuid, original_user_id)
    """
    auth_header = request.headers.get('Authorization', '')
    
    # Handle mock tokens for development
    if 'mock_token' in auth_header:
        return DEFAULT_USER_UUID, 'mock_user_candidate'
    
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
        
        if not user_id:
            return DEFAULT_USER_UUID, 'anonymous_user'
        
        user_uuid = convert_user_id_to_uuid(user_id)
        return user_uuid, str(user_id)
        
    except Exception as e:
        logger.warning(f"Error extracting user ID from request: {e}")
        return DEFAULT_USER_UUID, 'anonymous_user'
