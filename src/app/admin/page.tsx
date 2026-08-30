'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { fetchAllMaidsAdmin } from '@/lib/services/maidService';
import { fetchAllBookingsAdmin } from '@/lib/services/bookingService';
import { Maid } from '@/lib/types';
import { MOCK_ADMIN_STATS, MOCK_MAIDS } from '@/lib/mockData';
import { formatINRCompact } from '@/lib/utils';
import { Users, Shield, CalendarDays, Wallet, AlertCircle, ChevronRight, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [maids, setMaids] = useState<Maid[]>([]);
  const [stats, setStats] = useState(MOCK_ADMIN_STATS);

  useEffect(() => {
    async function load() {
      try {
        const [maidsList, bookingsList] = await Promise.all([
          fetchAllMaidsAdmin(),
          fetchAllBookingsAdmin(),
        ]);
        setMaids(maidsList.length > 0 ? maidsList : MOCK_MAIDS);

        const approvedMaids = maidsList.filter(m => m.approvalStatus === 'approved').length;
        const pendingMaids = maidsList.filter(m => m.approvalStatus === 'under_review').length;
        const completedBookings = bookingsList.filter(b => b.bookingStatus === 'completed').length;
        const grossVolume = bookingsList.reduce((sum, b) => sum + b.totalAmount, 0);

        setStats({
          customers: { total: 48, newThisMonth: 12 },
          maids: { total: maidsList.length || 18, approved: approvedMaids || 12, pending: pendingMaids || 3, rejected: 2, suspended: 1 },
          bookings: { total: bookingsList.length || 142, completed: completedBookings || 98, pending: 12, confirmed: 24, cancelled: 8 },
          revenue: { gross: grossVolume || 185000, platform: Math.round((grossVolume || 185000) * 0.05), thisMonth: 24500, maidEarnings: Math.round((grossVolume || 185000) * 0.95) },
        });
      } catch (err) {
        console.error('Error loading admin stats:', err);
      }
    }
    load();
  }, []);

  const pendingMaids = maids.filter(m => m.approvalStatus === 'under_review');

  return (
    <AppShell role="admin" headerProps={{ title: 'Admin Dashboard', showNotifications: true }}>
      <div className="animate-fade-in space-y-5">
        {/* Pending Approvals Alert Banner */}
        {pendingMaids.length > 0 && (
          <Card className="border-[var(--accent-200)] bg-[var(--accent-50)] text-[var(--accent-800)] p-4 rounded-2xl">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-[var(--accent-500)] text-white flex items-center justify-center shrink-0">
                  <AlertCircle className="size-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[var(--text-primary)]">
                    {pendingMaids.length} Maid Profile{pendingMaids.length > 1 ? 's' : ''} Pending Review
                  </div>
                  <div className="text-xs text-[var(--text-secondary)]">Awaiting identity & selfie verification</div>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => router.push('/admin/maids?status=under_review')}
                className="shrink-0 bg-[var(--accent-500)] hover:bg-[var(--accent-600)]"
              >
                Review Now
              </Button>
            </div>
          </Card>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Total Maids', value: stats.maids.total, sub: `${stats.maids.pending} pending approval`, icon: Shield, color: 'var(--primary-600)', href: '/admin/maids' },
            { label: 'Total Bookings', value: stats.bookings.total, sub: `${stats.bookings.completed} completed`, icon: CalendarDays, color: 'var(--success-600)', href: '/admin/bookings' },
            { label: 'Customers', value: stats.customers.total, sub: `+${stats.customers.newThisMonth} this month`, icon: Users, color: 'var(--accent-500)', href: '/admin/users' },
            { label: 'Gross Revenue', value: formatINRCompact(stats.revenue.gross), sub: `${formatINRCompact(stats.revenue.platform)} platform fee`, icon: Wallet, color: 'var(--primary-700)', href: '/admin/payments' },
          ].map(({ label, value, sub, icon: Icon, color, href }) => (
            <Link key={label} href={href} className="no-underline">
              <Card className="p-4 hover:border-[var(--primary-600)] transition-all cursor-pointer">
                <div className="size-9 rounded-xl bg-[var(--gray-100)] flex items-center justify-center mb-2" style={{ color }}>
                  <Icon className="size-5" />
                </div>
                <div className="text-xl font-black text-[var(--text-primary)]">{value}</div>
                <div className="text-xs font-bold text-[var(--text-secondary)]">{label}</div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{sub}</div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Action Rows */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold">Recent Pending Maids</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingMaids.slice(0, 3).map(m => (
              <Link key={m.id} href={`/admin/maids/${m.id}`} className="no-underline block">
                <div className="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--gray-50)] transition-colors border border-[var(--border)]">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-full bg-[var(--primary-100)] flex items-center justify-center font-bold text-xs text-[var(--primary-700)] shrink-0">
                      {m.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[var(--text-primary)]">{m.name}</div>
                      <div className="text-[11px] text-[var(--text-secondary)]">{m.area}, {m.city}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default"><Clock className="size-3" /> Pending</Badge>
                    <ChevronRight className="size-4 text-[var(--text-muted)]" />
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <div className="h-6" />
      </div>
    </AppShell>
  );
}
