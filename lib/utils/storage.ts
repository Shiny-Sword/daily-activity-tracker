// Local storage utilities for data persistence
export class StorageManager {
  private static isClient = typeof window !== 'undefined';

  static get<T>(key: string, defaultValue: T): T {
    if (!this.isClient) return defaultValue;
    
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error getting ${key} from localStorage:`, error);
      return defaultValue;
    }
  }

  static set<T>(key: string, value: T): void {
    if (!this.isClient) return;
    
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting ${key} in localStorage:`, error);
    }
  }

  static remove(key: string): void {
    if (!this.isClient) return;
    
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error);
    }
  }

  static clear(): void {
    if (!this.isClient) return;
    
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
}

// Storage keys
export const STORAGE_KEYS = {
  ACTIVITIES: 'daily_tracker_activities',
  GOALS: 'daily_tracker_goals', 
  REMINDERS: 'daily_tracker_reminders',
  REFLECTIONS: 'daily_tracker_reflections',
  USER_PREFERENCES: 'daily_tracker_preferences'
};