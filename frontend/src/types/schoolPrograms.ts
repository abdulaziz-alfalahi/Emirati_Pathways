
export interface ProgramFilters {
  gradeLevel?: string[];
  subjectArea?: string[];
  programType?: string[];
}

export interface SchoolProgram {
  id: string;
  title: string;
  description: string;
  institution: string;
  gradeLevel: string[];
  subjectArea: string[];
  programType: string[];
  ageRange: string;
  duration: string;
  schedule: string;
  location: string;
  startDate: string;
  enrollmentStatus: string;
  spotsAvailable: number;
  image: string;
}
