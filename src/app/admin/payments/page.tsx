'use client';

import { useState, useEffect, useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { fetchAllBookingsAdmin } from '@/lib/services/bookingService';
import { Booking } from '@/lib/types';
import { formatINR, formatDate, getPaymentStatusLabel } from '@/lib/utils';
import { DataTable, Column } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Clock } from 'lucide-react';

export default function AdminPaymentsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const list = await fetchAllBookingsAdmin();
      setBookings(list);
      setLoading(false);
    }
    load();
  }, []);

  const paidBookings = useMemo(() => bookings.filter(b => b.paymentStatus === 'paid'), [bookings]);
  const totalRevenue = useMemo(() => paidBookings.reduce((sum, b) => sum + b.totalAmount, 0), [paidBookings]);

  const columns: Column<Booking>[] = [
    {
      header: 'Customer',
      cell: (row) => (
        <div>
          <div className="font-bold text-[var(--text-primary)]">{row.customerName}</div>
          <div className="text-xs text-[var(--text-secondary)]">{row.serviceName} • {formatDate(row.date || '')}</div>
        </div>
      ),
    },
    {
      header: 'Txn ID',
      cell: (row) => (
        <div className="font-mono text-xs text-[var(--text-secondary)]">
          {row.transactionId || row.bookingNumber}
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
        const isPaid = row.paymentStatus === 'paid';
        return (
          <div className="flex justify-end">
            <Badge variant={isPaid ? 'success' : 'default'}>
              {isPaid ? <CheckCircle className="size-3" /> : <Clock className="size-3" />}
              {getPaymentStatusLabel(row.paymentStatus)}
            </Badge>
          </div>
        );
      },
    },
  ];

  return (
    <AppShell role="admin" headerProps={{ title: 'Payments & Revenue', showNotifications: false }}>
      <div className="animate-fade-in space-y-5">
        {/* KPI Banner */}
        <Card className="border-none bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-600)] text-white shadow-md">
          <CardContent className="p-6">
            <div className="text-xs opacity-90 font-medium mb-1">Total Platform Revenue</div>
            <div className="text-3xl font-extrabold">{formatINR(totalRevenue)}</div>
            <div className="text-xs opacity-80 mt-1">{paidBookings.length} paid transactions processed</div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-[var(--text-primary)]">Transactions Log</h2>

          {loading ? (
            <div className="p-8 text-center text-[var(--text-secondary)] text-sm">
              Loading transactions log...
            </div>
          ) : (
            <DataTable
              data={bookings}
              columns={columns}
              searchPlaceholder="Search payments by ID or customer..."
              searchKey={(row) => `${row.customerName} ${row.transactionId || ''} ${row.bookingNumber}`}
              emptyStateText="No transactions found."
            />
          )}
        </div>

        <div className="h-6" />
      </div>
    </AppShell>
  );
}
