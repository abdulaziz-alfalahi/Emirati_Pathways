
-- Create user journey analytics table
CREATE TABLE IF NOT EXISTS public.user_journey_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  phase TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}',
  session_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

-- Create feature usage analytics table
CREATE TABLE IF NOT EXISTS public.feature_usage_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  feature_name TEXT NOT NULL,
  phase TEXT NOT NULL,
  action_type TEXT NOT NULL,
  duration_seconds INTEGER,
  success_rate NUMERIC,
  error_data JSONB,
  usage_context JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create A/B testing experiments table
CREATE TABLE IF NOT EXISTS public.ab_testing_experiments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  experiment_name TEXT NOT NULL,
  feature_name TEXT NOT NULL,
  hypothesis TEXT,
  variant_a_config JSONB NOT NULL,
  variant_b_config JSONB NOT NULL,
  success_metric TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'draft',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create A/B testing assignments table
CREATE TABLE IF NOT EXISTS public.ab_testing_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  experiment_id UUID NOT NULL REFERENCES public.ab_testing_experiments(id),
  user_id UUID NOT NULL,
  variant TEXT NOT NULL CHECK (variant IN ('A', 'B')),
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(experiment_id, user_id)
);

-- Create analytics consent table
CREATE TABLE IF NOT EXISTS public.analytics_consent (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE,
  essential_analytics BOOLEAN NOT NULL DEFAULT true,
  performance_analytics BOOLEAN NOT NULL DEFAULT false,
  personalization_analytics BOOLEAN NOT NULL DEFAULT false,
  marketing_analytics BOOLEAN NOT NULL DEFAULT false,
  consent_given_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  consent_updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

-- Create user journey milestones table
CREATE TABLE IF NOT EXISTS public.user_journey_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  phase TEXT NOT NULL,
  milestone_type TEXT NOT NULL,
  milestone_name TEXT NOT NULL,
  achieved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  milestone_data JSONB DEFAULT '{}',
  points_earned INTEGER DEFAULT 0
);

-- Enable RLS on new tables
ALTER TABLE public.user_journey_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_usage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_testing_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_testing_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_journey_milestones ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user journey analytics
CREATE POLICY "Users can view their own journey analytics" 
  ON public.user_journey_analytics FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert journey analytics" 
  ON public.user_journey_analytics FOR INSERT 
  WITH CHECK (true);

-- Create RLS policies for feature usage analytics
CREATE POLICY "Users can view their own feature usage" 
  ON public.feature_usage_analytics FOR SELECT 
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "System can insert feature usage analytics" 
  ON public.feature_usage_analytics FOR INSERT 
  WITH CHECK (true);

-- Create RLS policies for A/B testing
CREATE POLICY "Admins can view A/B experiments" 
  ON public.ab_testing_experiments FOR SELECT 
  USING (public.is_admin());

CREATE POLICY "Admins can manage A/B experiments" 
  ON public.ab_testing_experiments FOR ALL 
  USING (public.is_admin());

CREATE POLICY "Users can view their own A/B assignments" 
  ON public.ab_testing_assignments FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage A/B assignments" 
  ON public.ab_testing_assignments FOR ALL 
  USING (true);

-- Create RLS policies for analytics consent
CREATE POLICY "Users can manage their own consent" 
  ON public.analytics_consent FOR ALL 
  USING (auth.uid() = user_id);

-- Create RLS policies for user milestones
CREATE POLICY "Users can view their own milestones" 
  ON public.user_journey_milestones FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage user milestones" 
  ON public.user_journey_milestones FOR ALL 
  USING (true);

-- Create indexes for performance (with IF NOT EXISTS where possible)
CREATE INDEX IF NOT EXISTS idx_user_journey_analytics_user_phase ON public.user_journey_analytics(user_id, phase);
CREATE INDEX IF NOT EXISTS idx_user_journey_analytics_created_at ON public.user_journey_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_feature_usage_analytics_feature_phase ON public.feature_usage_analytics(feature_name, phase);
CREATE INDEX IF NOT EXISTS idx_ab_testing_assignments_experiment_user ON public.ab_testing_assignments(experiment_id, user_id);
