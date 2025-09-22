
import { enrollmentService } from './enrollmentService';
import { campService } from './campService';
import { campQueryService } from './campQueryService';

// Re-export all services from this index file
export { 
  enrollmentService,
  campService,
  campQueryService
};

// Re-export individual functions for backward compatibility
export const {
  getCamps,
  getCampById,
  getCampsByInstitution
} = campQueryService;

export const {
  createCamp,
  updateCamp
} = campService;

export const {
  enrollInCamp,
  cancelEnrollment,
  getUserEnrollments,
  getCampEnrollments
} = enrollmentService;
