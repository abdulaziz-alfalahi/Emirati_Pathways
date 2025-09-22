
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, FileCheck, BookOpen } from 'lucide-react';
import { BrowsePositionsTab } from './BrowsePositionsTab';
import { MyApplicationsTab } from './MyApplicationsTab';
import { ResourcesTab } from './ResourcesTab';

export const AdvisoryPositionsContent: React.FC = () => {
  return (
    <Tabs defaultValue="browse" className="w-full">
      <TabsList className="mb-6 bg-white border shadow-sm">
        <TabsTrigger value="browse" className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Browse Positions</span>
        </TabsTrigger>
        <TabsTrigger value="applications" className="flex items-center gap-2">
          <FileCheck className="h-4 w-4" />
          <span className="hidden sm:inline">My Applications</span>
        </TabsTrigger>
        <TabsTrigger value="resources" className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          <span className="hidden sm:inline">Resources</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="browse">
        <BrowsePositionsTab />
      </TabsContent>

      <TabsContent value="applications">
        <MyApplicationsTab />
      </TabsContent>

      <TabsContent value="resources">
        <ResourcesTab />
      </TabsContent>
    </Tabs>
  );
};
