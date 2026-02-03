'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Calendar, Target, TrendingUp, Flame, Award, Plus, Edit3, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { CATEGORIES } from '@/lib/constants';
import { generateId, getTodayDateString } from '@/lib/utils/date';

interface Habit {
  id: string;
  name: string;
  category: string;
  targetDays: number; // days per week
  streak: number;
  longestStreak: number;
  completedDates: string[];
  createdAt: string;
  color: string;
}

interface HabitTrackerProps {
  habits: Habit[];
  onHabitSaved: (habit: Habit) => void;
  onHabitDeleted: (habitId: string) => void;
  onHabitToggled: (habitId: string, date: string) => void;
}

const HABIT_COLORS = [
  'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
  'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-orange-500'
];

export default function HabitTracker({ habits, onHabitSaved, onHabitDeleted, onHabitToggled }: HabitTrackerProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    targetDays: 7,
    color: HABIT_COLORS[0]
  });

  const today = getTodayDateString();

  const handleOpenDialog = (habit?: Habit) => {
    if (habit) {
      setEditingHabit(habit);
      setFormData({
        name: habit.name,
        category: habit.category,
        targetDays: habit.targetDays,
        color: habit.color
      });
    } else {
      setEditingHabit(null);
      setFormData({
        name: '',
        category: '',
        targetDays: 7,
        color: HABIT_COLORS[Math.floor(Math.random() * HABIT_COLORS.length)]
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const habitData: Habit = {
      id: editingHabit?.id || generateId(),
      name: formData.name,
      category: formData.category,
      targetDays: formData.targetDays,
      color: formData.color,
      streak: editingHabit?.streak || 0,
      longestStreak: editingHabit?.longestStreak || 0,
      completedDates: editingHabit?.completedDates || [],
      createdAt: editingHabit?.createdAt || new Date().toISOString()
    };

    onHabitSaved(habitData);
    setIsDialogOpen(false);
    
    toast({
      title: "Success!",
      description: `Habit ${editingHabit ? 'updated' : 'created'} successfully`,
    });
  };

  const handleDelete = (habitId: string) => {
    if (confirm('Are you sure you want to delete this habit?')) {
      onHabitDeleted(habitId);
      toast({
        title: "Success!",
        description: "Habit deleted successfully",
      });
    }
  };

  const toggleHabit = (habitId: string, date: string) => {
    onHabitToggled(habitId, date);
  };

  const getWeekDates = () => {
    const dates = [];
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const weekDates = getWeekDates();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getHabitStats = (habit: Habit) => {
    const thisWeekCompleted = weekDates.filter(date => habit.completedDates.includes(date)).length;
    const weeklyProgress = (thisWeekCompleted / habit.targetDays) * 100;
    
    return {
      thisWeekCompleted,
      weeklyProgress: Math.min(weeklyProgress, 100),
      isCompletedToday: habit.completedDates.includes(today)
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Habit Tracker</h2>
          <p className="text-muted-foreground">Build and maintain positive daily habits</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Habit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingHabit ? 'Edit Habit' : 'Create New Habit'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Habit Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Drink 8 glasses of water"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Select category</option>
                  {Object.entries(CATEGORIES).map(([key, config]) => (
                    <option key={key} value={key}>{config.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetDays">Target Days per Week</Label>
                <Input
                  id="targetDays"
                  type="number"
                  min="1"
                  max="7"
                  value={formData.targetDays}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetDays: parseInt(e.target.value) || 1 }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  {HABIT_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                      className={`w-8 h-8 rounded-full ${color} ${
                        formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingHabit ? 'Update Habit' : 'Create Habit'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Habits Grid */}
      <div className="space-y-4">
        {habits.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Habits Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start building positive habits to improve your daily routine.
              </p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Habit
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Week Header */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  This Week
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-8 gap-2 text-center text-sm font-medium mb-4">
                  <div></div>
                  {dayNames.map((day, index) => (
                    <div key={day} className={`p-2 ${weekDates[index] === today ? 'bg-blue-100 rounded' : ''}`}>
                      {day}
                    </div>
                  ))}
                </div>

                {habits.map(habit => {
                  const stats = getHabitStats(habit);
                  const categoryConfig = CATEGORIES[habit.category as keyof typeof CATEGORIES];
                  const IconComponent = categoryConfig?.icon || Target;

                  return (
                    <div key={habit.id} className="grid grid-cols-8 gap-2 items-center py-3 border-b last:border-b-0">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${habit.color}`} />
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">{habit.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <IconComponent className="w-3 h-3" />
                            {habit.category}
                          </div>
                        </div>
                      </div>
                      
                      {weekDates.map(date => (
                        <div key={date} className="flex justify-center">
                          <button
                            onClick={() => toggleHabit(habit.id, date)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            {habit.completedDates.includes(date) ? (
                              <CheckCircle2 className={`w-6 h-6 text-green-600`} />
                            ) : (
                              <Circle className="w-6 h-6 text-gray-300 hover:text-gray-500" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Habit Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {habits.map(habit => {
                const stats = getHabitStats(habit);
                const categoryConfig = CATEGORIES[habit.category as keyof typeof CATEGORIES];
                const IconComponent = categoryConfig?.icon || Target;

                return (
                  <Card key={habit.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full ${habit.color}`} />
                          <div>
                            <CardTitle className="text-base leading-tight">{habit.name}</CardTitle>
                            <CardDescription className="flex items-center gap-1 mt-1">
                              <IconComponent className="w-3 h-3" />
                              {habit.category}
                            </CardDescription>
                          </div>
                        </div>
                        
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDialog(habit)}
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(habit.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">This Week</span>
                          <span className="text-sm font-medium">
                            {stats.thisWeekCompleted}/{habit.targetDays}
                          </span>
                        </div>
                        <Progress value={stats.weeklyProgress} className="h-2" />
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="flex items-center justify-center gap-1 text-orange-600">
                            <Flame className="w-4 h-4" />
                            <span className="font-bold">{habit.streak}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">Current Streak</div>
                        </div>
                        <div>
                          <div className="flex items-center justify-center gap-1 text-purple-600">
                            <Award className="w-4 h-4" />
                            <span className="font-bold">{habit.longestStreak}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">Best Streak</div>
                        </div>
                      </div>

                      {stats.isCompletedToday && (
                        <Badge className="w-full justify-center bg-green-100 text-green-800">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Completed Today!
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}