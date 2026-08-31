'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { subscribeToAllCustomers } from '@/lib/services/userService';
import { Customer } from '@/lib/types';
import { DataTable, Column } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';

export default function AdminUsersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToAllCustomers((liveCustomers) => {
      setCustomers(liveCustomers);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const columns: Column<Customer>[] = [
    {
      header: 'Customer',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-full bg-[var(--primary-100)] flex items-center justify-center font-bold text-sm text-[var(--primary-700)] shrink-0">
            {row.name.charAt(0)}
          </div>
          <div>
            <div className="font-bold text-[var(--text-primary)]">{row.name}</div>
            <div className="text-xs text-[var(--text-secondary)]">{row.phone}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Area',
      cell: (row) => (
        <div className="text-xs text-[var(--text-secondary)]">
          {row.area || 'Bhilai'}
        </div>
      ),
    },
    {
      header: 'Bookings',
      cell: (row) => (
        <div className="text-xs font-semibold text-[var(--text-primary)]">
          {row.totalBookings || 0}
        </div>
      ),
    },
    {
      header: 'Status',
      className: 'text-right',
      cell: (row) => {
        const isActive = row.status === 'active';
        return (
          <div className="flex justify-end">
            <Badge variant={isActive ? 'success' : 'destructive'}>
              {isActive ? <CheckCircle className="size-3" /> : <XCircle className="size-3" />}
              {isActive ? 'Active' : 'Suspended'}
            </Badge>
          </div>
        );
      },
    },
  ];

  return (
    <AppShell role="admin" headerProps={{ title: 'Manage Customers', showNotifications: false }}>
      <div className="animate-fade-in space-y-4">
        {loading ? (
          <div className="p-8 text-center text-[var(--text-secondary)] text-sm">
            Loading customer records...
          </div>
        ) : (
          <DataTable
            data={customers}
            columns={columns}
            searchPlaceholder="Search customers by name, phone or area..."
            searchKey={(row) => `${row.name} ${row.phone} ${row.area || ''}`}
            emptyStateText="No customers found."
            onRowClick={(row) => router.push(`/admin/users/${row.id}`)}
          />
        )}
        <div className="h-6" />
      </div>
    </AppShell>
  );
}
