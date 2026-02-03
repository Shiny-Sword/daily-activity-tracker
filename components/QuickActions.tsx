'use client';

import { useState } from 'react';
import { Zap, Play, Pause, Square, Clock, Target, Plus, Coffee, Heart, BookOpen } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Activity } from '@/lib/types';
import { formatTime, getCurrentTimeString, generateId } from '@/lib/utils/date';

interface QuickAction {
  id: string;
  title: string;
  category: string;
  icon: any;
  color: string;
  bgColor: string;
  estimatedDuration: number;
}

interface QuickActionsProps {
  onActivitySaved: (activity: Activity) => void;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'quick-exercise',
    title: '15min Exercise',
    category: 'Health',
    icon: Heart,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    estimatedDuration: 15
  },
  {
    id: 'quick-reading',
    title: '20min Reading',
    category: 'Learning',
    icon: BookOpen,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    estimatedDuration: 20
  },
  {
    id: 'quick-break',
    title: '10min Break',
    category: 'Personal',
    icon: Coffee,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    estimatedDuration: 10
  },
  {
    id: 'quick-meditation',
    title: '5min Meditation',
    category: 'Health',
    icon: Target,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    estimatedDuration: 5
  }
];

export default function QuickActions({ onActivitySaved }: QuickActionsProps) {
  const { toast } = useToast();
  const [activeTimer, setActiveTimer] = useState<{
    actionId: string;
    startTime: Date;
    duration: number;
  } | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Update elapsed time every second
  useState(() => {
    if (activeTimer) {
      const interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - activeTimer.startTime.getTime()) / 1000 / 60);
        setElapsedTime(elapsed);
      }, 1000);

      return () => clearInterval(interval);
    }
  });

  const startQuickAction = (action: QuickAction) => {
    if (activeTimer) {
      toast({
        title: "Timer Already Running",
        description: "Please stop the current timer before starting a new one.",
        variant: "destructive"
      });
      return;
    }

    setActiveTimer({
      actionId: action.id,
      startTime: new Date(),
      duration: action.estimatedDuration
    });

    setElapsedTime(0);

    toast({
      title: "Timer Started!",
      description: `${action.title} timer is now running.`,
    });
  };

  const stopTimer = (completed: boolean = true) => {
    if (!activeTimer) return;

    const action = QUICK_ACTIONS.find(a => a.id === activeTimer.actionId);
    if (!action) return;

    const endTime = new Date();
    const actualDuration = Math.max(1, Math.floor((endTime.getTime() - activeTimer.startTime.getTime()) / 1000 / 60));

    if (completed) {
      // Save as completed activity
      const activity: Activity = {
        id: generateId(),
        title: action.title,
        description: `Quick action completed`,
        category: action.category as any,
        startTime: activeTimer.startTime.toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        endTime: getCurrentTimeString(),
        duration: actualDuration,
        date: new Date().toISOString().split('T')[0],
        notes: `Completed via Quick Actions`,
        completed: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      onActivitySaved(activity);

      toast({
        title: "Activity Completed!",
        description: `${action.title} logged successfully (${formatTime(actualDuration)})`,
      });
    } else {
      toast({
        title: "Timer Stopped",
        description: "Activity was not saved.",
      });
    }

    setActiveTimer(null);
    setElapsedTime(0);
  };

  const activeAction = activeTimer ? QUICK_ACTIONS.find(a => a.id === activeTimer.actionId) : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Quick Actions</h2>
        <p className="text-muted-foreground">Start common activities with one click</p>
      </div>

      {/* Active Timer */}
      {activeTimer && activeAction && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${activeAction.bgColor}`}>
                  <activeAction.icon className={`w-5 h-5 ${activeAction.color}`} />
                </div>
                <span>{activeAction.title} - Running</span>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Badge variant="outline" className="bg-white">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatTime(elapsedTime)}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button 
                onClick={() => stopTimer(true)}
                className="flex-1"
              >
                <Square className="w-4 h-4 mr-2" />
                Complete & Save
              </Button>
              <Button 
                variant="outline" 
                onClick={() => stopTimer(false)}
                className="flex-1"
              >
                <Pause className="w-4 h-4 mr-2" />
                Stop Timer
              </Button>
            </div>
            
            <div className="mt-3 text-sm text-muted-foreground">
              Target: {formatTime(activeTimer.duration)} • 
              Elapsed: {formatTime(elapsedTime)} • 
              {elapsedTime >= activeTimer.duration ? (
                <span className="text-green-600 font-medium">Target Reached! 🎉</span>
              ) : (
                <span>Remaining: {formatTime(Math.max(0, activeTimer.duration - elapsedTime))}</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {QUICK_ACTIONS.map(action => {
          const IconComponent = action.icon;
          const isActive = activeTimer?.actionId === action.id;
          
          return (
            <Card 
              key={action.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                isActive ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              } ${activeTimer && !isActive ? 'opacity-50' : ''}`}
            >
              <CardContent className="p-6 text-center">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${action.bgColor} flex items-center justify-center`}>
                  <IconComponent className={`w-8 h-8 ${action.color}`} />
                </div>
                
                <h3 className="font-semibold mb-2">{action.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {action.category} • {formatTime(action.estimatedDuration)}
                </p>
                
                <Button 
                  onClick={() => startQuickAction(action)}
                  disabled={!!activeTimer}
                  className="w-full"
                  variant={isActive ? "default" : "outline"}
                >
                  {isActive ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Start
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Custom Quick Action */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create Custom Quick Action
          </CardTitle>
          <CardDescription>
            Add your own frequently used activities for quick access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Custom Action
          </Button>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Quick Actions Today
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">0</div>
              <div className="text-sm text-muted-foreground">Actions Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">0m</div>
              <div className="text-sm text-muted-foreground">Time Saved</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}