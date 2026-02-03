'use client';

import { useState, useEffect } from 'react';
import { Heart, Star, Plus, Edit3, Save, X, Calendar, Smile, Frown, Meh, Laugh, Angry } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { DailyReflection } from '@/lib/types';
import { formatDate, getTodayDateString, generateId } from '@/lib/utils/date';

interface DailyReflectionProps {
  reflections: DailyReflection[];
  onReflectionSaved: (reflection: DailyReflection) => void;
}

const MOOD_OPTIONS = [
  { value: 1, label: 'Very Bad', icon: Angry, color: 'text-red-600', bgColor: 'bg-red-50' },
  { value: 2, label: 'Bad', icon: Frown, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  { value: 3, label: 'Okay', icon: Meh, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
  { value: 4, label: 'Good', icon: Smile, color: 'text-green-600', bgColor: 'bg-green-50' },
  { value: 5, label: 'Excellent', icon: Laugh, color: 'text-blue-600', bgColor: 'bg-blue-50' }
];

export default function DailyReflection({ reflections, onReflectionSaved }: DailyReflectionProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [formData, setFormData] = useState({
    mood: 3 as 1 | 2 | 3 | 4 | 5,
    notes: '',
    achievements: [''],
    improvements: ['']
  });

  // Get reflection for selected date
  const currentReflection = reflections.find(r => r.date === selectedDate);

  useEffect(() => {
    if (currentReflection) {
      setFormData({
        mood: currentReflection.mood,
        notes: currentReflection.notes,
        achievements: currentReflection.achievements.length > 0 ? currentReflection.achievements : [''],
        improvements: currentReflection.improvements.length > 0 ? currentReflection.improvements : ['']
      });
    } else {
      setFormData({
        mood: 3,
        notes: '',
        achievements: [''],
        improvements: ['']
      });
    }
  }, [currentReflection, selectedDate]);

  const handleSave = () => {
    const reflectionData: DailyReflection = {
      id: currentReflection?.id || generateId(),
      date: selectedDate,
      mood: formData.mood,
      notes: formData.notes,
      achievements: formData.achievements.filter(a => a.trim() !== ''),
      improvements: formData.improvements.filter(i => i.trim() !== ''),
      createdAt: currentReflection?.createdAt || new Date().toISOString()
    };

    onReflectionSaved(reflectionData);
    setIsEditing(false);
    
    toast({
      title: "Reflection Saved!",
      description: "Your daily reflection has been saved successfully.",
    });
  };

  const addAchievement = () => {
    setFormData(prev => ({
      ...prev,
      achievements: [...prev.achievements, '']
    }));
  };

  const addImprovement = () => {
    setFormData(prev => ({
      ...prev,
      improvements: [...prev.improvements, '']
    }));
  };

  const updateAchievement = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      achievements: prev.achievements.map((a, i) => i === index ? value : a)
    }));
  };

  const updateImprovement = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      improvements: prev.improvements.map((i, idx) => idx === index ? value : i)
    }));
  };

  const removeAchievement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      achievements: prev.achievements.filter((_, i) => i !== index)
    }));
  };

  const removeImprovement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      improvements: prev.improvements.filter((_, i) => i !== index)
    }));
  };

  const selectedMood = MOOD_OPTIONS.find(m => m.value === formData.mood);
  const MoodIcon = selectedMood?.icon || Meh;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Daily Reflection</h2>
          <p className="text-muted-foreground">Reflect on your day and track your personal growth</p>
        </div>
        
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border rounded-md"
          />
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              {currentReflection ? <Edit3 className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              {currentReflection ? 'Edit Reflection' : 'Add Reflection'}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Reflection Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mood Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                How was your day?
              </CardTitle>
              <CardDescription>Select your overall mood for {formatDate(selectedDate)}</CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="grid grid-cols-5 gap-3">
                  {MOOD_OPTIONS.map((mood) => {
                    const IconComponent = mood.icon;
                    return (
                      <button
                        key={mood.value}
                        onClick={() => setFormData(prev => ({ ...prev, mood: mood.value as any }))}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          formData.mood === mood.value
                            ? `border-current ${mood.color} ${mood.bgColor}`
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <IconComponent className={`w-8 h-8 mx-auto mb-2 ${
                          formData.mood === mood.value ? mood.color : 'text-gray-400'
                        }`} />
                        <div className={`text-sm font-medium ${
                          formData.mood === mood.value ? mood.color : 'text-gray-600'
                        }`}>
                          {mood.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${selectedMood?.bgColor}`}>
                    <MoodIcon className={`w-6 h-6 ${selectedMood?.color}`} />
                  </div>
                  <div>
                    <div className="font-medium">{selectedMood?.label}</div>
                    <div className="text-sm text-muted-foreground">Mood Rating: {formData.mood}/5</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Notes</CardTitle>
              <CardDescription>What happened today? How did you feel?</CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Write about your day, thoughts, feelings, or anything significant that happened..."
                  rows={6}
                />
              ) : (
                <div className="min-h-[100px] p-3 bg-gray-50 rounded-lg">
                  {formData.notes || (
                    <span className="text-muted-foreground italic">No notes for this day</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Achievements and Improvements */}
        <div className="space-y-6">
          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                Achievements
              </CardTitle>
              <CardDescription>What did you accomplish today?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isEditing ? (
                <div className="space-y-2">
                  {formData.achievements.map((achievement, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={achievement}
                        onChange={(e) => updateAchievement(index, e.target.value)}
                        placeholder="What did you achieve?"
                        className="flex-1 px-3 py-2 border rounded-md text-sm"
                      />
                      {formData.achievements.length > 1 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeAchievement(index)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button size="sm" variant="outline" onClick={addAchievement}>
                    <Plus className="w-3 h-3 mr-1" />
                    Add Achievement
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {formData.achievements.filter(a => a.trim()).length > 0 ? (
                    formData.achievements
                      .filter(a => a.trim())
                      .map((achievement, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm">{achievement}</span>
                        </div>
                      ))
                  ) : (
                    <span className="text-muted-foreground italic text-sm">No achievements recorded</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Areas for Improvement */}
          <Card>
            <CardHeader>
              <CardTitle>Areas for Improvement</CardTitle>
              <CardDescription>What could you do better tomorrow?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isEditing ? (
                <div className="space-y-2">
                  {formData.improvements.map((improvement, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={improvement}
                        onChange={(e) => updateImprovement(index, e.target.value)}
                        placeholder="What can be improved?"
                        className="flex-1 px-3 py-2 border rounded-md text-sm"
                      />
                      {formData.improvements.length > 1 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeImprovement(index)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button size="sm" variant="outline" onClick={addImprovement}>
                    <Plus className="w-3 h-3 mr-1" />
                    Add Improvement
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {formData.improvements.filter(i => i.trim()).length > 0 ? (
                    formData.improvements
                      .filter(i => i.trim())
                      .map((improvement, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                          </div>
                          <span className="text-sm">{improvement}</span>
                        </div>
                      ))
                  ) : (
                    <span className="text-muted-foreground italic text-sm">No improvements noted</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reflection Stats */}
          {reflections.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Reflection Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Reflections</span>
                  <Badge variant="outline">{reflections.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Average Mood</span>
                  <Badge variant="outline">
                    {(reflections.reduce((sum, r) => sum + r.mood, 0) / reflections.length).toFixed(1)}/5
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">This Month</span>
                  <Badge variant="outline">
                    {reflections.filter(r => {
                      const reflectionDate = new Date(r.date);
                      const now = new Date();
                      return reflectionDate.getMonth() === now.getMonth() && 
                             reflectionDate.getFullYear() === now.getFullYear();
                    }).length}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}