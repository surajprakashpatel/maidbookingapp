'use client';

import { useState, useMemo, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { subscribeToAllMaidsAdmin, updateMaidApprovalStatus } from '@/lib/services/maidService';
import { Maid, ApprovalStatus } from '@/lib/types';
import { getApprovalStatusLabel } from '@/lib/utils';
import { CheckCircle, XCircle, ChevronRight, ShieldCheck, Clock } from 'lucide-react';
import Link from 'next/link';
import { useApp } from '@/lib/app-context';
import { DataTable, Column } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const APPROVAL_TABS: { label: string; status: ApprovalStatus | 'all' }[] = [
  { label: 'All', status: 'all' },
  { label: 'Pending', status: 'under_review' },
  { label: 'Approved', status: 'approved' },
  { label: 'Rejected', status: 'rejected' },
];

export default function AdminMaidsPage() {
  const { showToast } = useApp();
  const [activeStatus, setActiveStatus] = useState<ApprovalStatus | 'all'>('all');
  const [maids, setMaids] = useState<Maid[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToAllMaidsAdmin((liveMaids) => {
      setMaids(liveMaids);
      setLoading(false);
    }, activeStatus);

    return () => unsub();
  }, [activeStatus]);

  const filtered = useMemo(() => {
    return maids.filter(m => {
      if (activeStatus !== 'all' && m.approvalStatus !== activeStatus) return false;
      return true;
    });
  }, [maids, activeStatus]);

  const handleApprove = async (maid: Maid, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const success = await updateMaidApprovalStatus(maid.id, 'approved');
    if (success) {
      setMaids(prev => prev.map(m => m.id === maid.id ? { ...m, approvalStatus: 'approved', verificationStatus: 'verified', selfieStatus: 'verified' } : m));
      showToast('success', 'Maid Approved', `${maid.name}'s profile has been approved.`);
    } else {
      showToast('error', 'Action Failed', 'Could not update approval status.');
    }
  };

  const handleReject = async (maid: Maid, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const success = await updateMaidApprovalStatus(maid.id, 'rejected');
    if (success) {
      setMaids(prev => prev.map(m => m.id === maid.id ? { ...m, approvalStatus: 'rejected', verificationStatus: 'failed' } : m));
      showToast('error', 'Maid Rejected', `${maid.name}'s profile has been rejected.`);
    } else {
      showToast('error', 'Action Failed', 'Could not update approval status.');
    }
  };

  const columns: Column<Maid>[] = [
    {
      header: 'Maid',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-[var(--primary-100)] flex items-center justify-center font-bold text-[var(--primary-700)] shrink-0 overflow-hidden">
            {row.profilePhoto ? (
              <img src={row.profilePhoto} alt={row.name} className="size-full object-cover" />
            ) : (
              row.name.charAt(0)
            )}
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
        <div className="text-xs">
          <div className="font-medium text-[var(--text-primary)]">{row.area}</div>
          <div className="text-[var(--text-muted)]">{row.city}</div>
        </div>
      ),
    },
    {
      header: 'Services',
      cell: (row) => (
        <div className="text-xs text-[var(--text-secondary)] max-w-[150px] truncate">
          {row.services.slice(0, 2).join(', ')}
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (row) => {
        const badgeVariant =
          row.approvalStatus === 'approved'
            ? 'success'
            : row.approvalStatus === 'rejected'
            ? 'destructive'
            : 'default';
        const Icon =
          row.approvalStatus === 'approved'
            ? ShieldCheck
            : row.approvalStatus === 'rejected'
            ? XCircle
            : Clock;
        return (
          <Badge variant={badgeVariant}>
            <Icon className="size-3" />
            {getApprovalStatusLabel(row.approvalStatus)}
          </Badge>
        );
      },
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          {row.approvalStatus === 'under_review' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleReject(row, e)}
                className="text-[var(--error-600)] hover:bg-[var(--error-50)] h-8 px-2"
                title="Reject"
              >
                <XCircle className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleApprove(row, e)}
                className="text-[var(--success-600)] hover:bg-[var(--success-50)] h-8 px-2"
                title="Approve"
              >
                <CheckCircle className="size-4" />
              </Button>
            </>
          )}
          <Link href={`/admin/maids/${row.id}`}>
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <ChevronRight className="size-4 text-[var(--text-muted)]" />
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <AppShell role="admin" headerProps={{ title: 'Manage Maids', showNotifications: false }}>
      <div className="animate-fade-in space-y-4">
        {/* Status tabs */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-[var(--gray-100)] rounded-xl max-w-fit">
          {APPROVAL_TABS.map((tab) => {
            const count = maids.filter(m => tab.status === 'all' || m.approvalStatus === tab.status).length;
            return (
              <button
                key={tab.status}
                type="button"
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  activeStatus === tab.status
                    ? 'bg-white text-[var(--primary-600)] shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
                onClick={() => setActiveStatus(tab.status)}
              >
                {tab.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Maids Data Table */}
        {loading ? (
          <div className="p-8 text-center text-[var(--text-secondary)] text-sm">
            Loading maid records...
          </div>
        ) : (
          <DataTable
            data={filtered}
            columns={columns}
            searchPlaceholder="Search by maid name, phone or area..."
            searchKey={(row) => `${row.name} ${row.phone} ${row.area}`}
            emptyStateText="No maids match the selected status filter."
          />
        )}

        <div className="h-6" />
      </div>
    </AppShell>
  );
}
