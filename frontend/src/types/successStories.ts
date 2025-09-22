
export interface SuccessStory {
  id: string;
  title: string;
  summary: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    title: string;
    company?: string;
    location: string;
  };
  category: 'career_progression' | 'entrepreneurship' | 'education' | 'innovation' | 'leadership' | 'skills_development';
  tags: string[];
  media: {
    featured_image?: string;
    gallery?: string[];
    video_url?: string;
    audio_clips?: {
      title: string;
      url: string;
      duration?: string;
    }[];
    video_testimonial?: {
      url: string;
      thumbnail?: string;
      duration?: string;
    };
  };
  metrics?: {
    career_growth?: string;
    impact?: string;
    timeline?: string;
  };
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'published' | 'rejected';
  editorial_notes?: string;
  submitted_at?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
  is_featured: boolean;
  view_count: number;
  likes_count: number;
}

export interface StorySubmissionData {
  title: string;
  summary: string;
  content: string;
  category: SuccessStory['category'];
  tags: string[];
  media: {
    featured_image?: File | string;
    gallery?: (File | string)[];
    video_url?: string;
  };
  metrics?: {
    career_growth?: string;
    impact?: string;
    timeline?: string;
  };
}

export interface EditorialReview {
  id: string;
  story_id: string;
  reviewer_id: string;
  reviewer_name: string;
  status: 'approved' | 'rejected' | 'needs_revision';
  notes: string;
  suggested_changes?: string[];
  reviewed_at: string;
}
