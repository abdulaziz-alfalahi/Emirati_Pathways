
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Target, Calendar, CheckCircle, Clock, Pause, X } from 'lucide-react';
import { successMetricsService } from '@/services/mentorship/successMetricsService';
import { supabase } from '@/integrations/supabase/client';
import type { MentorshipGoal } from '@/types/mentorship';
import { useToast } from '@/hooks/use-toast';

interface GoalsManagerProps {
  relationshipId: string;
  goals: MentorshipGoal[];
  onGoalUpdate: () => void;
}

export const GoalsManager: React.FC<GoalsManagerProps> = ({
  relationshipId,
  goals,
  onGoalUpdate
}) => {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    target_date: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

  const handleCreateGoal = async () => {
    if (!newGoal.title.trim()) {
      toast({
        title: "Error",
        description: "Goal title is required",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      await successMetricsService.createGoal({
        relationship_id: relationshipId,
        title: newGoal.title,
        description: newGoal.description || undefined,
        target_date: newGoal.target_date || undefined,
        priority: newGoal.priority,
        status: 'active',
        completion_percentage: 0,
        created_by: user.user.id
      });

      setNewGoal({ title: '', description: '', target_date: '', priority: 'medium' });
      setShowCreateDialog(false);
      onGoalUpdate();
      
      toast({
        title: "Success",
        description: "Goal created successfully",
      });
    } catch (error) {
      console.error('Error creating goal:', error);
      toast({
        title: "Error",
        description: "Failed to create goal",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGoalProgress = async (goalId: string, percentage: number) => {
    try {
      await successMetricsService.updateGoal(goalId, {
        completion_percentage: percentage,
        ...(percentage === 100 ? {
          status: 'completed',
          completed_at: new Date().toISOString()
        } : {})
      });
      
      onGoalUpdate();
      
      if (percentage === 100) {
        toast({
          title: "Congratulations!",
          description: "Goal completed successfully",
        });
      }
    } catch (error) {
      console.error('Error updating goal progress:', error);
      toast({
        title: "Error",
        description: "Failed to update goal progress",
        variant: "destructive"
      });
    }
  };

  const handleCompleteGoal = async (goalId: string) => {
    try {
      await successMetricsService.completeGoal(goalId);
      onGoalUpdate();
      
      toast({
        title: "Congratulations!",
        description: "Goal marked as completed",
      });
    } catch (error) {
      console.error('Error completing goal:', error);
      toast({
        title: "Error",
        description: "Failed to complete goal",
        variant: "destructive"
      });
    }
  };

  const handleUpdateGoalStatus = async (goalId: string, status: MentorshipGoal['status']) => {
    try {
      await successMetricsService.updateGoal(goalId, { status });
      onGoalUpdate();
      
      toast({
        title: "Success",
        description: `Goal ${status} successfully`,
      });
    } catch (error) {
      console.error('Error updating goal status:', error);
      toast({
        title: "Error",
        description: "Failed to update goal status",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: MentorshipGoal['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'cancelled':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Goals Management
              </CardTitle>
              <CardDescription>
                Set and track goals for this mentorship relationship
              </CardDescription>
            </div>
            
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Goal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Goal</DialogTitle>
                  <DialogDescription>
                    Define a specific, measurable goal for this mentorship
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="goal-title">Goal Title *</Label>
                    <Input
                      id="goal-title"
                      placeholder="e.g., Learn React.js fundamentals"
                      value={newGoal.title}
                      onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="goal-description">Description</Label>
                    <Textarea
                      id="goal-description"
                      placeholder="Provide more details about this goal..."
                      value={newGoal.description}
                      onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="goal-priority">Priority</Label>
                      <Select 
                        value={newGoal.priority} 
                        onValueChange={(value: 'low' | 'medium' | 'high') => 
                          setNewGoal(prev => ({ ...prev, priority: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="goal-target-date">Target Date</Label>
                      <Input
                        id="goal-target-date"
                        type="date"
                        value={newGoal.target_date}
                        onChange={(e) => setNewGoal(prev => ({ ...prev, target_date: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowCreateDialog(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateGoal} 
                      disabled={loading}
                      className="flex-1"
                    >
                      {loading ? 'Creating...' : 'Create Goal'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {goals.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Goals Set</h3>
              <p className="text-muted-foreground mb-4">
                Start by creating your first mentorship goal
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Goal
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {goals.map((goal) => (
                <Card key={goal.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusIcon(goal.status)}
                          <h4 className="font-medium">{goal.title}</h4>
                          <Badge variant={getPriorityColor(goal.priority)} className="text-xs">
                            {goal.priority}
                          </Badge>
                          <Badge 
                            variant={goal.status === 'completed' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {goal.status}
                          </Badge>
                        </div>
                        {goal.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {goal.description}
                          </p>
                        )}
                        {goal.target_date && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            Target: {new Date(goal.target_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span>{goal.completion_percentage}%</span>
                      </div>
                      <Progress value={goal.completion_percentage} className="h-2" />
                    </div>
                    
                    {goal.status === 'active' && (
                      <div className="flex gap-2">
                        <Select
                          onValueChange={(value) => 
                            handleUpdateGoalProgress(goal.id, parseInt(value))
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Update progress" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="25">25%</SelectItem>
                            <SelectItem value="50">50%</SelectItem>
                            <SelectItem value="75">75%</SelectItem>
                            <SelectItem value="100">100%</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button
                          size="sm"
                          onClick={() => handleCompleteGoal(goal.id)}
                          className="flex-1"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark Complete
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateGoalStatus(goal.id, 'paused')}
                        >
                          <Pause className="h-4 w-4 mr-2" />
                          Pause
                        </Button>
                      </div>
                    )}
                    
                    {goal.status === 'paused' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdateGoalStatus(goal.id, 'active')}
                          className="flex-1"
                        >
                          Resume
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateGoalStatus(goal.id, 'cancelled')}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
