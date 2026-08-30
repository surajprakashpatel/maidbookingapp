'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/lib/auth-context';
import { MOCK_MAIDS } from '@/lib/mockData';
import { fetchMaidBookings } from '@/lib/services/bookingService';
import { fetchMaidById } from '@/lib/services/maidService';
import { Booking, Maid } from '@/lib/types';
import { formatINRCompact, getApprovalStatusLabel } from '@/lib/utils';
import { Clock, CalendarDays, Wallet, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

export default function MaidDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [maid, setMaid] = useState<Maid>(MOCK_MAIDS[0]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    async function load() {
      if (!user) return;
      const [m, bList] = await Promise.all([
        fetchMaidById(user.id),
        fetchMaidBookings(user.id),
      ]);
      if (m) setMaid(m);
      setBookings(bList);
    }
    load();
  }, [user]);

  // Real calculated metrics from bookings
  const completedBookingsList = bookings.filter(b => b.bookingStatus === 'completed' && b.paymentStatus === 'paid');
  const monthEarnings = completedBookingsList.reduce((sum, b) => sum + b.serviceAmount, 0);

  const newBookings = bookings.filter(b => b.bookingStatus === 'awaiting_maid').length;
  const upcoming = bookings.filter(b => b.bookingStatus === 'confirmed').length;
  const completed = completedBookingsList.length;

  const profileCompletion = (() => {
    let score = 0;
    if (maid.name) score += 20;
    if (maid.profilePhoto) score += 15;
    if (maid.bio) score += 10;
    if (maid.services.length > 0) score += 15;
    if (maid.serviceAreas.length > 0) score += 10;
    if (maid.hourlyPrice || maid.dailyPrice) score += 15;
    if (maid.verificationStatus === 'verified') score += 15;
    return score;
  })();

  const badgeVariant =
    maid.approvalStatus === 'approved' ? 'success'
    : maid.approvalStatus === 'rejected' ? 'destructive'
    : 'default';

  return (
    <AppShell role="maid" headerProps={{ title: 'Dashboard', showNotifications: true }}>
      <div className="animate-fade-in space-y-4">
        {/* Welcome Banner */}
        <Card className="border-none bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-600)] text-white p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="size-14 rounded-full border-2 border-white/40 bg-white/20 flex items-center justify-center font-extrabold text-xl overflow-hidden shrink-0">
              {maid.profilePhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={maid.profilePhoto} alt={maid.name} className="size-full object-cover" />
              ) : (
                maid.name.charAt(0)
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-extrabold text-white truncate">Hello, {user?.name || maid.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={badgeVariant} className="bg-white/20 text-white border-white/30">
                  {maid.approvalStatus === 'approved' ? <ShieldCheck className="size-3" /> : <Clock className="size-3" />}
                  {getApprovalStatusLabel(maid.approvalStatus)}
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Profile Completion Indicator */}
        {profileCompletion < 100 && (
          <Card className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-[var(--text-primary)]">Profile Setup Progress</span>
              <span className="text-[var(--primary-600)]">{profileCompletion}%</span>
            </div>
            <Progress value={profileCompletion} />
            {maid.verificationStatus !== 'verified' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/maid/verification')}
                className="w-full text-xs h-8 mt-1"
              >
                Complete Identity Verification
              </Button>
            )}
          </Card>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 text-center">
            <div className="size-9 rounded-xl bg-[var(--primary-50)] text-[var(--primary-600)] flex items-center justify-center mx-auto mb-2">
              <Wallet className="size-5" />
            </div>
            <div className="text-xl font-black text-[var(--text-primary)]">{formatINRCompact(monthEarnings)}</div>
            <div className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">This Month</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="size-9 rounded-xl bg-[var(--accent-50)] text-[var(--accent-600)] flex items-center justify-center mx-auto mb-2">
              <CalendarDays className="size-5" />
            </div>
            <div className="text-xl font-black text-[var(--text-primary)]">{completed}</div>
            <div className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">Completed Jobs</div>
          </Card>
        </div>

        {/* Action Shortcuts */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={() => router.push('/maid/bookings')}
            className="h-12 justify-start gap-2 text-xs font-bold"
          >
            <CalendarDays className="size-4 text-[var(--primary-600)]" />
            View Bookings ({newBookings + upcoming})
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/maid/earnings')}
            className="h-12 justify-start gap-2 text-xs font-bold"
          >
            <Wallet className="size-4 text-[var(--success-600)]" />
            Earnings & Payouts
          </Button>
        </div>

        <div className="h-6" />
      </div>
    </AppShell>
  );
}
