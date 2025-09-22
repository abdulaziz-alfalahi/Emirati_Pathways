
import { careerPathService } from '../careerPathService';

// Re-export the main service
export { careerPathService };

// Re-export types
export type { CareerPath, CareerPathStage } from '../careerPathService';

// Additional utility functions can be added here
export const getCareerPathsByIndustry = async (industry: string) => {
  const allPaths = await careerPathService.getCareerPaths();
  return allPaths.filter(path => path.industry === industry);
};

// Re-export individual functions for compatibility
export { 
  getUserCareerPaths,
  getUserCareerPathDetails,
  deleteUserCareerPath,
  selectCareerPath,
  getCareerPathById,
  updateUserCareerStage,
  getCareerPaths
} from '../careerPathService';
