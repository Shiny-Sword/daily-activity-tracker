'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, PieChart, TrendingUp, TrendingDown, Calendar, Clock, 
  Target, Activity as ActivityIcon, Filter, Download, RefreshCw,
  ArrowUp, ArrowDown, Minus, ChevronLeft, ChevronRight, Eye,
  Users, Heart, Briefcase, BookOpen, Coffee, MessageCircle, MoreHorizontal
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CATEGORIES } from '@/lib/constants';
import { Activity, Goal } from '@/lib/types';
import { formatTime, formatDate } from '@/lib/utils/date';

interface AnalyticsProps {
  activities: Activity[];
  goals: Goal[];
}

interface AnalyticsData {
  totalTime: number;
  totalActivities: number;
  averagePerDay: number;
  categoryBreakdown: Record<string, number>;
  dailyTrends: Array<{ date: string; time: number; activities: number }>;
  weeklyComparison: { current: number; previous: number; change: number };
  productivityScore: number;
  goalCompletion: number;
  streaks: { current: number; longest: number };
  peakHours: Array<{ hour: number; count: number }>;
  categoryTrends: Record<string, { current: number; previous: number; trend: 'up' | 'down' | 'stable' }>;
}

export default function Analytics({ activities, goals }: AnalyticsProps) {
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | '3months' | '6months' | 'year'>('month');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [comparisonMode, setComparisonMode] = useState<'previous' | 'target' | 'average'>('previous');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');

  // Calculate analytics data based on selected time range
  const analyticsData = useMemo((): AnalyticsData => {
    const now = new Date();
    const startDate = new Date();
    
    // Set start date based on time range
    switch (timeRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '3months':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '6months':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Filter activities by time range and category
    const filteredActivities = activities.filter(activity => {
      const activityDate = new Date(activity.date);
      const inTimeRange = activityDate >= startDate && activityDate <= now;
      const inCategory = selectedCategory === 'all' || activity.category === selectedCategory;
      return inTimeRange && inCategory;
    });

    // Calculate basic metrics
    const totalTime = filteredActivities.reduce((sum, activity) => sum + activity.duration, 0);
    const totalActivities = filteredActivities.length;
    const dayCount = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const averagePerDay = totalTime / dayCount;

    // Category breakdown
    const categoryBreakdown = filteredActivities.reduce((acc, activity) => {
      acc[activity.category] = (acc[activity.category] || 0) + activity.duration;
      return acc;
    }, {} as Record<string, number>);

    // Daily trends
    const dailyData = new Map<string, { time: number; activities: number }>();
    filteredActivities.forEach(activity => {
      const date = activity.date;
      if (!dailyData.has(date)) {
        dailyData.set(date, { time: 0, activities: 0 });
      }
      const day = dailyData.get(date)!;
      day.time += activity.duration;
      day.activities += 1;
    });

    const dailyTrends = Array.from(dailyData.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Weekly comparison
    const currentWeekStart = new Date();
    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    const previousWeekStart = new Date();
    previousWeekStart.setDate(previousWeekStart.getDate() - 14);

    const currentWeekTime = activities
      .filter(a => new Date(a.date) >= currentWeekStart)
      .reduce((sum, a) => sum + a.duration, 0);
    
    const previousWeekTime = activities
      .filter(a => {
        const date = new Date(a.date);
        return date >= previousWeekStart && date < currentWeekStart;
      })
      .reduce((sum, a) => sum + a.duration, 0);

    const weeklyChange = previousWeekTime > 0 
      ? ((currentWeekTime - previousWeekTime) / previousWeekTime) * 100 
      : 0;

    // Productivity score (based on goal completion and consistency)
    const goalProgress = goals.reduce((sum, goal) => {
      const categoryTime = categoryBreakdown[goal.category] || 0;
      const dailyTarget = goal.targetMinutes;
      const actualDaily = categoryTime / dayCount;
      return sum + Math.min((actualDaily / dailyTarget) * 100, 100);
    }, 0);

    const productivityScore = goals.length > 0 ? goalProgress / goals.length : 0;

    // Goal completion percentage
    const completedGoals = goals.filter(goal => {
      const categoryTime = categoryBreakdown[goal.category] || 0;
      const targetTime = goal.targetMinutes * dayCount;
      return categoryTime >= targetTime;
    }).length;

    const goalCompletion = goals.length > 0 ? (completedGoals / goals.length) * 100 : 0;

    // Activity streaks
    const sortedDates = Array.from(new Set(activities.map(a => a.date))).sort();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Calculate streaks
    const today = new Date().toISOString().split('T')[0];
    let checkDate = new Date();
    
    // Current streak (working backwards from today)
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (sortedDates.includes(dateStr)) {
        currentStreak++;
      } else {
        break;
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Helper function to check consecutive days
    const isConsecutiveDay = (date1: string, date2: string): boolean => {
      const d1 = new Date(date1);
      const d2 = new Date(date2);
      const diffTime = Math.abs(d2.getTime() - d1.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays === 1;
    };

    // Longest streak
    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0 || isConsecutiveDay(sortedDates[i-1], sortedDates[i])) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    // Peak hours analysis
    const hourCounts = new Array(24).fill(0);
    filteredActivities.forEach(activity => {
      if (activity.startTime) {
        const hour = parseInt(activity.startTime.split(':')[0]);
        hourCounts[hour]++;
      }
    });

    const peakHours = hourCounts
      .map((count, hour) => ({ hour, count }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Category trends
    const categoryTrends: Record<string, { current: number; previous: number; trend: 'up' | 'down' | 'stable' }> = {};
    
    Object.keys(CATEGORIES).forEach(category => {
      const currentPeriodTime = categoryBreakdown[category] || 0;
      
      // Calculate previous period time
      const previousStartDate = new Date(startDate);
      const periodLength = now.getTime() - startDate.getTime();
      previousStartDate.setTime(startDate.getTime() - periodLength);
      
      const previousPeriodTime = activities
        .filter(a => {
          const date = new Date(a.date);
          return date >= previousStartDate && date < startDate && a.category === category;
        })
        .reduce((sum, a) => sum + a.duration, 0);

      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (currentPeriodTime > previousPeriodTime * 1.1) trend = 'up';
      else if (currentPeriodTime < previousPeriodTime * 0.9) trend = 'down';

      categoryTrends[category] = {
        current: currentPeriodTime,
        previous: previousPeriodTime,
        trend
      };
    });

    return {
      totalTime,
      totalActivities,
      averagePerDay,
      categoryBreakdown,
      dailyTrends,
      weeklyComparison: {
        current: currentWeekTime,
        previous: previousWeekTime,
        change: weeklyChange
      },
      productivityScore,
      goalCompletion,
      streaks: { current: currentStreak, longest: longestStreak },
      peakHours,
      categoryTrends
    };
  }, [activities, goals, timeRange, selectedCategory]);

  // Helper function to check consecutive days
  const isConsecutiveDay = (date1: string, date2: string): boolean => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1;
  };

  // Export analytics data
  const handleExportAnalytics = () => {
    const exportData = {
      timeRange,
      selectedCategory,
      generatedAt: new Date().toISOString(),
      summary: analyticsData,
      detailedBreakdown: {
        dailyTrends: analyticsData.dailyTrends,
        categoryBreakdown: analyticsData.categoryBreakdown,
        peakHours: analyticsData.peakHours,
        categoryTrends: analyticsData.categoryTrends
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics_${timeRange}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Analytics Exported!",
      description: "Your analytics data has been downloaded as JSON",
    });
  };

  // Simple chart components (since we can't use external chart libraries)
  const BarChart = ({ data, title }: { data: Array<{ label: string; value: number; color?: string }>, title: string }) => {
    const maxValue = Math.max(...data.map(d => d.value));
    
    return (
      <div className="space-y-3">
        <h4 className="font-medium text-sm">{title}</h4>
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-20 text-xs text-muted-foreground truncate">
                {item.label}
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-2 relative">
                <div 
                  className={`h-2 rounded-full ${item.color || 'bg-blue-500'}`}
                  style={{ width: `${(item.value / maxValue) * 100}%` }}
                />
              </div>
              <div className="w-16 text-xs text-right">
                {formatTime(item.value)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const PieChartSimple = ({ data, title }: { data: Array<{ label: string; value: number; color: string }>, title: string }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    return (
      <div className="space-y-3">
        <h4 className="font-medium text-sm">{title}</h4>
        <div className="space-y-2">
          {data.map((item, index) => {
            const percentage = total > 0 ? (item.value / total) * 100 : 0;
            return (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <span className="text-sm">{item.label}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{formatTime(item.value)}</div>
                  <div className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced Analytics</h2>
          <p className="text-muted-foreground">
            Deep insights into your activity patterns and productivity trends
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">1 Week</SelectItem>
              <SelectItem value="month">1 Month</SelectItem>
              <SelectItem value="3months">3 Months</SelectItem>
              <SelectItem value="6months">6 Months</SelectItem>
              <SelectItem value="year">1 Year</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(CATEGORIES).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handleExportAnalytics}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(analyticsData.totalTime)}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {analyticsData.weeklyComparison.change > 0 ? (
                <ArrowUp className="w-3 h-3 text-green-600" />
              ) : analyticsData.weeklyComparison.change < 0 ? (
                <ArrowDown className="w-3 h-3 text-red-600" />
              ) : (
                <Minus className="w-3 h-3 text-gray-600" />
              )}
              <span className={
                analyticsData.weeklyComparison.change > 0 ? 'text-green-600' :
                analyticsData.weeklyComparison.change < 0 ? 'text-red-600' : 'text-gray-600'
              }>
                {Math.abs(analyticsData.weeklyComparison.change).toFixed(1)}% vs last week
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productivity Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.productivityScore.toFixed(1)}%</div>
            <Progress value={analyticsData.productivityScore} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.streaks.current}</div>
            <p className="text-xs text-muted-foreground">
              Longest: {analyticsData.streaks.longest} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Goal Completion</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.goalCompletion.toFixed(1)}%</div>
            <Progress value={analyticsData.goalCompletion} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Activity Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Daily Activity Trends
                </CardTitle>
                <CardDescription>
                  Your activity patterns over the selected time period
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsData.dailyTrends.length > 0 ? (
                  <div className="space-y-3">
                    {analyticsData.dailyTrends.slice(-14).map((day, index) => {
                      const maxTime = Math.max(...analyticsData.dailyTrends.map(d => d.time));
                      const percentage = maxTime > 0 ? (day.time / maxTime) * 100 : 0;
                      
                      return (
                        <div key={index} className="flex items-center gap-3">
                          <div className="w-16 text-xs text-muted-foreground">
                            {formatDate(day.date)}
                          </div>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="h-2 bg-blue-500 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="w-16 text-xs text-right">
                            {formatTime(day.time)}
                          </div>
                          <div className="w-8 text-xs text-muted-foreground">
                            {day.activities}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No activity data for the selected period
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Category Distribution
                </CardTitle>
                <CardDescription>
                  Time spent across different activity categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PieChartSimple
                  title=""
                  data={Object.entries(analyticsData.categoryBreakdown)
                    .filter(([_, time]) => time > 0)
                    .map(([category, time]) => ({
                      label: category,
                      value: time,
                      color: CATEGORIES[category as keyof typeof CATEGORIES]?.bgColor.replace('bg-', 'bg-').replace('-50', '-500') || 'bg-gray-500'
                    }))
                    .sort((a, b) => b.value - a.value)
                  }
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Comparison</CardTitle>
                <CardDescription>Current week vs previous week</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Current Week</span>
                  <span className="font-medium">{formatTime(analyticsData.weeklyComparison.current)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Previous Week</span>
                  <span className="font-medium">{formatTime(analyticsData.weeklyComparison.previous)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Change</span>
                  <div className={`flex items-center gap-1 font-medium ${
                    analyticsData.weeklyComparison.change > 0 ? 'text-green-600' :
                    analyticsData.weeklyComparison.change < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {analyticsData.weeklyComparison.change > 0 ? (
                      <ArrowUp className="w-4 h-4" />
                    ) : analyticsData.weeklyComparison.change < 0 ? (
                      <ArrowDown className="w-4 h-4" />
                    ) : (
                      <Minus className="w-4 h-4" />
                    )}
                    {Math.abs(analyticsData.weeklyComparison.change).toFixed(1)}%
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Peak Hours */}
            <Card>
              <CardHeader>
                <CardTitle>Peak Activity Hours</CardTitle>
                <CardDescription>When you're most active during the day</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.peakHours.map((hour, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">
                        {hour.hour.toString().padStart(2, '0')}:00 - {(hour.hour + 1).toString().padStart(2, '0')}:00
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 bg-orange-500 rounded-full"
                            style={{ 
                              width: `${(hour.count / Math.max(...analyticsData.peakHours.map(h => h.count))) * 100}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8">{hour.count}</span>
                      </div>
                    </div>
                  ))}
                  {analyticsData.peakHours.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      No time data available
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(CATEGORIES).map(([categoryKey, config]) => {
              const IconComponent = config.icon;
              const categoryData = analyticsData.categoryTrends[categoryKey];
              const currentTime = analyticsData.categoryBreakdown[categoryKey] || 0;
              
              return (
                <Card key={categoryKey}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <div className={`p-2 rounded-lg ${config.bgColor}`}>
                        <IconComponent className={`w-4 h-4 ${config.color}`} />
                      </div>
                      {config.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-2xl font-bold">{formatTime(currentTime)}</div>
                    
                    {categoryData && (
                      <div className="flex items-center gap-2 text-sm">
                        {categoryData.trend === 'up' ? (
                          <ArrowUp className="w-4 h-4 text-green-600" />
                        ) : categoryData.trend === 'down' ? (
                          <ArrowDown className="w-4 h-4 text-red-600" />
                        ) : (
                          <Minus className="w-4 h-4 text-gray-600" />
                        )}
                        <span className={`${
                          categoryData.trend === 'up' ? 'text-green-600' :
                          categoryData.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {categoryData.trend === 'stable' ? 'No change' : 
                           categoryData.previous > 0 ? 
                           `${Math.abs(((categoryData.current - categoryData.previous) / categoryData.previous) * 100).toFixed(1)}%` :
                           'New activity'
                          }
                        </span>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      {analyticsData.totalTime > 0 ? 
                        `${((currentTime / analyticsData.totalTime) * 100).toFixed(1)}% of total time` :
                        'No activity recorded'
                      }
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Productivity Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Productivity Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-sm mb-1">Most Productive Category</h4>
                    <p className="text-sm text-muted-foreground">
                      {Object.entries(analyticsData.categoryBreakdown)
                        .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'No data'}
                    </p>
                  </div>
                  
                  <div className="p-3 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-sm mb-1">Daily Average</h4>
                    <p className="text-sm text-muted-foreground">
                      {formatTime(Math.round(analyticsData.averagePerDay))} per day
                    </p>
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <h4 className="font-medium text-sm mb-1">Activity Consistency</h4>
                    <p className="text-sm text-muted-foreground">
                      {analyticsData.streaks.current > 7 ? 'Excellent' :
                       analyticsData.streaks.current > 3 ? 'Good' :
                       analyticsData.streaks.current > 0 ? 'Getting started' : 'Needs improvement'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.productivityScore < 50 && (
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <h4 className="font-medium text-sm text-orange-800 mb-1">Boost Productivity</h4>
                      <p className="text-sm text-orange-700">
                        Consider setting smaller, achievable daily goals to build momentum.
                      </p>
                    </div>
                  )}
                  
                  {analyticsData.streaks.current === 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="font-medium text-sm text-red-800 mb-1">Build Consistency</h4>
                      <p className="text-sm text-red-700">
                        Try to log at least one activity daily to build a habit.
                      </p>
                    </div>
                  )}
                  
                  {Object.keys(analyticsData.categoryBreakdown).length < 3 && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-sm text-blue-800 mb-1">Diversify Activities</h4>
                      <p className="text-sm text-blue-700">
                        Consider adding activities from different categories for better balance.
                      </p>
                    </div>
                  )}
                  
                  {analyticsData.productivityScore > 80 && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-sm text-green-800 mb-1">Great Job!</h4>
                      <p className="text-sm text-green-700">
                        You're maintaining excellent productivity. Keep it up!
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}