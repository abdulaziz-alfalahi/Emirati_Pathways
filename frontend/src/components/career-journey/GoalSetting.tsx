
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  Plus, 
  Calendar, 
  CheckCircle, 
  Circle, 
  AlertCircle,
  Edit,
  Trash2
} from 'lucide-react';

interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'career' | 'education' | 'skills' | 'personal';
  priority: 'high' | 'medium' | 'low';
  deadline: string;
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'paused';
  milestones: string[];
}

const GoalSetting: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: '1',
      title: 'Become Senior Developer',
      description: 'Advance to senior developer role with team leadership responsibilities',
      category: 'career',
      priority: 'high',
      deadline: '2024-12-31',
      progress: 60,
      status: 'in_progress',
      milestones: ['Complete React certification', 'Lead 2 projects', 'Mentor junior developers']
    },
    {
      id: '2',
      title: 'Master System Architecture',
      description: 'Develop expertise in system design and architecture patterns',
      category: 'skills',
      priority: 'medium',
      deadline: '2024-08-15',
      progress: 25,
      status: 'in_progress',
      milestones: ['Complete AWS certification', 'Design microservices system', 'Implement scalable solution']
    },
    {
      id: '3',
      title: 'Professional Network Growth',
      description: 'Expand professional network within UAE tech industry',
      category: 'personal',
      priority: 'medium',
      deadline: '2024-06-30',
      progress: 80,
      status: 'in_progress',
      milestones: ['Attend 5 tech meetups', 'Connect with 20 professionals', 'Join 3 professional groups']
    }
  ]);

  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: 'career' as Goal['category'],
    priority: 'medium' as Goal['priority'],
    deadline: '',
    milestones: ['']
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'career': return 'bg-blue-100 text-blue-800';
      case 'education': return 'bg-green-100 text-green-800';
      case 'skills': return 'bg-purple-100 text-purple-800';
      case 'personal': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <Circle className="h-4 w-4 text-blue-600 fill-current" />;
      case 'paused': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default: return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const handleAddGoal = () => {
    if (newGoal.title && newGoal.deadline) {
      const goal: Goal = {
        id: Date.now().toString(),
        title: newGoal.title,
        description: newGoal.description,
        category: newGoal.category,
        priority: newGoal.priority,
        deadline: newGoal.deadline,
        progress: 0,
        status: 'not_started',
        milestones: newGoal.milestones.filter(m => m.trim() !== '')
      };
      setGoals([...goals, goal]);
      setNewGoal({
        title: '',
        description: '',
        category: 'career',
        priority: 'medium',
        deadline: '',
        milestones: ['']
      });
      setShowAddGoal(false);
    }
  };

  const handleMilestoneChange = (index: number, value: string) => {
    const updatedMilestones = [...newGoal.milestones];
    updatedMilestones[index] = value;
    setNewGoal({ ...newGoal, milestones: updatedMilestones });
  };

  const addMilestone = () => {
    setNewGoal({ ...newGoal, milestones: [...newGoal.milestones, ''] });
  };

  const removeMilestone = (index: number) => {
    const updatedMilestones = newGoal.milestones.filter((_, i) => i !== index);
    setNewGoal({ ...newGoal, milestones: updatedMilestones });
  };

  return (
    <div className="space-y-6">
      {/* Goal Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{goals.length}</div>
            <p className="text-xs text-muted-foreground">Active career goals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Circle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {goals.filter(g => g.status === 'in_progress').length}
            </div>
            <p className="text-xs text-muted-foreground">Currently working on</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {goals.filter(g => g.status === 'completed').length}
            </div>
            <p className="text-xs text-muted-foreground">Successfully achieved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(goals.reduce((acc, goal) => acc + goal.progress, 0) / goals.length)}%
            </div>
            <p className="text-xs text-muted-foreground">Overall completion</p>
          </CardContent>
        </Card>
      </div>

      {/* Add New Goal Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Career Goals</h2>
        <Button onClick={() => setShowAddGoal(true)}>
          <Plus className="h-4 w-4 me-2" />
          Add Goal
        </Button>
      </div>

      {/* Add Goal Form */}
      {showAddGoal && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Goal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Goal Title</Label>
                <Input
                  id="title"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  placeholder="Enter your goal title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Target Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newGoal.description}
                onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                placeholder="Describe your goal in detail"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={newGoal.category} onValueChange={(value: Goal['category']) => setNewGoal({ ...newGoal, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="career">Career</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="skills">Skills</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={newGoal.priority} onValueChange={(value: Goal['priority']) => setNewGoal({ ...newGoal, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Milestones</Label>
              {newGoal.milestones.map((milestone, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={milestone}
                    onChange={(e) => handleMilestoneChange(index, e.target.value)}
                    placeholder={`Milestone ${index + 1}`}
                  />
                  {newGoal.milestones.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeMilestone(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addMilestone}>
                <Plus className="h-4 w-4 me-1" />
                Add Milestone
              </Button>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddGoal}>Create Goal</Button>
              <Button variant="outline" onClick={() => setShowAddGoal(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Goals List */}
      <div className="space-y-4">
        {goals.map((goal) => (
          <Card key={goal.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(goal.status)}
                    <h3 className="font-semibold text-lg">{goal.title}</h3>
                    <Badge variant="secondary" className={getCategoryColor(goal.category)}>
                      {goal.category}
                    </Badge>
                    <Badge variant="outline" className={getPriorityColor(goal.priority)}>
                      {goal.priority}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mb-3">{goal.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Due: {new Date(goal.deadline).toLocaleDateString()}</span>
                    </div>
                    <span>Progress: {goal.progress}%</span>
                  </div>

                  <div className="mb-4">
                    <Progress value={goal.progress} className="h-2" />
                  </div>

                  {goal.milestones.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Milestones</h4>
                      <ul className="space-y-1">
                        {goal.milestones.map((milestone, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm">
                            <Circle className="h-3 w-3 text-gray-400" />
                            {milestone}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default GoalSetting;
