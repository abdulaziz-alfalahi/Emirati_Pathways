
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { campQueryService } from '@/services/summerCamps';
// import { CampFilters } from '@/services/summerCamps/types';

interface CampFilters {
  category?: string[];
  location?: string[];
  ageGroup?: string[];
  priceRange?: [number, number];
}

export const useCamps = (type?: string, filters?: CampFilters, searchQuery?: string) => {
  const { user } = useAuth();

  const {
    data: camps = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['camps'],
    queryFn: () => campQueryService.getCamps(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const {
    data: userEnrollments = [],
    isLoading: isLoadingEnrollments
  } = useQuery({
    queryKey: ['user-enrollments', user?.id],
    queryFn: () => Promise.resolve([]), // Mock implementation
    enabled: !!user?.id,
  });

  // Group camps by category
  const campsByCategory = camps.reduce((acc: Record<string, any[]>, camp: any) => {
    const category = camp.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(camp);
    return acc;
  }, {});

  // Get unique locations from camps
  const locations = [...new Set(camps.map((camp: any) => camp.location).filter((loc: any) => loc))];

  // Get unique age groups
  const ageGroups = [...new Set(camps.map((camp: any) => camp.age_group).filter((group: any) => group))];

  // Get unique categories
  const categories = [...new Set(camps.map((camp: any) => camp.category).filter((cat: any) => cat))];

  // Get camps by location
  const getCampsByLocation = (location: string) => {
    return camps.filter((camp: any) => camp.location === location);
  };

  // Get camps by age group
  const getCampsByAgeGroup = (ageGroup: string) => {
    return camps.filter((camp: any) => camp.age_group === ageGroup);
  };

  // Get featured camps (you can define your own logic)
  const featuredCamps = camps.filter((camp: any) => 
    camp.featured || camp.rating >= 4.5 || camp.enrolled > 50
  );

  return {
    camps,
    campsByCategory,
    locations,
    ageGroups,
    categories,
    featuredCamps,
    userEnrollments,
    loading: isLoading,
    totalCount: camps.length,
    enrolledCamps: userEnrollments,
    pagination: { 
      page: 1, 
      limit: 20, 
      total: camps.length,
      currentPage: 1,
      pageSize: 20,
      getTotalPages: (total: number) => Math.ceil(total / 20),
      setCurrentPage: (page: number) => console.log('Set page:', page),
      hasNextPage: (total: number) => false,
      hasPreviousPage: () => false
    },
    handleEnroll: (campId: string) => console.log('Enroll in camp:', campId),
    handleCancelEnrollment: (campId: string) => console.log('Cancel enrollment:', campId),
    isLoading,
    isLoadingEnrollments,
    error,
    refetch,
    getCampsByLocation,
    getCampsByAgeGroup,
  };
};
