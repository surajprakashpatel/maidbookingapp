'use client';

import { useState, useEffect, use } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { fetchBookingById, updateBookingStatus } from '@/lib/services/bookingService';
import { Booking } from '@/lib/types';
import { formatDate, formatTime, formatINR, getBookingStatusLabel, getBookingStatusClass } from '@/lib/utils';
import { useApp } from '@/lib/app-context';
import {
  ArrowLeft, MapPin, Clock, CalendarDays, Phone,
  CheckCircle, XCircle, PlayCircle, Loader, User, ShieldCheck, DollarSign
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function MaidBookingDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { showToast } = useApp();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchBookingById(resolvedParams.id);
      setBooking(data);
      setLoading(false);
    }
    load();
  }, [resolvedParams.id]);

  const handleStatusChange = async (newStatus: Booking['bookingStatus']) => {
    if (!booking) return;
    setUpdating(true);
    const success = await updateBookingStatus(booking.id, newStatus);
    if (success) {
      setBooking(prev => prev ? { ...prev, bookingStatus: newStatus } : null);
      showToast('success', 'Status Updated', `Booking status changed to ${getBookingStatusLabel(newStatus)}`);
    } else {
      showToast('error', 'Update Failed', 'Could not update booking status.');
    }
    setUpdating(false);
  };

  if (loading) {
    return (
      <AppShell role="maid" headerProps={{ title: 'Booking Details', showNotifications: true }}>
        <div className="flex items-center justify-center p-12">
          <Loader className="size-8 animate-spin text-[var(--primary-600)]" />
        </div>
      </AppShell>
    );
  }

  if (!booking) {
    return (
      <AppShell role="maid" headerProps={{ title: 'Booking Details', showNotifications: true }}>
        <div className="text-center py-12 space-y-3">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Booking Not Found</h2>
          <p className="text-sm text-[var(--text-secondary)]">The requested booking record does not exist or was removed.</p>
          <Link href="/maid/bookings">
            <Button variant="outline"><ArrowLeft className="size-4" /> Back to Bookings</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const netPayout = Math.round(booking.totalAmount * 0.95);
  const platformFee = booking.totalAmount - netPayout;

  return (
    <AppShell role="maid" headerProps={{ title: `Booking #${booking.bookingNumber}`, showNotifications: true }}>
      <div className="animate-fade-in space-y-4 max-w-2xl mx-auto">
        <Link href="/maid/bookings" className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--primary-600)] hover:underline mb-1">
          <ArrowLeft className="size-4" /> Back to All Bookings
        </Link>

        {/* Status Header Card */}
        <Card className="p-4 border-[var(--border)] bg-white shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-[var(--text-muted)] font-mono">#{booking.bookingNumber}</div>
              <h1 className="text-xl font-black text-[var(--text-primary)] mt-0.5">{booking.serviceName}</h1>
            </div>
            <span className={getBookingStatusClass(booking.bookingStatus)}>
              {getBookingStatusLabel(booking.bookingStatus)}
            </span>
          </div>
        </Card>

        {/* Customer Information Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <User className="size-4 text-[var(--primary-600)]" /> Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-[var(--gray-50)] rounded-xl border border-[var(--border-light)]">
              <div className="size-10 rounded-full bg-[var(--primary-100)] font-bold text-sm text-[var(--primary-700)] flex items-center justify-center shrink-0">
                {booking.customerName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-[var(--text-primary)]">{booking.customerName}</div>
                <div className="text-xs text-[var(--text-secondary)]">{booking.customerPhone || '+91 98765 43210'}</div>
              </div>
              {booking.customerPhone && (
                <a href={`tel:${booking.customerPhone}`} className="shrink-0">
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs font-bold">
                    <Phone className="size-3.5 text-[var(--success-600)]" /> Call Customer
                  </Button>
                </a>
              )}
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-start gap-2 text-[var(--text-secondary)]">
                <MapPin className="size-4 text-[var(--primary-500)] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[var(--text-primary)]">Service Address: </span>
                  {booking.customerAddress || 'Flat 402, Block B, Sunshine Apartments, Nehru Nagar, Bhilai'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedule & Timing Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <CalendarDays className="size-4 text-[var(--primary-600)]" /> Appointment Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-[var(--gray-50)] rounded-xl border border-[var(--border-light)] space-y-1">
              <div className="text-[11px] font-bold text-[var(--text-muted)]">Date & Time</div>
              <div className="font-bold text-sm text-[var(--text-primary)]">{formatDate(booking.date)}</div>
              <div className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                <Clock className="size-3 text-[var(--primary-500)]" /> {booking.time ? formatTime(booking.time) : '09:00 AM'} ({booking.duration || 2} hrs)
              </div>
            </div>

            <div className="p-3 bg-[var(--gray-50)] rounded-xl border border-[var(--border-light)] space-y-1">
              <div className="text-[11px] font-bold text-[var(--text-muted)]">Pricing Model</div>
              <div className="font-bold text-sm text-[var(--text-primary)] capitalize">{booking.pricingType || 'Hourly'} Rate</div>
              <div className="text-xs text-[var(--text-secondary)]">Rate: {formatINR(booking.serviceAmount)}</div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Breakdown Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <DollarSign className="size-4 text-[var(--success-600)]" /> Payout & Earnings Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-[var(--border-light)]">
              <span className="text-[var(--text-secondary)]">Total Booking Amount</span>
              <span className="font-bold text-[var(--text-primary)]">{formatINR(booking.totalAmount)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[var(--border-light)]">
              <span className="text-[var(--text-secondary)]">Platform Fee (5%)</span>
              <span className="font-semibold text-[var(--error-600)]">-{formatINR(platformFee)}</span>
            </div>
            <div className="flex justify-between py-2 text-sm font-black text-[var(--success-700)] bg-[var(--success-50)] p-2.5 rounded-xl border border-[var(--success-100)]">
              <span>Your Net Payout</span>
              <span>{formatINR(netPayout)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Maid Action Controls */}
        <Card className="p-4 border-[var(--primary-200)] bg-[var(--primary-50)]">
          <div className="space-y-3">
            <div className="text-xs font-bold text-[var(--primary-800)] flex items-center gap-2">
              <ShieldCheck className="size-4 text-[var(--primary-600)]" /> Update Booking Status
            </div>

            {booking.bookingStatus === 'awaiting_maid' && (
              <div className="flex gap-2">
                <Button
                  onClick={() => handleStatusChange('rejected')}
                  disabled={updating}
                  variant="outline"
                  className="flex-1 border-[var(--error-200)] text-[var(--error-600)] hover:bg-[var(--error-50)]"
                >
                  <XCircle className="size-4" /> Decline Request
                </Button>
                <Button
                  onClick={() => handleStatusChange('confirmed')}
                  disabled={updating}
                  className="flex-1 bg-[var(--success-600)] hover:bg-[var(--success-700)] text-white"
                >
                  <CheckCircle className="size-4" /> Accept Request
                </Button>
              </div>
            )}

            {booking.bookingStatus === 'confirmed' && (
              <Button
                onClick={() => handleStatusChange('in_progress')}
                disabled={updating}
                className="w-full bg-[var(--primary-600)] hover:bg-[var(--primary-700)] text-white gap-2 font-bold"
              >
                <PlayCircle className="size-4" /> Start Service Work
              </Button>
            )}

            {booking.bookingStatus === 'in_progress' && (
              <Button
                onClick={() => handleStatusChange('completed')}
                disabled={updating}
                className="w-full bg-[var(--success-600)] hover:bg-[var(--success-700)] text-white gap-2 font-bold"
              >
                <CheckCircle className="size-4" /> Mark Job Completed
              </Button>
            )}

            {(booking.bookingStatus === 'completed' || booking.bookingStatus === 'cancelled' || booking.bookingStatus === 'rejected') && (
              <div className="text-xs font-bold text-[var(--text-secondary)] text-center py-1">
                This booking is finalized ({getBookingStatusLabel(booking.bookingStatus)}). No further actions required.
              </div>
            )}
          </div>
        </Card>

        <div className="h-6" />
      </div>
    </AppShell>
  );
}
