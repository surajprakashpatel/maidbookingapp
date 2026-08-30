'use client';

import { Bell, MapPin, ChevronDown, ArrowLeft, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/app-context';
import { useAuth } from '@/lib/auth-context';
import { getInitials } from '@/lib/utils';

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
  const { user } = useAuth();

  const bgStyle = variant === 'transparent'
    ? { background: 'transparent', borderBottom: 'none', boxShadow: 'none' }
    : {};

  return (
    <header className="app-header" style={bgStyle}>
      {/* Left: back or logo */}
      {showBack ? (
        <button
          onClick={() => router.back()}
          className="btn btn-ghost btn-icon"
          aria-label="Go back"
          style={{ marginLeft: '-8px' }}
        >
          <ArrowLeft size={22} />
        </button>
      ) : !title ? (
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 'var(--radius-md)',
            background: 'var(--primary-500)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{ color: 'white', fontSize: '16px' }}>✦</span>
          </div>
          <span style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text-primary)' }}>MaidEasy</span>
        </Link>
      ) : null}

      {/* Title */}
      {title && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <h1 style={{ fontWeight: 700, fontSize: '17px', margin: 0, color: 'var(--text-primary)' }}>
            {title}
          </h1>
        </div>
      )}

      {/* Location */}
      {showLocation && !title && (
        <button style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'var(--primary-50)',
          border: '1px solid var(--primary-100)',
          borderRadius: 'var(--radius-full)',
          padding: '5px 12px',
          cursor: 'pointer',
          flex: 1,
          maxWidth: '200px',
        }}>
          <MapPin size={14} style={{ color: 'var(--primary-600)', flexShrink: 0 }} />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary-700)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selectedArea}, {selectedCity}
          </span>
          <ChevronDown size={12} style={{ color: 'var(--primary-600)', flexShrink: 0 }} />
        </button>
      )}

      {/* Spacer */}
      {!showLocation && !title && !showBack && <div style={{ flex: 1 }} />}
      {(title || showBack) && <div style={{ flex: 1 }} />}

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {actions}

        {showSearch && (
          <Link href="/search">
            <button className="btn btn-ghost btn-icon" aria-label="Search">
              <Search size={22} />
            </button>
          </Link>
        )}

        {showNotifications && (
          <Link href="/notifications">
            <button className="btn btn-ghost btn-icon" aria-label="Notifications" style={{ position: 'relative' }}>
              <Bell size={22} />
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
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: user.photoUrl ? `url(${user.photoUrl}) center/cover` : 'var(--primary-100)',
              cursor: 'pointer',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--primary-600)',
              flexShrink: 0,
              border: '2px solid var(--primary-100)',
              backgroundSize: 'cover',
            }}>
              {!user.photoUrl && getInitials(user.name)}
            </div>
          </Link>
        )}
      </div>
    </header>
  );
}
