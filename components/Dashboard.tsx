'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Target, TrendingUp, CheckCircle, Award,
  BarChart3, PieChart, Activity as ActivityIcon, Timer
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CATEGORIES } from '@/lib/constants';
import { Activity, Goal } from '@/lib/types';
import { formatTime, isToday, formatDate } from '@/lib/utils/date';

interface DashboardProps {
  activities: Activity[];
  goals: Goal[];
}

export default function Dashboard({ activities, goals }: DashboardProps) {
  const [todayActivities, setTodayActivities] = useState<Activity[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<any>({});
  const [goalProgress, setGoalProgress] = useState<any[]>([]);

  useEffect(() => {
    // Filter today's activities
    const today = activities.filter(activity => isToday(activity.date));
    setTodayActivities(today);

    // Calculate weekly stats
    calculateWeeklyStats();

    // Calculate goal progress
    calculateGoalProgress();
  }, [activities, goals]);

  const calculateWeeklyStats = () => {
    const weekActivities = activities.filter(activity => {
      const activityDate = new Date(activity.date);
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      return activityDate >= weekAgo;
    });

    const categoryTotals: Record<string, number> = {};
    let totalTime = 0;

    weekActivities.forEach(activity => {
      categoryTotals[activity.category] = (categoryTotals[activity.category] || 0) + activity.duration;
      totalTime += activity.duration;
    });

    setWeeklyStats({
      totalActivities: weekActivities.length,
      totalTime,
      categoryTotals,
      averagePerDay: totalTime / 7
    });
  };

  const calculateGoalProgress = () => {
    const progressData = goals.map(goal => {
      let relevantActivities: Activity[] = [];
      const today = new Date();

      if (goal.type === 'daily') {
        relevantActivities = activities.filter(
          activity => activity.category === goal.category && isToday(activity.date)
        );
      } else if (goal.type === 'weekly') {
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        relevantActivities = activities.filter(
          activity => activity.category === goal.category && new Date(activity.date) >= weekAgo
        );
      } else if (goal.type === 'monthly') {
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        relevantActivities = activities.filter(
          activity => activity.category === goal.category && new Date(activity.date) >= monthAgo
        );
      }

      const actualTime = relevantActivities.reduce((sum, activity) => sum + activity.duration, 0);
      const progress = Math.min((actualTime / goal.targetMinutes) * 100, 100);

      return {
        ...goal,
        actualTime,
        progress: Math.round(progress)
      };
    });

    setGoalProgress(progressData);
  };

  const todayTotal = todayActivities.reduce((sum, activity) => sum + activity.duration, 0);
  const todayByCategory = todayActivities.reduce((acc, activity) => {
    acc[activity.category] = (acc[activity.category] || 0) + activity.duration;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Today's Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Activities</CardTitle>
            <ActivityIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayActivities.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatTime(todayTotal)} total time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Total</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(weeklyStats.totalTime || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {weeklyStats.totalActivities || 0} activities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Goals Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {goals.length > 0 ? 
                Math.round(goalProgress.reduce((sum, goal) => sum + goal.progress, 0) / goals.length) : 0
              }%
            </div>
            <p className="text-xs text-muted-foreground">
              Average completion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productivity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {weeklyStats.averagePerDay ? formatTime(Math.round(weeklyStats.averagePerDay)) : '0m'}
            </div>
            <p className="text-xs text-muted-foreground">
              Daily average
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="today" className="space-y-4">
        <TabsList>
          <TabsTrigger value="today">Today's View</TabsTrigger>
          <TabsTrigger value="goals">Goals Progress</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Today's Activities */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Activities</CardTitle>
                <CardDescription>
                  {todayActivities.length} activities • {formatTime(todayTotal)} total
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {todayActivities.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No activities logged today. Start tracking your day!
                    </p>
                  ) : (
                    todayActivities.slice(0, 5).map((activity) => {
                      const categoryConfig = CATEGORIES[activity.category];
                      const IconComponent = categoryConfig.icon;
                      
                      return (
                        <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${categoryConfig.bgColor}`}>
                              <IconComponent className={`w-4 h-4 ${categoryConfig.color}`} />
                            </div>
                            <div>
                              <p className="font-medium">{activity.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {activity.startTime && activity.endTime 
                                  ? `${activity.startTime} - ${activity.endTime}`
                                  : formatTime(activity.duration)
                                }
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline">
                            {formatTime(activity.duration)}
                          </Badge>
                        </div>
                      );
                    })
                  )}
                  {todayActivities.length > 5 && (
                    <p className="text-sm text-muted-foreground text-center">
                      +{todayActivities.length - 5} more activities
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Today by Category</CardTitle>
                <CardDescription>Time distribution across categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(CATEGORIES).map(([categoryKey, config]) => {
                    const time = todayByCategory[categoryKey] || 0;
                    const percentage = todayTotal > 0 ? (time / todayTotal) * 100 : 0;
                    const IconComponent = config.icon;

                    return (
                      <div key={categoryKey} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <IconComponent className={`w-4 h-4 ${config.color}`} />
                            <span className="text-sm font-medium">{config.name}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {formatTime(time)}
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goalProgress.length === 0 ? (
              <Card className="col-span-2">
                <CardContent className="text-center py-8">
                  <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No goals set yet. Create your first goal to start tracking progress!</p>
                </CardContent>
              </Card>
            ) : (
              goalProgress.map((goal) => {
                const categoryConfig = CATEGORIES[goal.category];
                const IconComponent = categoryConfig?.icon || Target;

                return (
                  <Card key={goal.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <IconComponent className={`w-5 h-5 ${categoryConfig?.color || 'text-gray-600'}`} />
                        {goal.title}
                      </CardTitle>
                      <CardDescription>
                        {goal.type.charAt(0).toUpperCase() + goal.type.slice(1)} Goal • {goal.category}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Progress</span>
                          <span className="text-sm font-medium">{goal.progress}%</span>
                        </div>
                        <Progress value={goal.progress} className="h-3" />
                        <div className="flex justify-between items-center text-sm">
                          <span>{formatTime(goal.actualTime)} done</span>
                          <span className="text-muted-foreground">
                            {formatTime(goal.targetMinutes)} target
                          </span>
                        </div>
                        {goal.progress >= 100 && (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Goal Achieved!</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Weekly Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Activities</span>
                    <span className="font-medium">{weeklyStats.totalActivities || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Time</span>
                    <span className="font-medium">{formatTime(weeklyStats.totalTime || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Daily Average</span>
                    <span className="font-medium">
                      {formatTime(Math.round(weeklyStats.averagePerDay || 0))}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Category Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Category Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(weeklyStats.categoryTotals || {})
                    .sort(([,a], [,b]) => (b as number) - (a as number))
                    .slice(0, 5)
                    .map(([category, time]) => {
                      const config = CATEGORIES[category as keyof typeof CATEGORIES];
                      const IconComponent = config?.icon || ActivityIcon;
                      const percentage = weeklyStats.totalTime > 0 
                        ? ((time as number) / weeklyStats.totalTime) * 100 
                        : 0;

                      return (
                        <div key={category} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <IconComponent className={`w-4 h-4 ${config?.color || 'text-gray-600'}`} />
                            <span className="text-sm">{category}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{formatTime(time as number)}</div>
                            <div className="text-xs text-muted-foreground">
                              {percentage.toFixed(1)}%
                            </div>
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
      </Tabs>
    </div>
  );
}