'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/lib/auth-context';
import { subscribeToMaidById } from '@/lib/services/maidService';
import { Maid } from '@/lib/types';
import { formatINR } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { MapPin, ChevronRight, Edit, ShieldCheck, Bell, HelpCircle, LogOut } from 'lucide-react';

export default function MaidProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [maid, setMaid] = useState<Maid | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    const targetMaidId = user.id.startsWith('maid-') ? user.id : `maid-${user.id}`;
    const unsub = subscribeToMaidById(targetMaidId, (m) => {
      if (m) setMaid(m);
    });
    return () => unsub();
  }, [user?.id]);

  const activeMaid: Maid = maid || {
    id: user?.id || 'maid',
    userId: user?.id || 'maid',
    name: user?.name || 'Maid Partner',
    phone: user?.phone || '',
    gender: 'female',
    location: user?.location || 'Bhilai',
    city: user?.location || 'Bhilai',
    area: user?.area || 'Nehru Nagar',
    services: [],
    serviceAreas: [],
    workRadius: 5,
    experience: 0,
    approvalStatus: 'under_review',
    verificationStatus: 'not_submitted',
    selfieStatus: 'not_captured',
    availability: 'available',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <AppShell role="maid" headerProps={{ title: 'My Profile' }}>
      <div className="animate-fade-in">
        {/* Header card */}
        <div style={{
          background: 'linear-gradient(135deg, var(--primary-600), var(--primary-400))',
          borderRadius: 'var(--radius-2xl)',
          padding: '24px',
          marginBottom: '16px',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: activeMaid.profilePhoto ? `url(${activeMaid.profilePhoto}) center/cover` : 'rgba(255,255,255,0.2)',
              backgroundSize: 'cover',
              border: '3px solid rgba(255,255,255,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 700,
            }}>
              {!activeMaid.profilePhoto && (activeMaid.name ? activeMaid.name.charAt(0) : 'M')}
            </div>

            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px', color: 'white' }}>{activeMaid.name}</h1>
              <div style={{ fontSize: '13px', opacity: 0.9 }}>{activeMaid.phone}</div>
              <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={12} /> {activeMaid.area || 'Bhilai'}, {activeMaid.city || 'Bhilai'}
              </div>
            </div>
          </div>
        </div>

        {/* Pricing card */}
        <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: '20px', marginBottom: '16px', border: '1px solid var(--border-light)' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px' }}>Current Service Rates</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            <div style={{ padding: '12px', background: 'var(--gray-50)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Per Hour</div>
              <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--primary-700)', marginTop: '2px' }}>
                {activeMaid.hourlyPrice ? formatINR(activeMaid.hourlyPrice) : 'N/A'}
              </div>
            </div>
            <div style={{ padding: '12px', background: 'var(--gray-50)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Per Day</div>
              <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--primary-700)', marginTop: '2px' }}>
                {activeMaid.dailyPrice ? formatINR(activeMaid.dailyPrice) : 'N/A'}
              </div>
            </div>
            <div style={{ padding: '12px', background: 'var(--gray-50)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Per Month</div>
              <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--primary-700)', marginTop: '2px' }}>
                {activeMaid.monthlyPrice ? formatINR(activeMaid.monthlyPrice) : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Menu items */}
        <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
          {[
            { label: 'Edit Profile', Icon: Edit, href: '/maid/settings', color: 'var(--primary-600)' },
            { label: 'Verification', Icon: ShieldCheck, href: '/maid/verification', color: 'var(--accent-600)' },
            { label: 'Notifications', Icon: Bell, href: '/notifications', color: 'var(--info-600)' },
            { label: 'Help & 24/7 Support', Icon: HelpCircle, href: '/help', color: 'var(--gray-600)' },
          ].map(({ label, Icon, href, color }) => (
            <button
              key={label}
              onClick={() => router.push(href)}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '15px 16px', background: 'none', border: 'none', borderBottom: '1px solid var(--border-light)', cursor: 'pointer', textAlign: 'left' }}
            >
              <Icon size={18} style={{ color }} />
              <span style={{ flex: 1, fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{label}</span>
              <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
            </button>
          ))}

          <button
            onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '15px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <LogOut size={18} style={{ color: 'var(--error-600)' }} />
            <span style={{ flex: 1, fontSize: '14px', fontWeight: 600, color: 'var(--error-600)' }}>Logout</span>
          </button>
        </div>

        <div style={{ height: '24px' }} />
      </div>
    </AppShell>
  );
}
