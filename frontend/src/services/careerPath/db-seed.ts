export interface SeedData {
  career_paths: any[];
  stages: any[];
}

export const seedData: SeedData = {
  career_paths: [
    {
      id: '1',
      title: 'Software Developer',
      industry: 'Technology',
      description: 'Build and maintain software applications'
    }
  ],
  stages: [
    {
      id: '1',
      career_path_id: '1',
      title: 'Junior Developer',
      stage_type: 'entry',
      order_index: 1
    }
  ]
};

export const seedDatabase = async () => {
  console.log('Seeding database with career path data...');
  // Implementation would go here
};
