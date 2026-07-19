import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  Video, 
  Image, 
  Download, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  Plus,
  BookOpen,
  Globe,
  Users,
  Calendar,
  Star,
  Eye,
  Share2
} from 'lucide-react';
import axios from 'axios';

interface Resource {
  id: number;
  title: string;
  description: string;
  type: 'document' | 'video' | 'image' | 'presentation' | 'interactive';
  category: string;
  language: 'en' | 'ar' | 'both';
  file_url: string;
  file_size: number;
  upload_date: string;
  views: number;
  rating: number;
  tags: string[];
  is_public: boolean;
  created_by: string;
}

interface ResourceFormData {
  title: string;
  description: string;
  type: string;
  category: string;
  language: string;
  tags: string;
  is_public: boolean;
  file: File | null;
}

const ResourceManagement: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterLanguage, setFilterLanguage] = useState('all');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [formData, setFormData] = useState<ResourceFormData>({
    title: '',
    description: '',
    type: '',
    category: '',
    language: 'en',
    tags: '',
    is_public: false,
    file: null
  });

  // Mock data for demonstration
  const mockResources: Resource[] = [
    {
      id: 1,
      title: "UAE History and Culture Module",
      description: "Comprehensive module covering UAE's rich history, traditions, and cultural values for educational purposes.",
      type: 'document',
      category: 'Cultural Studies',
      language: 'both',
      file_url: '/resources/uae-history-culture.pdf',
      file_size: 2048000,
      upload_date: '2024-01-15',
      views: 245,
      rating: 4.8,
      tags: ['UAE', 'History', 'Culture', 'Heritage'],
      is_public: true,
      created_by: 'Dr. Amina Al-Zahra'
    },
    {
      id: 2,
      title: "Arabic Language Learning Videos",
      description: "Interactive video series for teaching Arabic language fundamentals to non-native speakers.",
      type: 'video',
      category: 'Language Learning',
      language: 'ar',
      file_url: '/resources/arabic-learning-series.mp4',
      file_size: 15728640,
      upload_date: '2024-01-20',
      views: 189,
      rating: 4.6,
      tags: ['Arabic', 'Language', 'Interactive', 'Beginner'],
      is_public: true,
      created_by: 'Prof. Mohammed Al-Rashid'
    },
    {
      id: 3,
      title: "Emiratization Career Pathways",
      description: "Visual guide showcasing various career opportunities for Emirati nationals in different sectors.",
      type: 'presentation',
      category: 'Career Development',
      language: 'en',
      file_url: '/resources/emiratization-careers.pptx',
      file_size: 5242880,
      upload_date: '2024-01-25',
      views: 156,
      rating: 4.7,
      tags: ['Emiratization', 'Career', 'Opportunities', 'Sectors'],
      is_public: false,
      created_by: 'Sarah Al-Mansoori'
    },
    {
      id: 4,
      title: "Traditional Emirati Crafts Workshop",
      description: "Step-by-step guide for conducting workshops on traditional Emirati handicrafts and artisanal skills.",
      type: 'document',
      category: 'Arts & Crafts',
      language: 'both',
      file_url: '/resources/traditional-crafts-workshop.pdf',
      file_size: 3145728,
      upload_date: '2024-02-01',
      views: 98,
      rating: 4.9,
      tags: ['Crafts', 'Traditional', 'Workshop', 'Heritage'],
      is_public: true,
      created_by: 'Fatima Al-Zaabi'
    },
    {
      id: 5,
      title: "UAE Innovation and Technology Timeline",
      description: "Interactive timeline showcasing UAE's technological advancement and innovation milestones.",
      type: 'interactive',
      category: 'Technology',
      language: 'en',
      file_url: '/resources/uae-tech-timeline.html',
      file_size: 1048576,
      upload_date: '2024-02-05',
      views: 134,
      rating: 4.5,
      tags: ['Innovation', 'Technology', 'Timeline', 'UAE'],
      is_public: true,
      created_by: 'Ahmed Al-Suwaidi'
    }
  ];

  const categories = [
    'Cultural Studies',
    'Language Learning',
    'Career Development',
    'Arts & Crafts',
    'Technology',
    'Science',
    'Mathematics',
    'Social Studies',
    'Islamic Studies',
    'Environmental Studies'
  ];

  const resourceTypes = [
    { value: 'document', label: 'Document', icon: FileText },
    { value: 'video', label: 'Video', icon: Video },
    { value: 'image', label: 'Image', icon: Image },
    { value: 'presentation', label: 'Presentation', icon: BookOpen },
    { value: 'interactive', label: 'Interactive', icon: Globe }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setResources(mockResources);
      setFilteredResources(mockResources);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    filterResources();
  }, [searchTerm, filterType, filterCategory, filterLanguage, resources]);

  const filterResources = () => {
    let filtered = resources.filter(resource => {
      const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesType = filterType === 'all' || resource.type === filterType;
      const matchesCategory = filterCategory === 'all' || resource.category === filterCategory;
      const matchesLanguage = filterLanguage === 'all' || resource.language === filterLanguage || resource.language === 'both';

      return matchesSearch && matchesType && matchesCategory && matchesLanguage;
    });

    setFilteredResources(filtered);
  };

  const handleInputChange = (field: keyof ResourceFormData, value: string | boolean | File | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.file || !formData.title || !formData.type || !formData.category) {
      setAlert({ type: 'error', message: 'Please fill in all required fields and select a file.' });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', formData.file);
      uploadFormData.append('title', formData.title);
      uploadFormData.append('description', formData.description);
      uploadFormData.append('type', formData.type);
      uploadFormData.append('category', formData.category);
      uploadFormData.append('language', formData.language);
      uploadFormData.append('tags', formData.tags);
      uploadFormData.append('is_public', formData.is_public.toString());

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setUploadProgress(100);
      
      // Add new resource to the list (mock)
      const newResource: Resource = {
        id: resources.length + 1,
        title: formData.title,
        description: formData.description,
        type: formData.type as any,
        category: formData.category,
        language: formData.language as any,
        file_url: `/resources/${formData.file.name}`,
        file_size: formData.file.size,
        upload_date: new Date().toISOString().split('T')[0],
        views: 0,
        rating: 0,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        is_public: formData.is_public,
        created_by: 'Current User'
      };

      setResources(prev => [newResource, ...prev]);
      setAlert({ type: 'success', message: 'Resource uploaded successfully!' });
      setIsUploadDialogOpen(false);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        type: '',
        category: '',
        language: 'en',
        tags: '',
        is_public: false,
        file: null
      });

    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to upload resource. Please try again.' });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTypeIcon = (type: string) => {
    const typeConfig = resourceTypes.find(t => t.value === type);
    return typeConfig ? typeConfig.icon : FileText;
  };

  const getLanguageLabel = (language: string) => {
    switch (language) {
      case 'en': return 'English';
      case 'ar': return 'العربية';
      case 'both': return 'English / العربية';
      default: return language;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {alert && (
        <Alert className={alert.type === 'error' ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}>
          <AlertDescription className={alert.type === 'error' ? 'text-red-700' : 'text-green-700'}>
            {alert.message}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Resource Management</h2>
          <p className="text-gray-600">Manage and organize educational resources for your students</p>
        </div>
        
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 me-2" />
              Upload Resource
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload New Resource</DialogTitle>
              <DialogDescription>
                Add a new educational resource to your collection
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter resource title"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="type">Type *</Label>
                  <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select resource type" />
                    </SelectTrigger>
                    <SelectContent>
                      {resourceTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center">
                            <type.icon className="w-4 h-4 me-2" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe the resource content and purpose"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select value={formData.language} onValueChange={(value) => handleInputChange('language', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ar">العربية</SelectItem>
                      <SelectItem value="both">Both Languages</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => handleInputChange('tags', e.target.value)}
                  placeholder="Enter tags separated by commas"
                />
              </div>

              <div>
                <Label htmlFor="file">File *</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => handleInputChange('file', e.target.files?.[0] || null)}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.avi,.mov,.jpg,.jpeg,.png,.gif"
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={formData.is_public}
                  onChange={(e) => handleInputChange('is_public', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="is_public">Make this resource publicly available</Label>
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsUploadDialogOpen(false)}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isUploading}>
                  {isUploading ? 'Uploading...' : 'Upload Resource'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search Resources</Label>
              <div className="relative">
                <Search className="absolute start-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by title, description, or tags"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="ps-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="filter-type">Filter by Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {resourceTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="filter-category">Filter by Category</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="filter-language">Filter by Language</Label>
              <Select value={filterLanguage} onValueChange={setFilterLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar">العربية</SelectItem>
                  <SelectItem value="both">Both Languages</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map((resource) => {
          const TypeIcon = getTypeIcon(resource.type);
          
          return (
            <Card key={resource.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <TypeIcon className="w-5 h-5 text-blue-600" />
                    <Badge variant="secondary">{resource.category}</Badge>
                  </div>
                  <div className="flex items-center space-x-1">
                    {resource.is_public ? (
                      <Globe className="w-4 h-4 text-green-600" />
                    ) : (
                      <Users className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>
                
                <CardTitle className="text-lg leading-tight">{resource.title}</CardTitle>
                <CardDescription className="text-sm">
                  {resource.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-1">
                  {resource.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {resource.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{resource.tags.length - 3}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Eye className="w-4 h-4" />
                    <span>{resource.views} views</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span>{resource.rating}/5</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(resource.upload_date).toLocaleDateString()}</span>
                  </div>
                  <div className="text-xs">
                    {formatFileSize(resource.file_size)}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Badge variant="outline">
                    {getLanguageLabel(resource.language)}
                  </Badge>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Share2 className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  Created by {resource.created_by}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredResources.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterType !== 'all' || filterCategory !== 'all' || filterLanguage !== 'all'
                ? 'Try adjusting your search criteria or filters.'
                : 'Start by uploading your first educational resource.'}
            </p>
            <Button onClick={() => setIsUploadDialogOpen(true)}>
              <Plus className="w-4 h-4 me-2" />
              Upload Resource
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ResourceManagement;
