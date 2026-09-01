'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { subscribeToMaidBookings, updateBookingStatus } from '@/lib/services/bookingService';
import { Booking, BookingStatus } from '@/lib/types';
import { formatDate, formatTime, formatINR, getBookingStatusLabel, getBookingStatusClass } from '@/lib/utils';
import { useApp } from '@/lib/app-context';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { CheckCircle, XCircle, CalendarDays } from 'lucide-react';

const TABS: { label: string; statuses: BookingStatus[] }[] = [
  { label: 'New', statuses: ['awaiting_maid', 'pending'] },
  { label: 'Upcoming', statuses: ['confirmed', 'paid'] },
  { label: 'Active', statuses: ['in_progress'] },
  { label: 'Completed', statuses: ['completed'] },
  { label: 'Cancelled', statuses: ['cancelled', 'rejected'] },
];

export default function MaidBookingsPage() {
  const { user } = useAuth();
  const { showToast } = useApp();
  const [activeTab, setActiveTab] = useState(0);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeToMaidBookings(user.id, (liveBookings) => {
      setBookings(liveBookings);
      setLoading(false);
    });
    return () => unsub();
  }, [user?.id]);

  const filtered = bookings.filter(b => TABS[activeTab].statuses.includes(b.bookingStatus));

  const handleAccept = async (booking: Booking, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const success = await updateBookingStatus(booking.id, 'confirmed');
    if (success) {
      showToast('success', 'Booking Accepted!', `You accepted booking from ${booking.customerName}`);
    } else {
      showToast('error', 'Update Failed', 'Failed to update booking status.');
    }
  };

  const handleReject = async (booking: Booking, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const success = await updateBookingStatus(booking.id, 'rejected');
    if (success) {
      showToast('error', 'Booking Rejected', `Booking from ${booking.customerName} was rejected`);
    } else {
      showToast('error', 'Update Failed', 'Failed to update booking status.');
    }
  };

  return (
    <AppShell role="maid" headerProps={{ title: 'My Bookings', showNotifications: true }}>
      <div className="animate-fade-in space-y-4">
        {/* Status tabs */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-[var(--gray-100)] rounded-xl">
          {TABS.map((tab, i) => {
            const count = bookings.filter(b => tab.statuses.includes(b.bookingStatus)).length;
            return (
              <button
                key={tab.label}
                type="button"
                className={`flex-1 min-w-[65px] px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap text-center ${
                  activeTab === i
                    ? 'bg-white text-[var(--primary-600)] shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
                onClick={() => setActiveTab(i)}
              >
                {tab.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Bookings list */}
        {loading ? (
          <div className="p-8 text-center text-xs text-[var(--text-secondary)]">Loading bookings...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><CalendarDays size={36} style={{ color: 'var(--gray-400)' }} /></div>
            <div className="empty-state-title">No {TABS[activeTab].label.toLowerCase()} bookings</div>
            <div className="empty-state-desc">You don&apos;t have any {TABS[activeTab].label.toLowerCase()} bookings at this time.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map(b => (
              <Link key={b.id} href={`/maid/bookings/${b.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: '16px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-card)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>#{b.bookingNumber}</span>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '2px 0 0', color: 'var(--text-primary)' }}>{b.serviceName}</h3>
                    </div>
                    <span className={`status-badge ${getBookingStatusClass(b.bookingStatus)}`}>
                      {getBookingStatusLabel(b.bookingStatus)}
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div>👤 <strong>{b.customerName}</strong> • {b.customerPhone}</div>
                    <div>📍 {b.customerAddress}, {b.customerArea}</div>
                    <div>📅 {formatDate(b.date)} at {formatTime(b.time || '09:00')} ({b.duration} {b.pricingType === 'hourly' ? 'hrs' : 'days'})</div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '10px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Your Earning:</span>
                      <span style={{ fontWeight: 800, color: 'var(--success-600)', marginLeft: '6px', fontSize: '15px' }}>{formatINR(b.serviceAmount)}</span>
                    </div>

                    {b.bookingStatus === 'awaiting_maid' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--error-600)' }}
                          onClick={e => handleReject(b, e)}
                        >
                          <XCircle size={14} /> Reject
                        </button>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={e => handleAccept(b, e)}
                        >
                          <CheckCircle size={14} /> Accept
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div style={{ height: '24px' }} />
      </div>
    </AppShell>
  );
}
