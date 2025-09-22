import { SuccessStory, StorySubmissionData, EditorialReview } from '@/types/successStories';

// Mock data for demonstration
const mockStories: SuccessStory[] = [
  {
    id: '1',
    title: 'From Graduate to Tech Leader: My Journey in Dubai\'s Innovation Hub',
    summary: 'How I transformed from a fresh computer science graduate to leading a team of 50+ engineers at a major tech company in Dubai.',
    content: `When I graduated from the American University of Sharjah in 2018, I never imagined I would be leading one of Dubai's most innovative tech teams just five years later.

My journey began with a simple internship at a local startup. I was nervous, inexperienced, but eager to learn. The UAE's commitment to digital transformation was just beginning to accelerate, and I found myself at the center of this exciting movement.

The early days were challenging. I worked long hours, took on projects others wouldn't touch, and constantly pushed myself to learn new technologies. But what set me apart was my understanding of both the local market and global tech trends.

In 2020, during the pandemic, I saw an opportunity to create solutions that would help UAE businesses adapt to the digital-first world. I proposed a new product line that would eventually become our company's flagship offering.

Today, I lead a diverse team of engineers from 15 different countries, all working together to build the future of fintech in the Middle East. We've processed over AED 1 billion in transactions and helped thousands of small businesses thrive.

The key to my success has been three things: continuous learning, understanding the local market, and never being afraid to take calculated risks. The UAE's vision for innovation has created incredible opportunities for young Emiratis willing to seize them.`,
    author: {
      id: 'user1',
      name: 'Ahmed Al Mansouri',
      avatar: '/placeholder.svg?height=64&width=64',
      title: 'Head of Engineering',
      company: 'Dubai FinTech Solutions',
      location: 'Dubai, UAE'
    },
    category: 'career_progression',
    tags: ['technology', 'leadership', 'fintech', 'innovation', 'digital transformation'],
    media: {
      featured_image: '/placeholder.svg?height=400&width=600',
      gallery: [
        '/placeholder.svg?height=300&width=400',
        '/placeholder.svg?height=300&width=400'
      ],
      video_testimonial: {
        url: '/placeholder-video.mp4',
        thumbnail: '/placeholder.svg?height=400&width=600',
        duration: '3:45'
      },
      audio_clips: [
        {
          title: 'My biggest challenge as a leader',
          url: '/placeholder-audio-1.mp3',
          duration: '2:15'
        },
        {
          title: 'Advice for aspiring tech professionals',
          url: '/placeholder-audio-2.mp3',
          duration: '1:30'
        }
      ]
    },
    metrics: {
      career_growth: '400% salary increase in 5 years',
      impact: 'Led team that processed AED 1B+ in transactions',
      timeline: '2018-2023: Graduate to Head of Engineering'
    },
    status: 'published',
    submitted_at: '2024-01-15T10:00:00Z',
    published_at: '2024-01-20T14:00:00Z',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-20T14:00:00Z',
    is_featured: true,
    view_count: 1245,
    likes_count: 89
  },
  {
    id: '2',
    title: 'Building a Sustainable Future: My Renewable Energy Startup Journey',
    summary: 'How I turned my passion for sustainability into a successful renewable energy company that\'s now powering thousands of homes across the Emirates.',
    content: `Growing up in Sharjah, I watched my city transform rapidly. But I also noticed the environmental challenges that came with this growth. This sparked my passion for renewable energy and sustainability.

After completing my engineering degree, I joined Masdar Institute to pursue my master's in renewable energy. The knowledge and connections I made there were invaluable for what was to come.

In 2019, I founded GreenTech Emirates with a simple mission: make renewable energy accessible and affordable for every home in the UAE. We started small, with just solar panel installations for residential properties.

The breakthrough came when we developed a innovative financing model that allowed homeowners to switch to solar with zero upfront costs. This removed the biggest barrier to adoption and our business exploded.

Today, we've installed over 10,000 solar systems, created 200 jobs, and prevented over 50,000 tons of CO2 emissions. We've also expanded into energy storage and smart grid solutions.

The UAE's commitment to becoming carbon neutral by 2050 has created an incredible environment for green innovation. As Emiratis, we have a unique opportunity to lead the region's sustainability transformation.`,
    author: {
      id: 'user2',
      name: 'Dr. Mohammad Mubarak',
      avatar: '/placeholder.svg?height=64&width=64',
      title: 'Founder & CEO',
      company: 'GreenTech Emirates',
      location: 'Sharjah, UAE'
    },
    category: 'entrepreneurship',
    tags: ['sustainability', 'renewable energy', 'entrepreneurship', 'innovation', 'climate'],
    media: {
      featured_image: '/placeholder.svg?height=400&width=600',
      video_url: 'https://example.com/fatima-story-video',
      audio_clips: [
        {
          title: 'Why I chose renewable energy',
          url: '/placeholder-audio-3.mp3',
          duration: '2:45'
        }
      ]
    },
    metrics: {
      impact: '10,000+ solar installations, 50,000 tons CO2 prevented',
      timeline: '2019-2024: From idea to market leader'
    },
    status: 'published',
    submitted_at: '2024-02-01T09:00:00Z',
    published_at: '2024-02-05T11:00:00Z',
    created_at: '2024-02-01T09:00:00Z',
    updated_at: '2024-02-05T11:00:00Z',
    is_featured: true,
    view_count: 892,
    likes_count: 67
  }
];

export class SuccessStoriesService {
  static async getStories(filters?: {
    category?: string;
    featured?: boolean;
    status?: string;
    limit?: number;
  }): Promise<SuccessStory[]> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let filtered = [...mockStories];
    
    if (filters?.category) {
      filtered = filtered.filter(story => story.category === filters.category);
    }
    
    if (filters?.featured !== undefined) {
      filtered = filtered.filter(story => story.is_featured === filters.featured);
    }
    
    if (filters?.status) {
      filtered = filtered.filter(story => story.status === filters.status);
    }
    
    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit);
    }
    
    return filtered;
  }

  static async getStoryById(id: string): Promise<SuccessStory | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockStories.find(story => story.id === id) || null;
  }

  static async submitStory(data: StorySubmissionData): Promise<SuccessStory> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Convert Files to strings for storage
    const processedGallery = data.media.gallery?.map(item => 
      typeof item === 'string' ? item : '/placeholder.svg?height=300&width=400'
    );
    
    const newStory: SuccessStory = {
      id: Date.now().toString(),
      ...data,
      author: {
        id: 'current_user',
        name: 'Current User',
        title: 'Professional',
        location: 'UAE'
      },
      media: {
        featured_image: typeof data.media.featured_image === 'string' ? data.media.featured_image : '/placeholder.svg?height=400&width=600',
        gallery: processedGallery,
        video_url: data.media.video_url
      },
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_featured: false,
      view_count: 0,
      likes_count: 0
    };
    
    return newStory;
  }

  static async updateStoryStatus(
    storyId: string, 
    status: SuccessStory['status'], 
    notes?: string
  ): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log(`Story ${storyId} status updated to ${status}`, notes);
  }

  static async getFeaturedStories(limit: number = 3): Promise<SuccessStory[]> {
    return this.getStories({ featured: true, status: 'published', limit });
  }

  static async getStoriesForReview(): Promise<SuccessStory[]> {
    return this.getStories({ status: 'submitted' });
  }
}
