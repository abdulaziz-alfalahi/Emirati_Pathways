
export interface FinancialResource {
  id: string;
  title: string;
  description?: string;
  category: 'budgeting' | 'investments' | 'retirement' | 'tools';
  resource_url?: string;
  image_url?: string;
  tags?: string[];
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  estimated_read_time?: number;
  is_featured: boolean;
  status: 'active' | 'inactive' | 'draft';
  created_at: string;
  updated_at: string;
  created_by?: string;
}
