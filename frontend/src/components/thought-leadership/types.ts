
export interface ThoughtLeadershipContent {
  id: string;
  title: string;
  content_type: 'article' | 'research_paper' | 'video' | 'podcast';
  author_name: string;
  author_title?: string;
  author_organization?: string;
  summary?: string;
  full_content_url?: string;
  thumbnail_url?: string;
  tags?: string[];
  published_date: string;
  duration_minutes?: number;
  reading_time_minutes?: number;
  view_count: number;
  is_featured: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}
