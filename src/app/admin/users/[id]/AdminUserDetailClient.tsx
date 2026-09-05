'use client';

import { useState, useEffect, use } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { subscribeToUserById, updateCustomerStatus, deleteUser, updateCustomerApprovalStatus } from '@/lib/services/userService';
import { Customer } from '@/lib/types';
import { useApp } from '@/lib/app-context';
import { getApprovalStatusLabel, getApprovalStatusClass } from '@/lib/utils';
import {
  ArrowLeft, MapPin,
  ShieldAlert, CheckCircle, XCircle, Loader, BookOpen, Trash2, Clock, ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AdminUserDetailClient({ params }: PageProps) {
  const resolvedParams = use(params);
  const routeParams = useParams();
  const id = (routeParams?.id as string) || resolvedParams?.id;
  const router = useRouter();
  const { showToast } = useApp();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const unsub = subscribeToUserById(id, (liveUser) => {
      setCustomer(liveUser as unknown as Customer);
      setLoading(false);
    });
    return () => unsub();
  }, [id]);

  const handleApprove = async () => {
    if (!customer) return;
    setUpdating(true);
    const success = await updateCustomerApprovalStatus(customer.id, 'approved');
    if (success) {
      setCustomer(prev => prev ? { ...prev, approvalStatus: 'approved', status: 'active' } : null);
      showToast('success', 'Customer Approved! 🎉', `${customer.name}'s account is now approved and active.`);
    } else {
      showToast('error', 'Action Failed', 'Could not update approval status.');
    }
    setUpdating(false);
  };

  const handleReject = async () => {
    if (!customer) return;
    setUpdating(true);
    const success = await updateCustomerApprovalStatus(customer.id, 'rejected', rejectionReason.trim() || 'Declined by Administrator');
    if (success) {
      setCustomer(prev => prev ? { ...prev, approvalStatus: 'rejected', rejectionReason: rejectionReason.trim() } : null);
      showToast('warning', 'Customer Rejected', `${customer.name}'s registration has been rejected.`);
      setShowRejectModal(false);
      setRejectionReason('');
    } else {
      showToast('error', 'Action Failed', 'Could not update approval status.');
    }
    setUpdating(false);
  };

  const handleDeleteCustomer = async () => {
    if (!customer) return;
    setDeleting(true);
    const success = await deleteUser(customer.id);
    if (success) {
      showToast('info', 'Customer Deleted', `Customer ${customer.name} was removed from database.`);
      router.push('/admin/users');
    } else {
      showToast('error', 'Delete Failed', 'Failed to delete customer record.');
    }
    setDeleting(false);
    setShowDeleteModal(false);
  };

  const handleToggleStatus = async () => {
    if (!customer) return;
    setUpdating(true);
    const newStatus = customer.status === 'active' ? 'suspended' : 'active';
    const success = await updateCustomerStatus(customer.id, newStatus);
    if (success) {
      setCustomer(prev => prev ? { ...prev, status: newStatus } : null);
      showToast('success', 'User Status Updated', `Account status set to ${newStatus}`);
    } else {
      showToast('error', 'Update Failed', 'Failed to update user status.');
    }
    setUpdating(false);
  };

  if (loading) {
    return (
      <AppShell role="admin" headerProps={{ title: 'User Details', showNotifications: false }}>
        <div className="flex items-center justify-center p-12">
          <Loader className="size-8 animate-spin text-[var(--primary-600)]" />
        </div>
      </AppShell>
    );
  }

  if (!customer) {
    return (
      <AppShell role="admin" headerProps={{ title: 'User Details', showNotifications: false }}>
        <div className="text-center py-12 space-y-3">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Customer Not Found</h2>
          <p className="text-sm text-[var(--text-secondary)]">The requested customer record does not exist.</p>
          <Link href="/admin/users">
            <Button variant="outline"><ArrowLeft className="size-4" /> Back to Customers</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const isActive = customer.status === 'active';

  return (
    <AppShell role="admin" headerProps={{ title: `Customer Profile`, showNotifications: false }}>
      <div className="animate-fade-in space-y-4 max-w-2xl mx-auto">
        <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--primary-600)] hover:underline mb-1">
          <ArrowLeft className="size-4" /> Back to Customer List
        </Link>

        {/* Status Banner */}
        <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
          customer.approvalStatus === 'approved'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : customer.approvalStatus === 'rejected'
            ? 'bg-red-50 border-red-200 text-red-900'
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-center gap-2.5">
            {customer.approvalStatus === 'approved' ? (
              <ShieldCheck className="size-5 text-emerald-600 shrink-0" />
            ) : customer.approvalStatus === 'rejected' ? (
              <XCircle className="size-5 text-red-600 shrink-0" />
            ) : (
              <Clock className="size-5 text-amber-600 shrink-0" />
            )}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">Approval Status</div>
              <div className="text-sm font-extrabold capitalize">
                {getApprovalStatusLabel(customer.approvalStatus || 'pending')}
              </div>
              {customer.rejectionReason && (
                <div className="text-[11px] text-red-700 mt-0.5">Reason: {customer.rejectionReason}</div>
              )}
            </div>
          </div>
          <span className={getApprovalStatusClass(customer.approvalStatus || 'pending')}>
            {customer.approvalStatus || 'pending'}
          </span>
        </div>

        {/* Header Profile Card */}
        <Card className="p-4 border-[var(--border)] bg-white shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-full bg-[var(--primary-100)] text-[var(--primary-700)] font-bold text-lg flex items-center justify-center shrink-0">
                {customer.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-xl font-black text-[var(--text-primary)]">{customer.name}</h1>
                <div className="text-xs text-[var(--text-secondary)]">{customer.phone}</div>
                {customer.email && <div className="text-xs text-[var(--text-muted)]">{customer.email}</div>}
              </div>
            </div>
            <Badge variant={isActive ? 'success' : 'destructive'}>
              {isActive ? <CheckCircle className="size-3" /> : <XCircle className="size-3" />}
              {isActive ? 'Active User' : 'Suspended'}
            </Badge>
          </div>
        </Card>

        {/* Location & Details Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <MapPin className="size-4 text-[var(--primary-600)]" /> Address & Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-[var(--border-light)]">
              <span className="text-[var(--text-secondary)]">Area Locality</span>
              <span className="font-bold text-[var(--text-primary)]">{customer.area || 'Bhilai'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[var(--border-light)]">
              <span className="text-[var(--text-secondary)]">Full Address</span>
              <span className="font-semibold text-[var(--text-primary)]">{customer.address || 'Not provided'}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-[var(--text-secondary)]">Account Created</span>
              <span className="font-semibold text-[var(--text-primary)]">{customer.createdAt || '2026-08-01'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Bookings Activity Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <BookOpen className="size-4 text-[var(--primary-600)]" /> Booking Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-[var(--gray-50)] rounded-xl border border-[var(--border-light)]">
              <div className="text-[11px] font-bold text-[var(--text-muted)]">Total Bookings</div>
              <div className="text-xl font-black text-[var(--text-primary)] mt-1">{customer.totalBookings || 0}</div>
            </div>
            <div className="p-3 bg-[var(--gray-50)] rounded-xl border border-[var(--border-light)]">
              <div className="text-[11px] font-bold text-[var(--text-muted)]">Account Role</div>
              <div className="text-sm font-black text-[var(--primary-700)] mt-1 uppercase">Customer</div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Action Controls */}
        <Card className="p-4 border-[var(--border)] bg-[var(--gray-50)]">
          <div className="space-y-3">
            <div className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-2">
              <ShieldAlert className="size-4 text-[var(--error-600)]" /> Administrative Actions
            </div>

            {/* Approval Controls */}
            {customer.approvalStatus !== 'approved' && (
              <Button
                onClick={handleApprove}
                disabled={updating}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2"
              >
                <CheckCircle className="size-4" /> Approve Customer Account
              </Button>
            )}

            {customer.approvalStatus !== 'rejected' && (
              <Button
                onClick={() => setShowRejectModal(true)}
                disabled={updating}
                variant="outline"
                className="w-full text-amber-700 border-amber-300 hover:bg-amber-50 gap-2 font-bold"
              >
                <XCircle className="size-4" /> Reject Customer Account
              </Button>
            )}

            <Button
              onClick={handleToggleStatus}
              disabled={updating}
              variant={isActive ? 'destructive' : 'default'}
              className="w-full font-bold"
            >
              {isActive ? 'Suspend User Account' : 'Reactivate User Account'}
            </Button>
            <Button
              onClick={() => setShowDeleteModal(true)}
              disabled={updating}
              variant="outline"
              className="w-full text-red-600 border-red-200 hover:bg-red-50 gap-2 font-bold"
            >
              <Trash2 className="size-4 text-red-600" /> Delete Customer Record
            </Button>
          </div>
        </Card>

        {/* Reject Modal */}
        <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-amber-700 flex items-center gap-2">
                <XCircle className="size-5" /> Reject Customer
              </DialogTitle>
              <DialogDescription className="text-xs pt-2">
                Provide a reason for rejecting <strong>{customer.name}</strong>&apos;s application (visible to the customer):
              </DialogDescription>
            </DialogHeader>
            <div className="py-2">
              <Input
                placeholder="e.g., Incomplete address or phone verification required"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="text-xs"
              />
            </div>
            <DialogFooter className="flex gap-2 sm:justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowRejectModal(false)} disabled={updating}>
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={handleReject} disabled={updating}>
                {updating ? <Loader className="size-4 animate-spin" /> : 'Confirm Rejection'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-red-600 flex items-center gap-2">
                <Trash2 className="size-5" /> Delete Customer
              </DialogTitle>
              <DialogDescription className="text-xs pt-2">
                Are you sure you want to delete <strong>{customer.name}</strong> from Firestore? This action will permanently remove their profile.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2 sm:justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDeleteCustomer} disabled={deleting}>
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
