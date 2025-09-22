
export interface CommunityLeadershipResource {
  id: string;
  title: string;
  description?: string;
  type: 'training' | 'workshop' | 'opportunity' | 'story';
  provider?: string;
  start_date?: string;
  end_date?: string;
  application_deadline?: string;
  location?: string;
  is_virtual: boolean;
  url?: string;
  requirements?: string;
  tags: string[];
  image_url?: string;
  duration_hours?: number;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  is_featured: boolean;
  status: 'active' | 'inactive' | 'archived';
  created_at: string;
  updated_at: string;
}
