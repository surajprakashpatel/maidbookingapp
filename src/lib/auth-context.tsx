'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { UserRole, User } from './types';

// ============================================================
// MOCK USERS FOR DEMO
// ============================================================

const MOCK_USERS: Record<string, { user: User; password: string }> = {
  customer: {
    password: 'demo',
    user: {
      id: 'cust-1',
      role: 'customer',
      name: 'Rahul Gupta',
      phone: '9876500001',
      email: 'rahul.gupta@gmail.com',
      photoUrl: 'https://i.pravatar.cc/300?img=11',
      location: 'Bhilai',
      area: 'Sector 7',
      address: 'House No. 42, Sector 7, Bhilai',
      status: 'active',
      createdAt: '2024-01-10T10:00:00Z',
    },
  },
  maid: {
    password: 'demo',
    user: {
      id: 'user-m1',
      role: 'maid',
      name: 'Sunita Verma',
      phone: '9876543210',
      email: 'sunita.verma@gmail.com',
      photoUrl: 'https://i.pravatar.cc/300?img=47',
      location: 'Bhilai',
      area: 'Nehru Nagar',
      status: 'active',
      createdAt: '2024-01-15T10:00:00Z',
    },
  },
  admin: {
    password: 'demo',
    user: {
      id: 'admin-1',
      role: 'admin',
      name: 'Admin User',
      phone: '9000000001',
      email: 'admin@maideasy.in',
      status: 'active',
      createdAt: '2023-01-01T10:00:00Z',
    },
  },
};

const STORAGE_KEY = 'maideasy_auth_user';

// ============================================================
// AUTH CONTEXT
// ============================================================

interface AuthContextValue {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  login: (role: UserRole, phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  adminLogin: (emailOrPhone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (role: UserRole) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  signup: (role: UserRole, name: string, phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  updateUser: (updates: Partial<User>) => void;
  switchRole: (role: UserRole) => void; // Demo only
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id && parsed.role) return parsed;
      }
    } catch {
      // Ignore
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(false);

  // Save session state
  const saveUserSession = useCallback((u: User | null) => {
    setUser(u);
    try {
      if (u) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const login = useCallback(async (
    role: UserRole,
    phone: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 800)); // Simulate API call

    const mockEntry = MOCK_USERS[role];
    if (!mockEntry) {
      setIsLoading(false);
      return { success: false, error: 'Invalid role' };
    }

    // For demo: any phone works with password "demo"
    if (password === 'demo' || password === 'admin123' || phone === mockEntry.user.phone) {
      saveUserSession(mockEntry.user);
      setIsLoading(false);
      return { success: true };
    }

    setIsLoading(false);
    return { success: false, error: 'Invalid email or password.' };
  }, [saveUserSession]);

  const adminLogin = useCallback(async (
    emailOrPhone: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 800)); // Simulate API call

    const trimmedInput = emailOrPhone.trim().toLowerCase();

    // Check if customer or maid credentials were supplied
    const customerEntry = MOCK_USERS.customer;
    const maidEntry = MOCK_USERS.maid;

    if (
      trimmedInput === customerEntry.user.email?.toLowerCase() ||
      trimmedInput === customerEntry.user.phone
    ) {
      setIsLoading(false);
      return { success: false, error: "You don't have permission to access the admin panel." };
    }

    if (
      trimmedInput === maidEntry.user.email?.toLowerCase() ||
      trimmedInput === maidEntry.user.phone
    ) {
      setIsLoading(false);
      return { success: false, error: "You don't have permission to access the admin panel." };
    }

    const adminEntry = MOCK_USERS.admin;

    // Check valid admin credentials
    const isMatchInput =
      trimmedInput === adminEntry.user.email?.toLowerCase() ||
      trimmedInput === adminEntry.user.phone ||
      trimmedInput === 'admin' ||
      trimmedInput === 'admin@maideasy.in';

    const isMatchPass = password === 'demo' || password === 'admin123' || password === 'admin';

    if (isMatchInput && isMatchPass) {
      saveUserSession(adminEntry.user);
      setIsLoading(false);
      return { success: true };
    }

    setIsLoading(false);
    return { success: false, error: 'Invalid email or password.' };
  }, [saveUserSession]);

  const loginWithGoogle = useCallback(async (
    role: UserRole
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    const mockEntry = MOCK_USERS[role];
    if (mockEntry) {
      const gUser = { ...mockEntry.user, name: mockEntry.user.name + ' (Google)' };
      saveUserSession(gUser);
    }
    setIsLoading(false);
    return { success: true };
  }, [saveUserSession]);

  const signup = useCallback(async (
    role: UserRole,
    name: string,
    phone: string,
    password?: string
  ): Promise<{ success: boolean; error?: string }> => {
    void password;
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 800));

    const newUser: User = {
      id: `new-${Date.now()}`,
      role,
      name,
      phone,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    saveUserSession(newUser);
    setIsLoading(false);
    return { success: true };
  }, [saveUserSession]);

  const logout = useCallback(() => {
    saveUserSession(null);
  }, [saveUserSession]);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(prev => {
      const updated = prev ? { ...prev, ...updates } : null;
      try {
        if (updated) localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        else localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore
      }
      return updated;
    });
  }, []);

  // Demo helper: quickly switch between roles
  const switchRole = useCallback((role: UserRole) => {
    const mockEntry = MOCK_USERS[role];
    if (mockEntry) saveUserSession(mockEntry.user);
  }, [saveUserSession]);

  return (
    <AuthContext.Provider value={{
      user,
      role: user?.role ?? null,
      isAuthenticated: !!user,
      isLoading,
      isInitializing: false,
      login,
      adminLogin,
      loginWithGoogle,
      logout,
      signup,
      updateUser,
      switchRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
