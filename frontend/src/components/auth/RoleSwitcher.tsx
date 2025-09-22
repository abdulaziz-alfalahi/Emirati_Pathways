import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '@/context/RoleContext';
import { UserRole } from '@/types/auth';
import { getDashboardPath } from './ProtectedRoute';

const RoleSwitcher: React.FC = () => {
  const { activeRole, availableRoles, setActiveRole } = useRole();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  // Don't show the switcher if user only has one role
  if (availableRoles.length <= 1) {
    return null;
  }

  const handleRoleSwitch = (newRole: UserRole) => {
    setActiveRole(newRole);
    setIsOpen(false);
    
    // Navigate to the appropriate dashboard for the new role
    const dashboardPath = getDashboardPath(newRole);
    navigate(dashboardPath);
  };

  const getRoleDisplayName = (role: UserRole): string => {
    const roleNames: Record<UserRole, string> = {
      'administrator': 'Administrator',
      'super_user': 'Super User',
      'private_sector_recruiter': 'Employer/Recruiter',
      'government_representative': 'Government Representative',
      'educational_institution': 'Educational Institution',
      'mentor': 'Mentor',
      'career_advisor': 'Career Advisor',
      'candidate': 'Job Seeker',
      'school_student': 'School Student',
      'university_student': 'University Student',
      'jobseeker': 'Job Seeker',
      'intern': 'Intern',
      'full_time_employee': 'Full-time Employee',
      'part_time_employee': 'Part-time Employee',
      'gig_worker': 'Gig Worker',
      'lifelong_learner': 'Lifelong Learner',
      'entrepreneur': 'Entrepreneur',
      'retiree': 'Retiree',
      'parent': 'Parent',
      'training_center': 'Training Center',
      'assessment_center': 'Assessment Center',
      'platform_operator': 'Platform Operator',
      'national_service_participant': 'National Service Participant',
      'retiree_advocate': 'Retiree Advocate'
    };
    
    return roleNames[role] || role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getRoleIcon = (role: UserRole): string => {
    const roleIcons: Record<string, string> = {
      'administrator': '⚙️',
      'super_user': '👑',
      'private_sector_recruiter': '💼',
      'government_representative': '🏛️',
      'educational_institution': '🎓',
      'mentor': '🧭',
      'career_advisor': '💡',
      'candidate': '👤',
      'school_student': '📚',
      'university_student': '🎓',
      'jobseeker': '🔍',
      'intern': '📝',
      'full_time_employee': '💼',
      'part_time_employee': '⏰',
      'gig_worker': '🚀',
      'lifelong_learner': '📖',
      'entrepreneur': '💡',
      'retiree': '🌅'
    };
    
    return roleIcons[role] || '👤';
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
      >
        <span className="text-lg">{getRoleIcon(activeRole || 'candidate')}</span>
        <span>{getRoleDisplayName(activeRole || 'candidate')}</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          <div className="py-1">
            <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
              Switch Role
            </div>
            {availableRoles.map((role) => (
              <button
                key={role}
                onClick={() => handleRoleSwitch(role)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-3 ${
                  role === activeRole ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
              >
                <span className="text-lg">{getRoleIcon(role)}</span>
                <span>{getRoleDisplayName(role)}</span>
                {role === activeRole && (
                  <span className="ml-auto text-blue-500">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Overlay to close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default RoleSwitcher;

