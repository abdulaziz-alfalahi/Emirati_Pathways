
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Users, 
  BookOpen,
  Lightbulb,
  Award,
  Building,
  Filter
} from 'lucide-react';

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  storyCounts?: Record<string, number>;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ 
  selectedCategory, 
  onCategoryChange,
  storyCounts = {}
}) => {
  const categoryData = {
    career_progression: {
      label: 'Career Growth',
      icon: <TrendingUp className="h-4 w-4" />,
      color: 'bg-blue-100 text-blue-800',
      description: 'Professional advancement and career development'
    },
    entrepreneurship: {
      label: 'Entrepreneurship',
      icon: <Building className="h-4 w-4" />,
      color: 'bg-green-100 text-green-800',
      description: 'Starting businesses and innovation ventures'
    },
    education: {
      label: 'Education',
      icon: <BookOpen className="h-4 w-4" />,
      color: 'bg-purple-100 text-purple-800',
      description: 'Learning achievements and academic success'
    },
    innovation: {
      label: 'Innovation',
      icon: <Lightbulb className="h-4 w-4" />,
      color: 'bg-yellow-100 text-yellow-800',
      description: 'Creative solutions and technological breakthroughs'
    },
    leadership: {
      label: 'Leadership',
      icon: <Users className="h-4 w-4" />,
      color: 'bg-red-100 text-red-800',
      description: 'Leading teams and organizations'
    },
    skills_development: {
      label: 'Skills Development',
      icon: <Award className="h-4 w-4" />,
      color: 'bg-orange-100 text-orange-800',
      description: 'Learning new skills and competencies'
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Filter className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-sm font-medium">Filter by Category</h3>
      </div>
      
      {/* Mobile/Compact Select */}
      <div className="md:hidden">
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger>
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(categoryData).map(([value, data]) => (
              <SelectItem key={value} value={value}>
                <div className="flex items-center space-x-2">
                  {data.icon}
                  <span>{data.label}</span>
                  {storyCounts[value] && (
                    <Badge variant="secondary" className="ms-auto text-xs">
                      {storyCounts[value]}
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop Category Grid */}
      <div className="hidden md:block">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <button
            onClick={() => onCategoryChange('all')}
            className={`p-3 rounded-lg border text-start transition-all ${
              selectedCategory === 'all'
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-border hover:border-primary/50 hover:bg-muted/50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-sm">All Categories</span>
              {Object.values(storyCounts).reduce((a, b) => a + b, 0) > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {Object.values(storyCounts).reduce((a, b) => a + b, 0)}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">View all success stories</p>
          </button>
          
          {Object.entries(categoryData).map(([value, data]) => (
            <button
              key={value}
              onClick={() => onCategoryChange(value)}
              className={`p-3 rounded-lg border text-start transition-all ${
                selectedCategory === value
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2">
                  {data.icon}
                  <span className="font-medium text-sm">{data.label}</span>
                </div>
                {storyCounts[value] && (
                  <Badge variant="secondary" className="text-xs">
                    {storyCounts[value]}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{data.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryFilter;
