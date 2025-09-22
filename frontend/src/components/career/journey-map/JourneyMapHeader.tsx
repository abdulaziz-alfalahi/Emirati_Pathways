
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Filter,
  Download,
  GitCompare
} from 'lucide-react';

interface CareerPath {
  id: string;
  title: string;
  industry: string;
  stages: any[];
  totalProgress: number;
}

interface JourneyMapHeaderProps {
  selectedPath: string;
  setSelectedPath: (path: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  onOpenComparison: () => void;
  onOpenExport: () => void;
  availablePaths: CareerPath[];
}

const JourneyMapHeader: React.FC<JourneyMapHeaderProps> = ({
  selectedPath,
  setSelectedPath,
  selectedCategory,
  setSelectedCategory,
  onOpenComparison,
  onOpenExport,
  availablePaths
}) => {
  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Career Journey Map</h2>
        <p className="text-muted-foreground">
          Track your progress and explore potential career paths in the UAE
        </p>
      </div>
      
      <div className="flex gap-4 items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenComparison}
          className="flex items-center gap-2"
        >
          <GitCompare className="h-4 w-4" />
          Compare Paths
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenExport}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export Map
        </Button>
        
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={selectedPath} onValueChange={setSelectedPath}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select career path" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Career Paths</SelectItem>
            {availablePaths.map(path => (
              <SelectItem key={path.id} value={path.id}>
                {path.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            <SelectItem value="education">Education</SelectItem>
            <SelectItem value="career">Career</SelectItem>
            <SelectItem value="personal">Personal</SelectItem>
            <SelectItem value="retirement">Retirement</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default JourneyMapHeader;
