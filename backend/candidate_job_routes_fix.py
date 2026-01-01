"""
Fixed get_candidate_cv function with improved user ID handling
"""

def get_candidate_cv(user_id):
    """Get the candidate's most recent CV from the database
    
    Checks multiple tables in order of priority:
    1. user_cvs - where CV Builder saves data
    2. cv_profiles - legacy CV storage
    3. cv_data - another legacy table
    
    Handles multiple user ID formats:
    - UUID strings
    - Integer IDs (converted to UUID using uuid5)
    """
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            logger.warning("Database connection not available for CV lookup")
            return None
        
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Build list of user IDs to try (handles multiple formats)
        user_ids_to_try = []
        
        # 1. Try original user_id if it's a valid UUID
        try:
            uuidlib.UUID(str(user_id))
            user_ids_to_try.append(str(user_id))
        except ValueError:
            pass
        
        # 2. Convert non-UUID to UUID using uuid5 (same as get_current_user_uuid_inline in unified_server.py)
        converted_uuid = str(uuidlib.uuid5(uuidlib.NAMESPACE_DNS, str(user_id)))
        if converted_uuid not in user_ids_to_try:
            user_ids_to_try.append(converted_uuid)
            logger.info(f"Converted user_id '{user_id}' to UUID: {converted_uuid}")
        
        logger.info(f"Trying user IDs for CV lookup: {user_ids_to_try}")
        
        # First, try user_cvs table (where CV Builder saves data)
        # This is the primary table used by the modern CV Builder
        for uid in user_ids_to_try:
            try:
                cur.execute("""
                    SELECT id, title, template_name, personal_info, professional_summary,
                           technical_skills, soft_skills, work_experience, education,
                           cv_score, ats_score, status, created_at, updated_at
                    FROM user_cvs 
                    WHERE user_id = %s::uuid
                    ORDER BY updated_at DESC 
                    LIMIT 1
                """, (uid,))
                
                result = cur.fetchone()
                if result:
                    logger.info(f"Found CV in user_cvs table for user {uid} (original: {user_id})")
                    # Reconstruct CV data in the expected format
                    cv_data = {
                        'personalInfo': result.get('personal_info') or {},
                        'professionalSummary': result.get('professional_summary') or '',
                        'technicalSkills': result.get('technical_skills') or [],
                        'softSkills': result.get('soft_skills') or [],
                        'experience': result.get('work_experience') or [],
                        'education': result.get('education') or [],
                        'skills': [],  # Will be populated from technicalSkills
                        '_source': 'user_cvs',
                        '_cv_id': str(result.get('id', '')),
                        '_title': result.get('title', 'My CV')
                    }
                    
                    # Combine technical and soft skills into skills array
                    tech_skills = cv_data.get('technicalSkills', [])
                    soft_skills = cv_data.get('softSkills', [])
                    if isinstance(tech_skills, list):
                        cv_data['skills'].extend(tech_skills)
                    if isinstance(soft_skills, list):
                        cv_data['skills'].extend(soft_skills)
                    
                    return cv_data
            except Exception as e:
                logger.warning(f"Error querying user_cvs table with uid {uid}: {e}")
        
        # Try cv_profiles table (legacy) with all user IDs
        for uid in user_ids_to_try:
            try:
                cur.execute("""
                    SELECT cv_data, parsed_data, raw_text 
                    FROM cv_profiles 
                    WHERE user_id = %s 
                    ORDER BY updated_at DESC 
                    LIMIT 1
                """, (uid,))
                
                result = cur.fetchone()
                if result:
                    cv_data = result.get('cv_data') or result.get('parsed_data')
                    if cv_data:
                        logger.info(f"Found CV in cv_profiles table for user {uid}")
                        if isinstance(cv_data, str):
                            try:
                                return json.loads(cv_data)
                            except json.JSONDecodeError:
                                pass
                        return cv_data
            except Exception as e:
                logger.warning(f"Error querying cv_profiles table with uid {uid}: {e}")
        
        # Try cv_data table (legacy fallback) with all user IDs
        for uid in user_ids_to_try:
            try:
                cur.execute("""
                    SELECT data 
                    FROM cv_data 
                    WHERE user_id = %s 
                    ORDER BY updated_at DESC 
                    LIMIT 1
                """, (uid,))
                
                result = cur.fetchone()
                if result and result.get('data'):
                    logger.info(f"Found CV in cv_data table for user {uid}")
                    data = result['data']
                    if isinstance(data, str):
                        try:
                            return json.loads(data)
                        except json.JSONDecodeError:
                            pass
                    return data
            except Exception as e:
                logger.warning(f"Error querying cv_data table with uid {uid}: {e}")
        
        logger.info(f"No CV found for user {user_id} (tried: {user_ids_to_try}) in any table")
        return None
        
    except Exception as e:
        logger.error(f"Error fetching candidate CV: {e}")
        return None
    finally:
        if conn:
            conn.close()
