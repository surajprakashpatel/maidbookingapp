'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { fetchBookingById } from '@/lib/services/bookingService';
import { Booking } from '@/lib/types';
import { formatDate, formatTime, formatINR, getBookingStatusLabel, getBookingStatusClass } from '@/lib/utils';
import { CalendarDays, Clock, MapPin, Loader } from 'lucide-react';

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const b = await fetchBookingById(id);
      setBooking(b);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <AppShell role="customer" headerProps={{ title: 'Booking Details', showBack: true }}>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <Loader size={28} className="animate-spin" style={{ color: 'var(--primary-600)', margin: '0 auto 12px' }} />
          <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading booking details...</div>
        </div>
      </AppShell>
    );
  }

  if (!booking) {
    return (
      <AppShell role="customer" headerProps={{ title: 'Booking Details', showBack: true }}>
        <div className="empty-state">
          <div className="empty-state-icon"><CalendarDays size={36} style={{ color: 'var(--gray-400)' }} /></div>
          <div className="empty-state-title">Booking not found</div>
          <button className="btn btn-primary" onClick={() => router.push('/bookings')}>Back to Bookings</button>
        </div>
      </AppShell>
    );
  }

  const canCancel = ['pending', 'awaiting_maid', 'confirmed'].includes(booking.bookingStatus);

  return (
    <AppShell role="customer" headerProps={{ title: 'Booking Details', showBack: true }}>
      <div className="animate-fade-in">
        {/* Status Banner */}
        <div style={{
          borderRadius: 'var(--radius-xl)',
          padding: '16px',
          marginBottom: '16px',
          background: booking.bookingStatus === 'completed' ? 'var(--success-50)'
                    : booking.bookingStatus === 'cancelled' ? 'var(--error-50)'
                    : 'var(--primary-50)',
          border: `1px solid ${booking.bookingStatus === 'completed' ? 'var(--success-100)' : booking.bookingStatus === 'cancelled' ? 'var(--error-100)' : 'var(--primary-100)'}`,
          textAlign: 'center',
        }}>
          <span className={getBookingStatusClass(booking.bookingStatus)} style={{ fontSize: '14px', padding: '6px 16px' }}>
            {getBookingStatusLabel(booking.bookingStatus)}
          </span>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', fontFamily: 'monospace' }}>
            #{booking.bookingNumber}
          </div>
        </div>

        {/* Details Card */}
        <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: '20px', marginBottom: '16px', border: '1px solid var(--border-light)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 16px', color: 'var(--text-primary)' }}>{booking.serviceName}</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CalendarDays size={18} style={{ color: 'var(--primary-600)' }} />
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Date</div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>{formatDate(booking.date || '')}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={18} style={{ color: 'var(--primary-600)' }} />
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Time & Duration</div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>{formatTime(booking.time || '')} ({booking.duration} hrs)</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <MapPin size={18} style={{ color: 'var(--primary-600)' }} />
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Service Address</div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>{booking.customerAddress}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Maid */}
        <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: '20px', marginBottom: '16px', border: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>ASSIGNED MAID</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: booking.maidPhoto ? `url(${booking.maidPhoto}) center/cover` : 'var(--primary-100)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              color: 'var(--primary-600)',
            }}>
              {!booking.maidPhoto && booking.maidName.charAt(0)}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '15px' }}>{booking.maidName}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Verified Professional</div>
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: '20px', marginBottom: '24px', border: '1px solid var(--border-light)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px' }}>Payment Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Service Amount</span>
              <span>{formatINR(booking.serviceAmount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Platform Fee</span>
              <span>{formatINR(booking.platformFee)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--border-light)', fontWeight: 800, fontSize: '15px' }}>
              <span>Total Paid</span>
              <span style={{ color: 'var(--primary-700)' }}>{formatINR(booking.totalAmount)}</span>
            </div>
          </div>
        </div>

        {canCancel && (
          <button className="btn btn-outline btn-full" style={{ color: 'var(--error-600)', borderColor: 'var(--error-200)' }}>
            Cancel Booking
          </button>
        )}

        <div style={{ height: '24px' }} />
      </div>
    </AppShell>
  );
}
