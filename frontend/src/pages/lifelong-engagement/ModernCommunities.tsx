import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users, 
  MessageCircle, 
  Calendar, 
  Award, 
  Search,
  Filter,
  Plus,
  ArrowRight,
  Heart,
  Share2,
  BookOpen,
  Briefcase,
  Globe,
  MapPin,
  Clock,
  Star,
  TrendingUp,
  UserPlus,
  Eye,
  ThumbsUp
} from 'lucide-react';
import { UnifiedPageLayout } from '../../components/design-system/UnifiedPageLayout';
import { StandardCard, FeatureCard, StatsCard } from '../../components/design-system/StandardCard';
import '../../styles/design-system.css';

const ModernCommunities: React.FC = () => {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const breadcrumbs = [
    { label: t('navigation.lifelong_engagement') },
    { label: t('pages.communities.title') }
  ];

  const categoryFilters = [
    { id: 'all', label: t('pages.communities.filters.all_communities') },
    { id: 'professional', label: t('pages.communities.filters.professional') },
    { id: 'industry', label: t('pages.communities.filters.industry') },
    { id: 'skills', label: t('pages.communities.filters.skills') },
    { id: 'networking', label: t('pages.communities.filters.networking') }
  ];

  const featuredCommunities = [
    {
      id: 'uae-tech-leaders',
      name: t('pages.communities.featured.uae_tech_leaders.name'),
      description: t('pages.communities.featured.uae_tech_leaders.description'),
      category: 'professional',
      members: '12,500+',
      posts: '2,340',
      growth: '+25%',
      image: '/api/placeholder/300/200',
      tags: ['Technology', 'Leadership', 'Innovation', 'AI'],
      isJoined: true,
      isVerified: true,
      lastActivity: '2 hours ago',
      moderators: ['Ahmed Al-Mansouri', 'Fatima Al-Zahra'],
      upcomingEvents: 2
    },
    {
      id: 'emirate-entrepreneurs',
      name: t('pages.communities.featured.emirate_entrepreneurs.name'),
      description: t('pages.communities.featured.emirate_entrepreneurs.description'),
      category: 'professional',
      members: '8,900+',
      posts: '1,890',
      growth: '+18%',
      image: '/api/placeholder/300/200',
      tags: ['Entrepreneurship', 'Startups', 'Business', 'Investment'],
      isJoined: false,
      isVerified: true,
      lastActivity: '1 hour ago',
      moderators: ['Mohammed Al-Rashid', 'Layla Al-Suwaidi'],
      upcomingEvents: 3
    },
    {
      id: 'healthcare-professionals',
      name: t('pages.communities.featured.healthcare_professionals.name'),
      description: t('pages.communities.featured.healthcare_professionals.description'),
      category: 'industry',
      members: '6,200+',
      posts: '1,560',
      growth: '+15%',
      image: '/api/placeholder/300/200',
      tags: ['Healthcare', 'Medicine', 'Research', 'Innovation'],
      isJoined: true,
      isVerified: true,
      lastActivity: '30 minutes ago',
      moderators: ['Dr. Sarah Al-Mansouri', 'Dr. Khalid Al-Nuaimi'],
      upcomingEvents: 1
    },
    {
      id: 'finance-network',
      name: t('pages.communities.featured.finance_network.name'),
      description: t('pages.communities.featured.finance_network.description'),
      category: 'industry',
      members: '9,800+',
      posts: '2,100',
      growth: '+22%',
      image: '/api/placeholder/300/200',
      tags: ['Finance', 'Banking', 'Investment', 'Fintech'],
      isJoined: false,
      isVerified: true,
      lastActivity: '45 minutes ago',
      moderators: ['Omar Al-Kindi', 'Aisha Al-Mazrouei'],
      upcomingEvents: 4
    },
    {
      id: 'digital-skills-hub',
      name: t('pages.communities.featured.digital_skills_hub.name'),
      description: t('pages.communities.featured.digital_skills_hub.description'),
      category: 'skills',
      members: '15,600+',
      posts: '3,200',
      growth: '+30%',
      image: '/api/placeholder/300/200',
      tags: ['Digital Skills', 'Training', 'Certification', 'Career Growth'],
      isJoined: true,
      isVerified: true,
      lastActivity: '15 minutes ago',
      moderators: ['Mariam Al-Dhaheri', 'Ahmed Al-Zaabi'],
      upcomingEvents: 5
    },
    {
      id: 'young-professionals',
      name: t('pages.communities.featured.young_professionals.name'),
      description: t('pages.communities.featured.young_professionals.description'),
      category: 'networking',
      members: '11,300+',
      posts: '2,800',
      growth: '+20%',
      image: '/api/placeholder/300/200',
      tags: ['Networking', 'Career Development', 'Mentorship', 'Events'],
      isJoined: false,
      isVerified: true,
      lastActivity: '1 hour ago',
      moderators: ['Noura Al-Mansouri', 'Rashid Al-Maktoum'],
      upcomingEvents: 3
    }
  ];

  const filteredCommunities = featuredCommunities.filter(community => {
    const matchesCategory = selectedCategory === 'all' || community.category === selectedCategory;
    const matchesSearch = community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         community.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         community.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const stats = [
    {
      title: t('pages.communities.stats.total_communities'),
      value: '150+',
      change: 'Active communities',
      changeType: 'neutral' as const,
      icon: Users
    },
    {
      title: t('pages.communities.stats.total_members'),
      value: '85,000+',
      change: '+12% this month',
      changeType: 'positive' as const,
      icon: UserPlus
    },
    {
      title: t('pages.communities.stats.monthly_posts'),
      value: '12,500+',
      change: '+18% engagement',
      changeType: 'positive' as const,
      icon: MessageCircle
    },
    {
      title: t('pages.communities.stats.events_hosted'),
      value: '450+',
      change: 'This year',
      changeType: 'positive' as const,
      icon: Calendar
    }
  ];

  const recentPosts = [
    {
      id: 1,
      author: 'Ahmed Al-Mansouri',
      community: 'UAE Tech Leaders',
      title: t('pages.communities.recent_posts.ai_trends.title'),
      content: t('pages.communities.recent_posts.ai_trends.content'),
      time: '2 hours ago',
      likes: 45,
      comments: 12,
      shares: 8,
      avatar: '/api/placeholder/40/40'
    },
    {
      id: 2,
      author: 'Fatima Al-Zahra',
      community: 'Healthcare Professionals',
      title: t('pages.communities.recent_posts.healthcare_innovation.title'),
      content: t('pages.communities.recent_posts.healthcare_innovation.content'),
      time: '4 hours ago',
      likes: 32,
      comments: 18,
      shares: 5,
      avatar: '/api/placeholder/40/40'
    },
    {
      id: 3,
      author: 'Mohammed Al-Rashid',
      community: 'Emirate Entrepreneurs',
      title: t('pages.communities.recent_posts.startup_funding.title'),
      content: t('pages.communities.recent_posts.startup_funding.content'),
      time: '6 hours ago',
      likes: 67,
      comments: 24,
      shares: 15,
      avatar: '/api/placeholder/40/40'
    }
  ];

  const upcomingEvents = [
    {
      id: 1,
      title: t('pages.communities.upcoming_events.tech_summit.title'),
      community: 'UAE Tech Leaders',
      date: '2024-01-15',
      time: '10:00 AM',
      location: 'Dubai Internet City',
      attendees: 250,
      type: 'Conference'
    },
    {
      id: 2,
      title: t('pages.communities.upcoming_events.networking_mixer.title'),
      community: 'Young Professionals',
      date: '2024-01-18',
      time: '6:00 PM',
      location: 'DIFC',
      attendees: 120,
      type: 'Networking'
    },
    {
      id: 3,
      title: t('pages.communities.upcoming_events.skills_workshop.title'),
      community: 'Digital Skills Hub',
      date: '2024-01-20',
      time: '2:00 PM',
      location: 'Online',
      attendees: 180,
      type: 'Workshop'
    }
  ];

  return (
    <UnifiedPageLayout
      title={t('pages.communities.title')}
      subtitle={t('pages.communities.subtitle')}
      breadcrumbs={breadcrumbs}
      headerActions={
        <div className="flex items-center space-x-3">
          <button className="btn-secondary">
            <Filter className="h-4 w-4 mr-2" />
            {t('common.filter')}
          </button>
          <button className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            {t('pages.communities.create_community')}
          </button>
        </div>
      }
    >
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-2xl p-8 mb-12">
        <div className="max-w-3xl">
          <h2 className="text-display-2 text-gray-900 mb-4">
            {t('pages.communities.hero.title')}
          </h2>
          <p className="text-body-large text-gray-600 mb-6">
            {t('pages.communities.hero.description')}
          </p>
          
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('pages.communities.search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div className="flex space-x-2">
              {categoryFilters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedCategory(filter.id)}
                  className={`px-4 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${
                    selectedCategory === filter.id
                      ? 'bg-teal-600 text-white'
                      : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            changeType={stat.changeType}
            icon={stat.icon}
          />
        ))}
      </div>

      {/* Featured Communities */}
      <div className="mb-12">
        <div className="text-center mb-8">
          <h2 className="text-display-2 text-gray-900 mb-4">
            {t('pages.communities.featured.title')}
          </h2>
          <p className="text-body-large text-gray-600 max-w-2xl mx-auto">
            {t('pages.communities.featured.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCommunities.map((community) => (
            <div
              key={community.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              {/* Community Image */}
              <div className="relative h-48">
                <img
                  src={community.image}
                  alt={community.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 flex items-center space-x-2">
                  {community.isVerified && (
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                      {t('common.verified')}
                    </span>
                  )}
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    community.growth.startsWith('+') 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {community.growth}
                  </span>
                </div>
                <div className="absolute top-4 right-4">
                  {community.isJoined ? (
                    <button className="bg-teal-600 text-white p-2 rounded-full hover:bg-teal-700 transition-colors">
                      <Users className="h-4 w-4" />
                    </button>
                  ) : (
                    <button className="bg-white text-gray-600 p-2 rounded-full hover:bg-gray-50 transition-colors">
                      <UserPlus className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6">
                {/* Community Header */}
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {community.name}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {community.description}
                  </p>
                </div>

                {/* Community Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{community.members}</div>
                    <div className="text-xs text-gray-500">{t('common.members')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{community.posts}</div>
                    <div className="text-xs text-gray-500">{t('common.posts')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{community.upcomingEvents}</div>
                    <div className="text-xs text-gray-500">{t('common.events')}</div>
                  </div>
                </div>

                {/* Tags */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {community.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                      >
                        {tag}
                      </span>
                    ))}
                    {community.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                        +{community.tags.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* Community Info */}
                <div className="mb-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{t('pages.communities.last_activity')}:</span>
                    <span className="text-gray-900">{community.lastActivity}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{t('pages.communities.moderators')}:</span>
                    <span className="text-gray-900 text-right">
                      {community.moderators.slice(0, 1).join(', ')}
                      {community.moderators.length > 1 && ` +${community.moderators.length - 1}`}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  {community.isJoined ? (
                    <button className="flex-1 btn-secondary text-sm py-2">
                      {t('pages.communities.view_community')}
                    </button>
                  ) : (
                    <button className="flex-1 btn-primary text-sm py-2">
                      {t('pages.communities.join_community')}
                    </button>
                  )}
                  <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Share2 className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Recent Posts */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              {t('pages.communities.recent_posts.title')}
            </h3>
            <MessageCircle className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-6">
            {recentPosts.map((post) => (
              <div key={post.id} className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0">
                <div className="flex items-start space-x-3">
                  <img
                    src={post.avatar}
                    alt={post.author}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {post.author}
                      </h4>
                      <span className="text-xs text-gray-500">in</span>
                      <span className="text-xs text-teal-600 font-medium">
                        {post.community}
                      </span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">{post.time}</span>
                    </div>
                    <h5 className="text-sm font-medium text-gray-900 mb-2">
                      {post.title}
                    </h5>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {post.content}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <button className="flex items-center space-x-1 hover:text-red-600 transition-colors">
                        <Heart className="h-4 w-4" />
                        <span>{post.likes}</span>
                      </button>
                      <button className="flex items-center space-x-1 hover:text-blue-600 transition-colors">
                        <MessageCircle className="h-4 w-4" />
                        <span>{post.comments}</span>
                      </button>
                      <button className="flex items-center space-x-1 hover:text-green-600 transition-colors">
                        <Share2 className="h-4 w-4" />
                        <span>{post.shares}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <button className="w-full mt-4 text-sm text-teal-600 hover:text-teal-700 font-medium">
            {t('pages.communities.view_all_posts')}
          </button>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              {t('pages.communities.upcoming_events.title')}
            </h3>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="p-4 border border-gray-200 rounded-lg hover:border-teal-300 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900 flex-1">
                    {event.title}
                  </h4>
                  <span className="text-xs bg-teal-100 text-teal-800 px-2 py-1 rounded-full ml-2">
                    {event.type}
                  </span>
                </div>
                <p className="text-xs text-teal-600 font-medium mb-2">
                  {event.community}
                </p>
                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-3 w-3" />
                    <span>{event.date} at {event.time}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-3 w-3" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-3 w-3" />
                    <span>{event.attendees} attending</span>
                  </div>
                </div>
                <button className="w-full mt-3 text-xs bg-teal-50 text-teal-700 py-2 rounded-md hover:bg-teal-100 transition-colors">
                  {t('pages.communities.register_event')}
                </button>
              </div>
            ))}
          </div>
          
          <button className="w-full mt-4 text-sm text-teal-600 hover:text-teal-700 font-medium">
            {t('pages.communities.view_all_events')}
          </button>
        </div>
      </div>

      {/* Community Benefits */}
      <div className="bg-white rounded-2xl p-8 border border-gray-200 mb-12">
        <div className="text-center mb-8">
          <h2 className="text-display-2 text-gray-900 mb-4">
            {t('pages.communities.benefits.title')}
          </h2>
          <p className="text-body-large text-gray-600">
            {t('pages.communities.benefits.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            title={t('pages.communities.benefits.networking.title')}
            description={t('pages.communities.benefits.networking.description')}
            icon={Users}
            features={[
              t('pages.communities.benefits.networking.features.0'),
              t('pages.communities.benefits.networking.features.1'),
              t('pages.communities.benefits.networking.features.2'),
              t('pages.communities.benefits.networking.features.3')
            ]}
            href="/networking"
            ctaText={t('common.start_networking')}
          />

          <FeatureCard
            title={t('pages.communities.benefits.learning.title')}
            description={t('pages.communities.benefits.learning.description')}
            icon={BookOpen}
            features={[
              t('pages.communities.benefits.learning.features.0'),
              t('pages.communities.benefits.learning.features.1'),
              t('pages.communities.benefits.learning.features.2'),
              t('pages.communities.benefits.learning.features.3')
            ]}
            href="/learning"
            ctaText={t('common.explore_learning')}
          />

          <FeatureCard
            title={t('pages.communities.benefits.career_growth.title')}
            description={t('pages.communities.benefits.career_growth.description')}
            icon={TrendingUp}
            features={[
              t('pages.communities.benefits.career_growth.features.0'),
              t('pages.communities.benefits.career_growth.features.1'),
              t('pages.communities.benefits.career_growth.features.2'),
              t('pages.communities.benefits.career_growth.features.3')
            ]}
            href="/career-growth"
            ctaText={t('common.boost_career')}
          />
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center bg-gradient-to-r from-teal-600 to-blue-600 rounded-2xl p-8 text-white">
        <h2 className="text-2xl font-bold mb-4">
          {t('pages.communities.cta.title')}
        </h2>
        <p className="text-lg mb-6 opacity-90">
          {t('pages.communities.cta.description')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-white text-teal-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors">
            {t('pages.communities.cta.join_communities')}
          </button>
          <button className="border border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-teal-600 transition-colors">
            {t('pages.communities.cta.create_community')}
          </button>
        </div>
      </div>
    </UnifiedPageLayout>
  );
};

export default ModernCommunities;
