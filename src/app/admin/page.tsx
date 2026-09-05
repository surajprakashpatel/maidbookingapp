'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { subscribeToAllMaidsAdmin } from '@/lib/services/maidService';
import { subscribeToAllBookingsAdmin } from '@/lib/services/bookingService';
import { subscribeToAllCustomers } from '@/lib/services/userService';
import { Maid, AdminStats, Booking, Customer } from '@/lib/types';
import { INITIAL_ADMIN_STATS } from '@/lib/mockData';
import { formatINRCompact } from '@/lib/utils';
import { Users, Shield, CalendarDays, Wallet, AlertCircle, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [maids, setMaids] = useState<Maid[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<AdminStats>(INITIAL_ADMIN_STATS);

  useEffect(() => {
    let maidsList: Maid[] = [];
    let bookingsList: Booking[] = [];
    let customersList: Customer[] = [];

    const recalculate = () => {
      const approvedMaids = maidsList.filter(m => m.approvalStatus === 'approved').length;
      const pendingMaids = maidsList.filter(m => m.approvalStatus === 'under_review' || m.approvalStatus === 'pending').length;
      const rejectedMaids = maidsList.filter(m => m.approvalStatus === 'rejected').length;
      const completedBookings = bookingsList.filter(b => b.bookingStatus === 'completed').length;
      const confirmedBookings = bookingsList.filter(b => b.bookingStatus === 'confirmed' || b.bookingStatus === 'paid').length;
      const pendingBookings = bookingsList.filter(b => b.bookingStatus === 'pending' || b.bookingStatus === 'awaiting_maid').length;
      const cancelledBookings = bookingsList.filter(b => b.bookingStatus === 'cancelled' || b.bookingStatus === 'rejected').length;
      const grossVolume = bookingsList.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

      setStats({
        customers: { total: customersList.length, newThisMonth: customersList.length },
        maids: { total: maidsList.length, approved: approvedMaids, pending: pendingMaids, rejected: rejectedMaids, suspended: 0 },
        bookings: { total: bookingsList.length, completed: completedBookings, pending: pendingBookings, confirmed: confirmedBookings, cancelled: cancelledBookings },
        revenue: { gross: grossVolume, platform: Math.round(grossVolume * 0.05), thisMonth: grossVolume, maidEarnings: Math.round(grossVolume * 0.95) },
      });
    };

    const unsubMaids = subscribeToAllMaidsAdmin((data) => {
      maidsList = data;
      setMaids(data);
      recalculate();
    });

    const unsubBookings = subscribeToAllBookingsAdmin((data) => {
      bookingsList = data;
      recalculate();
    });

    const unsubCustomers = subscribeToAllCustomers((data) => {
      customersList = data;
      setCustomers(data);
      recalculate();
    });

    return () => {
      unsubMaids();
      unsubBookings();
      unsubCustomers();
    };
  }, []);

  const pendingMaids = maids.filter(m => m.approvalStatus === 'under_review' || m.approvalStatus === 'pending');

  return (
    <AppShell role="admin" headerProps={{ title: 'Admin Overview' }}>
      <div className="animate-fade-in space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
          <Card className="border-slate-200/80 shadow-xs">
            <CardContent className="p-3.5 sm:p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500">Gross Volume</p>
                <h3 className="text-xl font-extrabold text-slate-900">{formatINRCompact(stats.revenue.gross)}</h3>
                <p className="text-[11px] text-emerald-600 font-semibold">Live Revenue</p>
              </div>
              <div className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Wallet className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-xs">
            <CardContent className="p-3.5 sm:p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500">Total Bookings</p>
                <h3 className="text-xl font-extrabold text-slate-900">{stats.bookings.total}</h3>
                <p className="text-[11px] text-blue-600 font-semibold">{stats.bookings.completed} completed</p>
              </div>
              <div className="size-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <CalendarDays className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-xs">
            <CardContent className="p-3.5 sm:p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500">Active Maids</p>
                <h3 className="text-xl font-extrabold text-slate-900">{stats.maids.approved}</h3>
                <p className="text-[11px] text-amber-600 font-semibold">{pendingMaids.length} pending</p>
              </div>
              <div className="size-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Shield className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-xs">
            <CardContent className="p-3.5 sm:p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500">Customers</p>
                <h3 className="text-xl font-extrabold text-slate-900">{stats.customers.total}</h3>
                <p className="text-[11px] text-blue-600 font-semibold">{customers.filter(c => c.status === 'active' || c.approvalStatus === 'approved').length} active</p>
              </div>
              <div className="size-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Users className="size-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Maid Verification Banner */}
        {pendingMaids.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/50 shadow-xs">
            <CardContent className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <AlertCircle className="size-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-900">
                    {pendingMaids.length} Maid Application{pendingMaids.length > 1 ? 's' : ''} Awaiting Approval
                  </h4>
                  <p className="text-xs text-amber-700">Review identity documents and verify qualifications.</p>
                </div>
              </div>
              <Link href="/admin/maids?status=under_review" className="w-full sm:w-auto">
                <Button size="sm" className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-9">
                  Review Applications
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Action Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:border-blue-300 transition-colors cursor-pointer" onClick={() => router.push('/admin/maids')}>
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-800">Maid Partners</CardTitle>
              <ChevronRight className="size-4 text-slate-400" />
            </CardHeader>
            <CardContent className="p-4 pt-0 text-xs text-slate-500">
              Manage approvals, verification documents, and active service providers.
            </CardContent>
          </Card>

          <Card className="hover:border-blue-300 transition-colors cursor-pointer" onClick={() => router.push('/admin/bookings')}>
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-800">Booking Management</CardTitle>
              <ChevronRight className="size-4 text-slate-400" />
            </CardHeader>
            <CardContent className="p-4 pt-0 text-xs text-slate-500">
              Track live appointments, dispatch status, and client fulfillment.
            </CardContent>
          </Card>

          <Card className="hover:border-blue-300 transition-colors cursor-pointer" onClick={() => router.push('/admin/users')}>
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-800">Customer Base</CardTitle>
              <ChevronRight className="size-4 text-slate-400" />
            </CardHeader>
            <CardContent className="p-4 pt-0 text-xs text-slate-500">
              View user accounts, registered locations, and booking activity.
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
