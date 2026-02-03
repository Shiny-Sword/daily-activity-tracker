'use client';

import { useState } from 'react';
import { Target, Plus, Edit3, Trash2, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CATEGORIES, GOAL_TYPES } from '@/lib/constants';
import { Goal } from '@/lib/types';
import { formatTime, generateId } from '@/lib/utils/date';

interface GoalManagerProps {
  goals: Goal[];
  onGoalSaved: (goal: Goal) => void;
  onGoalDeleted: (goalId: string) => void;
}

export default function GoalManager({ goals, onGoalSaved, onGoalDeleted }: GoalManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    targetMinutes: 60,
    type: 'daily' as 'daily' | 'weekly' | 'monthly',
    description: '',
    deadline: ''
  });

  const handleOpenDialog = (goal?: Goal) => {
    if (goal) {
      setEditingGoal(goal);
      setFormData({
        title: goal.title,
        category: goal.category,
        targetMinutes: goal.targetMinutes,
        type: goal.type,
        description: goal.description,
        deadline: goal.deadline?.split('T')[0] || ''
      });
    } else {
      setEditingGoal(null);
      setFormData({
        title: '',
        category: '',
        targetMinutes: 60,
        type: 'daily',
        description: '',
        deadline: ''
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.category) {
      alert('Please fill in title and category');
      return;
    }

    const goalData: Goal = {
      id: editingGoal?.id || generateId(),
      title: formData.title,
      category: formData.category,
      targetMinutes: formData.targetMinutes,
      type: formData.type,
      description: formData.description,
      deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
      progress: editingGoal?.progress || 0,
      createdAt: editingGoal?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const response = await fetch('/api/goals', {
        method: editingGoal ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalData)
      });
      
      if (response.ok) {
        onGoalSaved(goalData);
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error('Failed to save goal:', error);
    }
  };

  const handleDelete = async (goalId: string) => {
    if (confirm('Are you sure you want to delete this goal?')) {
      try {
        const response = await fetch(`/api/goals?id=${goalId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          onGoalDeleted(goalId);
        }
      } catch (error) {
        console.error('Failed to delete goal:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Goals & Milestones</h2>
          <p className="text-muted-foreground">Set and track your daily, weekly, and monthly objectives</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Create Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingGoal ? 'Edit Goal' : 'Create New Goal'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Goal Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Exercise daily, Learn React"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORIES).map(([key, config]) => {
                      const IconComponent = config.icon;
                      return (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <IconComponent className={`w-4 h-4 ${config.color}`} />
                            {config.name}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Goal Type</Label>
                  <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GOAL_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetMinutes">Target (minutes)</Label>
                  <Input
                    id="targetMinutes"
                    type="number"
                    value={formData.targetMinutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetMinutes: parseInt(e.target.value) || 0 }))}
                    min="1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline (optional)</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Why is this goal important to you?"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingGoal ? 'Update Goal' : 'Create Goal'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="text-center py-12">
              <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Goals Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first goal to start tracking your progress and stay motivated.
              </p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Goal
              </Button>
            </CardContent>
          </Card>
        ) : (
          goals.map((goal) => {
            const categoryConfig = CATEGORIES[goal.category as keyof typeof CATEGORIES];
            const IconComponent = categoryConfig?.icon || Target;
            const isCompleted = goal.progress >= 100;

            return (
              <Card key={goal.id} className={`relative ${isCompleted ? 'ring-2 ring-green-200 bg-green-50/50' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${categoryConfig?.bgColor || 'bg-gray-100'}`}>
                        <IconComponent className={`w-4 h-4 ${categoryConfig?.color || 'text-gray-600'}`} />
                      </div>
                      <div>
                        <CardTitle className="text-base leading-tight">{goal.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {goal.type}
                          </Badge>
                          <span>{goal.category}</span>
                        </CardDescription>
                      </div>
                    </div>
                    
                    {isCompleted && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Progress</span>
                      <span className="text-sm font-medium">{goal.progress}%</span>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>Target: {formatTime(goal.targetMinutes)}</span>
                      <span>{goal.deadline ? `Due: ${new Date(goal.deadline).toLocaleDateString()}` : ''}</span>
                    </div>
                  </div>

                  {/* Description */}
                  {goal.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {goal.description}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleOpenDialog(goal)}
                      className="flex-1"
                    >
                      <Edit3 className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleDelete(goal.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}