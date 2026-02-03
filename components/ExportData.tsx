'use client';

import { useState } from 'react';
import { Download, FileText, Database, Calendar, Clock, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Activity, Goal } from '@/lib/types';
import { formatTime, getTodayDateString } from '@/lib/utils/date';

interface ExportDataProps {
  activities: Activity[];
  goals: Goal[];
}

export default function ExportData({ activities, goals }: ExportDataProps) {
  const { toast } = useToast();
  const [exportConfig, setExportConfig] = useState({
    format: 'csv',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: getTodayDateString(),
    includeActivities: true,
    includeGoals: true,
    includeNotes: true,
    categories: [] as string[]
  });

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      // Filter activities by date range and categories
      const filteredActivities = activities.filter(activity => {
        const activityDate = activity.date;
        const inDateRange = activityDate >= exportConfig.startDate && activityDate <= exportConfig.endDate;
        const inCategories = exportConfig.categories.length === 0 || exportConfig.categories.includes(activity.category);
        return inDateRange && inCategories;
      });

      const filteredGoals = exportConfig.includeGoals ? goals : [];

      if (exportConfig.format === 'csv') {
        // Generate and download CSV directly on client side
        downloadCSV(filteredActivities, filteredGoals);
      } else {
        // Generate and download JSON
        downloadJSON(filteredActivities, filteredGoals);
      }

      toast({
        title: "Export Successful!",
        description: `Data exported as ${exportConfig.format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const downloadCSV = (activitiesData: Activity[], goalsData: Goal[]) => {
    // Generate CSV content
    let csvContent = '';
    
    if (exportConfig.includeActivities && activitiesData.length > 0) {
      csvContent += 'ACTIVITIES\n';
      csvContent += 'Date,Title,Category,Duration (min),Start Time,End Time,Description,Notes\n';
      
      activitiesData.forEach(activity => {
        const row = [
          activity.date,
          `"${activity.title.replace(/"/g, '""')}"`,
          activity.category,
          activity.duration,
          activity.startTime || '',
          activity.endTime || '',
          `"${(activity.description || '').replace(/"/g, '""')}"`,
          exportConfig.includeNotes ? `"${(activity.notes || '').replace(/"/g, '""')}"` : ''
        ].join(',');
        csvContent += row + '\n';
      });
      csvContent += '\n';
    }

    if (exportConfig.includeGoals && goalsData.length > 0) {
      csvContent += 'GOALS\n';
      csvContent += 'Title,Category,Target (min),Type,Progress (%),Description,Created Date\n';
      
      goalsData.forEach(goal => {
        const row = [
          `"${goal.title.replace(/"/g, '""')}"`,
          goal.category,
          goal.targetMinutes,
          goal.type,
          goal.progress,
          `"${(goal.description || '').replace(/"/g, '""')}"`,
          new Date(goal.createdAt).toLocaleDateString()
        ].join(',');
        csvContent += row + '\n';
      });
    }

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `activity_data_${exportConfig.startDate}_to_${exportConfig.endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadJSON = (activitiesData: Activity[], goalsData: Goal[]) => {
    const exportData = {
      activities: activitiesData,
      goals: goalsData,
      period: {
        startDate: exportConfig.startDate,
        endDate: exportConfig.endDate
      },
      exportedAt: new Date().toISOString(),
      summary: {
        totalActivities: activitiesData.length,
        totalTime: activitiesData.reduce((sum, act) => sum + act.duration, 0),
        categoryBreakdown: activitiesData.reduce((acc, act) => {
          acc[act.category] = (acc[act.category] || 0) + act.duration;
          return acc;
        }, {} as Record<string, number>),
        goalsCount: goalsData.length
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `activity_data_${exportConfig.startDate}_to_${exportConfig.endDate}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getPreviewStats = () => {
    const filteredActivities = activities.filter(activity => {
      const activityDate = activity.date;
      const inDateRange = activityDate >= exportConfig.startDate && activityDate <= exportConfig.endDate;
      const inCategories = exportConfig.categories.length === 0 || exportConfig.categories.includes(activity.category);
      return inDateRange && inCategories;
    });

    return {
      activitiesCount: filteredActivities.length,
      totalTime: filteredActivities.reduce((sum, act) => sum + act.duration, 0),
      goalsCount: exportConfig.includeGoals ? goals.length : 0
    };
  };

  const stats = getPreviewStats();

  // Get unique categories from activities
  const availableCategories = Array.from(new Set(activities.map(activity => activity.category)));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Export Data</h2>
        <p className="text-muted-foreground">Export your activity data for backup or analysis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Export Settings
            </CardTitle>
            <CardDescription>Configure what data to export and in which format</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Format Selection */}
            <div className="space-y-2">
              <Label>Export Format</Label>
              <Select value={exportConfig.format} onValueChange={(value) => setExportConfig(prev => ({ ...prev, format: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV (Spreadsheet)</SelectItem>
                  <SelectItem value="json">JSON (Data)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={exportConfig.startDate}
                  onChange={(e) => setExportConfig(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={exportConfig.endDate}
                  onChange={(e) => setExportConfig(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            {/* Data Inclusion */}
            <div className="space-y-3">
              <Label>Include Data</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeActivities"
                    checked={exportConfig.includeActivities}
                    onCheckedChange={(checked) => setExportConfig(prev => ({ ...prev, includeActivities: checked as boolean }))}
                  />
                  <Label htmlFor="includeActivities">Activities</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeGoals"
                    checked={exportConfig.includeGoals}
                    onCheckedChange={(checked) => setExportConfig(prev => ({ ...prev, includeGoals: checked as boolean }))}
                  />
                  <Label htmlFor="includeGoals">Goals</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeNotes"
                    checked={exportConfig.includeNotes}
                    onCheckedChange={(checked) => setExportConfig(prev => ({ ...prev, includeNotes: checked as boolean }))}
                  />
                  <Label htmlFor="includeNotes">Notes & Reflections</Label>
                </div>
              </div>
            </div>

            {/* Category Filter */}
            {availableCategories.length > 0 && (
              <div className="space-y-2">
                <Label>Categories to Include (leave empty for all)</Label>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {availableCategories.map(category => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category}`}
                        checked={exportConfig.categories.includes(category)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setExportConfig(prev => ({ 
                              ...prev, 
                              categories: [...prev.categories, category] 
                            }));
                          } else {
                            setExportConfig(prev => ({ 
                              ...prev, 
                              categories: prev.categories.filter(c => c !== category) 
                            }));
                          }
                        }}
                      />
                      <Label htmlFor={`category-${category}`} className="text-sm">{category}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Export Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Export Preview
            </CardTitle>
            <CardDescription>Preview of what will be exported</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">Activities</span>
                </div>
                <span className="text-blue-600 font-bold">{stats.activitiesCount}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-green-600" />
                  <span className="font-medium">Total Time</span>
                </div>
                <span className="text-green-600 font-bold">{formatTime(stats.totalTime)}</span>
              </div>

              {exportConfig.includeGoals && (
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-purple-600" />
                    <span className="font-medium">Goals</span>
                  </div>
                  <span className="text-purple-600 font-bold">{stats.goalsCount}</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t">
              <div className="text-sm text-muted-foreground mb-2">
                <strong>Date Range:</strong> {exportConfig.startDate} to {exportConfig.endDate}
              </div>
              <div className="text-sm text-muted-foreground mb-4">
                <strong>Format:</strong> {exportConfig.format.toUpperCase()}
              </div>
              
              <Button 
                className="w-full" 
                onClick={handleExport}
                disabled={isExporting || (stats.activitiesCount === 0 && stats.goalsCount === 0)}
              >
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? 'Exporting...' : `Export ${exportConfig.format.toUpperCase()}`}
              </Button>
              
              {stats.activitiesCount === 0 && stats.goalsCount === 0 && (
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  No data available for the selected criteria
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}