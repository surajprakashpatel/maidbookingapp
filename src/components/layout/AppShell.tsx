'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { MobileNav, Sidebar } from './Navigation';
import { Header } from './Header';
import { UserRole } from '@/lib/types';
import { useEffect } from 'react';
import { motion } from 'framer-motion';

interface AppShellProps {
  children: React.ReactNode;
  role: UserRole;
  headerProps?: {
    title?: string;
    showBack?: boolean;
    showLocation?: boolean;
    showSearch?: boolean;
    showNotifications?: boolean;
    actions?: React.ReactNode;
  };
  hideNav?: boolean;
}

export function AppShell({ children, role, headerProps = {}, hideNav = false }: AppShellProps) {
  const { user, isAuthenticated, isInitializing, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isInitializing) return;

    if (!isAuthenticated) {
      if (role === 'admin') {
        router.push('/admin/login');
      } else if (role === 'maid') {
        router.push('/login?role=maid');
      } else {
        router.push('/login?role=customer');
      }
      return;
    }

    // Role verification
    if (user && user.role !== role) {
      if (role === 'admin') {
        // Non-admin user trying to access /admin
        if (user.role === 'customer') {
          router.push('/home');
        } else if (user.role === 'maid') {
          router.push('/maid/dashboard');
        }
      } else if (role === 'maid' && user.role === 'customer') {
        router.push('/home');
      } else if (role === 'customer' && user.role === 'maid') {
        router.push('/maid/dashboard');
      }
    }
  }, [isAuthenticated, isInitializing, role, user, router]);

  // Loading state while checking auth
  if (isInitializing) {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--background)',
        gap: '12px',
      }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '3px solid var(--primary-100)',
          borderTopColor: 'var(--primary-600)',
          animation: 'spin 1s linear infinite',
        }} />
        <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>
          Checking authentication...
        </span>
      </div>
    );
  }

  // Prevent flash of admin UI when unauthenticated or unauthorized
  if (!isAuthenticated || !user || user.role !== role) {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--background)',
        gap: '12px',
      }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '3px solid var(--primary-100)',
          borderTopColor: 'var(--primary-600)',
          animation: 'spin 1s linear infinite',
        }} />
        <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>
          Checking authentication...
        </span>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    if (role === 'admin') {
      router.push('/admin/login');
    } else {
      router.push('/');
    }
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--background)' }}>
      {/* Desktop Sidebar */}
      <Sidebar
        role={role}
        userName={user.name}
        userPhoto={user.photoUrl}
        onLogout={handleLogout}
      />

      {/* Header */}
      <Header
        showLocation={!headerProps.title && role === 'customer'}
        showNotifications={role !== 'admin'}
        {...headerProps}
      />

      {/* Main content */}
      <motion.main
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="page-content"
        style={{
          paddingLeft: '16px',
          paddingRight: '16px',
        }}
      >
        {children}
      </motion.main>

      {/* Mobile nav */}
      {!hideNav && <MobileNav role={role} />}
    </div>
  );
}
