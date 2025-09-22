
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search, FileText, Video, Mic, Users } from 'lucide-react';
import { ArticlesTab } from './ArticlesTab';
import { ResearchPapersTab } from './ResearchPapersTab';
import { MediaTab } from './MediaTab';
import { ContributorsTab } from './ContributorsTab';

export const ThoughtLeadershipContent: React.FC = () => {
  const [searchQuery, setSearchQuery] = React.useState('');

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search thought leadership content..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs defaultValue="articles" className="w-full">
        <TabsList className="mb-6 bg-white border shadow-sm">
          <TabsTrigger value="articles" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Articles</span>
          </TabsTrigger>
          <TabsTrigger value="research" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Research Papers</span>
          </TabsTrigger>
          <TabsTrigger value="media" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            <span className="hidden sm:inline">Videos & Podcasts</span>
          </TabsTrigger>
          <TabsTrigger value="contributors" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Contributors</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="articles">
          <ArticlesTab searchQuery={searchQuery} />
        </TabsContent>

        <TabsContent value="research">
          <ResearchPapersTab searchQuery={searchQuery} />
        </TabsContent>

        <TabsContent value="media">
          <MediaTab searchQuery={searchQuery} />
        </TabsContent>

        <TabsContent value="contributors">
          <ContributorsTab searchQuery={searchQuery} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
