'use client';

import { AppShell } from '@/components/layout/AppShell';

export default function TermsPage() {
  return (
    <AppShell role="customer" headerProps={{ title: 'Terms & Conditions', showBack: true }}>
      <div className="animate-fade-in" style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: '24px', border: '1px solid var(--border-light)' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px' }}>Terms & Conditions</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
          By using MaidEasy, you agree to comply with our platform guidelines for booking verified maids.
        </p>
        <h2 style={{ fontSize: '16px', fontWeight: 700, marginTop: '20px', marginBottom: '8px' }}>1. Booking & Cancellation</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
          Free cancellation is available up to 4 hours before the scheduled appointment time. Platform fees apply to all completed bookings.
        </p>
        <h2 style={{ fontSize: '16px', fontWeight: 700, marginTop: '20px', marginBottom: '8px' }}>2. Maid Verification</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
          All maids undergo Aadhaar verification, live camera selfie verification, and admin approval before appearing on the platform.
        </p>
      </div>
    </AppShell>
  );
}
