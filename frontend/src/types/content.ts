
export interface ContentItem {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  category: string;
  content_type: ContentType;
  status: ContentStatus;
  tags: string[];
  featured_image_url?: string;
  author_id?: string;
  published_date?: string;
  slug?: string;
  metadata: Record<string, any>;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface ContentCategory {
  id: string;
  name: string;
  description?: string;
  content_type: ContentType;
  is_active: boolean;
  created_at: string;
}

export interface ContentRevision {
  id: string;
  content_item_id: string;
  title: string;
  content: string;
  revision_number: number;
  created_by?: string;
  created_at: string;
}

export type ContentType = 'training_material' | 'job_description' | 'thought_leadership' | 'announcement';
export type ContentStatus = 'draft' | 'pending_review' | 'published' | 'archived';

export interface ContentFilters {
  status?: ContentStatus;
  content_type?: ContentType;
  category?: string;
  author_id?: string;
  search?: string;
}
