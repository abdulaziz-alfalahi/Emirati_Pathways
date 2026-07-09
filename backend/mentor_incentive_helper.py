import logging

logger = logging.getLogger(__name__)

def award_mentor_points(conn, cursor, mentor_id, points, action_type, reference_id=None):
    """
    Awards points to a mentor, inserts an audit log into mentor_incentive_logs,
    and updates/recalculates their incentive_tier in mentor_profiles.
    
    This function accepts existing connection and cursor objects to execute within
    the caller's active database transaction.
    """
    try:
        # 1. Insert audit log into mentor_incentive_logs
        cursor.execute("""
            INSERT INTO mentor_incentive_logs (mentor_id, action_type, points_awarded, reference_id)
            VALUES (%s, %s, %s, %s)
        """, (mentor_id, action_type, points, reference_id))
        
        # 2. Update points in mentor_profiles
        cursor.execute("""
            UPDATE mentor_profiles 
            SET incentive_points = COALESCE(incentive_points, 0) + %s
            WHERE id = %s
            RETURNING incentive_points
        """, (points, mentor_id))
        
        result = cursor.fetchone()
        if not result:
            logger.warning(f"Mentor profile with id {mentor_id} not found when updating points.")
            return False
            
        new_points = result[0]
        
        # 3. Recalculate tier based on updated points
        # Bronze: < 1000
        # Silver: 1000 - 3499
        # Gold: 3500 - 7999
        # Platinum: >= 8000
        new_tier = 'bronze'
        if new_points >= 8000:
            new_tier = 'platinum'
        elif new_points >= 3500:
            new_tier = 'gold'
        elif new_points >= 1000:
            new_tier = 'silver'
            
        cursor.execute("""
            UPDATE mentor_profiles
            SET incentive_tier = %s
            WHERE id = %s
        """, (new_tier, mentor_id))
        
        logger.info(f"Awarded {points} points to mentor {mentor_id}. New points: {new_points}. Tier: {new_tier}.")
        return True
    except Exception as e:
        logger.error(f"Failed to award points to mentor {mentor_id}: {e}")
        raise e
