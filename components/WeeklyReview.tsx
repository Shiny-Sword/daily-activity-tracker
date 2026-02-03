'use client';

import { useState, useMemo } from 'react';
import { Calendar, TrendingUp, TrendingDown, Target, Clock, Award, Star, ChevronLeft, ChevronRight, BarChart3, PieChart, Activity as ActivityIcon, CheckCircle, AlertCircle, Minus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CATEGORIES } from '@/lib/constants';
import { Activity, Goal } from '@/lib/types';
import { formatTime, formatDate } from '@/lib/utils/date';

interface WeeklyReviewProps {
  activities: Activity[];
  goals: Goal[];
}

interface WeekData {
  startDate: Date;
  endDate: Date;
  activities: Activity[];
  totalTime: number;
  categoryBreakdown: Record<string, number>;
  dailyTotals: Record<string, number>;
  goalProgress: Array<{ goal: Goal; progress: number; achieved: boolean }>;
  productivity: number;
  consistency: number;
}

export default function WeeklyReview({ activities, goals }: WeeklyReviewProps) {
  const [selectedWeek, setSelectedWeek] = useState(0); // 0 = current week, 1 = last week, etc.
  const [reflection, setReflection] = useState('');

  // Calculate week data
  const weekData = useMemo((): WeekData => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() - (selectedWeek * 7));
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Filter activities for this week
    const weekActivities = activities.filter(activity => {
      const activityDate = new Date(activity.date);
      return activityDate >= startOfWeek && activityDate <= endOfWeek;
    });

    // Calculate totals
    const totalTime = weekActivities.reduce((sum, activity) => sum + activity.duration, 0);
    
    // Category breakdown
    const categoryBreakdown = weekActivities.reduce((acc, activity) => {
      acc[activity.category] = (acc[activity.category] || 0) + activity.duration;
      return acc;
    }, {} as Record<string, number>);

    // Daily totals
    const dailyTotals: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      dailyTotals[dateStr] = weekActivities
        .filter(activity => activity.date === dateStr)
        .reduce((sum, activity) => sum + activity.duration, 0);
    }

    // Goal progress for the week
    const goalProgress = goals.map(goal => {
      const categoryTime = categoryBreakdown[goal.category] || 0;
      let targetTime = 0;
      
      if (goal.type === 'daily') {
        targetTime = goal.targetMinutes * 7; // 7 days
      } else if (goal.type === 'weekly') {
        targetTime = goal.targetMinutes;
      } else if (goal.type === 'monthly') {
        targetTime = goal.targetMinutes / 4; // Approximate weekly portion
      }

      const progress = targetTime > 0 ? (categoryTime / targetTime) * 100 : 0;
      return {
        goal,
        progress: Math.min(progress, 100),
        achieved: progress >= 100
      };
    });

    // Calculate productivity score
    const avgGoalProgress = goalProgress.length > 0 
      ? goalProgress.reduce((sum, gp) => sum + gp.progress, 0) / goalProgress.length 
      : 0;
    
    const timeScore = Math.min((totalTime / (8 * 60 * 7)) * 100, 100); // 8 hours per day target
    const productivity = (avgGoalProgress * 0.7) + (timeScore * 0.3);

    // Calculate consistency (how many days had activities)
    const activeDays = Object.values(dailyTotals).filter(time => time > 0).length;
    const consistency = (activeDays / 7) * 100;

    return {
      startDate: startOfWeek,
      endDate: endOfWeek,
      activities: weekActivities,
      totalTime,
      categoryBreakdown,
      dailyTotals,
      goalProgress,
      productivity,
      consistency
    };
  }, [activities, goals, selectedWeek]);

  // Get previous week data for comparison
  const previousWeekData = useMemo((): WeekData => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() - ((selectedWeek + 1) * 7));
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const weekActivities = activities.filter(activity => {
      const activityDate = new Date(activity.date);
      return activityDate >= startOfWeek && activityDate <= endOfWeek;
    });

    const totalTime = weekActivities.reduce((sum, activity) => sum + activity.duration, 0);
    const categoryBreakdown = weekActivities.reduce((acc, activity) => {
      acc[activity.category] = (acc[activity.category] || 0) + activity.duration;
      return acc;
    }, {} as Record<string, number>);

    return {
      startDate: startOfWeek,
      endDate: endOfWeek,
      activities: weekActivities,
      totalTime,
      categoryBreakdown,
      dailyTotals: {},
      goalProgress: [],
      productivity: 0,
      consistency: 0
    };
  }, [activities, selectedWeek]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setSelectedWeek(prev => prev + 1);
    } else if (direction === 'next' && selectedWeek > 0) {
      setSelectedWeek(prev => prev - 1);
    }
  };

  const getWeekTitle = () => {
    if (selectedWeek === 0) return 'This Week';
    if (selectedWeek === 1) return 'Last Week';
    return `${selectedWeek + 1} Weeks Ago`;
  };

  const getComparison = (current: number, previous: number) => {
    if (previous === 0) return { change: 0, trend: 'stable' as const };
    const change = ((current - previous) / previous) * 100;
    const trend = change > 5 ? 'up' : change < -5 ? 'down' : 'stable';
    return { change: Math.abs(change), trend };
  };

  const timeComparison = getComparison(weekData.totalTime, previousWeekData.totalTime);
  const activityComparison = getComparison(weekData.activities.length, previousWeekData.activities.length);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Weekly Review</h2>
          <p className="text-muted-foreground">
            Analyze your weekly progress and reflect on achievements
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigateWeek('prev')}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="px-4 py-2 bg-blue-50 rounded-lg text-center min-w-[200px]">
            <div className="font-medium">{getWeekTitle()}</div>
            <div className="text-sm text-muted-foreground">
              {formatDate(weekData.startDate.toISOString().split('T')[0])} - {formatDate(weekData.endDate.toISOString().split('T')[0])}
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigateWeek('next')}
            disabled={selectedWeek === 0}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(weekData.totalTime)}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {timeComparison.trend === 'up' ? (
                <TrendingUp className="w-3 h-3 text-green-600" />
              ) : timeComparison.trend === 'down' ? (
                <TrendingDown className="w-3 h-3 text-red-600" />
              ) : (
                <Minus className="w-3 h-3 text-gray-600" />
              )}
              <span className={
                timeComparison.trend === 'up' ? 'text-green-600' :
                timeComparison.trend === 'down' ? 'text-red-600' : 'text-gray-600'
              }>
                {timeComparison.change.toFixed(1)}% vs last week
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activities</CardTitle>
            <ActivityIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weekData.activities.length}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {activityComparison.trend === 'up' ? (
                <TrendingUp className="w-3 h-3 text-green-600" />
              ) : activityComparison.trend === 'down' ? (
                <TrendingDown className="w-3 h-3 text-red-600" />
              ) : (
                <Minus className="w-3 h-3 text-gray-600" />
              )}
              <span className={
                activityComparison.trend === 'up' ? 'text-green-600' :
                activityComparison.trend === 'down' ? 'text-red-600' : 'text-gray-600'
              }>
                {activityComparison.change.toFixed(1)}% vs last week
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productivity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weekData.productivity.toFixed(1)}%</div>
            <Progress value={weekData.productivity} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consistency</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weekData.consistency.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {Object.values(weekData.dailyTotals).filter(time => time > 0).length}/7 active days
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="reflection">Reflection</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Daily Breakdown
                </CardTitle>
                <CardDescription>Time spent each day of the week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(weekData.dailyTotals).map(([date, time], index) => {
                    const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
                    const maxTime = Math.max(...Object.values(weekData.dailyTotals));
                    const percentage = maxTime > 0 ? (time / maxTime) * 100 : 0;
                    
                    return (
                      <div key={date} className="flex items-center gap-3">
                        <div className="w-12 text-sm font-medium">{dayName}</div>
                        <div className="flex-1 bg-gray-200 rounded-full h-3">
                          <div 
                            className="h-3 bg-blue-500 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="w-16 text-sm text-right">
                          {formatTime(time)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Category Distribution
                </CardTitle>
                <CardDescription>Time allocation across categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(weekData.categoryBreakdown)
                    .sort(([,a], [,b]) => (b as number) - (a as number))
                    .map(([category, time]) => {
                      const config = CATEGORIES[category as keyof typeof CATEGORIES];
                      const IconComponent = config?.icon || ActivityIcon;
                      const percentage = weekData.totalTime > 0 ? (time / weekData.totalTime) * 100 : 0;

                      return (
                        <div key={category} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <IconComponent className={`w-4 h-4 ${config?.color || 'text-gray-600'}`} />
                            <span className="text-sm font-medium">{category}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{formatTime(time)}</div>
                            <div className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</div>
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {weekData.goalProgress.length === 0 ? (
              <Card className="col-span-2">
                <CardContent className="text-center py-8">
                  <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No goals set for tracking</p>
                </CardContent>
              </Card>
            ) : (
              weekData.goalProgress.map(({ goal, progress, achieved }) => {
                const categoryConfig = CATEGORIES[goal.category as keyof typeof CATEGORIES];
                const IconComponent = categoryConfig?.icon || Target;

                return (
                  <Card key={goal.id} className={achieved ? 'ring-2 ring-green-200 bg-green-50/50' : ''}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <div className={`p-2 rounded-lg ${categoryConfig?.bgColor || 'bg-gray-100'}`}>
                          <IconComponent className={`w-4 h-4 ${categoryConfig?.color || 'text-gray-600'}`} />
                        </div>
                        {goal.title}
                        {achieved && <CheckCircle className="w-5 h-5 text-green-600" />}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Progress</span>
                          <span className="text-sm font-medium">{progress.toFixed(1)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        Target: {formatTime(goal.targetMinutes)} {goal.type}
                      </div>

                      {achieved && (
                        <Badge className="bg-green-100 text-green-800">
                          <Award className="w-3 h-3 mr-1" />
                          Achieved!
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Weekly Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {/* Most productive day */}
                  {(() => {
                    const mostProductiveDay = Object.entries(weekData.dailyTotals)
                      .sort(([,a], [,b]) => (b as number) - (a as number))[0];
                    
                    if (mostProductiveDay && mostProductiveDay[1] > 0) {
                      const dayName = new Date(mostProductiveDay[0]).toLocaleDateString('en-US', { weekday: 'long' });
                      return (
                        <div className="p-3 bg-green-50 rounded-lg">
                          <h4 className="font-medium text-green-800 mb-1">Most Productive Day</h4>
                          <p className="text-sm text-green-700">
                            {dayName} with {formatTime(mostProductiveDay[1])} of activities
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Top category */}
                  {(() => {
                    const topCategory = Object.entries(weekData.categoryBreakdown)
                      .sort(([,a], [,b]) => (b as number) - (a as number))[0];
                    
                    if (topCategory) {
                      return (
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <h4 className="font-medium text-blue-800 mb-1">Top Category</h4>
                          <p className="text-sm text-blue-700">
                            {topCategory[0]} - {formatTime(topCategory[1])} total
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Consistency feedback */}
                  <div className={`p-3 rounded-lg ${
                    weekData.consistency >= 80 ? 'bg-green-50' :
                    weekData.consistency >= 50 ? 'bg-yellow-50' : 'bg-red-50'
                  }`}>
                    <h4 className={`font-medium mb-1 ${
                      weekData.consistency >= 80 ? 'text-green-800' :
                      weekData.consistency >= 50 ? 'text-yellow-800' : 'text-red-800'
                    }`}>
                      Consistency Level
                    </h4>
                    <p className={`text-sm ${
                      weekData.consistency >= 80 ? 'text-green-700' :
                      weekData.consistency >= 50 ? 'text-yellow-700' : 'text-red-700'
                    }`}>
                      {weekData.consistency >= 80 ? 'Excellent! You maintained great consistency.' :
                       weekData.consistency >= 50 ? 'Good effort! Try to be more consistent.' :
                       'Focus on building daily habits for better consistency.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {weekData.productivity < 50 && (
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <h4 className="font-medium text-orange-800 mb-1">Boost Productivity</h4>
                      <p className="text-sm text-orange-700">
                        Consider setting smaller, achievable daily goals to build momentum.
                      </p>
                    </div>
                  )}
                  
                  {weekData.consistency < 70 && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-1">Improve Consistency</h4>
                      <p className="text-sm text-blue-700">
                        Try to log at least one activity daily to build a habit.
                      </p>
                    </div>
                  )}
                  
                  {Object.keys(weekData.categoryBreakdown).length < 3 && (
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <h4 className="font-medium text-purple-800 mb-1">Diversify Activities</h4>
                      <p className="text-sm text-purple-700">
                        Consider adding activities from different categories for better balance.
                      </p>
                    </div>
                  )}
                  
                  {weekData.goalProgress.filter(gp => gp.achieved).length === weekData.goalProgress.length && weekData.goalProgress.length > 0 && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-1">Outstanding Week!</h4>
                      <p className="text-sm text-green-700">
                        You achieved all your goals. Consider setting more challenging targets.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reflection" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Reflection</CardTitle>
              <CardDescription>
                Take a moment to reflect on your week and plan for improvement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reflection">What went well this week? What could be improved?</Label>
                <Textarea
                  id="reflection"
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder="Reflect on your achievements, challenges, and lessons learned..."
                  rows={6}
                />
              </div>
              
              <div className="flex justify-end">
                <Button onClick={() => {
                  // In a real app, this would save to storage
                  console.log('Saving reflection:', reflection);
                  alert('Reflection saved!');
                }}>
                  Save Reflection
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}