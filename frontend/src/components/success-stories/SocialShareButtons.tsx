
import React from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Facebook, Twitter, Linkedin, Link, MessageCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SocialShareButtonsProps {
  story: {
    id: string;
    title: string;
    summary: string;
    author: {
      name: string;
    };
  };
  variant?: 'default' | 'minimal';
}

const SocialShareButtons: React.FC<SocialShareButtonsProps> = ({ story, variant = 'default' }) => {
  const currentUrl = window.location.origin + `/success-stories#story-${story.id}`;
  const shareText = `Check out this inspiring success story: "${story.title}" by ${story.author.name}`;
  const shareTextEncoded = encodeURIComponent(shareText);
  const urlEncoded = encodeURIComponent(currentUrl);

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${urlEncoded}`,
    twitter: `https://twitter.com/intent/tweet?text=${shareTextEncoded}&url=${urlEncoded}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${urlEncoded}`,
    whatsapp: `https://wa.me/?text=${shareTextEncoded}%20${urlEncoded}`
  };

  const handleShare = (platform: string) => {
    const url = shareLinks[platform as keyof typeof shareLinks];
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer,width=600,height=400');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      toast({
        title: "Link copied!",
        description: "Story link has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: story.title,
          text: shareText,
          url: currentUrl,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    }
  };

  if (variant === 'minimal') {
    return (
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={navigator.share ? handleNativeShare : handleCopyLink}
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium">Share this story</h4>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShare('facebook')}
          className="flex items-center space-x-2"
        >
          <Facebook className="h-4 w-4" />
          <span>Facebook</span>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShare('twitter')}
          className="flex items-center space-x-2"
        >
          <Twitter className="h-4 w-4" />
          <span>Twitter</span>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShare('linkedin')}
          className="flex items-center space-x-2"
        >
          <Linkedin className="h-4 w-4" />
          <span>LinkedIn</span>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShare('whatsapp')}
          className="flex items-center space-x-2"
        >
          <MessageCircle className="h-4 w-4" />
          <span>WhatsApp</span>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyLink}
          className="flex items-center space-x-2"
        >
          <Link className="h-4 w-4" />
          <span>Copy Link</span>
        </Button>
        
        {navigator.share && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleNativeShare}
            className="flex items-center space-x-2"
          >
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default SocialShareButtons;
