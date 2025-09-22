-- Create optimized RPC function for scholarships with application counts
CREATE OR REPLACE FUNCTION get_scholarships_with_counts(provider_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  provider TEXT,
  provider_type TEXT,
  eligibility_criteria JSONB,
  amount NUMERIC,
  currency TEXT,
  application_deadline TIMESTAMP WITH TIME ZONE,
  requirements TEXT[],
  contact_email TEXT,
  contact_phone TEXT,
  website_url TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  application_counts JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.title,
    s.description,
    s.provider,
    s.provider_type,
    s.eligibility_criteria,
    s.amount,
    s.currency,
    s.application_deadline,
    s.requirements,
    s.contact_email,
    s.contact_phone,
    s.website_url,
    s.is_active,
    s.created_at,
    s.updated_at,
    s.created_by,
    COALESCE(
      jsonb_build_object(
        'pending', COALESCE(app_counts.pending_count, 0),
        'approved', COALESCE(app_counts.approved_count, 0),
        'rejected', COALESCE(app_counts.rejected_count, 0),
        'total', COALESCE(app_counts.total_count, 0)
      ),
      jsonb_build_object('pending', 0, 'approved', 0, 'rejected', 0, 'total', 0)
    ) as application_counts
  FROM public.scholarships s
  LEFT JOIN (
    SELECT 
      sa.scholarship_id,
      COUNT(*) FILTER (WHERE sa.status = 'pending') as pending_count,
      COUNT(*) FILTER (WHERE sa.status = 'approved') as approved_count,
      COUNT(*) FILTER (WHERE sa.status = 'rejected') as rejected_count,
      COUNT(*) as total_count
    FROM public.scholarship_applications sa
    GROUP BY sa.scholarship_id
  ) app_counts ON s.id = app_counts.scholarship_id
  WHERE (provider_id IS NULL OR s.created_by = provider_id)
    AND COALESCE(s.is_active, true) = true
  ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Create optimized RPC function for summer camps with enrollment counts
CREATE OR REPLACE FUNCTION get_camps_with_counts(institution_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  organizer TEXT,
  category TEXT,
  age_group TEXT,
  location TEXT,
  start_date DATE,
  end_date DATE,
  duration TEXT,
  price NUMERIC,
  capacity INTEGER,
  enrolled INTEGER,
  image_url TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  status TEXT,
  currency TEXT,
  max_participants INTEGER,
  registration_deadline DATE,
  rating NUMERIC,
  enrollment_counts JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sc.id,
    sc.title,
    sc.description,
    sc.organizer,
    sc.category,
    sc.age_group,
    sc.location,
    sc.start_date,
    sc.end_date,
    sc.duration,
    sc.price,
    sc.capacity,
    sc.enrolled,
    sc.image_url,
    sc.tags,
    sc.created_at,
    sc.updated_at,
    sc.created_by,
    COALESCE(sc.status, 'active'::TEXT) as status,
    COALESCE(sc.currency, 'AED'::TEXT) as currency,
    sc.max_participants,
    sc.registration_deadline,
    sc.rating,
    COALESCE(
      jsonb_build_object(
        'confirmed', COALESCE(enroll_counts.confirmed_count, 0),
        'cancelled', COALESCE(enroll_counts.cancelled_count, 0),
        'waiting_list', COALESCE(enroll_counts.waiting_list_count, 0),
        'total', COALESCE(enroll_counts.total_count, 0)
      ),
      jsonb_build_object('confirmed', 0, 'cancelled', 0, 'waiting_list', 0, 'total', 0)
    ) as enrollment_counts
  FROM public.summer_camps sc
  LEFT JOIN (
    SELECT 
      ce.camp_id,
      COUNT(*) FILTER (WHERE ce.status = 'confirmed') as confirmed_count,
      COUNT(*) FILTER (WHERE ce.status = 'cancelled') as cancelled_count,
      COUNT(*) FILTER (WHERE ce.status = 'waiting_list') as waiting_list_count,
      COUNT(*) as total_count
    FROM public.camp_enrollments ce
    GROUP BY ce.camp_id
  ) enroll_counts ON sc.id = enroll_counts.camp_id
  WHERE (institution_id IS NULL OR sc.created_by = institution_id)
  ORDER BY sc.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Create optimized RPC function for advisors with session counts
CREATE OR REPLACE FUNCTION get_advisors_with_session_counts()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  specialization TEXT,
  bio TEXT,
  availability JSONB,
  is_active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  session_counts JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ca.id,
    ca.user_id,
    ca.specialization,
    ca.bio,
    ca.availability,
    ca.is_active,
    ca.created_at,
    ca.updated_at,
    COALESCE(
      jsonb_build_object(
        'scheduled', COALESCE(session_counts.scheduled_count, 0),
        'completed', COALESCE(session_counts.completed_count, 0),
        'cancelled', COALESCE(session_counts.cancelled_count, 0),
        'total', COALESCE(session_counts.total_count, 0),
        'average_rating', ROUND(COALESCE(session_counts.avg_rating, 0), 2)
      ),
      jsonb_build_object('scheduled', 0, 'completed', 0, 'cancelled', 0, 'total', 0, 'average_rating', 0)
    ) as session_counts
  FROM public.career_advisors ca
  LEFT JOIN (
    SELECT 
      ads.advisor_id,
      COUNT(*) FILTER (WHERE ads.status = 'scheduled') as scheduled_count,
      COUNT(*) FILTER (WHERE ads.status = 'completed') as completed_count,
      COUNT(*) FILTER (WHERE ads.status = 'cancelled') as cancelled_count,
      COUNT(*) as total_count,
      AVG(ads.rating) FILTER (WHERE ads.rating IS NOT NULL) as avg_rating
    FROM public.advisory_sessions ads
    GROUP BY ads.advisor_id
  ) session_counts ON ca.id = session_counts.advisor_id
  WHERE COALESCE(ca.is_active, true) = true
  ORDER BY session_counts.total_count DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Create optimized RPC function for user's assessment performance overview
CREATE OR REPLACE FUNCTION get_user_assessment_performance(target_user_id UUID)
RETURNS TABLE (
  assessment_id UUID,
  assessment_title TEXT,
  session_count BIGINT,
  average_score NUMERIC,
  latest_session_date TIMESTAMP WITH TIME ZONE,
  coaching_recommended_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id as assessment_id,
    a.title as assessment_title,
    COUNT(asess.id) as session_count,
    ROUND(AVG(asess.score), 2) as average_score,
    MAX(asess.completed_date) as latest_session_date,
    COUNT(*) FILTER (WHERE asess.coaching_recommended = true) as coaching_recommended_count
  FROM public.assessments a
  LEFT JOIN public.assessment_sessions asess ON a.id = asess.assessment_id 
    AND asess.user_id = target_user_id 
    AND asess.status = 'completed'
  WHERE COALESCE(a.is_active, true) = true
  GROUP BY a.id, a.title
  ORDER BY latest_session_date DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;