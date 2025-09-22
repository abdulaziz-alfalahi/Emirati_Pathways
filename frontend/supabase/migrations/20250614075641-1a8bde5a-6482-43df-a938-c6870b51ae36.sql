-- Create audit logging and security monitoring tables (with policy cleanup)

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Only admins can access audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Only admins can access security alerts" ON public.security_alerts;

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  category TEXT DEFAULT 'data_access' CHECK (category IN ('authentication', 'authorization', 'data_access', 'data_modification', 'system_access', 'security_event')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address INET,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  alerts JSONB NOT NULL DEFAULT '[]',
  resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit tables
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for audit logs (admin only)
CREATE POLICY "Only admins can access audit logs" ON public.audit_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('administrator', 'super_user', 'platform_operator')
    )
  );

-- Create RLS policies for security alerts (admin only)  
CREATE POLICY "Only admins can access security alerts" ON public.security_alerts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('administrator', 'super_user', 'platform_operator')
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON public.audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_security_alerts_user_id ON public.security_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_security_alerts_risk_level ON public.security_alerts(risk_level);
CREATE INDEX IF NOT EXISTS idx_security_alerts_resolved ON public.security_alerts(resolved);