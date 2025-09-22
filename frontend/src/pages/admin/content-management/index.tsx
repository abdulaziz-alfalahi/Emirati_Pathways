
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { ContentItem, ContentCategory, ContentType, ContentStatus } from '@/types/content';
import Layout from '@/components/layout/Layout';
import ContentEditor from '@/components/admin/content/ContentEditor';
import ContentPreview from '@/components/admin/content/ContentPreview';
import { Plus, Search, Filter, Eye, Edit, Trash2, FileText, Shield } from 'lucide-react';

const ContentManagementPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [categories, setCategories] = useState<ContentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'list' | 'editor' | 'preview'>('list');
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContentStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<ContentType | 'all'>('all');

  // Check if user has admin permissions
  const isAuthorized = hasRole('administrator') || hasRole('super_user');

  useEffect(() => {
    if (!user) return;
    
    if (!isAuthorized) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive"
      });
      return;
    }

    fetchContent();
    fetchCategories();
  }, [user, isAuthorized]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('content_items' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContent((data as unknown) as ContentItem[]);
    } catch (error) {
      console.error('Error fetching content:', error);
      toast({
        title: "Error",
        description: "Failed to fetch content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('content_categories' as any)
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setCategories((data as unknown) as ContentCategory[]);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleDeleteContent = async (contentId: string) => {
    if (!confirm('Are you sure you want to delete this content item?')) return;

    try {
      const { error } = await supabase
        .from('content_items' as any)
        .delete()
        .eq('id', contentId);

      if (error) throw error;

      setContent(prev => prev.filter(item => item.id !== contentId));
      toast({
        title: "Success",
        description: "Content deleted successfully."
      });
    } catch (error) {
      console.error('Error deleting content:', error);
      toast({
        title: "Error",
        description: "Failed to delete content. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleStatusChange = async (contentId: string, newStatus: ContentStatus) => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === 'published') {
        updateData.published_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from('content_items' as any)
        .update(updateData)
        .eq('id', contentId);

      if (error) throw error;

      setContent(prev => prev.map(item => 
        item.id === contentId 
          ? { ...item, status: newStatus, ...(newStatus === 'published' ? { published_date: updateData.published_date } : {}) }
          : item
      ));

      toast({
        title: "Success",
        description: `Content status updated to ${newStatus}.`
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update content status. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSaveContent = (savedContent: ContentItem) => {
    if (selectedContent) {
      // Update existing content
      setContent(prev => prev.map(item => 
        item.id === savedContent.id ? savedContent : item
      ));
    } else {
      // Add new content
      setContent(prev => [savedContent, ...prev]);
    }
    
    setCurrentView('list');
    setSelectedContent(null);
  };

  const filteredContent = content.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesType = typeFilter === 'all' || item.content_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: ContentStatus) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'pending_review': return 'bg-yellow-100 text-yellow-800';
      case 'published': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-64">
          <p>Please sign in to access this page.</p>
        </div>
      </Layout>
    );
  }

  if (!isAuthorized) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
            <p className="text-muted-foreground">You don't have permission to access the content management panel.</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (currentView === 'editor') {
    return (
      <ContentEditor
        content={selectedContent}
        categories={categories}
        onSave={handleSaveContent}
        onCancel={() => {
          setCurrentView('list');
          setSelectedContent(null);
        }}
      />
    );
  }

  if (currentView === 'preview' && selectedContent) {
    return (
      <ContentPreview
        content={selectedContent}
        onClose={() => {
          setCurrentView('list');
          setSelectedContent(null);
        }}
        onEdit={() => {
          setCurrentView('editor');
        }}
      />
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Content Management</h1>
            <p className="text-muted-foreground">Manage dynamic content across the platform</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {filteredContent.length} Items
            </Badge>
            <Button 
              onClick={() => {
                setSelectedContent(null);
                setCurrentView('editor');
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Content
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={(value: ContentStatus | 'all') => setStatusFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending_review">Pending Review</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={(value: ContentType | 'all') => setTypeFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="training_material">Training Material</SelectItem>
                  <SelectItem value="job_description">Job Description</SelectItem>
                  <SelectItem value="thought_leadership">Thought Leadership</SelectItem>
                  <SelectItem value="announcement">Announcement</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setTypeFilter('all');
              }}>
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Content List */}
        <div className="grid gap-4">
          {loading ? (
            <div className="flex items-center justify-center min-h-64">
              <p>Loading content...</p>
            </div>
          ) : filteredContent.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Content Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria.' 
                    : 'Get started by creating your first content item.'
                  }
                </p>
                <Button onClick={() => {
                  setSelectedContent(null);
                  setCurrentView('editor');
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Content
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredContent.map(item => (
              <Card key={item.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {item.excerpt || item.content.substring(0, 150) + '...'}
                      </CardDescription>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>Category: {item.category}</span>
                        <span>•</span>
                        <span>Type: {item.content_type.replace('_', ' ')}</span>
                        <span>•</span>
                        <span>Created: {new Date(item.created_at).toLocaleDateString()}</span>
                        {item.view_count > 0 && (
                          <>
                            <span>•</span>
                            <span>{item.view_count} views</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Badge className={getStatusColor(item.status)}>
                        {item.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex gap-1">
                          {item.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {item.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{item.tags.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Select value={item.status} onValueChange={(value: ContentStatus) => handleStatusChange(item.id, value)}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="pending_review">Pending Review</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedContent(item);
                          setCurrentView('preview');
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedContent(item);
                          setCurrentView('editor');
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteContent(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ContentManagementPage;
