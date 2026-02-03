'use client';

import { useState, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, Clock, ArrowLeft, ArrowRight, TrendingUp, TrendingDown, BarChart3, PieChart, Filter, Search, Eye, GitCompare as Compare, Download, RefreshCw, ChevronLeft, ChevronRight, Activity as ActivityIcon, Target, CheckCircle, AlertCircle, Minus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { CATEGORIES } from '@/lib/constants';
import { Activity, Goal } from '@/lib/types';
import { formatTime, formatDate, isToday } from '@/lib/utils/date';

interface HistoricalViewProps {
  activities: Activity[];
  goals: Goal[];
}

interface DayData {
  date: string;
  activities: Activity[];
  totalTime: number;
  categoryBreakdown: Record<string, number>;
  completedGoals: number;
  productivity: number;
}

export default function HistoricalView({ activities, goals }: HistoricalViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'timeline' | 'comparison'>('calendar');
  const [comparisonDate, setComparisonDate] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | '3months' | '6months' | 'year'>('month');

  // Generate historical data
  const historicalData = useMemo(() => {
    const dataMap = new Map<string, DayData>();
    
    // Get date range based on timeRange
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case '3months':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case '6months':
        startDate.setMonth(endDate.getMonth() - 6);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }

    // Initialize all dates in range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      dataMap.set(dateStr, {
        date: dateStr,
        activities: [],
        totalTime: 0,
        categoryBreakdown: {},
        completedGoals: 0,
        productivity: 0
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Populate with actual activity data
    activities.forEach(activity => {
      if (dataMap.has(activity.date)) {
        const dayData = dataMap.get(activity.date)!;
        dayData.activities.push(activity);
        dayData.totalTime += activity.duration;
        dayData.categoryBreakdown[activity.category] = 
          (dayData.categoryBreakdown[activity.category] || 0) + activity.duration;
      }
    });

    // Calculate productivity scores
    dataMap.forEach((dayData) => {
      const goalProgress = goals.reduce((sum, goal) => {
        const categoryTime = dayData.categoryBreakdown[goal.category] || 0;
        const progress = Math.min((categoryTime / goal.targetMinutes) * 100, 100);
        return sum + progress;
      }, 0);
      
      dayData.completedGoals = Math.round(goalProgress / Math.max(goals.length, 1));
      dayData.productivity = Math.min(
        (dayData.totalTime / 480) * 50 + // Time factor (8 hours = 50%)
        (dayData.completedGoals / 100) * 30 + // Goal completion (30%)
        (Object.keys(dayData.categoryBreakdown).length / 7) * 20, // Diversity (20%)
        100
      );
    });

    return Array.from(dataMap.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [activities, goals, timeRange]);

  // Get data for selected date
  const selectedDateData = useMemo(() => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    return historicalData.find(d => d.date === dateStr) || {
      date: dateStr,
      activities: [],
      totalTime: 0,
      categoryBreakdown: {},
      completedGoals: 0,
      productivity: 0
    };
  }, [selectedDate, historicalData]);

  // Get comparison data
  const comparisonData = useMemo(() => {
    if (!comparisonDate) return null;
    const dateStr = comparisonDate.toISOString().split('T')[0];
    return historicalData.find(d => d.date === dateStr) || {
      date: dateStr,
      activities: [],
      totalTime: 0,
      categoryBreakdown: {},
      completedGoals: 0,
      productivity: 0
    };
  }, [comparisonDate, historicalData]);

  // Filter activities for timeline view
  const filteredActivities = useMemo(() => {
    return selectedDateData.activities.filter(activity => {
      const matchesSearch = activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           activity.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || activity.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [selectedDateData.activities, searchTerm, categoryFilter]);

  // Calendar day renderer
  const renderCalendarDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const dayData = historicalData.find(d => d.date === dateStr);
    
    if (!dayData || dayData.activities.length === 0) {
      return <div className="w-full h-full opacity-30" />;
    }

    const intensity = Math.min(dayData.totalTime / 480, 1); // Max 8 hours
    const opacity = 0.2 + (intensity * 0.8);

    return (
      <div 
        className="w-full h-full rounded-sm flex items-center justify-center text-xs font-medium"
        style={{
          backgroundColor: `rgba(59, 130, 246, ${opacity})`,
          color: intensity > 0.5 ? 'white' : 'inherit'
        }}
      >
        {dayData.activities.length}
      </div>
    );
  };

  // Quick date navigation
  const navigateDate = (direction: 'prev' | 'next', unit: 'day' | 'week' | 'month') => {
    const newDate = new Date(selectedDate);
    const multiplier = direction === 'prev' ? -1 : 1;
    
    switch (unit) {
      case 'day':
        newDate.setDate(newDate.getDate() + multiplier);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (7 * multiplier));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + multiplier);
        break;
    }
    
    setSelectedDate(newDate);
  };

  // Get productivity trend
  const getProductivityTrend = () => {
    const recentDays = historicalData.slice(0, 7);
    const olderDays = historicalData.slice(7, 14);
    
    const recentAvg = recentDays.reduce((sum, day) => sum + day.productivity, 0) / recentDays.length;
    const olderAvg = olderDays.reduce((sum, day) => sum + day.productivity, 0) / olderDays.length;
    
    return recentAvg - olderAvg;
  };

  const productivityTrend = getProductivityTrend();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Historical Activity View</h2>
          <p className="text-muted-foreground">
            Explore your activity history and track long-term patterns
          </p>
        </div>

        <div className="flex items-center gap-2">
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

          <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
            <TabsList>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="comparison">Compare</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Days Tracked</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {historicalData.filter(d => d.activities.length > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">
              of {historicalData.length} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
            <ActivityIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {historicalData.reduce((sum, day) => sum + day.activities.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round(historicalData.reduce((sum, day) => sum + day.activities.length, 0) / Math.max(historicalData.filter(d => d.activities.length > 0).length, 1))} avg/day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTime(historicalData.reduce((sum, day) => sum + day.totalTime, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatTime(Math.round(historicalData.reduce((sum, day) => sum + day.totalTime, 0) / Math.max(historicalData.filter(d => d.activities.length > 0).length, 1)))} avg/day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productivity Trend</CardTitle>
            {productivityTrend > 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : productivityTrend < 0 ? (
              <TrendingDown className="h-4 w-4 text-red-600" />
            ) : (
              <Minus className="h-4 w-4 text-gray-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              productivityTrend > 0 ? 'text-green-600' : 
              productivityTrend < 0 ? 'text-red-600' : 'text-gray-600'
            }`}>
              {productivityTrend > 0 ? '+' : ''}{productivityTrend.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              vs previous week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Calendar/Timeline */}
        <div className="lg:col-span-2 space-y-4">
          {viewMode === 'calendar' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  Activity Calendar
                </CardTitle>
                <CardDescription>
                  Click on any date to view detailed activities. Darker colors indicate more activity.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="rounded-md border"
                  components={{
                    Day: ({ date }) => (
                      <div className="relative w-full h-full">
                        <div className="absolute inset-0">
                          {renderCalendarDay(date)}
                        </div>
                        <div className="relative z-10 w-full h-full flex items-center justify-center">
                          {date.getDate()}
                        </div>
                      </div>
                    )
                  }}
                />
              </CardContent>
            </Card>
          )}

          {viewMode === 'timeline' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Daily Timeline - {formatDate(selectedDateData.date)}
                </CardTitle>
                <CardDescription>
                  Detailed view of activities for the selected date
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Date Navigation */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateDate('prev', 'day')}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateDate('next', 'day')}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm">
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          {formatDate(selectedDateData.date)}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => date && setSelectedDate(date)}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateDate('prev', 'week')}
                    >
                      -1 Week
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateDate('prev', 'month')}
                    >
                      -1 Month
                    </Button>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search activities..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Categories" />
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
                </div>

                {/* Activities List */}
                <div className="space-y-3">
                  {filteredActivities.length === 0 ? (
                    <div className="text-center py-8">
                      <ActivityIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {selectedDateData.activities.length === 0 
                          ? 'No activities logged for this date'
                          : 'No activities match your search criteria'
                        }
                      </p>
                    </div>
                  ) : (
                    filteredActivities
                      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
                      .map((activity) => {
                        const categoryConfig = CATEGORIES[activity.category];
                        const IconComponent = categoryConfig.icon;

                        return (
                          <div key={activity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className={`p-2 rounded-lg ${categoryConfig.bgColor}`}>
                              <IconComponent className={`w-4 h-4 ${categoryConfig.color}`} />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium">{activity.title}</h4>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>{formatTime(activity.duration)}</span>
                                {activity.startTime && activity.endTime && (
                                  <span>{activity.startTime} - {activity.endTime}</span>
                                )}
                                <Badge variant="outline">{activity.category}</Badge>
                              </div>
                              {activity.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {activity.description}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {viewMode === 'comparison' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Compare className="w-5 h-5" />
                  Date Comparison
                </CardTitle>
                <CardDescription>
                  Compare activities between two different dates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Date Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Primary Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          {formatDate(selectedDateData.date)}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => date && setSelectedDate(date)}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Compare With</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          {comparisonDate ? formatDate(comparisonDate.toISOString().split('T')[0]) : 'Select date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={comparisonDate}
                          onSelect={setComparisonDate}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Comparison Results */}
                {comparisonData && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">{formatDate(selectedDateData.date)}</h4>
                        <div className="space-y-1 text-sm">
                          <div>Activities: {selectedDateData.activities.length}</div>
                          <div>Total Time: {formatTime(selectedDateData.totalTime)}</div>
                          <div>Productivity: {selectedDateData.productivity.toFixed(1)}%</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium">{formatDate(comparisonData.date)}</h4>
                        <div className="space-y-1 text-sm">
                          <div>Activities: {comparisonData.activities.length}</div>
                          <div>Total Time: {formatTime(comparisonData.totalTime)}</div>
                          <div>Productivity: {comparisonData.productivity.toFixed(1)}%</div>
                        </div>
                      </div>
                    </div>

                    {/* Differences */}
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h5 className="font-medium mb-2">Comparison Summary</h5>
                      <div className="space-y-1 text-sm">
                        <div className={`flex items-center gap-2 ${
                          selectedDateData.activities.length > comparisonData.activities.length 
                            ? 'text-green-600' : selectedDateData.activities.length < comparisonData.activities.length 
                            ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {selectedDateData.activities.length > comparisonData.activities.length ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : selectedDateData.activities.length < comparisonData.activities.length ? (
                            <TrendingDown className="w-4 h-4" />
                          ) : (
                            <Minus className="w-4 h-4" />
                          )}
                          Activities: {selectedDateData.activities.length - comparisonData.activities.length > 0 ? '+' : ''}{selectedDateData.activities.length - comparisonData.activities.length}
                        </div>
                        <div className={`flex items-center gap-2 ${
                          selectedDateData.totalTime > comparisonData.totalTime 
                            ? 'text-green-600' : selectedDateData.totalTime < comparisonData.totalTime 
                            ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {selectedDateData.totalTime > comparisonData.totalTime ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : selectedDateData.totalTime < comparisonData.totalTime ? (
                            <TrendingDown className="w-4 h-4" />
                          ) : (
                            <Minus className="w-4 h-4" />
                          )}
                          Time: {formatTime(Math.abs(selectedDateData.totalTime - comparisonData.totalTime))} {selectedDateData.totalTime > comparisonData.totalTime ? 'more' : selectedDateData.totalTime < comparisonData.totalTime ? 'less' : 'same'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel - Day Details */}
        <div className="space-y-4">
          {/* Selected Date Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {isToday(selectedDateData.date) ? 'Today' : formatDate(selectedDateData.date)}
              </CardTitle>
              <CardDescription>
                {selectedDateData.activities.length} activities • {formatTime(selectedDateData.totalTime)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Productivity Score</span>
                  <span className="font-medium">{selectedDateData.productivity.toFixed(1)}%</span>
                </div>
                <Progress value={selectedDateData.productivity} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Goal Completion</span>
                  <span className="font-medium">{selectedDateData.completedGoals}%</span>
                </div>
                <Progress value={selectedDateData.completedGoals} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(selectedDateData.categoryBreakdown)
                  .sort(([,a], [,b]) => (b as number) - (a as number))
                  .map(([category, time]) => {
                    const config = CATEGORIES[category as keyof typeof CATEGORIES];
                    const IconComponent = config?.icon || ActivityIcon;
                    const percentage = selectedDateData.totalTime > 0 
                      ? ((time as number) / selectedDateData.totalTime) * 100 
                      : 0;

                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <IconComponent className={`w-4 h-4 ${config?.color || 'text-gray-600'}`} />
                            <span className="text-sm font-medium">{category}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {formatTime(time as number)}
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })
                }
                {Object.keys(selectedDateData.categoryBreakdown).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No activities for this date
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setSelectedDate(new Date())}
              >
                <CalendarIcon className="w-4 h-4 mr-2" />
                Go to Today
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  const oneMonthAgo = new Date();
                  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                  setSelectedDate(oneMonthAgo);
                }}
              >
                <Clock className="w-4 h-4 mr-2" />
                1 Month Ago
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setViewMode('comparison')}
              >
                <Compare className="w-4 h-4 mr-2" />
                Compare Dates
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}