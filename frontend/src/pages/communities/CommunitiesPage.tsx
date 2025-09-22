import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, MessageCircle, Calendar, MapPin, Star, Plus, Search, Filter, Bookmark, Share2, Heart, Eye, Clock, Award, Building, Briefcase, GraduationCap } from 'lucide-react';

interface Community {
  id: string;
  name: string;
  description: string;
  category: string;
  members: number;
  posts: number;
  image: string;
  isJoined: boolean;
  isVerified: boolean;
  moderators: string[];
  tags: string[];
  location?: string;
  meetupFrequency?: string;
}

interface Post {
  id: string;
  author: {
    name: string;
    title: string;
    company: string;
    avatar: string;
    verified: boolean;
  };
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  tags: string[];
  community: string;
  isLiked: boolean;
  isBookmarked: boolean;
}

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: 'online' | 'offline' | 'hybrid';
  attendees: number;
  maxAttendees: number;
  organizer: string;
  community: string;
  isRegistered: boolean;
}

const CommunitiesPage: React.FC = () => {
  const { t } = useTranslation('communities');
  const [activeTab, setActiveTab] = useState<string>('discover');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const communities: Community[] = [
    {
      id: '1',
      name: 'UAE Tech Leaders',
      description: 'A community for technology leaders and innovators in the UAE, sharing insights on digital transformation and emerging technologies.',
      category: 'Technology',
      members: 2847,
      posts: 1205,
      image: '💻',
      isJoined: true,
      isVerified: true,
      moderators: ['Ahmed Al Mansouri', 'Fatima Al Zahra'],
      tags: ['AI', 'Blockchain', 'Cloud Computing', 'Digital Transformation'],
      location: 'Dubai',
      meetupFrequency: 'Monthly'
    },
    {
      id: '2',
      name: 'Emirates Banking Network',
      description: 'Professional network for banking and finance professionals across the UAE, focusing on Islamic banking and fintech innovations.',
      category: 'Finance',
      members: 1923,
      posts: 856,
      image: '🏦',
      isJoined: false,
      isVerified: true,
      moderators: ['Omar Al Rashid', 'Aisha Al Nuaimi'],
      tags: ['Islamic Banking', 'Fintech', 'Risk Management', 'Compliance'],
      location: 'Abu Dhabi',
      meetupFrequency: 'Bi-weekly'
    },
    {
      id: '3',
      name: 'Sustainable Energy UAE',
      description: 'Dedicated to professionals working in renewable energy, sustainability, and green technologies in the UAE.',
      category: 'Energy',
      members: 1456,
      posts: 623,
      image: '⚡',
      isJoined: true,
      isVerified: true,
      moderators: ['Khalid Al Mansoori', 'Mariam Al Shamsi'],
      tags: ['Solar Energy', 'Wind Power', 'Sustainability', 'Green Tech'],
      location: 'Masdar City',
      meetupFrequency: 'Monthly'
    },
    {
      id: '4',
      name: 'UAE Healthcare Innovation',
      description: 'Healthcare professionals and researchers collaborating on medical innovations and healthcare technology in the UAE.',
      category: 'Healthcare',
      members: 1234,
      posts: 445,
      image: '🏥',
      isJoined: false,
      isVerified: true,
      moderators: ['Dr. Sara Al Maktoum', 'Dr. Hassan Al Qasimi'],
      tags: ['Medical Technology', 'Telemedicine', 'Healthcare AI', 'Research'],
      location: 'Dubai Healthcare City',
      meetupFrequency: 'Monthly'
    },
    {
      id: '5',
      name: 'Aviation Excellence UAE',
      description: 'Community for aviation professionals, pilots, engineers, and industry experts in the UAE aviation sector.',
      category: 'Aviation',
      members: 987,
      posts: 334,
      image: '✈️',
      isJoined: false,
      isVerified: true,
      moderators: ['Captain Ahmed Al Falasi', 'Eng. Layla Al Mazrouei'],
      tags: ['Aviation Safety', 'Aircraft Maintenance', 'Flight Operations', 'Airport Management'],
      location: 'Dubai International Airport',
      meetupFrequency: 'Quarterly'
    },
    {
      id: '6',
      name: 'UAE Entrepreneurs Hub',
      description: 'Supporting UAE National entrepreneurs with mentorship, networking, and business development opportunities.',
      category: 'Entrepreneurship',
      members: 2156,
      posts: 1087,
      image: '🚀',
      isJoined: true,
      isVerified: true,
      moderators: ['Mohammed Al Gergawi', 'Shamma Al Mazrui'],
      tags: ['Startups', 'Venture Capital', 'Business Development', 'Innovation'],
      location: 'Dubai Future Foundation',
      meetupFrequency: 'Weekly'
    }
  ];

  const posts: Post[] = [
    {
      id: '1',
      author: {
        name: 'Ahmed Al Mansouri',
        title: 'Senior Software Engineer',
        company: 'Emirates NBD',
        avatar: 'AA',
        verified: true
      },
      content: 'Excited to share that our team just launched a new AI-powered fraud detection system that has reduced false positives by 40%. The system uses machine learning algorithms trained on UAE-specific transaction patterns. Looking forward to discussing this at next week\'s Tech Leaders meetup! #AI #Fintech #UAE',
      timestamp: '2 hours ago',
      likes: 47,
      comments: 12,
      shares: 8,
      tags: ['AI', 'Fintech', 'Machine Learning'],
      community: 'UAE Tech Leaders',
      isLiked: false,
      isBookmarked: true
    },
    {
      id: '2',
      author: {
        name: 'Fatima Al Zahra',
        title: 'Renewable Energy Consultant',
        company: 'Masdar',
        avatar: 'FZ',
        verified: true
      },
      content: 'Just attended an incredible conference on solar energy innovations. The UAE is leading the way with the world\'s largest single-site solar park. Proud to be part of this sustainable energy revolution! Who else is working on renewable energy projects? Let\'s connect! 🌞 #SolarEnergy #Sustainability #UAED33',
      timestamp: '4 hours ago',
      likes: 63,
      comments: 18,
      shares: 15,
      tags: ['Solar Energy', 'Sustainability', 'D33 and Talent33'],
      community: 'Sustainable Energy UAE',
      isLiked: true,
      isBookmarked: false
    },
    {
      id: '3',
      author: {
        name: 'Omar Al Rashid',
        title: 'Islamic Banking Specialist',
        company: 'ADCB',
        avatar: 'OR',
        verified: true
      },
      content: 'The growth of Islamic fintech in the UAE has been remarkable. We\'re seeing innovative Sharia-compliant digital solutions that are setting global standards. Excited to discuss the latest trends in Islamic banking technology at our next networking event. #IslamicBanking #Fintech #Innovation',
      timestamp: '6 hours ago',
      likes: 34,
      comments: 9,
      shares: 5,
      tags: ['Islamic Banking', 'Fintech', 'Digital Innovation'],
      community: 'Emirates Banking Network',
      isLiked: false,
      isBookmarked: false
    }
  ];

  const upcomingEvents: Event[] = [
    {
      id: '1',
      title: 'AI in Healthcare: UAE Innovations',
      description: 'Exploring the latest AI applications in healthcare across UAE hospitals and medical centers.',
      date: '2024-02-15',
      time: '18:00',
      location: 'Dubai Healthcare City',
      type: 'offline',
      attendees: 87,
      maxAttendees: 150,
      organizer: 'UAE Healthcare Innovation',
      community: 'UAE Healthcare Innovation',
      isRegistered: false
    },
    {
      id: '2',
      title: 'Sustainable Energy Symposium',
      description: 'Annual symposium on renewable energy projects and sustainability initiatives in the UAE.',
      date: '2024-02-20',
      time: '09:00',
      location: 'Masdar City Conference Center',
      type: 'hybrid',
      attendees: 234,
      maxAttendees: 300,
      organizer: 'Sustainable Energy UAE',
      community: 'Sustainable Energy UAE',
      isRegistered: true
    },
    {
      id: '3',
      title: 'Fintech Innovation Workshop',
      description: 'Hands-on workshop on blockchain applications in Islamic banking and finance.',
      date: '2024-02-25',
      time: '14:00',
      location: 'Online',
      type: 'online',
      attendees: 156,
      maxAttendees: 200,
      organizer: 'Emirates Banking Network',
      community: 'Emirates Banking Network',
      isRegistered: false
    }
  ];

  const categories = [
    { id: 'all', name: 'All Categories', icon: '🌟' },
    { id: 'Technology', name: 'Technology', icon: '💻' },
    { id: 'Finance', name: 'Finance', icon: '🏦' },
    { id: 'Energy', name: 'Energy', icon: '⚡' },
    { id: 'Healthcare', name: 'Healthcare', icon: '🏥' },
    { id: 'Aviation', name: 'Aviation', icon: '✈️' },
    { id: 'Entrepreneurship', name: 'Entrepreneurship', icon: '🚀' }
  ];

  const tabs = [
    { id: 'discover', name: 'Discover', icon: Search },
    { id: 'my-communities', name: 'My Communities', icon: Users },
    { id: 'feed', name: 'Feed', icon: MessageCircle },
    { id: 'events', name: 'Events', icon: Calendar }
  ];

  const filteredCommunities = communities.filter(community => {
    const matchesCategory = selectedCategory === 'all' || community.category === selectedCategory;
    const matchesSearch = community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         community.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         community.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const joinedCommunities = communities.filter(community => community.isJoined);

  const renderDiscoverTab = () => (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search communities, topics, or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="text-gray-400 h-5 w-5" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Communities Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCommunities.map((community) => (
          <div key={community.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">{community.image}</div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-dubai-bold text-gray-900">{community.name}</h3>
                      {community.isVerified && (
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{community.category}</p>
                  </div>
                </div>
                <button
                  className={`px-4 py-2 rounded-lg font-dubai-medium transition-colors ${
                    community.isJoined
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {community.isJoined ? 'Joined' : 'Join'}
                </button>
              </div>

              <p className="text-gray-700 text-sm mb-4 line-clamp-2">{community.description}</p>

              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {community.members.toLocaleString()} members
                </div>
                <div className="flex items-center">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  {community.posts} posts
                </div>
                {community.location && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {community.location}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {community.tags.slice(0, 3).map((tag, index) => (
                  <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                    {tag}
                  </span>
                ))}
                {community.tags.length > 3 && (
                  <span className="text-gray-500 text-xs">+{community.tags.length - 3} more</span>
                )}
              </div>

              {community.meetupFrequency && (
                <div className="flex items-center text-sm text-blue-600">
                  <Calendar className="h-4 w-4 mr-1" />
                  {community.meetupFrequency} meetups
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMyCommunitiesTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-dubai-bold text-gray-900">My Communities ({joinedCommunities.length})</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Create Community
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {joinedCommunities.map((community) => (
          <div key={community.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="text-center mb-4">
              <div className="text-4xl mb-3">{community.image}</div>
              <h3 className="font-dubai-bold text-gray-900 mb-1">{community.name}</h3>
              <p className="text-sm text-gray-600">{community.members.toLocaleString()} members</p>
            </div>
            
            <div className="space-y-2">
              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                View Community
              </button>
              <button className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors">
                Manage Settings
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFeedTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-dubai-bold">AA</span>
          </div>
          <div className="flex-1">
            <textarea
              placeholder="Share your thoughts with the community..."
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <button className="hover:text-blue-600">📷 Photo</button>
                <button className="hover:text-blue-600">📎 File</button>
                <button className="hover:text-blue-600">🏷️ Tag</button>
              </div>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Post
              </button>
            </div>
          </div>
        </div>
      </div>

      {posts.map((post) => (
        <div key={post.id} className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-start space-x-4 mb-4">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-dubai-bold">{post.author.avatar}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="font-dubai-bold text-gray-900">{post.author.name}</h4>
                {post.author.verified && (
                  <Star className="h-4 w-4 text-blue-500 fill-current" />
                )}
              </div>
              <p className="text-sm text-gray-600">{post.author.title} at {post.author.company}</p>
              <p className="text-xs text-gray-500">{post.timestamp} • {post.community}</p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-gray-800 leading-relaxed">{post.content}</p>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag, index) => (
              <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                #{tag}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-6">
              <button
                className={`flex items-center space-x-2 text-sm ${
                  post.isLiked ? 'text-red-600' : 'text-gray-600 hover:text-red-600'
                }`}
              >
                <Heart className={`h-4 w-4 ${post.isLiked ? 'fill-current' : ''}`} />
                <span>{post.likes}</span>
              </button>
              <button className="flex items-center space-x-2 text-sm text-gray-600 hover:text-blue-600">
                <MessageCircle className="h-4 w-4" />
                <span>{post.comments}</span>
              </button>
              <button className="flex items-center space-x-2 text-sm text-gray-600 hover:text-green-600">
                <Share2 className="h-4 w-4" />
                <span>{post.shares}</span>
              </button>
            </div>
            <button
              className={`text-sm ${
                post.isBookmarked ? 'text-yellow-600' : 'text-gray-600 hover:text-yellow-600'
              }`}
            >
              <Bookmark className={`h-4 w-4 ${post.isBookmarked ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderEventsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-dubai-bold text-gray-900">Upcoming Events</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {upcomingEvents.map((event) => (
          <div key={event.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-dubai-bold text-gray-900 mb-2">{event.title}</h3>
                <p className="text-gray-600 text-sm mb-3">{event.description}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-dubai-medium ${
                event.type === 'online' ? 'bg-green-100 text-green-800' :
                event.type === 'offline' ? 'bg-blue-100 text-blue-800' :
                'bg-purple-100 text-purple-800'
              }`}>
                {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-2" />
                {new Date(event.date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-2" />
                {event.time}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-2" />
                {event.location}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Users className="h-4 w-4 mr-2" />
                {event.attendees}/{event.maxAttendees} attendees
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">by {event.organizer}</span>
              <button
                className={`px-4 py-2 rounded-lg font-dubai-medium transition-colors ${
                  event.isRegistered
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {event.isRegistered ? 'Registered' : 'Register'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-dubai">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-dubai-bold text-gray-900">Professional Communities</h1>
              <p className="text-gray-600 mt-2">Connect, learn, and grow with UAE professionals</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-dubai-medium">
                🇦🇪 UAE Professionals
              </span>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-dubai-medium">
                🤝 Verified Network
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="flex flex-wrap">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-6 py-4 text-sm font-dubai-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'discover' && renderDiscoverTab()}
        {activeTab === 'my-communities' && renderMyCommunitiesTab()}
        {activeTab === 'feed' && renderFeedTab()}
        {activeTab === 'events' && renderEventsTab()}
      </div>
    </div>
  );
};

export default CommunitiesPage;
