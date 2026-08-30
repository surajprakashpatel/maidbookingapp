'use client';

import { CalendarDays, Clock, MapPin, ChevronRight } from 'lucide-react';
import { Booking } from '@/lib/types';
import {
  formatDate, formatTime, formatINR,
  getBookingStatusLabel, getBookingStatusClass,
  getPaymentStatusLabel, getPaymentStatusClass,
  getInitials
} from '@/lib/utils';
import Link from 'next/link';

interface BookingCardProps {
  booking: Booking;
  viewAs?: 'customer' | 'maid' | 'admin';
  onAction?: (action: string, booking: Booking) => void;
}

export function BookingCard({ booking, viewAs = 'customer' }: BookingCardProps) {
  const personName = viewAs === 'customer' ? booking.maidName : booking.customerName;
  const personPhoto = viewAs === 'customer' ? booking.maidPhoto : undefined;

  return (
    <Link href={`/bookings/${booking.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div className="card card-hover" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          {/* Avatar */}
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: personPhoto ? `url(${personPhoto}) center/cover` : 'var(--primary-100)',
            backgroundSize: 'cover',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            fontWeight: 700,
            color: 'var(--primary-600)',
            flexShrink: 0,
          }}>
            {!personPhoto && getInitials(personName)}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>
                  {personName}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '1px' }}>
                  {booking.serviceName}
                </div>
              </div>
              <span className={getBookingStatusClass(booking.bookingStatus)} style={{ fontSize: '10px', flexShrink: 0 }}>
                {getBookingStatusLabel(booking.bookingStatus)}
              </span>
            </div>

            {/* Date & time */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CalendarDays size={12} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{formatDate(booking.date)}</span>
              </div>
              {booking.time && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{formatTime(booking.time)}</span>
                </div>
              )}
            </div>

            {/* Location */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
              <MapPin size={11} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {booking.customerArea}
              </span>
            </div>
          </div>

          <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }} />
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: '1px solid var(--border-light)',
        }}>
          <div>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Total: </span>
            <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--primary-700)' }}>
              {formatINR(booking.totalAmount)}
            </span>
          </div>
          <span className={getPaymentStatusClass(booking.paymentStatus)} style={{ fontSize: '10px' }}>
            {getPaymentStatusLabel(booking.paymentStatus)}
          </span>
        </div>

        {/* Booking number */}
        <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
          #{booking.bookingNumber}
        </div>
      </div>
    </Link>
  );
}

export function BookingCardSkeleton() {
  return (
    <div className="card" style={{ padding: '16px' }}>
      <div style={{ display: 'flex', gap: '12px' }}>
        <div className="skeleton" style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ height: 16, width: '55%', marginBottom: '6px' }} />
          <div className="skeleton" style={{ height: 12, width: '40%', marginBottom: '8px' }} />
          <div className="skeleton" style={{ height: 12, width: '70%' }} />
        </div>
      </div>
      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between' }}>
        <div className="skeleton" style={{ height: 18, width: '100px' }} />
        <div className="skeleton" style={{ height: 18, width: '60px' }} />
      </div>
    </div>
  );
}
