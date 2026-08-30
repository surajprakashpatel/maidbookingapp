'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { fetchMaidBookings, updateBookingStatus } from '@/lib/services/bookingService';
import { Booking, BookingStatus } from '@/lib/types';
import { formatDate, formatTime, formatINR, getBookingStatusLabel, getBookingStatusClass } from '@/lib/utils';
import { useApp } from '@/lib/app-context';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { CheckCircle, XCircle, Clock, CalendarDays } from 'lucide-react';

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

  useEffect(() => {
    async function load() {
      if (!user) return;
      const list = await fetchMaidBookings(user.id);
      setBookings(list);
    }
    load();
  }, [user]);

  const filtered = bookings.filter(b => TABS[activeTab].statuses.includes(b.bookingStatus));

  const handleAccept = async (booking: Booking) => {
    const success = await updateBookingStatus(booking.id, 'confirmed');
    if (success) {
      setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, bookingStatus: 'confirmed' } : b));
      showToast('success', 'Booking Accepted!', `You accepted booking from ${booking.customerName}`);
    } else {
      showToast('error', 'Update Failed', 'Failed to update booking status.');
    }
  };

  const handleReject = async (booking: Booking) => {
    const success = await updateBookingStatus(booking.id, 'rejected');
    if (success) {
      setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, bookingStatus: 'rejected' } : b));
      showToast('error', 'Booking Rejected', `Booking from ${booking.customerName} was rejected`);
    } else {
      showToast('error', 'Update Failed', 'Failed to update booking status.');
    }
  };

  return (
    <AppShell role="maid" headerProps={{ title: 'My Bookings', showNotifications: true }}>
      <div className="animate-fade-in">
        {/* Tabs */}
        <div className="tabs-underline" style={{ marginBottom: '20px' }}>
          {TABS.map((tab, i) => {
            const count = bookings.filter(b => tab.statuses.includes(b.bookingStatus)).length;
            return (
              <button
                key={tab.label}
                className={`tab-underline-trigger ${activeTab === i ? 'active' : ''}`}
                onClick={() => setActiveTab(i)}
              >
                {tab.label}
                {count > 0 && <span style={{ marginLeft: '4px', fontSize: '11px', fontWeight: 700, background: activeTab === i ? 'var(--primary-100)' : 'var(--gray-100)', color: activeTab === i ? 'var(--primary-700)' : 'var(--text-muted)', borderRadius: 'var(--radius-full)', padding: '0 5px' }}>{count}</span>}
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><CalendarDays size={36} style={{ color: 'var(--gray-400)' }} /></div>
            <div className="empty-state-title">No {TABS[activeTab].label.toLowerCase()} bookings</div>
            <div className="empty-state-desc">
              {activeTab === 0 ? 'New booking requests will appear here.' : 'Bookings in this status will appear here.'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map(booking => (
              <Link key={booking.id} href={`/maid/bookings/${booking.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="card card-hover" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>#{booking.bookingNumber}</span>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '2px 0 0', color: 'var(--text-primary)' }}>{booking.serviceName}</h3>
                  </div>
                  <span className={getBookingStatusClass(booking.bookingStatus)} style={{ fontSize: '11px' }}>
                    {getBookingStatusLabel(booking.bookingStatus)}
                  </span>
                </div>

                {/* Customer info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'var(--gray-50)', borderRadius: 'var(--radius-lg)', marginBottom: '12px' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', color: 'var(--primary-700)' }}>
                    {booking.customerName.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>{booking.customerName}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{booking.customerAddress}</div>
                  </div>
                </div>

                {/* Booking timing & pricing */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={14} style={{ color: 'var(--primary-500)' }} />
                    <span>{formatDate(booking.date || '')} • {formatTime(booking.time || '')} ({booking.duration} hrs)</span>
                  </div>
                  <div style={{ fontWeight: 800, color: 'var(--primary-700)' }}>
                    {formatINR(booking.serviceAmount)}
                  </div>
                </div>

                {/* Accept/Reject actions for new bookings */}
                {booking.bookingStatus === 'awaiting_maid' && (
                  <div style={{ display: 'flex', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--border-light)' }}>
                    <button className="btn btn-outline btn-sm" style={{ flex: 1, color: 'var(--error-600)', borderColor: 'var(--error-100)', gap: '4px' }} onClick={() => handleReject(booking)}>
                      <XCircle size={16} /> Decline
                    </button>
                    <button className="btn btn-success btn-sm" style={{ flex: 1, gap: '4px' }} onClick={() => handleAccept(booking)}>
                      <CheckCircle size={16} /> Accept Request
                    </button>
                  </div>
                )}
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
