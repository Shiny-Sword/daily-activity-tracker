// Core types based on BRD requirements
export interface Activity {
  id: string;
  title: string;
  description: string;
  category: 'Health' | 'Work' | 'Learning' | 'Family' | 'Personal' | 'Social' | 'Others';
  startTime?: string; // ISO string
  endTime?: string; // ISO string
  duration: number; // in minutes
  date: string; // ISO date string
  notes: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  title: string;
  category: string;
  targetMinutes: number; // daily target in minutes
  type: 'daily' | 'weekly' | 'monthly';
  progress: number;
  deadline?: string; // ISO date string
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Reminder {
  id: string;
  title: string;
  time: string; // HH:MM format
  category: string;
  active: boolean;
  days: string[]; // ['monday', 'tuesday', etc.]
  createdAt: string;
}

export interface DailyReflection {
  id: string;
  date: string; // ISO date string
  mood: 1 | 2 | 3 | 4 | 5;
  notes: string;
  achievements: string[];
  improvements: string[];
  createdAt: string;
}

export interface CategoryConfig {
  name: string;
  icon: any;
  color: string;
  bgColor: string;
  sampleActivities: string[];
}

export interface TimeEntry {
  start: Date;
  end?: Date;
  isRunning: boolean;
}

export interface ExportData {
  activities: Activity[];
  goals: Goal[];
  period: {
    start: string;
    end: string;
  };
  summary: {
    totalActivities: number;
    totalTime: number;
    categoryBreakdown: Record<string, number>;
    goalCompletion: number;
  };
}