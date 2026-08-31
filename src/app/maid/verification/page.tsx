'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { AppShell } from '@/components/layout/AppShell';
import { subscribeToMaidById } from '@/lib/services/maidService';
import { Maid } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';

export default function MaidVerificationPage() {
  const { user } = useAuth();
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

  return (
    <AppShell role="maid" headerProps={{ title: 'Verification Details', showBack: true }}>
      <div className="animate-fade-in space-y-4">
        {/* Verified Banner Illustration */}
        <div className="bg-white rounded-2xl p-4 border border-[var(--border-light)] shadow-xs flex flex-col items-center text-center">
          <div className="w-full max-w-[240px] flex justify-center mb-2">
            <Image
              src="/illustrations/maid_verified_badge.jpg"
              alt="100% Verified Maid Professional"
              width={240}
              height={180}
              className="w-full h-auto object-contain rounded-xl"
            />
          </div>
          <h3 className="text-base font-extrabold text-[var(--text-primary)]">Verified Partner Status</h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-xs">
            Complete your profile checklist to earn your 100% Verified badge and start accepting customer bookings.
          </p>
        </div>

        <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: '20px', marginBottom: '16px', border: '1px solid var(--border-light)' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 16px' }}>Verification Checklist</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'Aadhaar ID', done: !!activeMaid.aadhaarMasked, detail: activeMaid.aadhaarMasked ? `Masked: ${activeMaid.aadhaarMasked}` : 'Not provided' },
              { label: 'Live Camera Selfie', done: activeMaid.selfieStatus === 'verified' || !!activeMaid.selfieUrl, detail: activeMaid.selfieStatus === 'verified' || !!activeMaid.selfieUrl ? 'Camera selfie captured & verified' : 'Pending' },
              { label: 'Identity Verification', done: activeMaid.verificationStatus === 'verified', detail: activeMaid.verificationStatus === 'verified' ? 'Identity verified' : 'Pending' },
              { label: 'Admin Approval', done: activeMaid.approvalStatus === 'approved', detail: activeMaid.approvalStatus === 'approved' ? 'Profile approved by admin' : 'Under review' },
            ].map(({ label, done, detail }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: done ? 'var(--success-50)' : 'var(--gray-50)', borderRadius: 'var(--radius-lg)', border: `1px solid ${done ? 'var(--success-100)' : 'var(--border-light)'}` }}>
                {done ? <CheckCircle size={20} style={{ color: 'var(--success-500)', flexShrink: 0 }} /> : <Clock size={20} style={{ color: 'var(--accent-500)', flexShrink: 0 }} />}
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: done ? 'var(--success-700)' : 'var(--text-primary)' }}>{label}</div>
                  <div style={{ fontSize: '12px', color: done ? 'var(--success-600)' : 'var(--text-secondary)' }}>{detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {activeMaid.approvalStatus !== 'approved' && (
          <Link href="/maid/register">
            <button className="btn btn-primary btn-full">
              Update Registration Info
            </button>
          </Link>
        )}

        <div style={{ height: '24px' }} />
      </div>
    </AppShell>
  );
}
