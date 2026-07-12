
# =====================================================
# INLINE CV ROUTES (FIXED FOR CONSISTENCY)
# =====================================================

def get_current_user_eid_inline():
    """Helper to get user EID from JWT. Returns CHAR(15) EID string or None if unauthenticated."""
    try:
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        if not user_id:
            return None
        return str(user_id).strip()
    except Exception:
        return None

@app.route('/api/cv/<cv_id>', methods=['GET'])
@jwt_required()
def get_cv_fixed(cv_id):
    try:
        user_id = get_jwt_identity()
        
        query = "SELECT * FROM user_cvs WHERE id = %s::uuid"
        cv = execute_query(query, (cv_id,), fetch_one=True)
        
        if not cv:
            return jsonify({'success': False, 'message': 'CV not found'}), 404

        # Ownership check — allow admin/recruiter to view any CV
        if cv['user_id'] != str(user_id):
            claims = get_jwt()
            role = claims.get('role', '')
            if role not in ['admin', 'recruiter', 'platform_administrator', 'hr_manager']:
                return jsonify({'error': 'Unauthorized - you do not own this CV'}), 403
            
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
@jwt_required()
def update_cv_fixed(cv_id):
    try:
        user_eid = str(get_jwt_identity())
        # Ownership check — only the owner may modify their CV
        owner = execute_query("SELECT user_id FROM user_cvs WHERE id = %s::uuid", (cv_id,), fetch_one=True)
        if not owner:
            return jsonify({'success': False, 'message': 'CV not found'}), 404
        if owner['user_id'] != user_eid:
            return jsonify({'error': 'Unauthorized - you do not own this CV'}), 403
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
        params.append(user_eid)

        query = f"UPDATE user_cvs SET {', '.join(update_fields)} WHERE id = %s::uuid AND user_id = %s"
        
        execute_query(query, tuple(params), fetch_all=False)
        
        return jsonify({'success': True, 'message': 'CV updated successfully'})
    except Exception as e:
        logger.error(f"Update CV error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/cv/<cv_id>', methods=['DELETE'])
@jwt_required()
def delete_cv_fixed(cv_id):
    try:
        user_eid = str(get_jwt_identity())
        # Ownership check — only the owner may delete their CV
        owner = execute_query("SELECT user_id FROM user_cvs WHERE id = %s::uuid", (cv_id,), fetch_one=True)
        if not owner:
            return jsonify({'success': False, 'message': 'CV not found'}), 404
        if owner['user_id'] != user_eid:
            return jsonify({'error': 'Unauthorized - you do not own this CV'}), 403
        execute_query("DELETE FROM user_cvs WHERE id = %s::uuid AND user_id = %s", (cv_id, user_eid), fetch_all=False)
        return jsonify({'success': True, 'message': 'CV deleted successfully'})
    except Exception as e:
        logger.error(f"Delete CV error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/cv/<cv_id>/duplicate', methods=['POST'])
@jwt_required()
def duplicate_cv_fixed(cv_id):
    try:
        user_eid = str(get_jwt_identity())

        # Get original
        original = execute_query("SELECT * FROM user_cvs WHERE id = %s::uuid", (cv_id,), fetch_one=True)
        if not original:
             return jsonify({'success': False, 'message': 'CV not found'}), 404
        # Ownership check — only the owner may duplicate their CV
        if original['user_id'] != user_eid:
             return jsonify({'error': 'Unauthorized - you do not own this CV'}), 403

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
@jwt_required()
def set_visible_fixed(cv_id):
    try:
        user_eid = str(get_jwt_identity())
        # Ownership check — only the owner may change their CV visibility
        owner = execute_query("SELECT user_id FROM user_cvs WHERE id = %s::uuid", (cv_id,), fetch_one=True)
        if not owner:
            return jsonify({'success': False, 'message': 'CV not found'}), 404
        if owner['user_id'] != user_eid:
            return jsonify({'error': 'Unauthorized - you do not own this CV'}), 403

        # Set all to false
        execute_query("UPDATE user_cvs SET is_visible = false WHERE user_id = %s", (user_eid,), fetch_all=False)
        # Set specific to true
        execute_query("UPDATE user_cvs SET is_visible = true WHERE id = %s::uuid AND user_id = %s", (cv_id, user_eid), fetch_all=False)
        
        return jsonify({'success': True, 'message': 'CV set as visible'})
    except Exception as e:
        logger.error(f"Set visible error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/cv/<cv_id>/export/<format>', methods=['GET'])
@jwt_required()
def export_cv_fixed(cv_id, format):
    try:
        user_eid = str(get_jwt_identity())

        cv = execute_query("SELECT * FROM user_cvs WHERE id = %s::uuid", (cv_id,), fetch_one=True)
        if not cv:
            return jsonify({'error': 'CV not found'}), 404
        # Ownership check — only the owner may export/download their CV
        if cv['user_id'] != user_eid:
            return jsonify({'error': 'Unauthorized - you do not own this CV'}), 403

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
