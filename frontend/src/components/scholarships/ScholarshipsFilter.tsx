
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Search } from 'lucide-react';

interface FilterOptions {
  providerType: string[];
  amount: [number | null, number | null];
}

interface ScholarshipsFilterProps {
  onFilterChange: (filters: FilterOptions) => void;
  onSearchChange: (query: string) => void;
  selectedFilters: FilterOptions;
  searchQuery: string;
}

const ScholarshipsFilter: React.FC<ScholarshipsFilterProps> = ({
  onFilterChange,
  onSearchChange,
  selectedFilters,
  searchQuery
}) => {
  const providerTypes = [
    { id: 'compliance_auditor', label: 'Government' },
    { id: 'university', label: 'University' },
    { id: 'private_sector', label: 'Private Sector' }
  ];

  const handleProviderTypeChange = (typeId: string, checked: boolean) => {
    const newProviderTypes = checked
      ? [...selectedFilters.providerType, typeId]
      : selectedFilters.providerType.filter(id => id !== typeId);
    
    onFilterChange({
      ...selectedFilters,
      providerType: newProviderTypes
    });
  };

  const handleAmountChange = (values: number[]) => {
    onFilterChange({
      ...selectedFilters,
      amount: [values[0] * 1000, values[1] * 1000] // Convert to actual AED amounts
    });
  };

  const currentAmountRange = [
    (selectedFilters.amount[0] || 0) / 1000,
    (selectedFilters.amount[1] || 250) / 1000
  ];

  return (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <Label htmlFor="search" className="text-sm font-medium mb-2 block">
          Search Scholarships
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Search by title, provider, or keywords..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Provider Type Filter */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Provider Type</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {providerTypes.map((type) => (
              <div key={type.id} className="flex items-center space-x-2">
                <Checkbox
                  id={type.id}
                  checked={selectedFilters.providerType.includes(type.id)}
                  onCheckedChange={(checked) =>
                    handleProviderTypeChange(type.id, checked as boolean)
                  }
                />
                <Label
                  htmlFor={type.id}
                  className="text-sm font-normal cursor-pointer"
                >
                  {type.label}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Amount Range Filter */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Scholarship Amount (AED)</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            <Slider
              value={currentAmountRange}
              onValueChange={handleAmountChange}
              max={250}
              min={0}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>AED {(currentAmountRange[0] * 1000).toLocaleString()}</span>
              <span>AED {(currentAmountRange[1] * 1000).toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Field of Study Filter */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Field of Study</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {['Engineering', 'Business', 'Computer Science', 'Medicine', 'Arts & Humanities'].map((field) => (
              <div key={field} className="flex items-center space-x-2">
                <Checkbox id={field} />
                <Label htmlFor={field} className="text-sm font-normal cursor-pointer">
                  {field}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Eligibility Criteria */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Eligibility</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {['UAE Nationals Only', 'Open to All Residents', 'Merit-Based', 'Need-Based'].map((criteria) => (
              <div key={criteria} className="flex items-center space-x-2">
                <Checkbox id={criteria} />
                <Label htmlFor={criteria} className="text-sm font-normal cursor-pointer">
                  {criteria}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScholarshipsFilter;
