'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Notification, AppSettings } from './types';
import { DEFAULT_APP_SETTINGS } from './mockData';
import { subscribeToAppSettings, updateAppSettings as updateSettingsInFirestore } from './services/settingsService';
import { subscribeToUserNotifications, markNotificationAsRead, sendAppNotification } from './services/notificationService';
import { useAuth } from './auth-context';

interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

interface AppContextValue {
  notifications: Notification[];
  unreadCount: number;
  markAllRead: () => void;
  markRead: (id: string) => void;
  addNotification: (n: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
  toasts: ToastItem[];
  showToast: (type: ToastItem['type'], title: string, message?: string) => void;
  dismissToast: (id: string) => void;
  selectedArea: string;
  setSelectedArea: (area: string) => void;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  isOnline: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [selectedArea, setSelectedArea] = useState('Sector 7');
  const [selectedCity, setSelectedCity] = useState('Bhilai');
  const [isOnline] = useState(true);

  // Real-time Settings subscription from Firestore
  useEffect(() => {
    const unsub = subscribeToAppSettings((liveSettings) => {
      setSettings(liveSettings);
    });
    return () => unsub();
  }, []);

  // Real-time Notifications subscription from Firestore
  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      return;
    }
    const isAdmin = user.role === 'admin';
    const unsub = subscribeToUserNotifications(user.id, (liveNotifs) => {
      setNotifications(liveNotifs);
    }, isAdmin);
    return () => unsub();
  }, [user?.id, user?.role]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markRead = useCallback((id: string) => {
    markNotificationAsRead(id).catch(() => {});
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    notifications.forEach(n => {
      if (!n.read) markNotificationAsRead(n.id).catch(() => {});
    });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, [notifications]);

  const addNotification = useCallback((n: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
    sendAppNotification(n).catch(() => {});
  }, []);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    updateSettingsInFirestore(partial).catch(() => {});
    setSettings(prev => ({ ...prev, ...partial }));
  }, []);

  const showToast = useCallback((type: ToastItem['type'], title: string, message?: string) => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <AppContext.Provider value={{
      notifications,
      unreadCount,
      markAllRead,
      markRead,
      addNotification,
      settings,
      updateSettings,
      toasts,
      showToast,
      dismissToast,
      selectedArea,
      setSelectedArea,
      selectedCity,
      setSelectedCity,
      isOnline,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
