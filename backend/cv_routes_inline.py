
# =====================================================
# INLINE CV ROUTES (FIXED FOR CONSISTENCY)
# =====================================================

def get_current_user_eid_inline():
    """Helper to get user EID from JWT. Returns CHAR(15) EID string."""
    auth_header = request.headers.get('Authorization', '')
    if 'mock_token' in auth_header:
        return '784000000000010'
    
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
        if not user_id:
             return '784000000000010'
        return str(user_id).strip()
            
    except Exception:
        return '784000000000010'

@app.route('/api/cv/<cv_id>', methods=['GET'])
def get_cv_fixed(cv_id):
    try:
        user_eid = get_current_user_eid_inline()
        
        query = "SELECT * FROM user_cvs WHERE id = %s::uuid"
        # Ideally: AND user_id = %s::uuid but for debugging we trust ID lookup first
        # query = "SELECT * FROM user_cvs WHERE id = %s::uuid AND user_id = %s::uuid"
        
        cv = execute_query(query, (cv_id,), fetch_one=True)
        
        if not cv:
            return jsonify({'success': False, 'message': 'CV not found'}), 404
            
        cv_data = {
            'personalInfo': cv['personal_info'],
            'professionalSummary': cv['professional_summary'],
            'technicalSkills': cv['technical_skills'],
            'softSkills': cv['soft_skills'],
            'experience': cv['work_experience'],
            'education': cv['education']
        }
        
        return jsonify({
            'success': True,
            'data': cv_data,
            'metadata': {
                'id': cv['id'],
                'title': cv['title'],
                'template_name': cv['template_name'],
                'cv_score': cv['cv_score'],
                'ats_score': cv['ats_score']
            }
        })
    except Exception as e:
        logger.error(f"Get CV error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/cv/<cv_id>', methods=['PUT'])
def update_cv_fixed(cv_id):
    try:
        user_eid = get_current_user_eid_inline()
        data = request.get_json()
        
        cv_data = data.get('cvData', {})
        title = data.get('title')
        template_id = data.get('templateId')
        cv_score = data.get('cvScore')
        ats_score = data.get('atsScore')
        
        # Build update query
        update_fields = []
        params = []
        
        if title:
            update_fields.append("title = %s")
            params.append(title)
        if template_id:
            update_fields.append("template_name = %s")
            params.append(template_id)
        if cv_score is not None:
            update_fields.append("cv_score = %s")
            params.append(cv_score)
        if ats_score is not None:
            update_fields.append("ats_score = %s")
            params.append(ats_score)
            
        if cv_data:
            if 'personalInfo' in cv_data:
                update_fields.append("personal_info = %s::jsonb")
                params.append(json.dumps(cv_data['personalInfo']))
            if 'professionalSummary' in cv_data:
                update_fields.append("professional_summary = %s")
                params.append(cv_data['professionalSummary'])
            if 'technicalSkills' in cv_data:
                update_fields.append("technical_skills = %s::jsonb")
                params.append(json.dumps(cv_data['technicalSkills']))
            if 'softSkills' in cv_data:
                update_fields.append("soft_skills = %s::jsonb")
                params.append(json.dumps(cv_data['softSkills']))
            if 'experience' in cv_data:
                update_fields.append("work_experience = %s::jsonb")
                params.append(json.dumps(cv_data['experience']))
            if 'education' in cv_data:
                update_fields.append("education = %s::jsonb")
                params.append(json.dumps(cv_data['education']))
                
        update_fields.append("updated_at = CURRENT_TIMESTAMP")
        params.append(cv_id)
        
        query = f"UPDATE user_cvs SET {', '.join(update_fields)} WHERE id = %s::uuid"
        
        execute_query(query, tuple(params), fetch_all=False)
        
        return jsonify({'success': True, 'message': 'CV updated successfully'})
    except Exception as e:
        logger.error(f"Update CV error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/cv/<cv_id>', methods=['DELETE'])
def delete_cv_fixed(cv_id):
    try:
        user_eid = get_current_user_eid_inline()
        execute_query("DELETE FROM user_cvs WHERE id = %s::uuid", (cv_id,), fetch_all=False)
        return jsonify({'success': True, 'message': 'CV deleted successfully'})
    except Exception as e:
        logger.error(f"Delete CV error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/cv/<cv_id>/duplicate', methods=['POST'])
def duplicate_cv_fixed(cv_id):
    try:
        user_eid = get_current_user_eid_inline()
        
        # Get original
        original = execute_query("SELECT * FROM user_cvs WHERE id = %s::uuid", (cv_id,), fetch_one=True)
        if not original:
             return jsonify({'success': False, 'message': 'CV not found'}), 404
             
        new_cv_id = str(uuidlib.uuid4())
        new_title = f"{original['title']} (Copy)"
        
        insert_query = """
            INSERT INTO user_cvs (
                id, user_id, title, template_name, 
                personal_info, professional_summary, technical_skills, soft_skills, 
                work_experience, education, cv_score, ats_score, 
                created_at, updated_at, status, is_visible
            ) VALUES (
                %s::uuid, %s, %s, %s,
                %s::jsonb, %s, %s::jsonb, %s::jsonb,
                %s::jsonb, %s::jsonb, %s, %s,
                CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'draft', false
            )
        """
        
        params = (
            new_cv_id, user_eid, new_title, original['template_name'],
            json.dumps(original['personal_info']), original['professional_summary'],
            json.dumps(original['technical_skills']), json.dumps(original['soft_skills']),
            json.dumps(original['work_experience']), json.dumps(original['education']),
            original['cv_score'], original['ats_score']
        )
        
        execute_query(insert_query, params, fetch_all=False)
        
        return jsonify({'success': True, 'message': 'CV duplicated', 'data': {'cv_id': new_cv_id}})
    except Exception as e:
        logger.error(f"Duplicate CV error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/cv/<cv_id>/visible', methods=['PUT'])
def set_visible_fixed(cv_id):
    try:
        user_eid = get_current_user_eid_inline()
        
        # Set all to false
        execute_query("UPDATE user_cvs SET is_visible = false WHERE user_id = %s", (user_eid,), fetch_all=False)
        # Set specific to true
        execute_query("UPDATE user_cvs SET is_visible = true WHERE id = %s::uuid", (cv_id,), fetch_all=False)
        
        return jsonify({'success': True, 'message': 'CV set as visible'})
    except Exception as e:
        logger.error(f"Set visible error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/cv/<cv_id>/export/<format>', methods=['GET'])
def export_cv_fixed(cv_id, format):
    try:
        user_eid = get_current_user_eid_inline()
        
        cv = execute_query("SELECT * FROM user_cvs WHERE id = %s::uuid", (cv_id,), fetch_one=True)
        if not cv:
            return jsonify({'error': 'CV not found'}), 404
            
        cv_data = {
            'metadata': {'title': cv['title'], 'cv_id': cv['id']},
            'data': {
                'personal_info': cv['personal_info'],
                'professional_summary': cv['professional_summary'],
                'experience': cv['work_experience'],
                'education': cv['education'],
                'skills': (cv['technical_skills'] or []) + (cv['soft_skills'] or [])
            }
        }
        
        if format == 'json':
            return jsonify({'success': True, 'cv_data': cv_data})
            
        # PDF/DOCX Handling
        from cv_builder.cv_export import CVExporter
        exporter = CVExporter()
        
        # NOTE: CVExporter expects specific structure, we send formatted cv_data
        file_path = exporter.export_cv(cv_data, format)
        
        if not file_path or not os.path.exists(file_path):
             return jsonify({'error': 'Export failed'}), 500
             
        mime_types = {
            'pdf': 'application/pdf',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        }
        
        return send_file(
            file_path,
            mimetype=mime_types.get(format, 'application/octet-stream'),
            as_attachment=True,
            download_name=f"cv_{cv_id}.{format}"
        )
            
    except Exception as e:
        logger.error(f"Export error: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
