"""
Centralized database utilities for the Emirati Pathways platform.

Provides `get_db()`, `close_db()`, and `execute_query()` functions used across
all blueprint route modules. This module replaces the inline database code
that was previously in app.py (lines 856–956).

Usage:
    from backend.db_utils import get_db, execute_query, DATABASE_CONFIG
"""

import os
import logging
import psycopg2
import psycopg2.extras
from flask import g

logger = logging.getLogger(__name__)

# Database configuration from environment
DATABASE_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
    'port': int(os.getenv('DB_PORT', 5432))
}


def get_db():
    """Get database connection from Flask request context (g)."""
    if 'db' not in g:
        try:
            g.db = psycopg2.connect(**DATABASE_CONFIG)
        except psycopg2.Error as e:
            logger.error(f"Database connection error: {e}")
            return None
    return g.db


def close_db(e=None):
    """Close database connection."""
    db_conn = g.pop('db', None)
    if db_conn is not None:
        db_conn.close()


def execute_query(query, params=None, fetch_one=False, fetch_all=True):
    """Execute database query with error handling.
    
    Args:
        query: SQL query string
        params: Query parameters (tuple)
        fetch_one: If True, return single row
        fetch_all: If True, return all rows (default)
    
    Returns:
        Query results as list of RealDictRow, single RealDictRow, or None
    """
    db_conn = None
    try:
        db_conn = get_db()
        if not db_conn:
            return None

        cursor = db_conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute(query, params)

        if fetch_one:
            result = cursor.fetchone()
        elif fetch_all:
            result = cursor.fetchall()
        else:
            result = None

        db_conn.commit()
        cursor.close()
        return result
    except psycopg2.Error as e:
        logger.error(f"Database query error: {e}")
        if db_conn:
            db_conn.rollback()
        return None
