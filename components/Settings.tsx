"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { StorageManager, STORAGE_KEYS } from "@/lib/utils/storage";

const defaultSettings = {
  name: "Mahendra Mahajan",
  email: "mahendramahajan3492@gmail.com",
  timezone: "Asia/Kolkata",
  dateFormat: "DD/MM/YYYY",
  timeFormat: "24h",
  theme: "system",
  notifications: {
    enabled: true,
    sound: true,
    desktop: true,
    email: false,
  },
  privacy: {
    analytics: true,
    dataSharing: false,
  },
  backup: {
    autoBackup: true,
    frequency: "weekly",
  },
};

type UserSettingsContextType = {
  settings: typeof defaultSettings;
  setSettings: React.Dispatch<React.SetStateAction<typeof defaultSettings>>;
};
const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined);

export function UserSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState(() =>
    StorageManager.get(STORAGE_KEYS.USER_PREFERENCES, defaultSettings)
  );

  useEffect(() => {
    StorageManager.set(STORAGE_KEYS.USER_PREFERENCES, settings);
  }, [settings]);

  return (
    <UserSettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </UserSettingsContext.Provider>
  );
}

export function useUserSettings() {
  const context = useContext(UserSettingsContext);
  if (!context) {
    throw new Error('useUserSettings must be used within a UserSettingsProvider');
  }
  return context;
}

export function Settings() {
  const { settings, setSettings } = useUserSettings();
  const [isLoading, setIsLoading] = useState(false);

  // Save handler
  const handleSave = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      alert('Settings Saved!');
    }, 500);
  };

  // Reset handler
  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      setSettings(defaultSettings);
      alert('Settings Reset to default!');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Settings & Preferences</h2>
          <p className="text-muted-foreground">
            Customize your activity tracker experience
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleReset} disabled={isLoading} style={{ border: '1px solid #ccc', padding: '6px 12px', borderRadius: 4 }}>Reset</button>
          <button onClick={handleSave} disabled={isLoading} style={{ background: '#6366f1', color: '#fff', padding: '6px 12px', borderRadius: 4 }}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
      <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 24, marginTop: 16 }}>
        <h3 className="font-semibold mb-2">Profile Information</h3>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <div>
            <label>Full Name</label><br />
            <input
              value={settings.name}
              onChange={e => setSettings((s: typeof settings) => ({ ...s, name: e.target.value }))}
              style={{ padding: 4, border: '1px solid #ccc', borderRadius: 4 }}
            />
          </div>
          <div>
            <label>Email Address</label><br />
            <input
              value={settings.email}
              onChange={e => setSettings((s: typeof settings) => ({ ...s, email: e.target.value }))}
              style={{ padding: 4, border: '1px solid #ccc', borderRadius: 4 }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div>
            <label>Timezone</label><br />
            <select
              value={settings.timezone}
              onChange={e => setSettings((s: typeof settings) => ({ ...s, timezone: e.target.value }))}
              style={{ padding: 4, border: '1px solid #ccc', borderRadius: 4 }}
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
              <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
            </select>
          </div>
          <div>
            <label>Date Format</label><br />
            <select
              value={settings.dateFormat}
              onChange={e => setSettings((s: typeof settings) => ({ ...s, dateFormat: e.target.value }))}
              style={{ padding: 4, border: '1px solid #ccc', borderRadius: 4 }}
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
          <div>
            <label>Time Format</label><br />
            <select
              value={settings.timeFormat}
              onChange={e => setSettings((s: typeof settings) => ({ ...s, timeFormat: e.target.value as '12h' | '24h' }))}
              style={{ padding: 4, border: '1px solid #ccc', borderRadius: 4 }}
            >
              <option value="12h">12 Hour (AM/PM)</option>
              <option value="24h">24 Hour</option>
            </select>
          </div>
        </div>
      </div>
      {/* Add more sections for appearance, notifications, privacy, backup, etc. as needed */}
    </div>
  );
}
