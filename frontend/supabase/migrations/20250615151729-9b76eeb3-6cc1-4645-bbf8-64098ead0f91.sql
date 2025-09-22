-- Create cross-phase integration tables for citizen journey tracking

-- Create citizen journey profiles table
CREATE TABLE public.citizen_journey_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_phase TEXT NOT NULL DEFAULT 'education'::TEXT,
  profile_data JSONB NOT NULL DEFAULT '{}'::JSONB,
  skills_portfolio JSONB NOT NULL DEFAULT '{}'::JSONB,
  achievements JSONB NOT NULL DEFAULT '{}'::JSONB,
  interests_and_goals JSONB NOT NULL DEFAULT '{}'::JSONB,
  progress_metrics JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create phase transitions table
CREATE TABLE public.phase_transitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_phase TEXT NOT NULL,
  to_phase TEXT NOT NULL,
  transition_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  transition_data JSONB NOT NULL DEFAULT '{}'::JSONB,
  readiness_score NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cross-phase recommendations table
CREATE TABLE public.cross_phase_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL,
  recommendation_data JSONB NOT NULL DEFAULT '{}'::JSONB,
  priority_score NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active'::TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create data integration requests table
CREATE TABLE public.data_integration_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_phase TEXT NOT NULL,
  target_phase TEXT NOT NULL,
  data_type TEXT NOT NULL,
  request_data JSONB NOT NULL DEFAULT '{}'::JSONB,
  status TEXT NOT NULL DEFAULT 'pending'::TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.citizen_journey_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phase_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cross_phase_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_integration_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for citizen_journey_profiles
CREATE POLICY "Users can view their own journey profile" 
ON public.citizen_journey_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own journey profile" 
ON public.citizen_journey_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own journey profile" 
ON public.citizen_journey_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for phase_transitions
CREATE POLICY "Users can view their own phase transitions" 
ON public.phase_transitions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own phase transitions" 
ON public.phase_transitions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for cross_phase_recommendations
CREATE POLICY "Users can view their own recommendations" 
ON public.cross_phase_recommendations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own recommendations" 
ON public.cross_phase_recommendations 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for data_integration_requests
CREATE POLICY "Users can view their own integration requests" 
ON public.data_integration_requests 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own integration requests" 
ON public.data_integration_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create triggers for updated_at columns
CREATE TRIGGER update_citizen_journey_profiles_updated_at
  BEFORE UPDATE ON public.citizen_journey_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cross_phase_recommendations_updated_at
  BEFORE UPDATE ON public.cross_phase_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();