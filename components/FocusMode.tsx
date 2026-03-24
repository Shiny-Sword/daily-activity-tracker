'use client';

import { useState, useEffect } from 'react';
import { Focus, Play, Pause, Square, RotateCcw, Settings, Volume2, VolumeX, Coffee, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Activity } from '@/lib/types';
import { formatTime, getCurrentTimeString, generateId } from '@/lib/utils/date';

interface FocusSession {
  id: string;
  type: 'work' | 'break';
  duration: number; // in minutes
  startTime: Date;
  isActive: boolean;
}

interface FocusModeProps {
  onActivitySaved: (activity: Activity) => void;
}

const POMODORO_PRESETS = {
  classic: { work: 25, shortBreak: 5, longBreak: 15, cycles: 4 },
  extended: { work: 50, shortBreak: 10, longBreak: 30, cycles: 3 },
  short: { work: 15, shortBreak: 3, longBreak: 10, cycles: 6 }
};

export default function FocusMode({ onActivitySaved }: FocusModeProps) {
  const { toast } = useToast();
  const [session, setSession] = useState<FocusSession | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const [settings, setSettings] = useState({
    preset: 'classic',
    workDuration: 25,
    shortBreak: 5,
    longBreak: 15,
    cycles: 4,
    autoStart: false,
    soundEnabled: true,
    category: 'Work'
  });

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (session?.isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [session?.isActive, timeLeft]);

  const startSession = (type: 'work' | 'break', duration: number) => {
    const newSession: FocusSession = {
      id: generateId(),
      type,
      duration,
      startTime: new Date(),
      isActive: true
    };

    setSession(newSession);
    setTimeLeft(duration * 60); // Convert to seconds

    toast({
      title: `${type === 'work' ? 'Focus' : 'Break'} Session Started!`,
      description: `${formatTime(duration)} session is now running.`,
    });
  };

  const pauseSession = () => {
    if (session) {
      setSession({ ...session, isActive: false });
    }
  };

  const resumeSession = () => {
    if (session) {
      setSession({ ...session, isActive: true });
    }
  };

  const stopSession = () => {
    if (session && session.type === 'work') {
      // Save work session as activity
      const actualDuration = Math.max(1, Math.floor((new Date().getTime() - session.startTime.getTime()) / 1000 / 60));
      
      const activity: Activity = {
        id: generateId(),
        title: `Focus Session`,
        description: `Pomodoro focus session`,
        category: settings.category as any,
        startTime: session.startTime.toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        endTime: getCurrentTimeString(),
        duration: actualDuration,
        date: new Date().toISOString().split('T')[0],
        notes: `Focus session using ${settings.preset} preset`,
        completed: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      onActivitySaved(activity);
    }

    setSession(null);
    setTimeLeft(0);
  };

  const handleSessionComplete = () => {
    if (!session) return;

    if (settings.soundEnabled) {
      // Play notification sound (browser notification sound)
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
      audio.play().catch(() => {});
    }

    if (session.type === 'work') {
      // Work session completed
      const newCycleCount = cycleCount + 1;
      setCycleCount(newCycleCount);

      // Save work session
      const activity: Activity = {
        id: generateId(),
        title: `Focus Session #${newCycleCount}`,
        description: `Completed Pomodoro focus session`,
        category: settings.category as any,
        startTime: session.startTime.toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        endTime: getCurrentTimeString(),
        duration: session.duration,
        date: new Date().toISOString().split('T')[0],
        notes: `Focus session #${newCycleCount} completed`,
        completed: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      onActivitySaved(activity);

      toast({
        title: "Focus Session Complete! 🎉",
        description: `Great job! Time for a ${newCycleCount % settings.cycles === 0 ? 'long' : 'short'} break.`,
      });

      // Auto-start break if enabled
      if (settings.autoStart) {
        const breakDuration = newCycleCount % settings.cycles === 0 ? settings.longBreak : settings.shortBreak;
        setTimeout(() => startSession('break', breakDuration), 1000);
      }
    } else {
      // Break completed
      toast({
        title: "Break Complete!",
        description: "Ready to start your next focus session?",
      });

      // Auto-start work session if enabled
      if (settings.autoStart) {
        setTimeout(() => startSession('work', settings.workDuration), 1000);
      }
    }

    setSession(null);
    setTimeLeft(0);
  };

  const resetCycle = () => {
    setCycleCount(0);
    setSession(null);
    setTimeLeft(0);
  };

  const formatTimeLeft = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    if (!session) return 0;
    const totalSeconds = session.duration * 60;
    return ((totalSeconds - timeLeft) / totalSeconds) * 100;
  };

  const preset = POMODORO_PRESETS[settings.preset as keyof typeof POMODORO_PRESETS];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Focus Mode</h2>
        <p className="text-muted-foreground">Use the Pomodoro Technique to boost productivity</p>
      </div>

      {/* Main Timer */}
      <Card className={`text-center ${session?.isActive ? 'ring-2 ring-blue-500' : ''}`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2">
            <Focus className="w-6 h-6" />
            {session ? (
              <span className="capitalize">
                {session.type} Session {session.type === 'work' ? `#${cycleCount + 1}` : ''}
              </span>
            ) : (
              'Ready to Focus'
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Timer Display */}
          <div className="space-y-4">
            <div className="text-6xl font-mono font-bold">
              {session ? formatTimeLeft(timeLeft) : formatTimeLeft(settings.workDuration * 60)}
            </div>
            
            {session && (
              <Progress value={getProgress()} className="h-3" />
            )}
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-2">
            {!session ? (
              <>
                <Button 
                  onClick={() => startSession('work', settings.workDuration)}
                  size="lg"
                  className="px-8"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Focus
                </Button>
                <Button 
                  onClick={() => startSession('break', settings.shortBreak)}
                  variant="outline"
                  size="lg"
                >
                  <Coffee className="w-5 h-5 mr-2" />
                  Quick Break
                </Button>
              </>
            ) : (
              <>
                {session.isActive ? (
                  <Button onClick={pauseSession} size="lg">
                    <Pause className="w-5 h-5 mr-2" />
                    Pause
                  </Button>
                ) : (
                  <Button onClick={resumeSession} size="lg">
                    <Play className="w-5 h-5 mr-2" />
                    Resume
                  </Button>
                )}
                <Button onClick={stopSession} variant="outline" size="lg">
                  <Square className="w-5 h-5 mr-2" />
                  Stop
                </Button>
              </>
            )}
          </div>

          {/* Cycle Progress */}
          <div className="flex justify-center items-center gap-4">
            <span className="text-sm text-muted-foreground">Cycle Progress:</span>
            <div className="flex gap-1">
              {Array.from({ length: settings.cycles }).map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full ${
                    index < cycleCount ? 'bg-green-500' : 
                    index === cycleCount && session?.type === 'work' ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <Button onClick={resetCycle} variant="ghost" size="sm">
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Focus Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Preset</Label>
              <Select 
                value={settings.preset} 
                onValueChange={(value) => {
                  const newPreset = POMODORO_PRESETS[value as keyof typeof POMODORO_PRESETS];
                  setSettings(prev => ({
                    ...prev,
                    preset: value,
                    workDuration: newPreset.work,
                    shortBreak: newPreset.shortBreak,
                    longBreak: newPreset.longBreak,
                    cycles: newPreset.cycles
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="classic">Classic (25/5/15)</SelectItem>
                  <SelectItem value="extended">Extended (50/10/30)</SelectItem>
                  <SelectItem value="short">Short (15/3/10)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select 
                value={settings.category} 
                onValueChange={(value) => setSettings(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Work">Work</SelectItem>
                  <SelectItem value="Learning">Learning</SelectItem>
                  <SelectItem value="Personal">Personal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Work (min)</Label>
              <Input
                type="number"
                value={settings.workDuration}
                onChange={(e) => setSettings(prev => ({ ...prev, workDuration: parseInt(e.target.value) || 25 }))}
                min="1"
                max="120"
              />
            </div>
            <div className="space-y-2">
              <Label>Short Break (min)</Label>
              <Input
                type="number"
                value={settings.shortBreak}
                onChange={(e) => setSettings(prev => ({ ...prev, shortBreak: parseInt(e.target.value) || 5 }))}
                min="1"
                max="30"
              />
            </div>
            <div className="space-y-2">
              <Label>Long Break (min)</Label>
              <Input
                type="number"
                value={settings.longBreak}
                onChange={(e) => setSettings(prev => ({ ...prev, longBreak: parseInt(e.target.value) || 15 }))}
                min="1"
                max="60"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-start sessions</Label>
              <p className="text-sm text-muted-foreground">Automatically start the next session</p>
            </div>
            <Switch
              checked={settings.autoStart}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoStart: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Sound notifications</Label>
              <p className="text-sm text-muted-foreground">Play sound when sessions complete</p>
            </div>
            <Switch
              checked={settings.soundEnabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, soundEnabled: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Today's Focus Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Today's Focus Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{cycleCount}</div>
              <div className="text-sm text-muted-foreground">Sessions Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {formatTime(cycleCount * settings.workDuration)}
              </div>
              <div className="text-sm text-muted-foreground">Focus Time</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {Math.round((cycleCount / settings.cycles) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Cycle Progress</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
