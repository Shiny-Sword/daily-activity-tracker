'use client';

import { useState } from 'react';
import { 
  Clock, Edit3, Trash2, Calendar, Filter, Search, 
  SortAsc, SortDesc, FileText, Eye, CheckCircle2 
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { CATEGORIES } from '@/lib/constants';
import { Activity } from '@/lib/types';
import { formatTime, formatDate } from '@/lib/utils/date';

interface ActivityListProps {
  activities: Activity[];
  onActivityDeleted: (activityId: string) => void;
  onActivityEdit?: (activity: Activity) => void;
}

export default function ActivityList({ activities, onActivityDeleted, onActivityEdit }: ActivityListProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [dateFilter, setDateFilter] = useState('all');

  // Filter and sort activities
  const filteredActivities = activities
    .filter(activity => {
      const matchesSearch = activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           activity.notes.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || activity.category === categoryFilter;
      
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const activityDate = new Date(activity.date);
        const today = new Date();
        
        switch (dateFilter) {
          case 'today':
            matchesDate = activityDate.toDateString() === today.toDateString();
            break;
          case 'yesterday':
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            matchesDate = activityDate.toDateString() === yesterday.toDateString();
            break;
          case 'week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesDate = activityDate >= weekAgo;
            break;
          case 'month':
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            matchesDate = activityDate >= monthAgo;
            break;
        }
      }
      
      return matchesSearch && matchesCategory && matchesDate;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'duration':
          comparison = a.duration - b.duration;
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleDelete = async (activityId: string) => {
    if (confirm('Are you sure you want to delete this activity?')) {
      try {
        onActivityDeleted(activityId);
        toast({
          title: "Success!",
          description: "Activity deleted successfully",
        });
      } catch (error) {
        console.error('Failed to delete activity:', error);
        toast({
          title: "Error",
          description: "Failed to delete activity. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const getTotalStats = () => {
    const totalTime = filteredActivities.reduce((sum, activity) => sum + activity.duration, 0);
    const categoryBreakdown = filteredActivities.reduce((acc, activity) => {
      acc[activity.category] = (acc[activity.category] || 0) + activity.duration;
      return acc;
    }, {} as Record<string, number>);

    return { totalTime, categoryBreakdown };
  };

  const stats = getTotalStats();

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Activity History</h2>
          <p className="text-muted-foreground">
            {filteredActivities.length} of {activities.length} activities • {formatTime(stats.totalTime)} total time
          </p>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <div className="font-bold text-blue-600">{filteredActivities.length}</div>
            <div className="text-blue-600">Activities</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <div className="font-bold text-green-600">{formatTime(stats.totalTime)}</div>
            <div className="text-green-600">Total Time</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg text-center">
            <div className="font-bold text-purple-600">
              {Object.keys(stats.categoryBreakdown).length}
            </div>
            <div className="text-purple-600">Categories</div>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg text-center">
            <div className="font-bold text-orange-600">
              {filteredActivities.length > 0 ? Math.round(stats.totalTime / filteredActivities.length) : 0}m
            </div>
            <div className="text-orange-600">Avg/Activity</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
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

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Sort by Date</SelectItem>
                <SelectItem value="duration">Sort by Duration</SelectItem>
                <SelectItem value="title">Sort by Title</SelectItem>
                <SelectItem value="category">Sort by Category</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={toggleSortOrder} className="w-full">
              {sortOrder === 'asc' ? (
                <>
                  <SortAsc className="w-4 h-4 mr-2" />
                  Ascending
                </>
              ) : (
                <>
                  <SortDesc className="w-4 h-4 mr-2" />
                  Descending
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activities List */}
      <div className="space-y-3">
        {filteredActivities.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {activities.length === 0 ? 'No Activities Yet' : 'No Matching Activities'}
              </h3>
              <p className="text-muted-foreground">
                {activities.length === 0 
                  ? 'Start logging your activities to see them here.'
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredActivities.map((activity) => {
            const categoryConfig = CATEGORIES[activity.category];
            const IconComponent = categoryConfig.icon;

            return (
              <Card key={activity.id} className="hover:shadow-md transition-all duration-200 hover:border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${categoryConfig.bgColor} flex-shrink-0`}>
                        <IconComponent className={`w-4 h-4 ${categoryConfig.color}`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium truncate">{activity.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {activity.category}
                          </Badge>
                          {activity.completed && (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(activity.date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(activity.duration)}
                          </span>
                          {activity.startTime && activity.endTime && (
                            <span>{activity.startTime} - {activity.endTime}</span>
                          )}
                        </div>
                        
                        {activity.description && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                            {activity.description}
                          </p>
                        )}
                        
                        {activity.notes && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            <FileText className="w-3 h-3 inline mr-1" />
                            {activity.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedActivity(activity)}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <IconComponent className={`w-5 h-5 ${categoryConfig.color}`} />
                              {activity.title || 'Activity Details'}
                            </DialogTitle>
                            <DialogDescription>
                              {activity.category} • {formatDate(activity.date)} • {formatTime(activity.duration)}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            {activity.description && (
                              <div>
                                <h4 className="font-medium mb-2">Description</h4>
                                <p className="text-sm text-muted-foreground">{activity.description}</p>
                              </div>
                            )}
                            
                            <div>
                              <h4 className="font-medium mb-2">Time Details</h4>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Date:</span>
                                  <p>{formatDate(activity.date)}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Duration:</span>
                                  <p>{formatTime(activity.duration)}</p>
                                </div>
                                {activity.startTime && (
                                  <div>
                                    <span className="text-muted-foreground">Start:</span>
                                    <p>{activity.startTime}</p>
                                  </div>
                                )}
                                {activity.endTime && (
                                  <div>
                                    <span className="text-muted-foreground">End:</span>
                                    <p>{activity.endTime}</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {activity.notes && (
                              <div>
                                <h4 className="font-medium mb-2">Notes & Reflection</h4>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                  <p className="text-sm whitespace-pre-wrap">
                                    {activity.notes}
                                  </p>
                                </div>
                              </div>
                            )}

                            <div>
                              <h4 className="font-medium mb-2">Activity Status</h4>
                              <div className="flex items-center gap-2">
                                {activity.completed ? (
                                  <Badge className="bg-green-100 text-green-800">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Completed
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">
                                    In Progress
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {onActivityEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onActivityEdit(activity)}
                        >
                          <Edit3 className="w-3 h-3" />
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(activity.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Pagination would go here if needed */}
      {filteredActivities.length > 10 && (
        <div className="text-center text-sm text-muted-foreground">
          Showing {filteredActivities.length} activities
        </div>
      )}
    </div>
  );
}