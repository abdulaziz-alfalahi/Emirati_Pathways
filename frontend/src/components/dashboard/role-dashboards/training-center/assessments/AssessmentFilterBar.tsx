
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter } from 'lucide-react';

interface AssessmentFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTab: string;
  onTabChange: (tab: string) => void;
}

const AssessmentFilterBar: React.FC<AssessmentFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedTab,
  onTabChange
}) => {
  return (
    <div className="flex justify-between mb-4">
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search assessments..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2">
        <Tabs value={selectedTab} onValueChange={onTabChange}>
          <TabsList>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default AssessmentFilterBar;
