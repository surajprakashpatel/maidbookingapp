'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { MobileNav, Sidebar } from './Navigation';
import { Header } from './Header';
import { UserRole } from '@/lib/types';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { subscribeToUserById } from '@/lib/services/userService';
import { Clock, XCircle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

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
  const { user, isAuthenticated, isInitializing, logout, updateUser } = useAuth();
  const router = useRouter();

  // Listen for real-time approval status updates when pending
  useEffect(() => {
    if (!user?.id || user.role !== 'customer') return;
    const unsub = subscribeToUserById(user.id, (liveUser) => {
      if (liveUser && liveUser.approvalStatus && liveUser.approvalStatus !== user.approvalStatus) {
        updateUser({
          approvalStatus: liveUser.approvalStatus,
          rejectionReason: liveUser.rejectionReason,
        });
      }
    });
    return () => unsub();
  }, [user?.id, user?.role, user?.approvalStatus, updateUser]);

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

    // Check if profile is complete
    if (user && user.role !== 'admin' && user.profileCompleted === false) {
      if (user.role === 'maid') {
        router.push('/maid/register');
      } else {
        router.push('/profile/create');
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

  // Check customer approval access
  if (user && user.role === 'customer') {
    const isPending = user.approvalStatus === 'pending' || user.approvalStatus === 'under_review';
    const isRejected = user.approvalStatus === 'rejected';

    if (isPending) {
      return (
        <div className="min-h-dvh bg-slate-50 flex items-center justify-center p-3.5 sm:p-4">
          <Card className="max-w-md w-full p-4 sm:p-6 text-center space-y-5 bg-white border border-amber-200/90 shadow-sm rounded-3xl animate-fade-in">
            <div className="size-14 sm:size-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <Clock className="size-7 sm:size-8 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">Waiting for Admin Approval</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hello <span className="font-bold text-slate-800">{user.name}</span>, your customer account registration has been submitted and is currently awaiting administrator review.
              </p>
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 text-amber-800 text-[11px] text-left space-y-1">
                <div className="font-semibold">Account Status: Pending Approval</div>
                <div>Registered Phone: {user.phone}</div>
                <div>City: {user.city || user.location || 'Bhilai'}</div>
              </div>
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-emerald-600 pt-1">
                <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Checking status in real time. Will unlock automatically once approved.</span>
              </div>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="w-full text-xs font-semibold gap-1.5 rounded-xl text-slate-600"
              >
                <LogOut className="size-3.5" /> Sign Out
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    if (isRejected) {
      return (
        <div className="min-h-dvh bg-slate-50 flex items-center justify-center p-3.5 sm:p-4">
          <Card className="max-w-md w-full p-4 sm:p-6 text-center space-y-5 bg-white border border-red-200/90 shadow-sm rounded-3xl animate-fade-in">
            <div className="size-14 sm:size-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <XCircle className="size-7 sm:size-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">Account Registration Not Approved</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                {user.rejectionReason || 'Your account application could not be approved at this time. Please contact customer support.'}
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="w-full text-xs font-semibold gap-1.5 rounded-xl text-slate-600"
              >
                <LogOut className="size-3.5" /> Sign Out
              </Button>
            </div>
          </Card>
        </div>
      );
    }
  }

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
      >
        <div className="max-w-7xl mx-auto w-full px-3.5 sm:px-6 lg:px-8">
          {children}
        </div>
      </motion.main>

      {/* Mobile nav */}
      {!hideNav && <MobileNav role={role} />}
    </div>
  );
}
