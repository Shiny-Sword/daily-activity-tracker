'use client';

import { useState, useEffect } from 'react';
import {
  Calendar, Target, Activity as ActivityIcon, Download, User,
  BarChart3, Clock, Settings as SettingsIcon, Menu, X, Bell, History as HistoryIcon, Star, Cog, Heart, MessageCircle, Zap, Focus, CheckSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

// Import our components
import ActivityLogger from '@/components/ActivityLogger';
import Dashboard from '@/components/Dashboard';
import GoalManager from '@/components/GoalManager';
import ActivityList from '@/components/ActivityList';
import ExportData from '@/components/ExportData';
import Analytics from '@/components/Analytics';
import HistoricalView from '@/components/HistoricalView';
import WeeklyReview from '@/components/WeeklyReview';
import { Settings, UserSettingsProvider } from '@/components/Settings';
import ReminderManager from '@/components/ReminderManager';
import DailyReflection from '@/components/DailyReflection';
import HabitTracker from '@/components/HabitTracker';
import QuickActions from '@/components/QuickActions';
import FocusMode from '@/components/FocusMode';

// Import types and utilities
import { Activity, Goal, Reminder, DailyReflection as DailyReflectionType } from '@/lib/types';
import { CATEGORIES, DEFAULT_GOALS } from '@/lib/constants';
import { StorageManager, STORAGE_KEYS } from '@/lib/utils/storage';
import { formatTime, generateId } from '@/lib/utils/date';

interface Habit {
  id: string;
  name: string;
  category: string;
  targetDays: number;
  streak: number;
  longestStreak: number;
  completedDates: string[];
  createdAt: string;
  color: string;
}

// 1. Define the helper function first
function isConsecutiveDay(date1: string, date2: string) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.getTime() - d2.getTime() === 24 * 60 * 60 * 1000; // Check if date2 is exactly one day before date1
}

