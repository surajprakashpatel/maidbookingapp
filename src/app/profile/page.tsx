'use client';

import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { getInitials } from '@/lib/utils';
import {
  CalendarDays, Heart, Bell, CreditCard,
  HelpCircle, Settings, FileText, Shield,
  LogOut, ChevronRight, Phone, Mail, MapPin, CheckCircle
} from 'lucide-react';

const MENU_ITEMS = [
  { icon: CalendarDays, label: 'My Bookings', href: '/bookings', color: 'var(--primary-500)' },
  { icon: Heart, label: 'Saved Maids', href: '#', color: 'var(--error-500)' },
  { icon: Bell, label: 'Notifications', href: '/notifications', color: 'var(--accent-500)' },
  { icon: CreditCard, label: 'Payment History', href: '#', color: 'var(--success-500)' },
  null,
  { icon: Settings, label: 'Settings', href: '/settings', color: 'var(--gray-500)' },
  { icon: HelpCircle, label: 'Help & Support', href: '#', color: 'var(--info-500)' },
  { icon: Shield, label: 'Privacy Policy', href: '/privacy', color: 'var(--gray-500)' },
  { icon: FileText, label: 'Terms & Conditions', href: '/terms', color: 'var(--gray-500)' },
];

export default function CustomerProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <AppShell role="customer" headerProps={{ title: 'My Profile' }}>
      <div className="animate-fade-in">
        {/* Profile card */}
        <div style={{
          background: 'linear-gradient(135deg, var(--primary-600), var(--primary-400))',
          borderRadius: 'var(--radius-2xl)',
          padding: '24px',
          marginBottom: '16px',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '100px', height: '100px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', right: '30px', bottom: '-40px', width: '120px', height: '120px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}>
            {/* Avatar */}
            <div style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: user.photoUrl ? `url(${user.photoUrl}) center/cover` : 'rgba(255,255,255,0.2)',
              backgroundSize: 'cover',
              border: '3px solid rgba(255,255,255,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              fontWeight: 800,
              flexShrink: 0,
            }}>
              {!user.photoUrl && getInitials(user.name)}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px', color: 'white' }}>{user.name}</h1>
              <div style={{ fontSize: '13px', opacity: 0.8 }}>Customer Account</div>
            </div>

            <button
              className="btn btn-sm"
              style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', flexShrink: 0 }}
              onClick={() => router.push('/settings')}
            >
              Edit
            </button>
          </div>

          {/* Info rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '16px', position: 'relative' }}>
            {user.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', opacity: 0.85 }}>
                <Phone size={13} /> {user.phone}
              </div>
            )}
            {user.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', opacity: 0.85 }}>
                <Mail size={13} /> {user.email}
              </div>
            )}
            {user.area && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', opacity: 0.85 }}>
                <MapPin size={13} /> {user.area}, {user.location}
              </div>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
          {[
            { label: 'Bookings', value: '8', Icon: CalendarDays, color: 'var(--primary-500)' },
            { label: 'Completed', value: '6', Icon: CheckCircle, color: 'var(--success-500)' },
            { label: 'Saved', value: '3', Icon: Heart, color: 'var(--error-500)' },
          ].map(({ label, value, Icon, color }) => (
            <div key={label} style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: '14px', textAlign: 'center', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-xs)' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
                <Icon size={20} style={{ color }} />
              </div>
              <div style={{ fontWeight: 800, fontSize: '18px', color: 'var(--text-primary)' }}>{value}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Menu */}
        <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-xs)' }}>
          {MENU_ITEMS.map((item, i) => {
            if (!item) {
              return <div key={`sep-${i}`} style={{ height: '1px', background: 'var(--border-light)', margin: '0' }} />;
            }
            const { icon: Icon, label, href, color } = item;
            return (
              <button
                key={label}
                onClick={() => href !== '#' && router.push(href)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  width: '100%',
                  padding: '15px 16px',
                  background: 'none',
                  border: 'none',
                  borderBottom: '1px solid var(--border-light)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <span style={{ flex: 1, fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{label}</span>
                <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
              </button>
            );
          })}

          {/* Logout */}
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              width: '100%',
              padding: '15px 16px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--error-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <LogOut size={18} style={{ color: 'var(--error-500)' }} />
            </div>
            <span style={{ flex: 1, fontSize: '14px', fontWeight: 600, color: 'var(--error-600)' }}>Logout</span>
          </button>
        </div>

        <div style={{ height: '24px' }} />
      </div>
    </AppShell>
  );
}
