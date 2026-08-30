'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/lib/auth-context';
import { useApp } from '@/lib/app-context';
import { saveUserData } from '@/lib/services/userService';

export default function CustomerSettingsPage() {
  const { user } = useAuth();
  const { showToast } = useApp();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [area, setArea] = useState(user?.area ?? '');
  const [address, setAddress] = useState(user?.address ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const updatedUser = {
      ...user,
      name,
      email,
      area,
      address,
    };
    const success = await saveUserData(updatedUser);
    setSaving(false);
    if (success) {
      showToast('success', 'Profile updated!', 'Your settings have been saved to Firestore.');
    } else {
      showToast('error', 'Save Failed', 'Could not update settings.');
    }
  };

  return (
    <AppShell role="customer" headerProps={{ title: 'Settings', showBack: true }}>
      <div className="animate-fade-in">
        <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: '20px', marginBottom: '16px', border: '1px solid var(--border-light)' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 16px' }}>Personal Details</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="input-base" type="text" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input className="input-base" type="text" value={user?.phone ?? ''} disabled style={{ background: 'var(--gray-100)', color: 'var(--text-muted)' }} />
              <span className="form-hint">Phone number cannot be changed</span>
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="input-base" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
            </div>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: '20px', marginBottom: '16px', border: '1px solid var(--border-light)' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 16px' }}>Address & Location</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Area / Locality</label>
              <input className="input-base" type="text" value={area} onChange={e => setArea(e.target.value)} placeholder="e.g. Sector 7" />
            </div>
            <div className="form-group">
              <label className="form-label">Full Address</label>
              <textarea className="textarea-base" value={address} onChange={e => setAddress(e.target.value)} rows={3} placeholder="Flat, house no, street..." />
            </div>
          </div>
        </div>

        <button className="btn btn-primary btn-full btn-lg" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving Profile...' : 'Save Profile'}
        </button>

        <div style={{ height: '24px' }} />
      </div>
    </AppShell>
  );
}
