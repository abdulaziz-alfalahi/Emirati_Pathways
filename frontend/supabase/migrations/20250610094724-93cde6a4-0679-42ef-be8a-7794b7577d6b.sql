
-- Create financial_resources table
CREATE TABLE public.financial_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('budgeting', 'investments', 'retirement', 'tools')),
  resource_url TEXT,
  image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  estimated_read_time INTEGER, -- in minutes
  is_featured BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.financial_resources ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view active financial resources" 
  ON public.financial_resources 
  FOR SELECT 
  USING (status = 'active');

CREATE POLICY "Authenticated users can insert financial resources" 
  ON public.financial_resources 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own financial resources" 
  ON public.financial_resources 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = created_by);

-- Create updated_at trigger
CREATE TRIGGER update_financial_resources_updated_at
  BEFORE UPDATE ON public.financial_resources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert mockup data
INSERT INTO public.financial_resources (title, description, category, resource_url, image_url, tags, difficulty_level, estimated_read_time, is_featured) VALUES
-- Budgeting & Savings
('UAE Personal Budgeting Guide', 'Comprehensive guide to creating and managing personal budgets in the UAE context', 'budgeting', 'https://example.com/uae-budgeting-guide', '/images/budgeting-guide.jpg', ARRAY['budgeting', 'savings', 'UAE'], 'beginner', 15, true),
('50/30/20 Rule for UAE Residents', 'How to apply the popular budgeting rule to your UAE salary and expenses', 'budgeting', 'https://example.com/50-30-20-rule', '/images/budgeting-rule.jpg', ARRAY['budgeting', 'salary'], 'beginner', 10, false),
('Emergency Fund Calculator', 'Interactive tool to calculate your ideal emergency fund based on UAE living costs', 'budgeting', 'https://example.com/emergency-fund-calc', '/images/emergency-fund.jpg', ARRAY['emergency fund', 'calculator'], 'intermediate', 5, true),
('Saving for Hajj and Umrah', 'Financial planning guide for religious pilgrimages', 'budgeting', 'https://example.com/hajj-savings', '/images/hajj-savings.jpg', ARRAY['savings', 'religious'], 'beginner', 12, false),

-- Investments
('UAE Stock Market Basics', 'Introduction to investing in the Dubai Financial Market (DFM) and Abu Dhabi Securities Exchange (ADX)', 'investments', 'https://example.com/uae-stocks', '/images/uae-stocks.jpg', ARRAY['stocks', 'DFM', 'ADX'], 'beginner', 20, true),
('Islamic Investment Options in UAE', 'Comprehensive guide to Sharia-compliant investment opportunities', 'investments', 'https://example.com/islamic-investments', '/images/islamic-invest.jpg', ARRAY['islamic', 'halal', 'sharia'], 'intermediate', 25, true),
('Real Estate Investment Guide', 'How to invest in UAE real estate market as a resident', 'investments', 'https://example.com/real-estate-invest', '/images/real-estate.jpg', ARRAY['real estate', 'property'], 'advanced', 30, false),
('Gold Investment in UAE', 'Traditional and modern ways to invest in gold in the UAE', 'investments', 'https://example.com/gold-investment', '/images/gold-invest.jpg', ARRAY['gold', 'commodities'], 'intermediate', 18, false),
('Cryptocurrency Regulations UAE', 'Understanding crypto investment landscape and regulations in the UAE', 'investments', 'https://example.com/crypto-uae', '/images/crypto.jpg', ARRAY['cryptocurrency', 'regulations'], 'advanced', 22, false),

-- Retirement Planning
('UAE Pension System Overview', 'Understanding GPSSA and private pension schemes in the UAE', 'retirement', 'https://example.com/uae-pension', '/images/pension.jpg', ARRAY['pension', 'GPSSA', 'retirement'], 'intermediate', 25, true),
('Retirement Planning for Expats', 'Comprehensive retirement strategy for expatriates living in the UAE', 'retirement', 'https://example.com/expat-retirement', '/images/expat-retire.jpg', ARRAY['expat', 'retirement', 'planning'], 'advanced', 35, true),
('Gratuity Calculator UAE', 'Calculate your end-of-service gratuity based on UAE labor law', 'retirement', 'https://example.com/gratuity-calc', '/images/gratuity.jpg', ARRAY['gratuity', 'calculator'], 'beginner', 8, false),
('Healthcare Planning for Retirement', 'Planning for medical expenses during retirement in the UAE', 'retirement', 'https://example.com/healthcare-retire', '/images/healthcare-retire.jpg', ARRAY['healthcare', 'medical insurance'], 'intermediate', 20, false),

-- Tools
('Budget Tracker App', 'Free mobile app for tracking expenses and managing budgets', 'tools', 'https://example.com/budget-app', '/images/budget-app.jpg', ARRAY['app', 'budget tracking'], 'beginner', 3, true),
('Investment Calculator', 'Calculate compound interest and investment returns', 'tools', 'https://example.com/invest-calc', '/images/calc.jpg', ARRAY['calculator', 'investment'], 'intermediate', 5, true),
('Retirement Planning Worksheet', 'Downloadable Excel template for retirement planning', 'tools', 'https://example.com/retire-worksheet', '/images/worksheet.jpg', ARRAY['worksheet', 'template'], 'intermediate', 10, false),
('Debt Payoff Calculator', 'Tool to create debt repayment strategies', 'tools', 'https://example.com/debt-calc', '/images/debt-calc.jpg', ARRAY['debt', 'calculator'], 'beginner', 7, false),
('Tax Calculator UAE', 'Calculate your tax obligations in the UAE', 'tools', 'https://example.com/tax-calc', '/images/tax-calc.jpg', ARRAY['tax', 'calculator'], 'advanced', 10, false);
