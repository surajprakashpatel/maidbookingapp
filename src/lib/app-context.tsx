'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Notification, AppSettings } from './types';
import { MOCK_NOTIFICATIONS, DEFAULT_APP_SETTINGS } from './mockData';

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
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [selectedArea, setSelectedArea] = useState('Sector 7');
  const [selectedCity, setSelectedCity] = useState('Bhilai');
  const [isOnline] = useState(true);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const addNotification = useCallback((n: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
    const newN: Notification = {
      ...n,
      id: `notif-${Date.now()}`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => [newN, ...prev]);
  }, []);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
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
