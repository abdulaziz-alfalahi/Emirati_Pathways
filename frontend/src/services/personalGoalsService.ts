
export interface PersonalGoal {
  id: string;
  title: string;
  description: string;
  category: 'education' | 'career' | 'personal' | 'retirement';
  priority: 'low' | 'medium' | 'high';
  targetDate?: string;
  completed: boolean;
  associatedStageId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GoalTemplate {
  id: string;
  title: string;
  description: string;
  category: 'education' | 'career' | 'personal' | 'retirement';
  suggestedAge?: string;
}

// Mock goal templates that users can drag onto stages
export const goalTemplates: GoalTemplate[] = [
  {
    id: 'learn-arabic',
    title: 'Learn Arabic',
    description: 'Improve Arabic language skills for better UAE integration',
    category: 'personal',
    suggestedAge: '18-30'
  },
  {
    id: 'leadership-course',
    title: 'Leadership Training',
    description: 'Complete leadership development course',
    category: 'career',
    suggestedAge: '25-35'
  },
  {
    id: 'masters-degree',
    title: 'Master\'s Degree',
    description: 'Pursue advanced degree in your field',
    category: 'education',
    suggestedAge: '22-28'
  },
  {
    id: 'networking',
    title: 'Professional Network',
    description: 'Build strong professional connections in UAE',
    category: 'career',
    suggestedAge: '20-40'
  },
  {
    id: 'startup',
    title: 'Start a Business',
    description: 'Launch your own entrepreneurial venture',
    category: 'career',
    suggestedAge: '25-45'
  },
  {
    id: 'save-retirement',
    title: 'Retirement Savings',
    description: 'Build comprehensive retirement fund',
    category: 'retirement',
    suggestedAge: '25-55'
  }
];

// Mock user's personal goals
let userGoals: PersonalGoal[] = [
  {
    id: 'goal-1',
    title: 'Complete Data Science Certification',
    description: 'Finish online data science course by end of year',
    category: 'education',
    priority: 'high',
    targetDate: '2024-12-31',
    completed: false,
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  },
  {
    id: 'goal-2',
    title: 'Join Professional Association',
    description: 'Become member of UAE IT Professional Association',
    category: 'career',
    priority: 'medium',
    targetDate: '2024-06-30',
    completed: false,
    associatedStageId: 'internship',
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z'
  }
];

export const getPersonalGoals = async (userId: string): Promise<PersonalGoal[]> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => resolve(userGoals), 100);
  });
};

export const createPersonalGoal = async (goal: Omit<PersonalGoal, 'id' | 'createdAt' | 'updatedAt'>): Promise<PersonalGoal> => {
  const newGoal: PersonalGoal = {
    ...goal,
    id: `goal-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  userGoals.push(newGoal);
  return newGoal;
};

export const updatePersonalGoal = async (goalId: string, updates: Partial<PersonalGoal>): Promise<PersonalGoal> => {
  const goalIndex = userGoals.findIndex(g => g.id === goalId);
  if (goalIndex === -1) throw new Error('Goal not found');
  
  userGoals[goalIndex] = {
    ...userGoals[goalIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  return userGoals[goalIndex];
};

export const deletePersonalGoal = async (goalId: string): Promise<void> => {
  userGoals = userGoals.filter(g => g.id !== goalId);
};

export const assignGoalToStage = async (goalId: string, stageId: string): Promise<PersonalGoal> => {
  return updatePersonalGoal(goalId, { associatedStageId: stageId });
};

export const createGoalFromTemplate = async (template: GoalTemplate): Promise<PersonalGoal> => {
  return createPersonalGoal({
    title: template.title,
    description: template.description,
    category: template.category,
    priority: 'medium',
    completed: false
  });
};
