
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { ContentItem, ContentCategory, ContentType, ContentStatus } from '@/types/content';
import Layout from '@/components/layout/Layout';
import { ArrowLeft, Save, Eye, Plus, X } from 'lucide-react';

interface ContentEditorProps {
  content?: ContentItem | null;
  categories: ContentCategory[];
  onSave: (savedContent: ContentItem) => void;
  onCancel: () => void;
}

const ContentEditor: React.FC<ContentEditorProps> = ({
  content,
  categories,
  onSave,
  onCancel
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: content?.title || '',
    content: content?.content || '',
    excerpt: content?.excerpt || '',
    category: content?.category || '',
    content_type: content?.content_type || 'training_material' as ContentType,
    status: content?.status || 'draft' as ContentStatus,
    tags: content?.tags || [],
    featured_image_url: content?.featured_image_url || '',
    slug: content?.slug || ''
  });
  const [newTag, setNewTag] = useState('');

  const isEditing = !!content;

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim() || !formData.category) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (title, content, category).",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);

      const saveData = {
        ...formData,
        author_id: user?.id,
        metadata: {},
        ...(formData.status === 'published' && !content?.published_date ? {
          published_date: new Date().toISOString()
        } : {})
      };

      let savedContent: ContentItem;

      if (isEditing) {
        const { data, error } = await supabase
          .from('content_items' as any)
          .update(saveData)
          .eq('id', content.id)
          .select()
          .single();

        if (error) throw error;
        savedContent = (data as unknown) as ContentItem;
      } else {
        const { data, error } = await supabase
          .from('content_items' as any)
          .insert([saveData])
          .select()
          .single();

        if (error) throw error;
        savedContent = (data as unknown) as ContentItem;
      }

      toast({
        title: "Success",
        description: `Content ${isEditing ? 'updated' : 'created'} successfully.`
      });

      onSave(savedContent);
    } catch (error) {
      console.error('Error saving content:', error);
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? 'update' : 'create'} content. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredCategories = categories.filter(cat => cat.content_type === formData.content_type);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">
                {isEditing ? 'Edit Content' : 'Create Content'}
              </h1>
              <p className="text-muted-foreground">
                {isEditing ? 'Update existing content' : 'Create new content for the platform'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Content Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Title *</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter content title..."
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Excerpt</label>
                  <Textarea
                    value={formData.excerpt}
                    onChange={(e) => handleInputChange('excerpt', e.target.value)}
                    placeholder="Brief description or excerpt..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Content *</label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    placeholder="Write your content here..."
                    rows={15}
                    className="font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Featured Image URL</label>
                  <Input
                    value={formData.featured_image_url}
                    onChange={(e) => handleInputChange('featured_image_url', e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Custom Slug</label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => handleInputChange('slug', e.target.value)}
                    placeholder="custom-url-slug (leave empty for auto-generation)"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Publishing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value: ContentStatus) => handleInputChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="pending_review">Pending Review</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Content Type *</label>
                  <Select 
                    value={formData.content_type} 
                    onValueChange={(value: ContentType) => {
                      handleInputChange('content_type', value);
                      handleInputChange('category', ''); // Reset category when type changes
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="training_material">Training Material</SelectItem>
                      <SelectItem value="job_description">Job Description</SelectItem>
                      <SelectItem value="thought_leadership">Thought Leadership</SelectItem>
                      <SelectItem value="announcement">Announcement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Category *</label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => handleInputChange('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCategories.map(category => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add tag..."
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button onClick={addTag} size="sm" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ms-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ContentEditor;
