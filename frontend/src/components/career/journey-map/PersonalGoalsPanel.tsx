
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Target, 
  Calendar,
  GripVertical,
  Trash2,
  CheckCircle,
  Circle
} from 'lucide-react';
import { 
  PersonalGoal, 
  GoalTemplate, 
  goalTemplates,
  getPersonalGoals,
  createGoalFromTemplate,
  deletePersonalGoal,
  updatePersonalGoal
} from '@/services/personalGoalsService';

interface PersonalGoalsPanelProps {
  userId: string;
  onGoalDragStart: (goal: PersonalGoal | GoalTemplate, isTemplate: boolean) => void;
  onGoalDragEnd: () => void;
}

const PersonalGoalsPanel: React.FC<PersonalGoalsPanelProps> = ({
  userId,
  onGoalDragStart,
  onGoalDragEnd
}) => {
  const [userGoals, setUserGoals] = useState<PersonalGoal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const goals = await getPersonalGoals(userId);
        setUserGoals(goals);
      } catch (error) {
        console.error('Error fetching personal goals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();
  }, [userId]);

  const handleDragStart = (e: React.DragEvent, goal: PersonalGoal | GoalTemplate, isTemplate: boolean) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ goal, isTemplate }));
    onGoalDragStart(goal, isTemplate);
  };

  const handleAddTemplateGoal = async (template: GoalTemplate) => {
    try {
      const newGoal = await createGoalFromTemplate(template);
      setUserGoals(prev => [...prev, newGoal]);
    } catch (error) {
      console.error('Error creating goal from template:', error);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await deletePersonalGoal(goalId);
      setUserGoals(prev => prev.filter(g => g.id !== goalId));
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const handleToggleComplete = async (goal: PersonalGoal) => {
    try {
      const updatedGoal = await updatePersonalGoal(goal.id, { 
        completed: !goal.completed 
      });
      setUserGoals(prev => prev.map(g => g.id === goal.id ? updatedGoal : g));
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'education': return 'bg-blue-100 text-blue-800';
      case 'career': return 'bg-green-100 text-green-800';
      case 'personal': return 'bg-purple-100 text-purple-800';
      case 'retirement': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Personal Goals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* User's Personal Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            My Personal Goals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {userGoals.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No personal goals yet. Add some from templates below or create new ones.
            </p>
          ) : (
            userGoals.map(goal => (
              <div
                key={goal.id}
                draggable
                onDragStart={(e) => handleDragStart(e, goal, false)}
                onDragEnd={onGoalDragEnd}
                className="flex items-center gap-3 p-3 bg-white border rounded-lg cursor-move hover:shadow-md transition-shadow"
              >
                <GripVertical className="h-4 w-4 text-gray-400" />
                
                <button
                  onClick={() => handleToggleComplete(goal)}
                  className="flex-shrink-0"
                >
                  {goal.completed ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Circle className="h-4 w-4 text-gray-400" />
                  )}
                </button>
                
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-medium ${goal.completed ? 'line-through text-gray-500' : ''}`}>
                    {goal.title}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {goal.description}
                  </p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="secondary" className={getCategoryColor(goal.category)}>
                      {goal.category}
                    </Badge>
                    <Badge variant="outline" className={getPriorityColor(goal.priority)}>
                      {goal.priority}
                    </Badge>
                    {goal.targetDate && (
                      <Badge variant="outline" className="text-xs">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(goal.targetDate).toLocaleDateString()}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteGoal(goal.id)}
                  className="flex-shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Goal Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Goal Templates
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Drag these onto career stages or add to your personal goals
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {goalTemplates.map(template => (
            <div
              key={template.id}
              draggable
              onDragStart={(e) => handleDragStart(e, template, true)}
              onDragEnd={onGoalDragEnd}
              className="flex items-center gap-3 p-3 bg-gray-50 border rounded-lg cursor-move hover:shadow-md transition-shadow"
            >
              <GripVertical className="h-4 w-4 text-gray-400" />
              
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium">{template.title}</h4>
                <p className="text-xs text-muted-foreground">
                  {template.description}
                </p>
                <div className="flex gap-2 mt-1">
                  <Badge variant="secondary" className={getCategoryColor(template.category)}>
                    {template.category}
                  </Badge>
                  {template.suggestedAge && (
                    <Badge variant="outline" className="text-xs">
                      Age: {template.suggestedAge}
                    </Badge>
                  )}
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddTemplateGoal(template)}
                className="flex-shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default PersonalGoalsPanel;
