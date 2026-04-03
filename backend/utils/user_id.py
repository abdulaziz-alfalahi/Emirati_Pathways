#!/usr/bin/env python3
"""
Shared User ID Normalization Utility
Emirati Journey Platform - Single source of truth for user identity handling
"""

import uuid


def get_normalized_user_id(identity):
    """
    Normalize user identity to a consistent UUID string.
    
    Handles:
    - Dict identities (extracts 'id' key)
    - Legacy integer IDs (preserved as-is)
    - Valid UUID strings (normalized)
    - Email / arbitrary strings (hashed to UUID5)
    
    Args:
        identity: Raw identity from JWT or other source
        
    Returns:
        Normalized string identifier, or None if identity is falsy
    """
    if not identity:
        return None

    if isinstance(identity, dict):
        identity = identity.get('id')

    identity_str = str(identity).strip()

    # Legacy Integer ID Support
    if identity_str.isdigit():
        return identity_str

    try:
        # Check if already valid UUID
        return str(uuid.UUID(identity_str))
    except ValueError:
        # If not, hash strictly using DNS namespace
        return str(uuid.uuid5(uuid.NAMESPACE_DNS, identity_str))
