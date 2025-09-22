
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Layout from '@/components/layout/Layout';
import { ArrowLeft, Edit, Calendar, User, Tag, Eye } from 'lucide-react';
import { ContentItem } from '@/types/content';

interface ContentPreviewProps {
  content: ContentItem;
  onClose: () => void;
  onEdit: () => void;
}

const ContentPreview: React.FC<ContentPreviewProps> = ({
  content,
  onClose,
  onEdit
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'pending_review': return 'bg-yellow-100 text-yellow-800';
      case 'published': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Content Preview</h1>
              <p className="text-muted-foreground">Preview how this content will appear</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onEdit} className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-2xl">{content.title}</CardTitle>
                      {content.excerpt && (
                        <p className="text-lg text-muted-foreground mt-2">{content.excerpt}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Badge className={getStatusColor(content.status)}>
                        {content.status.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline">
                        {content.content_type.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Created: {formatDate(content.created_at)}
                    </div>
                    {content.updated_at !== content.created_at && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Updated: {formatDate(content.updated_at)}
                      </div>
                    )}
                    {content.published_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Published: {formatDate(content.published_date)}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {content.author_id ? 'Author' : 'System'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {content.view_count} views
                    </div>
                  </div>

                  {content.featured_image_url && (
                    <div className="mt-4">
                      <img
                        src={content.featured_image_url}
                        alt={content.title}
                        className="w-full h-64 object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div
                  className="prose prose-slate max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: content.content.replace(/\n/g, '<br />')
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Content Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Category</div>
                  <div className="flex items-center gap-1">
                    <Tag className="h-4 w-4" />
                    {content.category}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Content Type</div>
                  <div>{content.content_type.replace('_', ' ')}</div>
                </div>

                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Status</div>
                  <Badge className={getStatusColor(content.status)}>
                    {content.status.replace('_', ' ')}
                  </Badge>
                </div>

                {content.slug && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Slug</div>
                    <div className="text-sm font-mono bg-muted px-2 py-1 rounded">
                      {content.slug}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {content.tags && content.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {content.tags.map(tag => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {Object.keys(content.metadata).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Metadata</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm bg-muted p-3 rounded overflow-auto">
                    {JSON.stringify(content.metadata, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ContentPreview;
