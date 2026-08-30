'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { fetchMaidById } from '@/lib/services/maidService';
import { Maid } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { MOCK_MAIDS } from '@/lib/mockData';

export default function MaidVerificationPage() {
  const { user } = useAuth();
  const [maid, setMaid] = useState<Maid>(MOCK_MAIDS[0]);

  useEffect(() => {
    async function load() {
      if (!user) return;
      const m = await fetchMaidById(user.id);
      if (m) setMaid(m);
    }
    load();
  }, [user]);

  return (
    <AppShell role="maid" headerProps={{ title: 'Verification Details', showBack: true }}>
      <div className="animate-fade-in">
        <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: '20px', marginBottom: '16px', border: '1px solid var(--border-light)' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 16px' }}>Verification Checklist</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'Aadhaar ID', done: !!maid.aadhaarMasked, detail: maid.aadhaarMasked ? `Masked: ${maid.aadhaarMasked}` : 'Not provided' },
              { label: 'Live Camera Selfie', done: maid.selfieStatus === 'verified' || !!maid.selfieUrl, detail: maid.selfieStatus === 'verified' || !!maid.selfieUrl ? 'Camera selfie captured & verified' : 'Pending' },
              { label: 'Identity Verification', done: maid.verificationStatus === 'verified', detail: maid.verificationStatus === 'verified' ? 'Identity verified' : 'Pending' },
              { label: 'Admin Approval', done: maid.approvalStatus === 'approved', detail: maid.approvalStatus === 'approved' ? 'Profile approved by admin' : 'Under review' },
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

        {maid.approvalStatus !== 'approved' && (
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
