
import React, { useEffect, useState } from 'react';
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Briefcase, MapPin, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getInternships } from '@/services/internshipService';

// Define unique industries based on mockInternships
const INDUSTRIES = [
  'Technology',
  'Marketing',
  'Banking',
  'Healthcare',
  'Education',
  'Retail',
  'Manufacturing',
  'Media',
  'Hospitality'
];

// Define business districts in Dubai
const LOCATIONS = [
  'Dubai Internet City',
  'Dubai Media City',
  'Dubai Marina',
  'Business Bay',
  'DIFC',
  'Downtown Dubai',
  'Dubai Silicon Oasis',
  'Dubai Knowledge Park',
  'JLT',
  'Deira'
];

interface InternshipsFilterProps {
  onFilterChange: (filters: {
    industry?: string[];
    isPaid?: boolean;
    location?: string[];
    search?: string;
  }) => void;
}

export const InternshipsFilter: React.FC<InternshipsFilterProps> = ({ onFilterChange }) => {
  const { t } = useTranslation('common');
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [isPaid, setIsPaid] = useState<boolean | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Apply filters when any filter value changes
  useEffect(() => {
    applyFilters();
  }, [selectedIndustries, selectedLocations, isPaid]);

  // Debounce search term changes
  useEffect(() => {
    const handler = setTimeout(() => {
      applyFilters();
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  const applyFilters = () => {
    onFilterChange({
      industry: selectedIndustries.length > 0 ? selectedIndustries : undefined,
      location: selectedLocations.length > 0 ? selectedLocations : undefined,
      isPaid: isPaid,
      search: searchTerm || undefined
    });
  };

  const resetFilters = () => {
    setSelectedIndustries([]);
    setSelectedLocations([]);
    setIsPaid(undefined);
    setSearchTerm('');
    onFilterChange({});
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Filters</CardTitle>
          {(selectedIndustries.length > 0 || selectedLocations.length > 0 || isPaid !== undefined || searchTerm) && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 text-xs">
              <X className="h-3 w-3 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t('forms.placeholders.searchInternships')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Paid Filter */}
          <div>
            <Label className="text-sm font-medium flex items-center mb-2">
              <span className="mr-2 text-gray-500 font-medium">AED</span>
              Payment
            </Label>
            <div className="flex gap-2">
              <Button 
                variant={isPaid === undefined ? "outline" : "ghost"} 
                size="sm"
                onClick={() => setIsPaid(undefined)}
                className="flex-1 text-xs"
              >
                All
              </Button>
              <Button 
                variant={isPaid === true ? "outline" : "ghost"} 
                size="sm"
                onClick={() => setIsPaid(true)}
                className="flex-1 text-xs"
              >
                Paid
              </Button>
              <Button 
                variant={isPaid === false ? "outline" : "ghost"} 
                size="sm"
                onClick={() => setIsPaid(false)}
                className="flex-1 text-xs"
              >
                Unpaid
              </Button>
            </div>
          </div>

          {/* Industry Filter */}
          <div>
            <Label className="text-sm font-medium flex items-center mb-2">
              <Briefcase className="h-4 w-4 mr-2 text-gray-500" />
              Industry
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-36 overflow-y-auto">
              {INDUSTRIES.slice(0, isExpanded ? INDUSTRIES.length : 4).map((industry) => (
                <div key={industry} className="flex items-center space-x-2">
                  <Checkbox
                    id={`industry-${industry}`}
                    checked={selectedIndustries.includes(industry)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedIndustries([...selectedIndustries, industry]);
                      } else {
                        setSelectedIndustries(selectedIndustries.filter((i) => i !== industry));
                      }
                    }}
                  />
                  <Label htmlFor={`industry-${industry}`} className="text-sm cursor-pointer">
                    {industry}
                  </Label>
                </div>
              ))}
            </div>
            {INDUSTRIES.length > 4 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsExpanded(!isExpanded)} 
                className="w-full mt-1 text-xs"
              >
                {isExpanded ? "Show Less" : "Show More"}
              </Button>
            )}
          </div>

          {/* Location Filter */}
          <div>
            <Label className="text-sm font-medium flex items-center mb-2">
              <MapPin className="h-4 w-4 mr-2 text-gray-500" />
              Location
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {LOCATIONS.slice(0, 6).map((location) => (
                <div key={location} className="flex items-center space-x-2">
                  <Checkbox
                    id={`location-${location}`}
                    checked={selectedLocations.includes(location)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedLocations([...selectedLocations, location]);
                      } else {
                        setSelectedLocations(selectedLocations.filter((l) => l !== location));
                      }
                    }}
                  />
                  <Label htmlFor={`location-${location}`} className="text-sm cursor-pointer">
                    {location}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
