'use client';

import { AppShell } from '@/components/layout/AppShell';

export default function PrivacyPage() {
  return (
    <AppShell role="customer" headerProps={{ title: 'Privacy Policy', showBack: true }}>
      <div className="animate-fade-in" style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: '24px', border: '1px solid var(--border-light)' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px' }}>Privacy Policy</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
          MaidEasy is committed to protecting your privacy. We collect minimal personal information required to verify maid identity and facilitate home service bookings across India.
        </p>
        <h2 style={{ fontSize: '16px', fontWeight: 700, marginTop: '20px', marginBottom: '8px' }}>1. Identity Verification</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
          Aadhaar numbers are stored securely with masking. Only the last 4 digits are displayed publicly. Live camera selfies are used strictly for identity confirmation and are never shared publicly.
        </p>
        <h2 style={{ fontSize: '16px', fontWeight: 700, marginTop: '20px', marginBottom: '8px' }}>2. Data Safety</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
          Payment details are handled via secure payment gateways (Razorpay & PhonePe). We do not store card credentials on our servers.
        </p>
      </div>
    </AppShell>
  );
}
