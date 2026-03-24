'use client';

import { useState } from 'react';
import { Bell, Plus, Edit3, Trash2, Clock, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { CATEGORIES } from '@/lib/constants';
import { Reminder } from '@/lib/types';
import { generateId } from '@/lib/utils/date';

interface ReminderManagerProps {
  reminders: Reminder[];
  onReminderSaved: (reminder: Reminder) => void;
  onReminderDeleted: (reminderId: string) => void;
}

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' }
];

export default function ReminderManager({ reminders, onReminderSaved, onReminderDeleted }: ReminderManagerProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    time: '',
    category: '',
    active: true,
    days: [] as string[]
  });

  const handleOpenDialog = (reminder?: Reminder) => {
    if (reminder) {
      setEditingReminder(reminder);
      setFormData({
        title: reminder.title,
        time: reminder.time,
        category: reminder.category,
        active: reminder.active,
        days: reminder.days
      });
    } else {
      setEditingReminder(null);
      setFormData({
        title: '',
        time: '',
        category: '',
        active: true,
        days: []
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.time || !formData.category) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (formData.days.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one day",
        variant: "destructive"
      });
      return;
    }

    const reminderData: Reminder = {
      id: editingReminder?.id || generateId(),
      title: formData.title,
      time: formData.time,
      category: formData.category,
      active: formData.active,
      days: formData.days,
      createdAt: editingReminder?.createdAt || new Date().toISOString()
    };

    try {
      onReminderSaved(reminderData);
      toast({
        title: "Success!",
        description: `Reminder ${editingReminder ? 'updated' : 'created'} successfully`,
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to save reminder:', error);
      toast({
        title: "Error",
        description: "Failed to save reminder. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (reminderId: string) => {
    if (confirm('Are you sure you want to delete this reminder?')) {
      try {
        onReminderDeleted(reminderId);
        toast({
          title: "Success!",
          description: "Reminder deleted successfully",
        });
      } catch (error) {
        console.error('Failed to delete reminder:', error);
        toast({
          title: "Error",
          description: "Failed to delete reminder. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const toggleReminderActive = (reminderId: string) => {
    const reminder = reminders.find(r => r.id === reminderId);
    if (reminder) {
      onReminderSaved({
        ...reminder,
        active: !reminder.active
      });
    }
  };

  const handleDayToggle = (day: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({ ...prev, days: [...prev.days, day] }));
    } else {
      setFormData(prev => ({ ...prev, days: prev.days.filter(d => d !== day) }));
    }
  };

  const formatDays = (days: string[]) => {
    if (days.length === 7) return 'Every day';
    if (days.length === 5 && !days.includes('saturday') && !days.includes('sunday')) {
      return 'Weekdays';
    }
    if (days.length === 2 && days.includes('saturday') && days.includes('sunday')) {
      return 'Weekends';
    }
    return days.map(day => day.charAt(0).toUpperCase() + day.slice(1, 3)).join(', ');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Reminders & Notifications</h2>
          <p className="text-muted-foreground">Set up reminders for your daily activities</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Reminder
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingReminder ? 'Edit Reminder' : 'Create New Reminder'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Reminder Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Morning Exercise, Take Vitamins"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="time">Time *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
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
              </div>

              <div className="space-y-3">
                <Label>Days of Week *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={day.value}
                        checked={formData.days.includes(day.value)}
                        onCheckedChange={(checked) => handleDayToggle(day.value, checked as boolean)}
                      />
                      <Label htmlFor={day.value} className="text-sm">{day.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                />
                <Label htmlFor="active">Active</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingReminder ? 'Update Reminder' : 'Create Reminder'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reminders List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reminders.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="text-center py-12">
              <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Reminders Set</h3>
              <p className="text-muted-foreground mb-4">
                Create reminders to help you stay on track with your daily activities.
              </p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Reminder
              </Button>
            </CardContent>
          </Card>
        ) : (
          reminders.map((reminder) => {
            const categoryConfig = CATEGORIES[reminder.category as keyof typeof CATEGORIES];
            const IconComponent = categoryConfig?.icon || Bell;

            return (
              <Card key={reminder.id} className={`relative ${!reminder.active ? 'opacity-60' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${categoryConfig?.bgColor || 'bg-gray-100'}`}>
                        <IconComponent className={`w-4 h-4 ${categoryConfig?.color || 'text-gray-600'}`} />
                      </div>
                      <div>
                        <CardTitle className="text-base leading-tight">{reminder.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3" />
                          {reminder.time}
                        </CardDescription>
                      </div>
                    </div>
                    
                    <Switch
                      checked={reminder.active}
                      onCheckedChange={() => toggleReminderActive(reminder.id)}
                    />
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {formatDays(reminder.days)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Category: {reminder.category}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleOpenDialog(reminder)}
                      className="flex-1"
                    >
                      <Edit3 className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleDelete(reminder.id)}
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

      {/* Browser Notification Permission */}
      {reminders.some(r => r.active) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Browser Notifications</CardTitle>
            <CardDescription>
              Enable browser notifications to receive reminders even when the app is not active
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => {
                if ('Notification' in window) {
                  Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                      toast({
                        title: "Success!",
                        description: "Browser notifications enabled",
                      });
                    }
                  });
                }
              }}
              disabled={typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'}
            >
              <Bell className="w-4 h-4 mr-2" />
              {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted' 
                ? 'Notifications Enabled' 
                : 'Enable Notifications'
              }
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
