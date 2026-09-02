'use client';

import { useState, useEffect, use } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { subscribeToBookingById, updateBookingStatus, deleteBooking } from '@/lib/services/bookingService';
import { Booking } from '@/lib/types';
import { formatINR, getBookingStatusLabel, getBookingStatusClass } from '@/lib/utils';
import { useApp } from '@/lib/app-context';
import {
  ArrowLeft, ShieldAlert, Loader, DollarSign, User, Shield, Trash2
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AdminBookingDetailClient({ params }: PageProps) {
  const resolvedParams = use(params);
  const routeParams = useParams();
  const id = (routeParams?.id as string) || resolvedParams?.id;
  const router = useRouter();
  const { showToast } = useApp();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const unsub = subscribeToBookingById(id, (liveBooking) => {
      setBooking(liveBooking);
      setLoading(false);
    });
    return () => unsub();
  }, [id]);

  const handleDeleteBooking = async () => {
    if (!booking) return;
    setDeleting(true);
    const success = await deleteBooking(booking.id);
    if (success) {
      showToast('info', 'Booking Deleted', `Booking #${booking.bookingNumber} was deleted from database.`);
      router.push('/admin/bookings');
    } else {
      showToast('error', 'Delete Failed', 'Failed to delete booking record.');
    }
    setDeleting(false);
    setShowDeleteModal(false);
  };

  const handleAdminOverride = async (newStatus: Booking['bookingStatus']) => {
    if (!booking) return;
    setUpdating(true);
    const success = await updateBookingStatus(booking.id, newStatus);
    if (success) {
      setBooking(prev => prev ? { ...prev, bookingStatus: newStatus } : null);
      showToast('success', 'Admin Override Applied', `Booking set to ${getBookingStatusLabel(newStatus)}`);
    } else {
      showToast('error', 'Override Failed', 'Could not update booking status.');
    }
    setUpdating(false);
  };

  if (loading) {
    return (
      <AppShell role="admin" headerProps={{ title: 'Booking Audit', showNotifications: false }}>
        <div className="flex items-center justify-center p-12">
          <Loader className="size-8 animate-spin text-[var(--primary-600)]" />
        </div>
      </AppShell>
    );
  }

  if (!booking) {
    return (
      <AppShell role="admin" headerProps={{ title: 'Booking Audit', showNotifications: false }}>
        <div className="text-center py-12 space-y-3">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Booking Record Not Found</h2>
          <p className="text-sm text-[var(--text-secondary)]">The requested booking does not exist in the database.</p>
          <Link href="/admin/bookings">
            <Button variant="outline"><ArrowLeft className="size-4" /> Back to All Bookings</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  // Use stored platformFee if present (correct); fall back to 5% calculation for legacy records
  const platformFee = booking.platformFee ?? Math.round(booking.totalAmount * 0.05);
  const maidNet = booking.serviceAmount ?? (booking.totalAmount - platformFee);

  return (
    <AppShell role="admin" headerProps={{ title: `Booking #${booking.bookingNumber}`, showNotifications: false }}>
      <div className="animate-fade-in space-y-4 max-w-2xl mx-auto">
        <Link href="/admin/bookings" className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--primary-600)] hover:underline mb-1">
          <ArrowLeft className="size-4" /> Back to Bookings List
        </Link>

        {/* Status Header */}
        <Card className="p-4 border-[var(--border)] bg-white shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-mono font-bold text-[var(--text-muted)]">ID: {booking.id}</div>
              <h1 className="text-xl font-black text-[var(--text-primary)] mt-0.5">{booking.serviceName}</h1>
            </div>
            <span className={getBookingStatusClass(booking.bookingStatus)}>
              {getBookingStatusLabel(booking.bookingStatus)}
            </span>
          </div>
        </Card>

        {/* Customer & Maid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card className="p-3.5 bg-white">
            <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <User className="size-3.5 text-[var(--primary-600)]" /> Customer Details
            </div>
            <div className="font-bold text-sm text-[var(--text-primary)]">{booking.customerName}</div>
            <div className="text-xs text-[var(--text-secondary)] mt-0.5">{booking.customerPhone || 'N/A'}</div>
            <div className="text-xs text-[var(--text-muted)] mt-1">{booking.customerAddress || booking.customerArea}</div>
          </Card>

          <Card className="p-3.5 bg-white">
            <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Shield className="size-3.5 text-[var(--success-600)]" /> Assigned Maid
            </div>
            <div className="font-bold text-sm text-[var(--text-primary)]">{booking.maidName}</div>
            <div className="text-xs text-[var(--text-secondary)] mt-0.5">Maid ID: {booking.maidId}</div>
            <Link href={`/admin/maids/${booking.maidId}`} className="text-xs font-bold text-[var(--primary-600)] hover:underline mt-1.5 inline-block">
              View Maid Profile →
            </Link>
          </Card>
        </div>

        {/* Booking & Financial Audit */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <DollarSign className="size-4 text-[var(--primary-600)]" /> Financial & Transaction Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-[var(--border-light)]">
              <span className="text-[var(--text-secondary)]">Total Customer Payment</span>
              <span className="font-extrabold text-[var(--primary-700)]">{formatINR(booking.totalAmount)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[var(--border-light)]">
              <span className="text-[var(--text-secondary)]">Platform Fee Retained (5%)</span>
              <span className="font-bold text-[var(--success-600)]">+{formatINR(platformFee)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[var(--border-light)]">
              <span className="text-[var(--text-secondary)]">Maid Net Payout (95%)</span>
              <span className="font-bold text-[var(--text-primary)]">{formatINR(maidNet)}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-[var(--text-secondary)]">Payment Status</span>
              <span className="font-bold uppercase text-[var(--success-700)]">{booking.paymentStatus || 'Paid'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Administrative Override Controls */}
        <Card className="p-4 border-[var(--error-200)] bg-[var(--error-50)]">
          <div className="space-y-3">
            <div className="text-xs font-bold text-[var(--error-800)] flex items-center gap-2">
              <ShieldAlert className="size-4 text-[var(--error-600)]" /> Admin Force Overrides
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => handleAdminOverride('completed')}
                disabled={updating}
                variant="outline"
                className="border-[var(--success-300)] text-[var(--success-700)] hover:bg-[var(--success-50)] font-bold text-xs"
              >
                Force Complete
              </Button>
              <Button
                onClick={() => handleAdminOverride('cancelled')}
                disabled={updating}
                variant="destructive"
                className="font-bold text-xs"
              >
                Force Cancel
              </Button>
            </div>
            <Button
              onClick={() => setShowDeleteModal(true)}
              disabled={updating}
              variant="outline"
              className="w-full text-red-600 border-red-200 hover:bg-red-50 gap-2 font-bold text-xs"
            >
              <Trash2 className="size-4 text-red-600" /> Delete Booking Record
            </Button>
          </div>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-red-600 flex items-center gap-2">
                <Trash2 className="size-5" /> Delete Booking
              </DialogTitle>
              <DialogDescription className="text-xs pt-2">
                Are you sure you want to delete Booking <strong>#{booking.bookingNumber}</strong> from Firestore? This action will permanently remove the booking record.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2 sm:justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDeleteBooking} disabled={deleting}>
                {deleting ? <Loader className="size-4 animate-spin" /> : 'Confirm Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="h-6" />
      </div>
    </AppShell>
  );
}
