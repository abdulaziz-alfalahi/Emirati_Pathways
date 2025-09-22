
import { User } from '@supabase/supabase-js';
import { UserRole } from '@/types/auth';
import React from 'react';

// Import components directly instead of using require
import {
  AdminDashboard,
  StudentDashboard,
  EducationalInstitutionDashboard,
  ParentDashboard,
  RecruiterDashboard,
  DefaultDashboard,
  GovRepDashboard,
  EntrepreneurDashboard,
  RetireeDashboard,
  MentorDashboard,
  TrainingCenterDashboard,
  AssessmentCenterDashboard
} from '@/components/dashboard/role-dashboards';

/**
 * Determines which dashboard component to render based on user email or active role
 */
export const getDashboardComponentByUserProfile = (
  user: User | null, 
  roles: UserRole[], 
  activeTab: string
): React.ReactNode => {
  // Get the active role (should be single role now)
  const activeRole = roles[0];

  // For testing, if email contains specific keywords, use appropriate dashboard regardless of roles
  if (user?.email) {
    // Check for university student first (more specific)
    if (user.email.includes('university-student') || user.email.includes('university_student')) {
      console.log("Email-based rendering: StudentDashboard for university student");
      return <StudentDashboard activeTab={activeTab} />;
    }
    
    // Check for career advisor emails with both formats (hyphen and underscore)
    if (user.email.includes('career-advisor') || user.email.includes('career_advisor')) {
      console.log("Email-based rendering: MentorDashboard");
      return <MentorDashboard activeTab={activeTab} />;
    }
  
    // Check for assessment center email with both formats (hyphen and underscore)
    if (user.email.includes('assessment-center') || user.email.includes('assessment_center')) {
      console.log("Email-based rendering: AssessmentCenterDashboard");
      return <AssessmentCenterDashboard activeTab={activeTab} />;
    }
    
    // Check for training center email with both formats (hyphen and underscore)
    if (user.email.includes('training-center') || user.email.includes('training_center')) {
      console.log("Email-based rendering: TrainingCenterDashboard");
      return <TrainingCenterDashboard activeTab={activeTab} />;
    }
    
    // Then check for general student
    if (user.email.includes('student')) {
      console.log("Email-based rendering: StudentDashboard");
      return <StudentDashboard activeTab={activeTab} />;
    }
    
    if (user.email.includes('admin')) {
      console.log("Email-based rendering: AdminDashboard");
      return <AdminDashboard activeTab={activeTab} />;
    }
    
    if (user.email.includes('school') || user.email.includes('edu')) {
      console.log("Email-based rendering: EducationalInstitutionDashboard");
      return <EducationalInstitutionDashboard activeTab={activeTab} />;
    }
    
    if (user.email.includes('parent')) {
      console.log("Email-based rendering: ParentDashboard");
      return <ParentDashboard activeTab={activeTab} />;
    }
    
    if (user.email.includes('recruit')) {
      console.log("Email-based rendering: RecruiterDashboard");
      return <RecruiterDashboard activeTab={activeTab} />;
    }
    
    if (user.email.includes('retiree')) {
      console.log("Email-based rendering: RetireeDashboard");
      return <RetireeDashboard activeTab={activeTab} />;
    }
    
    if (user.email.includes('entrepreneur')) {
      console.log("Email-based rendering: EntrepreneurDashboard");
      return <EntrepreneurDashboard activeTab={activeTab} />;
    }
  }

  // Check based on active role
  if (activeRole === 'administrator' || activeRole === 'super_user') {
    console.log("Rendering AdminDashboard for role:", activeRole);
    return <AdminDashboard activeTab={activeTab} />;
  }
  
  if (activeRole === 'school_student' || activeRole === 'university_student') {
    console.log("Rendering StudentDashboard for role:", activeRole);
    return <StudentDashboard activeTab={activeTab} />;
  }

  if (activeRole === 'educational_institution') {
    console.log("Rendering EducationalInstitutionDashboard for role:", activeRole);
    return <EducationalInstitutionDashboard activeTab={activeTab} />;
  }
  
  if (activeRole === 'parent') {
    console.log("Rendering ParentDashboard for role:", activeRole);
    return <ParentDashboard activeTab={activeTab} />;
  }
  
  if (activeRole === 'private_sector_recruiter') {
    console.log("Rendering RecruiterDashboard for role:", activeRole);
    return <RecruiterDashboard activeTab={activeTab} />;
  }
  
  if (activeRole === 'government_representative') {
    console.log("Rendering GovRepDashboard for role:", activeRole);
    return <GovRepDashboard activeTab={activeTab} />;
  }
  
  if (activeRole === 'entrepreneur') {
    console.log("Rendering EntrepreneurDashboard for role:", activeRole);
    return <EntrepreneurDashboard activeTab={activeTab} />;
  }
  
  if (activeRole === 'retiree' || activeRole === 'retiree_advocate') {
    console.log("Rendering RetireeDashboard for role:", activeRole);
    return <RetireeDashboard activeTab={activeTab} />;
  }
  
  if (activeRole === 'mentor' || activeRole === 'career_advisor') {
    console.log("Rendering MentorDashboard for role:", activeRole);
    return <MentorDashboard activeTab={activeTab} />;
  }
  
  if (activeRole === 'training_center') {
    console.log("Rendering TrainingCenterDashboard for role:", activeRole);
    return <TrainingCenterDashboard activeTab={activeTab} />;
  }
  
  if (activeRole === 'assessment_center') {
    console.log("Rendering AssessmentCenterDashboard for role:", activeRole);
    return <AssessmentCenterDashboard activeTab={activeTab} />;
  }
  
  // Default dashboard if active role doesn't match specific dashboards
  if (activeRole) {
    console.log("Rendering DefaultDashboard for role:", activeRole);
    return <DefaultDashboard userRole={activeRole} activeTab={activeTab} />;
  }
  
  // If email contains assessment-center, assessment_center, training-center, training_center,
  // or school/edu but no roles assigned, show the appropriate dashboard
  if (user?.email) {
    if (user.email.includes('university-student') || user.email.includes('university_student')) {
      console.log("Email-based fallback: StudentDashboard for university student");
      return <StudentDashboard activeTab={activeTab} />;
    }
    
    if (user.email.includes('assessment-center') || user.email.includes('assessment_center')) {
      console.log("Email-based fallback: AssessmentCenterDashboard");
      return <AssessmentCenterDashboard activeTab={activeTab} />;
    }
    
    if (user.email.includes('training-center') || user.email.includes('training_center')) {
      console.log("Email-based fallback: TrainingCenterDashboard");
      return <TrainingCenterDashboard activeTab={activeTab} />;
    }
    
    if (user.email.includes('career-advisor') || user.email.includes('career_advisor')) {
      console.log("Email-based fallback: MentorDashboard");
      return <MentorDashboard activeTab={activeTab} />;
    }
    
    if (user.email.includes('school') || user.email.includes('edu')) {
      console.log("Email-based fallback: EducationalInstitutionDashboard");
      return <EducationalInstitutionDashboard activeTab={activeTab} />;
    }
    
    if (user.email.includes('retiree')) {
      console.log("Email-based fallback: RetireeDashboard");
      return <RetireeDashboard activeTab={activeTab} />;
    }
    
    if (user.email.includes('entrepreneur')) {
      console.log("Email-based fallback: EntrepreneurDashboard");
      return <EntrepreneurDashboard activeTab={activeTab} />;
    }
  }
  
  // Default to student dashboard as a fallback
  return <StudentDashboard activeTab={activeTab} />;
};
