'use client';

import { AppShell } from '@/components/layout/AppShell';
import { useApp } from '@/lib/app-context';
import { timeAgo } from '@/lib/utils';
import { Bell, CheckCheck, CalendarDays, CreditCard, User, Megaphone, Home } from 'lucide-react';

const renderNotificationIcon = (type: string) => {
  switch (type) {
    case 'booking': return <CalendarDays size={20} style={{ color: 'var(--primary-600)' }} />;
    case 'payment': return <CreditCard size={20} style={{ color: 'var(--success-600)' }} />;
    case 'account': return <User size={20} style={{ color: 'var(--accent-600)' }} />;
    case 'system': return <Megaphone size={20} style={{ color: 'var(--info-600)' }} />;
    case 'maid': return <Home size={20} style={{ color: 'var(--primary-600)' }} />;
    default: return <Bell size={20} style={{ color: 'var(--primary-600)' }} />;
  }
};

export default function NotificationsPage() {
  const { notifications, markRead, markAllRead, unreadCount } = useApp();

  return (
    <AppShell role="customer" headerProps={{
      title: 'Notifications',
      showBack: true,
      showNotifications: false,
      actions: unreadCount > 0 ? (
        <button
          className="btn btn-ghost btn-sm"
          onClick={markAllRead}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary-600)' }}
        >
          <CheckCheck size={16} /> Mark all read
        </button>
      ) : undefined,
    }}>
      <div className="animate-fade-in">
        {notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Bell size={36} style={{ color: 'var(--gray-400)' }} /></div>
            <div className="empty-state-title">You&apos;re all caught up!</div>
            <div className="empty-state-desc">No notifications yet. We&apos;ll notify you about your bookings and account updates.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0', background: 'white', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            {notifications.map((n, i) => (
              <div
                key={n.id}
                className={`notification-item ${!n.read ? 'unread' : ''}`}
                onClick={() => markRead(n.id)}
                style={{ borderBottom: i < notifications.length - 1 ? '1px solid var(--border-light)' : 'none' }}
              >
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 'var(--radius-lg)',
                  background: n.read ? 'var(--gray-100)' : 'var(--primary-100)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {renderNotificationIcon(n.type)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ fontWeight: n.read ? 500 : 700, fontSize: '14px', color: 'var(--text-primary)' }}>
                      {n.title}
                    </span>
                    {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary-500)', flexShrink: 0, marginTop: '4px' }} />}
                  </div>
                  <p style={{ margin: '3px 0 4px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    {n.message}
                  </p>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{timeAgo(n.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{ height: '24px' }} />
      </div>
    </AppShell>
  );
}
