'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { fetchMaidById, updateMaidApprovalStatus } from '@/lib/services/maidService';
import { Maid } from '@/lib/types';
import { useApp } from '@/lib/app-context';
import { formatINR, getApprovalStatusClass, getApprovalStatusLabel } from '@/lib/utils';
import { CheckCircle, XCircle, Shield, Camera, MapPin, Phone, Mail, Eye, AlertTriangle, Loader, UserX } from 'lucide-react';

export default function AdminMaidDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { showToast } = useApp();

  const [maid, setMaid] = useState<Maid | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionInput, setShowRejectionInput] = useState(false);
  const [viewSelfie, setViewSelfie] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const m = await fetchMaidById(id);
      setMaid(m);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <AppShell role="admin" headerProps={{ title: 'Maid Detail', showBack: true }}>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <Loader size={28} className="animate-spin" style={{ color: 'var(--primary-600)', margin: '0 auto 12px' }} />
          <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading maid details...</div>
        </div>
      </AppShell>
    );
  }

  if (!maid) {
    return (
      <AppShell role="admin" headerProps={{ title: 'Maid Detail', showBack: true }}>
        <div className="empty-state">
          <div className="empty-state-icon"><UserX size={36} style={{ color: 'var(--gray-400)' }} /></div>
          <div className="empty-state-title">Maid not found</div>
          <button className="btn btn-primary" onClick={() => router.push('/admin/maids')}>Back to List</button>
        </div>
      </AppShell>
    );
  }

  const handleApprove = async () => {
    const success = await updateMaidApprovalStatus(maid.id, 'approved');
    if (success) {
      showToast('success', 'Maid Approved!', `${maid.name}'s profile is now live on the platform.`);
      router.push('/admin/maids');
    } else {
      showToast('error', 'Action Failed', 'Could not update approval status.');
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      showToast('error', 'Reason required', 'Please provide a rejection reason.');
      return;
    }
    const success = await updateMaidApprovalStatus(maid.id, 'rejected', rejectionReason);
    if (success) {
      showToast('error', 'Maid Rejected', `${maid.name}'s profile has been rejected.`);
      router.push('/admin/maids');
    } else {
      showToast('error', 'Action Failed', 'Could not update approval status.');
    }
  };

  const handleSuspend = async () => {
    const success = await updateMaidApprovalStatus(maid.id, 'suspended', 'Suspended by Administrator');
    if (success) {
      showToast('warning', 'Account Suspended', `${maid.name}'s account has been suspended.`);
      router.push('/admin/maids');
    } else {
      showToast('error', 'Action Failed', 'Could not suspend account.');
    }
  };

  return (
    <AppShell role="admin" headerProps={{ title: 'Maid Profile Review', showBack: true }}>
      <div className="animate-fade-in" style={{ paddingBottom: '120px' }}>
        {/* Status banner */}
        <div style={{
          background: maid.approvalStatus === 'approved' ? 'var(--success-50)' : maid.approvalStatus === 'under_review' ? 'var(--accent-50)' : 'var(--error-50)',
          border: `1px solid ${maid.approvalStatus === 'approved' ? 'var(--success-100)' : maid.approvalStatus === 'under_review' ? 'var(--accent-100)' : 'var(--error-100)'}`,
          borderRadius: 'var(--radius-xl)',
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>CURRENT STATUS</div>
            <div style={{ fontWeight: 800, fontSize: '15px', color: maid.approvalStatus === 'approved' ? 'var(--success-700)' : maid.approvalStatus === 'under_review' ? 'var(--accent-700)' : 'var(--error-700)' }}>
              {getApprovalStatusLabel(maid.approvalStatus)}
            </div>
          </div>
          <span className={getApprovalStatusClass(maid.approvalStatus)}>{maid.approvalStatus}</span>
        </div>

        {/* Profile Card */}
        <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: '20px', marginBottom: '16px', border: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: maid.profilePhoto ? `url(${maid.profilePhoto}) center/cover` : 'var(--primary-100)',
              backgroundSize: 'cover',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '24px',
              color: 'var(--primary-600)',
              flexShrink: 0,
            }}>
              {!maid.profilePhoto && maid.name.charAt(0)}
            </div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px', color: 'var(--text-primary)' }}>{maid.name}</h1>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {maid.gender} • {maid.experience ? `${maid.experience} Yrs Exp` : 'Experienced'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={12} /> {maid.area}, {maid.city}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <Phone size={14} style={{ color: 'var(--text-muted)' }} /> {maid.phone}
            </div>
            {maid.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <Mail size={14} style={{ color: 'var(--text-muted)' }} /> {maid.email}
              </div>
            )}
          </div>
        </div>

        {/* Verification Checklist */}
        <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: '20px', marginBottom: '16px', border: '1px solid var(--border-light)' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Shield size={16} style={{ color: 'var(--primary-600)' }} /> Verification Checklist
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Aadhaar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: maid.aadhaarMasked ? 'var(--success-50)' : 'var(--gray-50)', borderRadius: 'var(--radius-lg)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>Aadhaar Verification</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {maid.aadhaarMasked ? `Masked: ${maid.aadhaarMasked}` : 'Not provided'}
                </div>
              </div>
              <span className={`badge ${maid.aadhaarMasked ? 'badge-verified' : 'badge-pending'}`}>
                {maid.aadhaarMasked ? 'Masked Stored' : 'Missing'}
              </span>
            </div>

            {/* Selfie Verification */}
            <div style={{ padding: '12px', background: maid.selfieUrl ? 'var(--primary-50)' : 'var(--gray-50)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: viewSelfie ? '12px' : '0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Camera size={16} style={{ color: 'var(--primary-600)' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>Live Camera Selfie</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {maid.selfieUrl ? 'Camera selfie captured' : 'Not captured'}
                    </div>
                  </div>
                </div>
                {maid.selfieUrl && (
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setViewSelfie(!viewSelfie)}
                  >
                    <Eye size={14} /> {viewSelfie ? 'Hide' : 'View'}
                  </button>
                )}
              </div>
              {viewSelfie && maid.selfieUrl && (
                <div style={{ textAlign: 'center' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={maid.selfieUrl}
                    alt={`${maid.name}'s verification selfie`}
                    style={{ width: 160, height: 160, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary-100)', display: 'block', margin: '0 auto' }}
                  />
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '10px' }}>
                    Captured via live camera — gallery upload not permitted
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: '20px', marginBottom: '16px', border: '1px solid var(--border-light)' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px' }}>Requested Pricing</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            <div style={{ padding: '12px', background: 'var(--gray-50)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Per Hour</div>
              <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--primary-700)', marginTop: '2px' }}>
                {maid.hourlyPrice ? formatINR(maid.hourlyPrice) : 'N/A'}
              </div>
            </div>
            <div style={{ padding: '12px', background: 'var(--gray-50)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Per Day</div>
              <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--primary-700)', marginTop: '2px' }}>
                {maid.dailyPrice ? formatINR(maid.dailyPrice) : 'N/A'}
              </div>
            </div>
            <div style={{ padding: '12px', background: 'var(--gray-50)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Per Month</div>
              <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--primary-700)', marginTop: '2px' }}>
                {maid.monthlyPrice ? formatINR(maid.monthlyPrice) : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Admin Action Bar */}
        <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: '20px', border: '1px solid var(--border-light)' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 16px' }}>Approval Actions</h2>

          {showRejectionInput ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label className="form-label">Rejection Reason</label>
              <textarea
                className="textarea-base"
                rows={3}
                placeholder="Explain why this profile is being rejected..."
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowRejectionInput(false)}>
                  Cancel
                </button>
                <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleReject}>
                  Confirm Rejection
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {maid.approvalStatus !== 'approved' && (
                <button className="btn btn-success btn-lg btn-full" style={{ gap: '8px' }} onClick={handleApprove}>
                  <CheckCircle size={20} /> Approve Profile & Make Live
                </button>
              )}
              {maid.approvalStatus !== 'rejected' && (
                <button className="btn btn-danger btn-full" style={{ gap: '8px' }} onClick={() => setShowRejectionInput(true)}>
                  <XCircle size={20} /> Reject Profile
                </button>
              )}
              {maid.approvalStatus === 'approved' && (
                <button className="btn btn-outline btn-full" style={{ gap: '8px', color: 'var(--error-600)', borderColor: 'var(--error-100)' }} onClick={handleSuspend}>
                  <AlertTriangle size={18} /> Suspend Account
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
