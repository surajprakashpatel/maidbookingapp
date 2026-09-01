'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Search, CalendarDays, User, LayoutDashboard,
  Wallet, BarChart3, Users, Settings, Shield, Bell, MapPin
} from 'lucide-react';
import { UserRole } from '@/lib/types';
import { BrandLogo } from '@/components/ui/BrandLogo';

interface NavItem {
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  href: string;
  badge?: number;
}

function getNavItems(role: UserRole): NavItem[] {
  if (role === 'customer') {
    return [
      { label: 'Home', icon: Home, href: '/home' },
      { label: 'Search', icon: Search, href: '/search' },
      { label: 'Bookings', icon: CalendarDays, href: '/bookings' },
      { label: 'Profile', icon: User, href: '/profile' },
    ];
  }
  if (role === 'maid') {
    return [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/maid/dashboard' },
      { label: 'Bookings', icon: CalendarDays, href: '/maid/bookings' },
      { label: 'Earnings', icon: Wallet, href: '/maid/earnings' },
      { label: 'Profile', icon: User, href: '/maid/profile' },
    ];
  }
  // admin
  return [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
    { label: 'Maids', icon: Shield, href: '/admin/maids' },
    { label: 'Users', icon: Users, href: '/admin/users' },
    { label: 'Settings', icon: Settings, href: '/admin/settings' },
  ];
}

interface MobileNavProps {
  role: UserRole;
}

export function MobileNav({ role }: MobileNavProps) {
  const pathname = usePathname();
  const items = getNavItems(role);

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
      {items.map(({ label, icon: Icon, href, badge }) => {
        const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
          >
            <div className="bottom-nav-icon-wrap">
              <Icon size={22} />
              {badge != null && badge > 0 && (
                <span className="nav-badge">{badge > 99 ? '99+' : badge}</span>
              )}
            </div>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

// ============================================================
// DESKTOP SIDEBAR
// ============================================================

interface SidebarSection {
  label?: string;
  items: NavItem[];
}

function getSidebarSections(role: UserRole): SidebarSection[] {
  if (role === 'customer') {
    return [
      {
        items: [
          { label: 'Home', icon: Home, href: '/home' },
          { label: 'Search Maids', icon: Search, href: '/search' },
          { label: 'My Bookings', icon: CalendarDays, href: '/bookings' },
        ],
      },
      {
        label: 'Account',
        items: [
          { label: 'Profile', icon: User, href: '/profile' },
          { label: 'Notifications', icon: Bell, href: '/notifications' },
          { label: 'Settings', icon: Settings, href: '/settings' },
        ],
      },
    ];
  }

  if (role === 'maid') {
    return [
      {
        items: [
          { label: 'Dashboard', icon: LayoutDashboard, href: '/maid/dashboard' },
          { label: 'Bookings', icon: CalendarDays, href: '/maid/bookings' },
          { label: 'Earnings', icon: Wallet, href: '/maid/earnings' },
          { label: 'Analytics', icon: BarChart3, href: '/maid/analytics' },
        ],
      },
      {
        label: 'Account',
        items: [
          { label: 'My Profile', icon: User, href: '/maid/profile' },
          { label: 'Verification', icon: Shield, href: '/maid/verification' },
          { label: 'Settings', icon: Settings, href: '/maid/settings' },
        ],
      },
    ];
  }

  // Admin
  return [
    {
      items: [
        { label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
      ],
    },
    {
      label: 'Management',
      items: [
        { label: 'Maids', icon: Shield, href: '/admin/maids' },
        { label: 'Customers', icon: Users, href: '/admin/users' },
        { label: 'Bookings', icon: CalendarDays, href: '/admin/bookings' },
        { label: 'Payments', icon: Wallet, href: '/admin/payments' },
        { label: 'Locations', icon: MapPin, href: '/admin/locations' },
      ],
    },
    {
      label: 'Reports',
      items: [
        { label: 'Analytics', icon: BarChart3, href: '/admin/analytics' },
        { label: 'Notifications', icon: Bell, href: '/admin/notifications' },
      ],
    },
    {
      label: 'System',
      items: [
        { label: 'Settings', icon: Settings, href: '/admin/settings' },
      ],
    },
  ];
}

interface SidebarProps {
  role: UserRole;
  userName: string;
  userPhoto?: string;
  onLogout: () => void;
}

export function Sidebar({ role, userName, userPhoto, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const sections = getSidebarSections(role);

  const roleLabel = role === 'customer' ? 'Customer' : role === 'maid' ? 'Maid' : 'Administrator';
  const roleColor = role === 'admin' ? 'var(--error-600)' : role === 'maid' ? 'var(--success-600)' : 'var(--primary-600)';

  return (
    <aside className="sidebar" role="navigation" aria-label="Sidebar navigation">
      {/* Logo */}
      <div className="sidebar-logo">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <BrandLogo size="md" href={role === 'admin' ? '/admin' : role === 'maid' ? '/maid/dashboard' : '/home'} />
          <div style={{ fontSize: '11px', color: roleColor, fontWeight: 700, paddingLeft: '44px', marginTop: '-6px' }}>{roleLabel}</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {sections.map((section, si) => (
          <div key={si}>
            {section.label && (
              <div className="sidebar-section-label">{section.label}</div>
            )}
            {section.items.map(({ label, icon: Icon, href }) => {
              const isActive = pathname === href || (href !== '/' && href !== '/admin' && pathname.startsWith(href));
              const isAdminExact = href === '/admin' && pathname === '/admin';
              const active = isAdminExact || (href !== '/admin' && isActive);

              return (
                <Link
                  key={href}
                  href={href}
                  className={`sidebar-item ${active ? 'active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: userPhoto ? `url(${userPhoto}) center/cover` : 'var(--primary-100)',
            flexShrink: 0,
            backgroundSize: 'cover',
            display: userPhoto ? 'block' : 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 700,
            color: 'var(--primary-600)',
          }}>
            {!userPhoto && userName.charAt(0)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {userName}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{roleLabel}</div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="btn btn-outline btn-sm btn-full"
          style={{ justifyContent: 'center' }}
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
