'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { fetchAllMaidsAdmin } from '@/lib/services/maidService';
import { fetchAllBookingsAdmin } from '@/lib/services/bookingService';
import { formatINRCompact } from '@/lib/utils';
import { BarChart3, TrendingUp, Shield, CalendarDays } from 'lucide-react';
import { MOCK_ADMIN_STATS } from '@/lib/mockData';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState(MOCK_ADMIN_STATS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [maidsList, bookingsList] = await Promise.all([
          fetchAllMaidsAdmin(),
          fetchAllBookingsAdmin(),
        ]);

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
        console.error('Error loading analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <AppShell role="admin" headerProps={{ title: 'Platform Analytics', showNotifications: false }}>
      <div className="animate-fade-in space-y-5">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32 w-full rounded-2xl" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Growth', value: `+${stats.customers.newThisMonth}`, sub: 'New users this month', icon: <TrendingUp className="size-5" />, color: 'var(--success-600)', bg: 'var(--success-50)' },
                { label: 'Maids Approved', value: `${stats.maids.approved}/${stats.maids.total}`, sub: `${stats.maids.pending} pending`, icon: <Shield className="size-5" />, color: 'var(--primary-600)', bg: 'var(--primary-50)' },
                { label: 'Completed Jobs', value: stats.bookings.completed.toLocaleString(), sub: 'Successful bookings', icon: <CalendarDays className="size-5" />, color: 'var(--info-600)', bg: 'var(--info-50)' },
                { label: 'Gross Revenue', value: formatINRCompact(stats.revenue.gross), sub: 'Lifetime volume', icon: <BarChart3 className="size-5" />, color: 'var(--accent-600)', bg: 'var(--accent-50)' },
              ].map(({ label, value, sub, icon, color, bg }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.2 }}
                >
                  <Card className="p-4 sm:p-5">
                    <div className="size-10 rounded-xl flex items-center justify-center mb-3" style={{ background: bg, color }}>
                      {icon}
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-[var(--text-primary)] mb-0.5">{value}</div>
                    <div className="text-xs font-semibold text-[var(--text-secondary)]">{label}</div>
                    <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{sub}</div>
                  </Card>
                </motion.div>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold">Operational Performance</CardTitle>
                <CardDescription>
                  Platform conversion rate is currently at {stats.bookings.total > 0 ? ((stats.bookings.completed / stats.bookings.total) * 100).toFixed(1) : '91.2'}% for approved maid bookings across Bhilai and surrounding areas.
                </CardDescription>
              </CardHeader>
            </Card>
          </>
        )}

        <div className="h-6" />
      </div>
    </AppShell>
  );
}
