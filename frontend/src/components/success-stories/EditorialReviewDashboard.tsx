import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Eye, 
  MessageSquare,
  Calendar,
  User
} from 'lucide-react';
import { SuccessStory } from '@/types/successStories';
import { SuccessStoriesService } from '@/services/successStoriesService';
import StoryCard from './StoryCard';

const EditorialReviewDashboard: React.FC = () => {
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [selectedStory, setSelectedStory] = useState<SuccessStory | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    setIsLoading(true);
    try {
      const pendingStories = await SuccessStoriesService.getStoriesForReview();
      const publishedStories = await SuccessStoriesService.getStories({ status: 'published' });
      setStories([...pendingStories, ...publishedStories]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load stories for review",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async (storyId: string, status: 'approved' | 'rejected', notes: string) => {
    try {
      await SuccessStoriesService.updateStoryStatus(
        storyId, 
        status === 'approved' ? 'published' : 'rejected',
        notes
      );
      
      toast({
        title: "Review Submitted",
        description: `Story has been ${status}`,
      });
      
      setSelectedStory(null);
      setReviewNotes('');
      loadStories();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit review",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string): "default" | "destructive" | "secondary" | "outline" | "success" => {
    switch (status) {
      case 'submitted': return 'secondary';
      case 'under_review': return 'secondary';
      case 'approved': case 'published': return 'default';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted': case 'under_review': return <Clock className="h-4 w-4" />;
      case 'approved': case 'published': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const pendingStories = stories.filter(s => s.status === 'submitted' || s.status === 'under_review');
  const reviewedStories = stories.filter(s => s.status === 'published' || s.status === 'rejected');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Editorial Review Dashboard</h1>
          <p className="text-muted-foreground">Review and manage submitted success stories</p>
        </div>
        
        <div className="flex space-x-4">
          <Card className="px-4 py-2">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">{pendingStories.length} Pending Review</span>
            </div>
          </Card>
          <Card className="px-4 py-2">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">{reviewedStories.filter(s => s.status === 'published').length} Published</span>
            </div>
          </Card>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">Pending Review ({pendingStories.length})</TabsTrigger>
          <TabsTrigger value="reviewed">Reviewed ({reviewedStories.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingStories.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-medium mb-2">All Caught Up!</h3>
                <p className="text-muted-foreground text-center">
                  No stories are currently pending review. Great work keeping up with submissions!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingStories.map((story) => (
                <Card key={story.id} className="relative">
                  <div className="absolute top-4 right-4">
                    <Badge variant={
                      story.status === 'published' ? 'default' :
                      story.status === 'approved' ? 'secondary' :
                      story.status === 'rejected' ? 'destructive' : 'outline'
                    } className="flex items-center space-x-1">
                      {getStatusIcon(story.status)}
                      <span className="capitalize">{story.status.replace('_', ' ')}</span>
                    </Badge>
                  </div>
                  
                  <CardHeader className="pr-20">
                    <CardTitle className="line-clamp-2">{story.title}</CardTitle>
                    <CardDescription className="line-clamp-3">{story.summary}</CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="flex items-center space-x-2 mb-4">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{story.author.name}</span>
                      <Calendar className="h-4 w-4 text-muted-foreground ml-4" />
                      <span className="text-sm">{new Date(story.submitted_at!).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => setSelectedStory(story)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Review Story: {selectedStory?.title}</DialogTitle>
                            <DialogDescription>
                              Review this story and provide feedback for publication or revision.
                            </DialogDescription>
                          </DialogHeader>
                          
                          {selectedStory && (
                            <div className="space-y-6">
                              <StoryCard story={selectedStory} variant="featured" />
                              
                              <div>
                                <h4 className="font-medium mb-2">Full Story Content</h4>
                                <div className="bg-muted p-4 rounded-lg max-h-60 overflow-y-auto">
                                  <p className="whitespace-pre-wrap">{selectedStory.content}</p>
                                </div>
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium mb-2">Review Notes</label>
                                <Textarea
                                  placeholder="Add your feedback, suggested changes, or approval notes..."
                                  value={reviewNotes}
                                  onChange={(e) => setReviewNotes(e.target.value)}
                                  className="min-h-[100px]"
                                />
                              </div>
                              
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="destructive"
                                  onClick={() => handleReview(selectedStory.id, 'rejected', reviewNotes)}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                                <Button
                                  onClick={() => handleReview(selectedStory.id, 'approved', reviewNotes)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve & Publish
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reviewed" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviewedStories.map((story) => (
              <div key={story.id} className="relative">
                <div className="absolute top-4 right-4 z-10">
                  <Badge variant={
                    story.status === 'published' ? 'default' :
                    story.status === 'approved' ? 'secondary' :
                    story.status === 'rejected' ? 'destructive' : 'outline'
                  } className="flex items-center space-x-1">
                    {getStatusIcon(story.status)}
                    <span className="capitalize">{story.status}</span>
                  </Badge>
                </div>
                <StoryCard story={story} />
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EditorialReviewDashboard;
