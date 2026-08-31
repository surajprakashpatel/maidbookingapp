'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { subscribeToAllBookingsAdmin } from '@/lib/services/bookingService';
import { Booking } from '@/lib/types';
import { formatDate, formatINR, getBookingStatusLabel } from '@/lib/utils';
import { DataTable, Column } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle } from 'lucide-react';

export default function AdminBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToAllBookingsAdmin((liveBookings) => {
      setBookings(liveBookings);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const columns: Column<Booking>[] = [
    {
      header: 'Booking #',
      cell: (row) => (
        <div>
          <div className="font-bold text-[var(--text-primary)] font-mono text-xs">#{row.bookingNumber}</div>
          <div className="text-[11px] text-[var(--text-muted)]">{formatDate(row.date || '')}</div>
        </div>
      ),
    },
    {
      header: 'Service & Flow',
      cell: (row) => (
        <div>
          <div className="font-bold text-[var(--text-primary)]">{row.serviceName}</div>
          <div className="text-xs text-[var(--text-secondary)]">{row.customerName} → {row.maidName}</div>
        </div>
      ),
    },
    {
      header: 'Amount',
      cell: (row) => (
        <div className="font-extrabold text-[var(--primary-700)]">
          {formatINR(row.totalAmount)}
        </div>
      ),
    },
    {
      header: 'Status',
      className: 'text-right',
      cell: (row) => {
        const isCompleted = row.bookingStatus === 'completed';
        const isCancelled = row.bookingStatus === 'cancelled';
        const variant = isCompleted ? 'success' : isCancelled ? 'destructive' : 'default';
        const Icon = isCompleted ? CheckCircle : isCancelled ? XCircle : Clock;
        return (
          <div className="flex justify-end">
            <Badge variant={variant}>
              <Icon className="size-3" />
              {getBookingStatusLabel(row.bookingStatus)}
            </Badge>
          </div>
        );
      },
    },
  ];

  return (
    <AppShell role="admin" headerProps={{ title: 'All Bookings', showNotifications: false }}>
      <div className="animate-fade-in space-y-4">
        {loading ? (
          <div className="p-8 text-center text-[var(--text-secondary)] text-sm">
            Loading booking records...
          </div>
        ) : (
          <DataTable
            data={bookings}
            columns={columns}
            searchPlaceholder="Search by booking #, maid or customer..."
            searchKey={(row) => `${row.bookingNumber} ${row.customerName} ${row.maidName} ${row.serviceName}`}
            emptyStateText="No bookings found."
            onRowClick={(row) => router.push(`/admin/bookings/${row.id}`)}
          />
        )}
        <div className="h-6" />
      </div>
    </AppShell>
  );
}
