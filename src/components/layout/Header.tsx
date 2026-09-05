'use client';

import { useState } from 'react';
import { Bell, MapPin, ChevronDown, ArrowLeft, Search, Menu } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/app-context';
import { useAuth } from '@/lib/auth-context';
import { getInitials } from '@/lib/utils';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { LocationSelectorModal } from '@/components/location/LocationSelectorModal';
import { MobileSidebarDrawer } from './Navigation';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showLocation?: boolean;
  showSearch?: boolean;
  showNotifications?: boolean;
  actions?: React.ReactNode;
  variant?: 'default' | 'transparent' | 'white';
}

export function Header({
  title,
  showBack = false,
  showLocation = false,
  showSearch = false,
  showNotifications = true,
  actions,
  variant = 'default',
}: HeaderProps) {
  const router = useRouter();
  const { unreadCount, selectedCity, selectedArea } = useApp();
  const { user, logout } = useAuth();
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const bgStyle = variant === 'transparent'
    ? { background: 'transparent', borderBottom: 'none', boxShadow: 'none' }
    : {};

  const handleLogout = () => {
    logout();
    if (user?.role === 'admin') {
      router.push('/admin/login');
    } else {
      router.push('/');
    }
  };

  return (
    <>
      <header className="app-header" style={bgStyle}>
        {/* Left: back or mobile menu + logo */}
        {showBack ? (
          <button
            onClick={() => router.back()}
            className="btn btn-ghost btn-icon shrink-0"
            aria-label="Go back"
            style={{ marginLeft: '-8px' }}
          >
            <ArrowLeft size={22} />
          </button>
        ) : (
          <div className="flex items-center gap-1 shrink-0">
            {user && (
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="btn btn-ghost btn-icon lg:hidden -ml-2 shrink-0"
                aria-label="Open navigation menu"
              >
                <Menu size={22} />
              </button>
            )}
            {!title && <BrandLogo size="sm" href="/" />}
          </div>
        )}

        {/* Title */}
        {title && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', minWidth: 0 }}>
            <h1 className="truncate font-bold text-base sm:text-[17px] m-0 text-[var(--text-primary)]">
              {title}
            </h1>
          </div>
        )}

        {/* Location */}
        {showLocation && !title && (
          <button
            type="button"
            onClick={() => setShowLocationModal(true)}
            className="flex items-center gap-1 bg-[var(--primary-50)] border border-[var(--primary-100)] rounded-full py-1 sm:py-1.5 px-2.5 sm:px-3 cursor-pointer shrink min-w-0 max-w-[125px] min-[380px]:max-w-[160px] sm:max-w-[200px]"
          >
            <MapPin size={14} className="text-[var(--primary-600)] shrink-0" />
            <span className="text-xs sm:text-[13px] font-semibold text-[var(--primary-700)] overflow-hidden text-ellipsis whitespace-nowrap min-w-0">
              {selectedArea ? `${selectedArea}, ${selectedCity}` : selectedCity}
            </span>
            <ChevronDown size={12} className="text-[var(--primary-600)] shrink-0" />
          </button>
        )}

        {/* Spacer */}
        {!showLocation && !title && !showBack && <div style={{ flex: 1 }} />}
        {(title || showBack) && <div style={{ flex: 1 }} />}

        {/* Right actions */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {actions}

          {showSearch && (
            <Link href="/search">
              <button className="btn btn-ghost btn-icon" aria-label="Search">
                <Search size={20} className="sm:w-[22px] sm:h-[22px]" />
              </button>
            </Link>
          )}

          {showNotifications && (
            <Link href={user?.role === 'admin' ? '/admin/notifications' : '/notifications'}>
              <button className="btn btn-ghost btn-icon relative" aria-label="Notifications">
                <Bell size={20} className="sm:w-[22px] sm:h-[22px]" />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '6px',
                    right: '6px',
                    width: '8px',
                    height: '8px',
                    background: 'var(--error-500)',
                    borderRadius: '50%',
                    border: '2px solid white',
                  }} />
                )}
              </button>
            </Link>
          )}

          {user && !title && (
            <Link href={user.role === 'admin' ? '/admin' : user.role === 'maid' ? '/maid/profile' : '/profile'}>
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full cursor-pointer overflow-hidden flex items-center justify-center text-xs sm:text-[13px] font-bold text-[var(--primary-600)] shrink-0 border-2 border-[var(--primary-100)] bg-cover"
                style={{
                  background: user.photoUrl ? `url(${user.photoUrl}) center/cover` : 'var(--primary-100)',
                }}
              >
                {!user.photoUrl && getInitials(user.name)}
              </div>
            </Link>
          )}
        </div>
      </header>

      {/* Mobile Drawer Navigation for < 1024px */}
      {user && (
        <MobileSidebarDrawer
          open={mobileMenuOpen}
          onOpenChange={setMobileMenuOpen}
          role={user.role}
          userName={user.name}
          userPhoto={user.photoUrl}
          onLogout={handleLogout}
        />
      )}

      <LocationSelectorModal
        open={showLocationModal}
        onOpenChange={setShowLocationModal}
      />
    </>
  );
}
