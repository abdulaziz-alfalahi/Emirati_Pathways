#!/usr/bin/env python3
"""
Shared User ID Normalization Utility
Emirati Journey Platform - Single source of truth for user identity handling

Post-EID Migration: users.id is now CHAR(15) — a 15-digit Emirates ID string.
"""

import re


def get_normalized_user_id(identity):
    """
    Normalize user identity to a consistent EID string (CHAR(15)).

    Handles:
    - Dict identities (extracts 'id' key)
    - 15-digit EID strings (returned as-is)
    - UUID strings (looked up via backward-compat — returned as-is for now)
    - Legacy integer IDs (preserved as-is for backward compat)

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

    # EID format: exactly 15 digits (primary path post-migration)
    if re.match(r'^\d{15}$', identity_str):
        return identity_str

    # Legacy Integer ID Support (backward compat during transition)
    if identity_str.isdigit():
        return identity_str

    # UUID or other string — return as-is (will match id_old_uuid if needed)
    return identity_str


def generate_synthetic_eid(sequence_number: int) -> str:
    """
    Generate a synthetic EID for system/test accounts.

    Format: 784 + 0000 + 7-digit zero-padded sequence + 0
    Example: 784000000000010

    Args:
        sequence_number: Sequential number (1-9999999)

    Returns:
        15-digit synthetic EID string
    """
    return f"784{'0000'}{sequence_number:07d}{'0'}"


def is_valid_eid(eid: str) -> bool:
    """
    Validate that a string is a valid Emirates ID (15 digits starting with 784).

    Args:
        eid: String to validate

    Returns:
        True if valid EID format
    """
    if not eid:
        return False
    clean = re.sub(r'[-\s]', '', str(eid))
    return bool(re.match(r'^784\d{12}$', clean))


def strip_eid_hyphens(eid: str) -> str:
    """
    Strip hyphens from an EID for storage.
    784-YYYY-XXXXXXX-X → 784YYYYXXXXXXXX

    Args:
        eid: EID string, possibly with hyphens

    Returns:
        15-digit stripped EID string
    """
    return re.sub(r'[-\s]', '', str(eid))
