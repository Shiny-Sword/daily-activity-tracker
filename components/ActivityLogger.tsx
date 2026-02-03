'use client';

import { useState, useEffect } from 'react';
import { Plus, Clock, Play, Pause, Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CATEGORIES } from '@/lib/constants';
import { Activity, TimeEntry } from '@/lib/types';
import { formatTime, getCurrentTimeString, calculateDuration, generateId } from '@/lib/utils/date';

interface ActivityLoggerProps {
  onActivitySaved: (activity: Activity) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ActivityLogger({ onActivitySaved, isOpen, onOpenChange }: ActivityLoggerProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    startTime: '',
    endTime: '',
    duration: 0,
    notes: ''
  });

  const [timeEntry, setTimeEntry] = useState<TimeEntry>({
    start: new Date(),
    end: undefined,
    isRunning: false
  });

  const [selectedSample, setSelectedSample] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timer for live tracking
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (timeEntry.isRunning) {
      interval = setInterval(() => {
        const now = new Date();
        const duration = Math.round((now.getTime() - timeEntry.start.getTime()) / (1000 * 60));
        setFormData(prev => ({ ...prev, duration }));
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [timeEntry.isRunning, timeEntry.start]);

  const handleStartTimer = () => {
    const now = new Date();
    setTimeEntry({
      start: now,
      end: undefined,
      isRunning: true
    });
    setFormData(prev => ({
      ...prev,
      startTime: getCurrentTimeString(),
      duration: 0
    }));
  };

  const handleStopTimer = () => {
    const now = new Date();
    const duration = Math.round((now.getTime() - timeEntry.start.getTime()) / (1000 * 60));
    
    setTimeEntry(prev => ({
      ...prev,
      end: now,
      isRunning: false
    }));
    
    setFormData(prev => ({
      ...prev,
      endTime: getCurrentTimeString(),
      duration
    }));
  };

  const handleManualTimeChange = () => {
    if (formData.startTime && formData.endTime) {
      const duration = calculateDuration(formData.startTime, formData.endTime);
      setFormData(prev => ({ ...prev, duration }));
    }
  };

  const handleSampleSelect = (sample: string) => {
    setSelectedSample(sample);
    if (!formData.title) {
      setFormData(prev => ({ ...prev, title: sample }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.category) {
      toast({
        title: "Validation Error",
        description: "Please fill in title and category",
        variant: "destructive"
      });
      return;
    }

    if (formData.duration <= 0) {
      toast({
        title: "Validation Error", 
        description: "Duration must be greater than 0 minutes",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    // Stop timer if running
    if (timeEntry.isRunning) {
      handleStopTimer();
    }

    const activity: Activity = {
      id: generateId(),
      title: formData.title,
      description: formData.description,
      category: formData.category as any,
      startTime: formData.startTime || undefined,
      endTime: formData.endTime || undefined,
      duration: formData.duration,
      date: new Date().toISOString().split('T')[0],
      notes: formData.notes,
      completed: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      // Since we're using client-side storage, we don't need the API call
      // Just save directly and show success
      onActivitySaved(activity);
      
      toast({
        title: "Success!",
        description: "Activity logged successfully",
      });
      
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save activity:', error);
      toast({
        title: "Error",
        description: "Failed to save activity. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      startTime: '',
      endTime: '',
      duration: 0,
      notes: ''
    });
    setTimeEntry({
      start: new Date(),
      end: undefined,
      isRunning: false
    });
    setSelectedSample('');
  };

  const selectedCategory = formData.category ? CATEGORIES[formData.category] : null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          <Plus className="w-4 h-4 mr-2" />
          Log Activity
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Log New Activity
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Selection */}
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

          {/* Sample Activities */}
          {selectedCategory && (
            <div className="space-y-2">
              <Label>Quick Select (Sample Activities)</Label>
              <div className="flex flex-wrap gap-2">
                {selectedCategory.sampleActivities.map((sample) => (
                  <Badge
                    key={sample}
                    variant={selectedSample === sample ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => handleSampleSelect(sample)}
                  >
                    {sample}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Activity Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Activity Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Morning Walk, Client Meeting"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description (optional)"
            />
          </div>

          {/* Time Tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Time Tracking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Live Timer */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span className="font-semibold">
                    {timeEntry.isRunning ? 'Running: ' : 'Duration: '}
                    {formatTime(formData.duration)}
                  </span>
                </div>
                <div className="flex gap-2">
                  {!timeEntry.isRunning ? (
                    <Button type="button" onClick={handleStartTimer} size="sm">
                      <Play className="w-4 h-4 mr-1" />
                      Start
                    </Button>
                  ) : (
                    <Button type="button" onClick={handleStopTimer} size="sm" variant="destructive">
                      <Pause className="w-4 h-4 mr-1" />
                      Stop
                    </Button>
                  )}
                </div>
              </div>

              {/* Manual Time Entry */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    onBlur={handleManualTimeChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    onBlur={handleManualTimeChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (min)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                    min="0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes & Reflection</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="How did it go? Any thoughts or reflections..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="w-4 h-4 mr-1" />
              {isSubmitting ? 'Saving...' : 'Save Activity'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}