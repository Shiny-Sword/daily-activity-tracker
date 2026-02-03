import { 
  Heart, Briefcase, BookOpen, Users, Coffee, MessageCircle, MoreHorizontal 
} from 'lucide-react';
import { CategoryConfig } from './types';

// Category configurations based on BRD specifications
export const CATEGORIES: Record<string, CategoryConfig> = {
  Health: {
    name: 'Health',
    icon: Heart,
    color: 'text-red-600',
    bgColor: 'bg-red-50 hover:bg-red-100',
    sampleActivities: ['Gym', 'Yoga', 'Morning Walk', 'Water Intake', 'Meditation']
  },
  Work: {
    name: 'Work',
    icon: Briefcase,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100',
    sampleActivities: ['Coding', 'Meetings', 'Documentation', 'Planning']
  },
  Learning: {
    name: 'Learning',
    icon: BookOpen,
    color: 'text-green-600',
    bgColor: 'bg-green-50 hover:bg-green-100',
    sampleActivities: ['Reading', 'Courses', 'Tutorials', 'Side Projects']
  },
  Family: {
    name: 'Family',
    icon: Users,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 hover:bg-purple-100',
    sampleActivities: ['Family Time', 'Talking with Parents', 'Outings']
  },
  Personal: {
    name: 'Personal',
    icon: Coffee,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 hover:bg-orange-100',
    sampleActivities: ['Journaling', 'Music', 'Relaxation', 'Self-care']
  },
  Social: {
    name: 'Social',
    icon: MessageCircle,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 hover:bg-pink-100',
    sampleActivities: ['Calls', 'Meetups', 'Events', 'Social Media']
  },
  Others: {
    name: 'Others',
    icon: MoreHorizontal,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 hover:bg-gray-100',
    sampleActivities: ['Groceries', 'Banking', 'Travel', 'House Chores']
  }
};

export const TIME_FORMATS = {
  SHORT: 'HH:mm',
  LONG: 'HH:mm:ss',
  DATE: 'yyyy-MM-dd',
  DATETIME: 'yyyy-MM-dd HH:mm:ss'
};

export const GOAL_TYPES = [
  { value: 'daily', label: 'Daily Goal' },
  { value: 'weekly', label: 'Weekly Goal' },
  { value: 'monthly', label: 'Monthly Goal' }
];

export const DEFAULT_GOALS = [
  { category: 'Health', title: '1 hour exercise daily', targetMinutes: 60, type: 'daily' as const },
  { category: 'Learning', title: '2 hours learning daily', targetMinutes: 120, type: 'daily' as const },
  { category: 'Work', title: '8 hours work daily', targetMinutes: 480, type: 'daily' as const },
  { category: 'Family', title: '1 hour family time daily', targetMinutes: 60, type: 'daily' as const }
];