import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Edit,
  Eye,
  Trash2,
  Calendar,
  User,
  Globe,
  Tag,
  Clock,
  CheckCircle,
  AlertCircle,
  Archive,
  Upload,
  Download,
  MoreHorizontal,
  ChevronDown,
  RefreshCw,
  Save,
  X
} from 'lucide-react';

interface ContentItem {
  id: number;
  title: string;
  slug: string;
  content_type: string;
  status: 'draft' | 'review' | 'published' | 'archived';
  language: string;
  category: string;
  tags: string[];
  excerpt: string;
  author: string;
  created_at: string;
  updated_at: string;
  publish_date?: string;
  view_count: number;
}

interface ContentFilters {
  status: string;
  content_type: string;
  language: string;
  category: string;
  author: string;
  date_range: string;
}

const ContentManager: React.FC = () => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [filteredContent, setFilteredContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(20);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);

  const [filters, setFilters] = useState<ContentFilters>({
    status: '',
    content_type: '',
    language: '',
    category: '',
    author: '',
    date_range: ''
  });

  const [newContent, setNewContent] = useState({
    title: '',
    content_type: 'article',
    language: 'en',
    category: '',
    tags: '',
    excerpt: '',
    content_data: {
      body: '',
      summary: ''
    }
  });

  useEffect(() => {
    fetchContent();
  }, [currentPage, filters]);

  useEffect(() => {
    filterContent();
  }, [content, searchTerm]);

  const fetchContent = async () => {
    try {
      setIsLoading(true);
      
      // Mock data - replace with actual API call
      const mockContent: ContentItem[] = [
        {
          id: 1,
          title: 'UAE Career Development Guide 2024',
          slug: 'uae-career-development-guide-2024',
          content_type: 'article',
          status: 'published',
          language: 'en',
          category: 'Career Guidance',
          tags: ['career', 'development', 'UAE', 'guide'],
          excerpt: 'Comprehensive guide for career development in the UAE, focusing on Emiratization initiatives and professional growth opportunities.',
          author: 'Sarah Al-Mansouri',
          created_at: '2024-01-15T10:30:00Z',
          updated_at: '2024-01-20T14:45:00Z',
          publish_date: '2024-01-20T14:45:00Z',
          view_count: 1247
        },
        {
          id: 2,
          title: 'دليل التطوير المهني في دولة الإمارات',
          slug: 'uae-professional-development-guide-ar',
          content_type: 'article',
          status: 'published',
          language: 'ar',
          category: 'التوجيه المهني',
          tags: ['تطوير', 'مهني', 'الإمارات', 'دليل'],
          excerpt: 'دليل شامل للتطوير المهني في دولة الإمارات العربية المتحدة مع التركيز على مبادرات التوطين والفرص المهنية.',
          author: 'أحمد الزعابي',
          created_at: '2024-01-18T09:15:00Z',
          updated_at: '2024-01-22T11:30:00Z',
          publish_date: '2024-01-22T11:30:00Z',
          view_count: 892
        },
        {
          id: 3,
          title: 'Interview Preparation Checklist',
          slug: 'interview-preparation-checklist',
          content_type: 'resource',
          status: 'draft',
          language: 'en',
          category: 'Interview Skills',
          tags: ['interview', 'preparation', 'checklist', 'tips'],
          excerpt: 'Essential checklist for job interview preparation, including common questions and best practices.',
          author: 'Mohammed Al-Rashid',
          created_at: '2024-01-25T16:20:00Z',
          updated_at: '2024-01-25T16:20:00Z',
          view_count: 0
        },
        {
          id: 4,
          title: 'UAE Job Market Trends 2024',
          slug: 'uae-job-market-trends-2024',
          content_type: 'report',
          status: 'review',
          language: 'en',
          category: 'Market Analysis',
          tags: ['job market', 'trends', 'UAE', '2024', 'analysis'],
          excerpt: 'Comprehensive analysis of the UAE job market trends, emerging sectors, and employment opportunities.',
          author: 'Fatima Al-Zahra',
          created_at: '2024-01-20T13:45:00Z',
          updated_at: '2024-01-28T10:15:00Z',
          view_count: 156
        }
      ];

      setContent(mockContent);
      setTotalPages(Math.ceil(mockContent.length / itemsPerPage));
    } catch (error) {
      console.error('Failed to fetch content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterContent = () => {
    let filtered = content;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply other filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        filtered = filtered.filter(item => {
          switch (key) {
            case 'status':
              return item.status === value;
            case 'content_type':
              return item.content_type === value;
            case 'language':
              return item.language === value;
            case 'category':
              return item.category === value;
            case 'author':
              return item.author.toLowerCase().includes(value.toLowerCase());
            default:
              return true;
          }
        });
      }
    });

    setFilteredContent(filtered);
  };

  const handleCreateContent = async () => {
    try {
      // Mock API call - replace with actual implementation
      const newItem: ContentItem = {
        id: Date.now(),
        title: newContent.title,
        slug: newContent.title.toLowerCase().replace(/\s+/g, '-'),
        content_type: newContent.content_type,
        status: 'draft',
        language: newContent.language,
        category: newContent.category,
        tags: newContent.tags.split(',').map(tag => tag.trim()),
        excerpt: newContent.excerpt,
        author: 'Current User', // Replace with actual user
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        view_count: 0
      };

      setContent([newItem, ...content]);
      setShowCreateModal(false);
      setNewContent({
        title: '',
        content_type: 'article',
        language: 'en',
        category: '',
        tags: '',
        excerpt: '',
        content_data: { body: '', summary: '' }
      });
    } catch (error) {
      console.error('Failed to create content:', error);
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      setContent(content.map(item =>
        item.id === id ? { ...item, status: newStatus as any, updated_at: new Date().toISOString() } : item
      ));
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleBulkAction = async (action: string) => {
    try {
      switch (action) {
        case 'publish':
          setContent(content.map(item =>
            selectedItems.includes(item.id) ? { ...item, status: 'published' as any } : item
          ));
          break;
        case 'archive':
          setContent(content.map(item =>
            selectedItems.includes(item.id) ? { ...item, status: 'archived' as any } : item
          ));
          break;
        case 'delete':
          setContent(content.filter(item => !selectedItems.includes(item.id)));
          break;
      }
      setSelectedItems([]);
    } catch (error) {
      console.error('Failed to perform bulk action:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'draft':
        return <Edit className="w-4 h-4 text-gray-500" />;
      case 'review':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'archived':
        return <Archive className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'review':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Content Manager</h1>
              <p className="mt-1 text-sm text-gray-500">
                Create, edit, and manage platform content
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Plus className="w-4 h-4 me-2" />
                Create Content
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full ps-10 pe-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Filter className="w-4 h-4 me-2" />
                Filters
                <ChevronDown className={`w-4 h-4 ms-2 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
              
              <button
                onClick={fetchContent}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <RefreshCw className="w-4 h-4 me-2" />
                Refresh
              </button>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="review">Under Review</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>

                <select
                  value={filters.content_type}
                  onChange={(e) => setFilters({ ...filters, content_type: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="article">Article</option>
                  <option value="resource">Resource</option>
                  <option value="report">Report</option>
                  <option value="announcement">Announcement</option>
                </select>

                <select
                  value={filters.language}
                  onChange={(e) => setFilters({ ...filters, language: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Languages</option>
                  <option value="en">English</option>
                  <option value="ar">Arabic</option>
                </select>

                <input
                  type="text"
                  placeholder="Category"
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                  type="text"
                  placeholder="Author"
                  value={filters.author}
                  onChange={(e) => setFilters({ ...filters, author: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedItems.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">
                {selectedItems.length} item(s) selected
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleBulkAction('publish')}
                  className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition-colors"
                >
                  Publish
                </button>
                <button
                  onClick={() => handleBulkAction('archive')}
                  className="px-3 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded-md hover:bg-yellow-200 transition-colors"
                >
                  Archive
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600 me-3" />
              <span className="text-lg font-medium text-gray-700">Loading content...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-start">
                      <input
                        type="checkbox"
                        checked={selectedItems.length === filteredContent.length && filteredContent.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems(filteredContent.map(item => item.id));
                          } else {
                            setSelectedItems([]);
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Content
                    </th>
                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Author
                    </th>
                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Updated
                    </th>
                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Views
                    </th>
                    <th className="px-6 py-3 text-end text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredContent.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItems([...selectedItems, item.id]);
                            } else {
                              setSelectedItems(selectedItems.filter(id => id !== item.id));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start space-x-3">
                          <FileText className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {item.title}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {item.excerpt}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                item.language === 'ar' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {item.language.toUpperCase()}
                              </span>
                              {item.tags.slice(0, 2).map((tag, index) => (
                                <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                  {tag}
                                </span>
                              ))}
                              {item.tags.length > 2 && (
                                <span className="text-xs text-gray-500">+{item.tags.length - 2} more</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(item.status)}
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.content_type.charAt(0).toUpperCase() + item.content_type.slice(1)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.author}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(item.updated_at)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.view_count.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-end text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50 transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setEditingItem(item)}
                            className="text-green-600 hover:text-green-900 p-1 rounded-md hover:bg-green-50 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <div className="relative">
                            <button className="text-gray-600 hover:text-gray-900 p-1 rounded-md hover:bg-gray-50 transition-colors">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredContent.length)} of {filteredContent.length} results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-2 text-sm font-medium text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Content Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create New Content</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newContent.title}
                  onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter content title"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={newContent.content_type}
                    onChange={(e) => setNewContent({ ...newContent, content_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="article">Article</option>
                    <option value="resource">Resource</option>
                    <option value="report">Report</option>
                    <option value="announcement">Announcement</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                  <select
                    value={newContent.language}
                    onChange={(e) => setNewContent({ ...newContent, language: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="en">English</option>
                    <option value="ar">Arabic</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  value={newContent.category}
                  onChange={(e) => setNewContent({ ...newContent, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter category"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <input
                  type="text"
                  value={newContent.tags}
                  onChange={(e) => setNewContent({ ...newContent, tags: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter tags separated by commas"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
                <textarea
                  value={newContent.excerpt}
                  onChange={(e) => setNewContent({ ...newContent, excerpt: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of the content"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateContent}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create Content
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentManager;