export default function PersonalActivityTracker() {
  // State management
  const [activities, setActivities] = useState<Activity[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [reflections, setReflections] = useState<DailyReflectionType[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoggerOpen, setIsLoggerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  // Load data from localStorage on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Save data to localStorage whenever state changes
  useEffect(() => {
    if (!isLoading) {
      saveData();
    }
  }, [activities, goals, reminders, reflections, habits, isLoading]);

  const loadData = () => {
    try {
      const savedActivities = StorageManager.get<Activity[]>(STORAGE_KEYS.ACTIVITIES, []);
      const savedGoals = StorageManager.get<Goal[]>(STORAGE_KEYS.GOALS, []);
      const savedReminders = StorageManager.get<Reminder[]>(STORAGE_KEYS.REMINDERS, []);
      const savedReflections = StorageManager.get<DailyReflectionType[]>(STORAGE_KEYS.REFLECTIONS, []);
      const savedHabits = StorageManager.get<Habit[]>('daily_tracker_habits', []);

      setActivities(savedActivities);

      // If no goals exist, create default ones
      if (savedGoals.length === 0) {
        const defaultGoals = DEFAULT_GOALS.map(goal => ({
          ...goal,
          id: generateId(),
          progress: 0,
          description: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
        setGoals(defaultGoals);
      } else {
        setGoals(savedGoals);
      }

      setReminders(savedReminders);
      setReflections(savedReflections);
      setHabits(savedHabits);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load data:', error);
      setIsLoading(false);
    }
  };

  const saveData = () => {
    try {
      StorageManager.set(STORAGE_KEYS.ACTIVITIES, activities);
      StorageManager.set(STORAGE_KEYS.GOALS, goals);
      StorageManager.set(STORAGE_KEYS.REMINDERS, reminders);
      StorageManager.set(STORAGE_KEYS.REFLECTIONS, reflections);
      StorageManager.set('daily_tracker_habits', habits);
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  };

  // Activity handlers
  const handleActivitySaved = (activity: Activity) => {
    setActivities(prev => [activity, ...prev]);
    updateGoalProgress(activity);
  };

  const handleActivityDeleted = (activityId: string) => {
    setActivities(prev => prev.filter(activity => activity.id !== activityId));
  };

  // Goal handlers
  const handleGoalSaved = (goal: Goal) => {
    setGoals(prev => {
      const existingIndex = prev.findIndex(g => g.id === goal.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = goal;
        return updated;
      }
      return [goal, ...prev];
    });
  };

  const handleGoalDeleted = (goalId: string) => {
    setGoals(prev => prev.filter(goal => goal.id !== goalId));
  };

  // Reminder handlers
  const handleReminderSaved = (reminder: Reminder) => {
    setReminders(prev => {
      const existingIndex = prev.findIndex(r => r.id === reminder.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = reminder;
        return updated;
      }
      return [reminder, ...prev];
    });
  };

  const handleReminderDeleted = (reminderId: string) => {
    setReminders(prev => prev.filter(reminder => reminder.id !== reminderId));
  };

  // Reflection handlers
  const handleReflectionSaved = (reflection: DailyReflectionType) => {
    setReflections(prev => {
      const existingIndex = prev.findIndex(r => r.date === reflection.date);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = reflection;
        return updated;
      }
      return [reflection, ...prev];
    });
  };

  // Habit handlers
  const handleHabitSaved = (habit: Habit) => {
    setHabits(prev => {
      const existingIndex = prev.findIndex(h => h.id === habit.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = habit;
        return updated;
      }
      return [habit, ...prev];
    });
  };

  const handleHabitDeleted = (habitId: string) => {
    setHabits(prev => prev.filter(habit => habit.id !== habitId));
  };

  const handleHabitToggled = (habitId: string, date: string) => {
    setHabits(prev => prev.map(habit => {
      if (habit.id !== habitId) return habit;

      const isCompleted = habit.completedDates.includes(date);
      let newCompletedDates: string[];
      let newStreak = habit.streak;
      let newLongestStreak = habit.longestStreak;

      if (isCompleted) {
        // Remove date
        newCompletedDates = habit.completedDates.filter(d => d !== date);
        // Recalculate streak
        newStreak = calculateStreak(newCompletedDates);
      } else {
        // Add date
        newCompletedDates = [...habit.completedDates, date].sort();
        // Recalculate streak
        newStreak = calculateStreak(newCompletedDates);
        newLongestStreak = Math.max(newLongestStreak, newStreak);
      }

      return {
        ...habit,
        completedDates: newCompletedDates,
        streak: newStreak,
        longestStreak: newLongestStreak
      };
    }));
  };

  const calculateStreak = (completedDates: string[]): number => {
    if (completedDates.length === 0) return 0;

    const sortedDates = completedDates.sort().reverse();
    const today = new Date().toISOString().split('T')[0];

    let streak = 0;
    let currentDate = new Date(today);

    for (const dateStr of sortedDates) {
      const date = new Date(dateStr);
      const diffDays = Math.floor((currentDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === streak) {
        streak++;
        currentDate = new Date(date);
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  };

  // Update goal progress when new activity is added
  const updateGoalProgress = (newActivity: Activity) => {
    setGoals(prev => prev.map(goal => {
      if (goal.category === newActivity.category) {
        // Calculate progress based on goal type
        const relevantActivities = [...activities, newActivity].filter(activity => {
          if (activity.category !== goal.category) return false;

          const today = new Date();
          const activityDate = new Date(activity.date);

          if (goal.type === 'daily') {
            return activityDate.toDateString() === today.toDateString();
          } else if (goal.type === 'weekly') {
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return activityDate >= weekAgo;
          } else if (goal.type === 'monthly') {
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            return activityDate >= monthAgo;
          }
          return false;
        });

        const totalTime = relevantActivities.reduce((sum, activity) => sum + activity.duration, 0);
        const progress = Math.min((totalTime / goal.targetMinutes) * 100, 100);

        return {
          ...goal,
          progress: Math.round(progress),
          updatedAt: new Date().toISOString()
        };
      }
      return goal;
    }));
  };

  // Calculate summary stats
  const todayActivities = activities.filter(activity => {
    const today = new Date().toISOString().split('T')[0];
    return activity.date === today;
  });

  const totalTodayTime = todayActivities.reduce((sum, activity) => sum + activity.duration, 0);
  const completedGoals = goals.filter(goal => goal.progress >= 100).length;

  // Calculate weekly stats
  const weekActivities = activities.filter(activity => {
    const activityDate = new Date(activity.date);
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    return activityDate >= weekAgo;
  });
  const totalWeekTime = weekActivities.reduce((sum, activity) => sum + activity.duration, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your activity tracker...</p>
        </div>
      </div>
    );
  }

  return (
    <UserSettingsProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                  <ActivityIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Daily Activity Tracker</h1>
                  <p className="text-sm text-gray-600 hidden sm:block">
                    Welcome back, Mahendra Mahajan
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Quick Stats */}
                <div className="hidden lg:flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{todayActivities.length}</div>
                    <div className="text-xs text-gray-600">Today</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{formatTime(totalTodayTime)}</div>
                    <div className="text-xs text-gray-600">Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">{completedGoals}</div>
                    <div className="text-xs text-gray-600">Goals</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-600">{formatTime(totalWeekTime)}</div>
                    <div className="text-xs text-gray-600">Week</div>
                  </div>
                </div>

                {/* Activity Logger Button */}
                <ActivityLogger
                  onActivitySaved={handleActivitySaved}
                  isOpen={isLoggerOpen}
                  onOpenChange={setIsLoggerOpen}
                />

                {/* Mobile Menu */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="lg:hidden">
                      <Menu className="w-4 h-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <div className="space-y-4 pt-6">
                      <div className="space-y-3">
                        <h3 className="font-semibold">Quick Stats</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Today's Activities</span>
                            <span className="font-medium">{todayActivities.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Time Logged Today</span>
                            <span className="font-medium">{formatTime(totalTodayTime)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Weekly Time</span>
                            <span className="font-medium">{formatTime(totalWeekTime)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Goals Completed</span>
                            <span className="font-medium">{completedGoals}/{goals.length}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-12 lg:w-auto lg:grid-cols-12 mb-8">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="quick-actions" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span className="hidden sm:inline">Quick</span>
              </TabsTrigger>
              <TabsTrigger value="focus" className="flex items-center gap-2">
                <Focus className="w-4 h-4" />
                <span className="hidden sm:inline">Focus</span>
              </TabsTrigger>
              <TabsTrigger value="habits" className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Habits</span>
              </TabsTrigger>
              <TabsTrigger value="activities" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="hidden sm:inline">Activities</span>
              </TabsTrigger>
              <TabsTrigger value="goals" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                <span className="hidden sm:inline">Goals</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <HistoryIcon className="w-4 h-4" />
                <span className="hidden sm:inline">History</span>
              </TabsTrigger>
              <TabsTrigger value="review" className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                <span className="hidden sm:inline">Review</span>
              </TabsTrigger>
              <TabsTrigger value="reminders" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Reminders</span>
              </TabsTrigger>
              <TabsTrigger value="reflection" className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                <span className="hidden sm:inline">Reflection</span>
              </TabsTrigger>
              <TabsTrigger value="export" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <SettingsIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <Dashboard activities={activities} goals={goals} />
            </TabsContent>

            <TabsContent value="quick-actions">
              <QuickActions onActivitySaved={handleActivitySaved} />
            </TabsContent>

            <TabsContent value="focus">
              <FocusMode onActivitySaved={handleActivitySaved} />
            </TabsContent>

            <TabsContent value="habits">
              <HabitTracker
                habits={habits}
                onHabitSaved={handleHabitSaved}
                onHabitDeleted={handleHabitDeleted}
                onHabitToggled={handleHabitToggled}
              />
            </TabsContent>

            <TabsContent value="activities">
              <ActivityList
                activities={activities}
                onActivityDeleted={handleActivityDeleted}
              />
            </TabsContent>

            <TabsContent value="goals">
              <GoalManager
                goals={goals}
                onGoalSaved={handleGoalSaved}
                onGoalDeleted={handleGoalDeleted}
              />
            </TabsContent>

            <TabsContent value="analytics">
              <Analytics activities={activities} goals={goals} />
            </TabsContent>

            <TabsContent value="history">
              <HistoricalView activities={activities} goals={goals} />
            </TabsContent>

            <TabsContent value="review">
              <WeeklyReview activities={activities} goals={goals} />
            </TabsContent>

            <TabsContent value="reminders">
              <ReminderManager
                reminders={reminders}
                onReminderSaved={handleReminderSaved}
                onReminderDeleted={handleReminderDeleted}
              />
            </TabsContent>

            <TabsContent value="reflection">
              <DailyReflection
                reflections={reflections}
                onReflectionSaved={handleReflectionSaved}
              />
            </TabsContent>

            <TabsContent value="export">
              <ExportData activities={activities} goals={goals} />
            </TabsContent>

            <TabsContent value="settings">
              <Settings />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </UserSettingsProvider>
  );
}