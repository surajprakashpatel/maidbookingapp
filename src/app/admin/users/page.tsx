'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { subscribeToAllCustomers, updateCustomerApprovalStatus } from '@/lib/services/userService';
import { Customer, ApprovalStatus } from '@/lib/types';
import { getApprovalStatusLabel } from '@/lib/utils';
import { DataTable, Column } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useApp } from '@/lib/app-context';
import { CheckCircle, XCircle, Clock, ShieldCheck } from 'lucide-react';

const APPROVAL_TABS: { label: string; status: ApprovalStatus | 'all' }[] = [
  { label: 'All', status: 'all' },
  { label: 'Pending', status: 'pending' },
  { label: 'Approved', status: 'approved' },
  { label: 'Rejected', status: 'rejected' },
];

function UsersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useApp();

  const initialTab = (searchParams.get('status') as ApprovalStatus) || 'all';
  const [activeStatus, setActiveStatus] = useState<ApprovalStatus | 'all'>(initialTab);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToAllCustomers((liveCustomers) => {
      setCustomers(liveCustomers);
      setLoading(false);
    }, activeStatus);
    return () => unsub();
  }, [activeStatus]);

  const filtered = useMemo(() => {
    return customers.filter(c => {
      if (activeStatus === 'all') return true;
      if (activeStatus === 'pending') {
        return c.approvalStatus === 'pending' || c.approvalStatus === 'under_review';
      }
      return c.approvalStatus === activeStatus;
    });
  }, [customers, activeStatus]);

  const handleApprove = async (cust: Customer, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const success = await updateCustomerApprovalStatus(cust.id, 'approved');
    if (success) {
      setCustomers(prev => prev.map(c => c.id === cust.id ? { ...c, approvalStatus: 'approved', status: 'active' } : c));
      showToast('success', 'Customer Approved', `${cust.name}'s account has been approved.`);
    } else {
      showToast('error', 'Action Failed', 'Could not update approval status.');
    }
  };

  const handleReject = async (cust: Customer, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const success = await updateCustomerApprovalStatus(cust.id, 'rejected', 'Application declined by administrator');
    if (success) {
      setCustomers(prev => prev.map(c => c.id === cust.id ? { ...c, approvalStatus: 'rejected' } : c));
      showToast('warning', 'Customer Rejected', `${cust.name}'s account was rejected.`);
    } else {
      showToast('error', 'Action Failed', 'Could not update approval status.');
    }
  };

  const pendingCount = customers.filter(c => c.approvalStatus === 'pending' || c.approvalStatus === 'under_review').length;

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
            {row.email && <div className="text-[10px] text-[var(--text-muted)]">{row.email}</div>}
          </div>
        </div>
      ),
    },
    {
      header: 'Location',
      cell: (row) => (
        <div className="text-xs text-[var(--text-secondary)]">
          <div className="font-medium text-[var(--text-primary)]">{row.area || 'N/A'}</div>
          <div className="text-[10px] text-[var(--text-muted)]">{row.city || 'Bhilai'}</div>
        </div>
      ),
    },
    {
      header: 'Approval',
      cell: (row) => {
        const isApproved = row.approvalStatus === 'approved';
        const isRejected = row.approvalStatus === 'rejected';

        const variant = isApproved ? 'success' : isRejected ? 'destructive' : 'default';
        const Icon = isApproved ? ShieldCheck : isRejected ? XCircle : Clock;

        return (
          <Badge variant={variant}>
            <Icon className="size-3" />
            {getApprovalStatusLabel(row.approvalStatus || 'pending')}
          </Badge>
        );
      },
    },
    {
      header: 'Status',
      cell: (row) => {
        const isActive = row.status === 'active';
        return (
          <Badge variant={isActive ? 'outline' : 'destructive'} className="text-[10px]">
            {isActive ? 'Active' : 'Suspended'}
          </Badge>
        );
      },
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (row) => {
        const isPending = row.approvalStatus === 'pending' || row.approvalStatus === 'under_review';
        return (
          <div className="flex items-center justify-end gap-1.5">
            {isPending && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e: React.MouseEvent) => handleReject(row, e)}
                  className="text-[var(--error-600)] hover:bg-[var(--error-50)] h-8 px-2"
                  title="Reject Customer"
                >
                  <XCircle className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e: React.MouseEvent) => handleApprove(row, e)}
                  className="text-[var(--success-600)] hover:bg-[var(--success-50)] h-8 px-2"
                  title="Approve Customer"
                >
                  <CheckCircle className="size-4" />
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/admin/users/${row.id}`)}
              className="text-xs h-8 px-2.5"
            >
              Details
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="animate-fade-in space-y-4">
      {/* Filter Tabs */}
      <div className="flex border-b border-[var(--border)] overflow-x-auto gap-2">
        {APPROVAL_TABS.map((tab) => (
          <button
            key={tab.status}
            onClick={() => setActiveStatus(tab.status)}
            className={`pb-3 px-3 text-xs font-bold transition-colors whitespace-nowrap border-b-2 cursor-pointer ${
              activeStatus === tab.status
                ? 'border-[var(--primary-600)] text-[var(--primary-700)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {tab.label}
            {tab.status === 'pending' && pendingCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px]">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-8 text-center text-[var(--text-secondary)] text-sm">
          Loading customer records...
        </div>
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          searchPlaceholder="Search customers by name, phone or area..."
          searchKey={(row) => `${row.name} ${row.phone} ${row.area || ''} ${row.email || ''}`}
          emptyStateText={`No ${activeStatus === 'all' ? '' : activeStatus} customers found.`}
          onRowClick={(row) => router.push(`/admin/users/${row.id}`)}
        />
      )}
      <div className="h-6" />
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <AppShell role="admin" headerProps={{ title: 'Manage Customers', showNotifications: false }}>
      <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Loading...</div>}>
        <UsersContent />
      </Suspense>
    </AppShell>
  );
}
