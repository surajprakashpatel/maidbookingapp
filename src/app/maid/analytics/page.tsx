'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { fetchMaidBookings } from '@/lib/services/bookingService';
import { fetchMaidById } from '@/lib/services/maidService';
import { Booking, Maid } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { formatINR } from '@/lib/utils';
import {
  TrendingUp, CalendarDays, CheckCircle, Star,
  Eye, Wallet, Award, BarChart3, Loader
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function MaidAnalyticsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [maid, setMaid] = useState<Maid | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    async function load() {
      if (!user) return;
      setLoading(true);
      const [maidData, bookingsData] = await Promise.all([
        fetchMaidById(user.id),
        fetchMaidBookings(user.id),
      ]);
      setMaid(maidData);
      setBookings(bookingsData);
      setLoading(false);
    }
    load();
  }, [user]);

  if (loading) {
    return (
      <AppShell role="maid" headerProps={{ title: 'Performance Analytics', showNotifications: true }}>
        <div className="flex items-center justify-center p-12">
          <Loader className="size-8 animate-spin text-[var(--primary-600)]" />
        </div>
      </AppShell>
    );
  }

  const completed = bookings.filter(b => b.bookingStatus === 'completed');
  const grossEarnings = completed.reduce((sum, b) => sum + b.totalAmount, 0);
  const netEarnings = Math.round(grossEarnings * 0.95);
  const completionRate = bookings.length > 0
    ? Math.round((completed.length / bookings.length) * 100)
    : 100;

  // Monthly breakdown simulation
  const monthlyData = [
    { month: 'May', earnings: Math.round(netEarnings * 0.2) },
    { month: 'Jun', earnings: Math.round(netEarnings * 0.25) },
    { month: 'Jul', earnings: Math.round(netEarnings * 0.25) },
    { month: 'Aug', earnings: Math.round(netEarnings * 0.3) },
  ];

  const maxMonthEarnings = Math.max(...monthlyData.map(m => m.earnings), 1);

  return (
    <AppShell role="maid" headerProps={{ title: 'Performance Analytics', showNotifications: true }}>
      <div className="animate-fade-in space-y-5">
        {/* Header Summary Banner */}
        <Card className="p-4 bg-gradient-to-br from-[var(--primary-700)] to-[var(--primary-900)] text-white shadow-md border-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-[var(--primary-200)] flex items-center gap-1.5">
                <BarChart3 className="size-4 text-[var(--primary-300)]" /> Performance Snapshot
              </div>
              <div className="text-2xl font-black mt-1">{formatINR(netEarnings)}</div>
              <div className="text-xs text-[var(--primary-200)] mt-0.5">Total Net Earnings</div>
            </div>
            <div className="size-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-xs">
              <TrendingUp className="size-6 text-white" />
            </div>
          </div>
        </Card>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3.5 bg-white border-[var(--border)] shadow-xs">
            <div className="size-8 rounded-xl bg-[var(--success-50)] text-[var(--success-600)] flex items-center justify-center mb-2">
              <CheckCircle className="size-4" />
            </div>
            <div className="text-xl font-black text-[var(--text-primary)]">{completionRate}%</div>
            <div className="text-xs font-bold text-[var(--text-secondary)]">Completion Rate</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{completed.length} of {bookings.length} jobs</div>
          </Card>

          <Card className="p-3.5 bg-white border-[var(--border)] shadow-xs">
            <div className="size-8 rounded-xl bg-[var(--accent-50)] text-[var(--accent-500)] flex items-center justify-center mb-2">
              <Star className="size-4" />
            </div>
            <div className="text-xl font-black text-[var(--text-primary)]">{maid?.rating || 5.0} ★</div>
            <div className="text-xs font-bold text-[var(--text-secondary)]">Customer Rating</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{maid?.totalRatings || 0} reviews</div>
          </Card>

          <Card className="p-3.5 bg-white border-[var(--border)] shadow-xs">
            <div className="size-8 rounded-xl bg-[var(--primary-50)] text-[var(--primary-600)] flex items-center justify-center mb-2">
              <CalendarDays className="size-4" />
            </div>
            <div className="text-xl font-black text-[var(--text-primary)]">{bookings.length}</div>
            <div className="text-xs font-bold text-[var(--text-secondary)] font-sans">Total Requests</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-0.5">All time bookings</div>
          </Card>

          <Card className="p-3.5 bg-white border-[var(--border)] shadow-xs">
            <div className="size-8 rounded-xl bg-[var(--gray-100)] text-[var(--text-secondary)] flex items-center justify-center mb-2">
              <Eye className="size-4" />
            </div>
            <div className="text-xl font-black text-[var(--text-primary)]">{maid?.profileViews || 42}</div>
            <div className="text-xs font-bold text-[var(--text-secondary)]">Profile Views</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-0.5">By local customers</div>
          </Card>
        </div>

        {/* Monthly Earnings Bar Graph */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Wallet className="size-4 text-[var(--primary-600)]" /> Monthly Income Trend
            </CardTitle>
            <CardDescription>Recent 4 months payout summary</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-40 flex items-end justify-between gap-3 px-2">
              {monthlyData.map(item => {
                const heightPercent = Math.max(Math.round((item.earnings / maxMonthEarnings) * 100), 15);
                return (
                  <div key={item.month} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-[10px] font-bold text-[var(--primary-700)]">{formatINR(item.earnings)}</span>
                    <div
                      className="w-full bg-[var(--primary-500)] rounded-t-lg transition-all"
                      style={{ height: `${heightPercent}%` }}
                    />
                    <span className="text-xs font-bold text-[var(--text-secondary)]">{item.month}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quality Badges */}
        <Card className="p-4 border-[var(--border)] bg-white">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-[var(--success-50)] text-[var(--success-600)] flex items-center justify-center shrink-0">
              <Award className="size-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-[var(--text-primary)]">Top Rated Maid Status</div>
              <div className="text-xs text-[var(--text-secondary)]">Maintain a high completion rate and 4.5+ rating to stay top listed in your area.</div>
            </div>
          </div>
        </Card>

        <div className="h-6" />
      </div>
    </AppShell>
  );
}
