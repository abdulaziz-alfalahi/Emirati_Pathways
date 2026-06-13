
import React from 'react';
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { UserRole } from "@/types/auth";

interface RoleSelectorProps {
  selectedRoles: UserRole[];
  onRolesChange: (roles: UserRole[]) => void;
}

type PersonaOption = {
  value: UserRole;
  label: string;
  category: string;
};

const personaOptions: PersonaOption[] = [
  // Students & Learners
  { value: 'school_student', label: 'School Student', category: 'Students & Learners' },
  { value: 'university_student', label: 'University Student', category: 'Students & Learners' },
  { value: 'lifelong_learner', label: 'Lifelong Learner', category: 'Students & Learners' },
  { value: 'national_service_participant', label: 'National Service Participant', category: 'Students & Learners' },
  
  // Professionals
  { value: 'full_time_employee', label: 'Full-Time Employee', category: 'Professionals' },
  { value: 'part_time_employee', label: 'Part-Time Employee', category: 'Professionals' },
  { value: 'gig_worker', label: 'Gig Worker', category: 'Professionals' },
  { value: 'intern', label: 'Internship Trainee', category: 'Professionals' },
  { value: 'jobseeker', label: 'Jobseeker', category: 'Professionals' },
  { value: 'entrepreneur', label: 'Entrepreneur/Business Owner', category: 'Professionals' },
  
  // Family & Community
  { value: 'parent', label: 'Parent', category: 'Family & Community' },
  { value: 'candidate', label: 'Retiree', category: 'Family & Community' },
  { value: 'retiree_advocate', label: 'Retiree Advocate', category: 'Family & Community' },
  
  // Organizations
  { value: 'educational_institution', label: 'Educational Institution', category: 'Organizations' },
  { value: 'training_center', label: 'Training Center', category: 'Organizations' },
  { value: 'assessment_center', label: 'Assessment Center', category: 'Organizations' },
  { value: 'private_sector_recruiter', label: 'Private Sector Recruiter', category: 'Organizations' },
  { value: 'government_representative', label: 'Government Representative', category: 'Organizations' },
  
  // Support & Guidance
  { value: 'mentor', label: 'Mentor/Coach', category: 'Support & Guidance' },
  { value: 'career_advisor', label: 'Career Advisor', category: 'Support & Guidance' },
  
  // Platform Management
  { value: 'platform_operator', label: 'Platform Operator', category: 'Platform Management' },
  { value: 'admin', label: 'Platform Administrator', category: 'Platform Management' },
  { value: 'super_user', label: 'Super User', category: 'Platform Management' },
];

// Group options by category
const groupedOptions = personaOptions.reduce((acc, option) => {
  if (!acc[option.category]) {
    acc[option.category] = [];
  }
  acc[option.category].push(option);
  return acc;
}, {} as Record<string, PersonaOption[]>);

const RoleSelector: React.FC<RoleSelectorProps> = ({ selectedRoles, onRolesChange }) => {
  const handleRoleToggle = (role: UserRole, checked: boolean) => {
    if (checked) {
      onRolesChange([...selectedRoles, role]);
    } else {
      onRolesChange(selectedRoles.filter(r => r !== role));
    }
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium">Select Your Role(s)</Label>
      <p className="text-sm text-muted-foreground">
        You can select multiple roles that apply to you. This will help us provide a more personalized experience.
      </p>
      
      <div className="max-h-60 overflow-y-auto space-y-4 border rounded-md p-4">
        {Object.entries(groupedOptions).map(([category, options]) => (
          <div key={category} className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground border-b pb-1">
              {category}
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {options.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.value}
                    checked={selectedRoles.includes(option.value)}
                    onCheckedChange={(checked) => 
                      handleRoleToggle(option.value, checked as boolean)
                    }
                  />
                  <Label 
                    htmlFor={option.value} 
                    className="text-sm font-normal cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {selectedRoles.length > 0 && (
        <div className="p-3 bg-muted rounded-md">
          <p className="text-sm font-medium">Selected roles ({selectedRoles.length}):</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {selectedRoles.map((role) => {
              const option = personaOptions.find(p => p.value === role);
              return (
                <span 
                  key={role} 
                  className="inline-block bg-primary/10 text-primary text-xs px-2 py-1 rounded"
                >
                  {option?.label}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleSelector;
