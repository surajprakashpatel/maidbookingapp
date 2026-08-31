'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/lib/auth-context';
import { subscribeToMaidBookings } from '@/lib/services/bookingService';
import { subscribeToMaidById } from '@/lib/services/maidService';
import { Booking, Maid } from '@/lib/types';
import { formatINRCompact, getApprovalStatusLabel } from '@/lib/utils';
import { Clock, CalendarDays, Wallet, ShieldCheck, AlertCircle, AlertTriangle, UserCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

export default function MaidDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [maid, setMaid] = useState<Maid | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    const targetMaidId = user.id.startsWith('maid-') ? user.id : `maid-${user.id}`;

    const unsubMaid = subscribeToMaidById(targetMaidId, (m) => {
      if (m) setMaid(m);
    });

    const unsubBookings = subscribeToMaidBookings(targetMaidId, (bList) => {
      setBookings(bList);
    });

    return () => {
      unsubMaid();
      unsubBookings();
    };
  }, [user?.id]);

  const activeMaid: Maid = maid || {
    id: user?.id ? (user.id.startsWith('maid-') ? user.id : `maid-${user.id}`) : 'maid',
    userId: user?.id || 'maid',
    name: user?.name || 'Maid Partner',
    phone: user?.phone || '',
    gender: 'female',
    location: user?.location || 'Bhilai',
    city: user?.location || 'Bhilai',
    area: user?.area || 'Nehru Nagar',
    services: [],
    serviceAreas: [],
    workRadius: 5,
    experience: 0,
    approvalStatus: 'under_review',
    verificationStatus: 'not_submitted',
    selfieStatus: 'not_captured',
    availability: 'available',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Real calculated metrics from bookings
  const completedBookingsList = bookings.filter(b => b.bookingStatus === 'completed' && b.paymentStatus === 'paid');
  const monthEarnings = completedBookingsList.reduce((sum, b) => sum + (b.serviceAmount || 0), 0);

  const newBookings = bookings.filter(b => b.bookingStatus === 'awaiting_maid').length;
  const upcoming = bookings.filter(b => b.bookingStatus === 'confirmed').length;
  const completed = completedBookingsList.length;

  const profileCompletion = (() => {
    let score = 0;
    if (activeMaid.name) score += 20;
    if (activeMaid.profilePhoto) score += 15;
    if (activeMaid.bio) score += 10;
    if (activeMaid.services && activeMaid.services.length > 0) score += 15;
    if (activeMaid.serviceAreas && activeMaid.serviceAreas.length > 0) score += 10;
    if (activeMaid.hourlyPrice || activeMaid.dailyPrice) score += 15;
    if (activeMaid.verificationStatus === 'verified') score += 15;
    return score;
  })();

  const badgeVariant =
    activeMaid.approvalStatus === 'approved' ? 'success'
    : activeMaid.approvalStatus === 'rejected' ? 'destructive'
    : 'default';

  return (
    <AppShell role="maid" headerProps={{ title: 'Dashboard', showNotifications: true }}>
      <div className="animate-fade-in space-y-4">
        {/* Welcome Banner */}
        <Card className="border-none bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-600)] text-white p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="size-14 rounded-full border-2 border-white/40 bg-white/20 flex items-center justify-center font-extrabold text-xl overflow-hidden shrink-0">
              {activeMaid.profilePhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={activeMaid.profilePhoto} alt={activeMaid.name} className="size-full object-cover" />
              ) : (
                (user?.name || activeMaid.name).charAt(0)
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-extrabold text-white truncate">Hello, {user?.name || activeMaid.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={badgeVariant} className="bg-white/20 text-white border-white/30">
                  {activeMaid.approvalStatus === 'approved' ? <ShieldCheck className="size-3" /> : <Clock className="size-3" />}
                  {getApprovalStatusLabel(activeMaid.approvalStatus)}
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Dedicated Review State Banner */}
        {activeMaid.approvalStatus === 'under_review' && (
          <Card className="p-4 bg-amber-50 border-amber-200 text-amber-900 rounded-2xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-amber-900">Your account is under review</h3>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Your registration details and verification documents are currently being verified by the admin team. Once approved, your profile will be published for customer bookings.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Dedicated Rejected State Banner */}
        {activeMaid.approvalStatus === 'rejected' && (
          <Card className="p-4 bg-red-50 border-red-200 text-red-900 rounded-2xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="size-5 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1.5 flex-1">
                <h3 className="text-sm font-bold text-red-900">Application Needs Attention</h3>
                <p className="text-xs text-red-700 leading-relaxed">
                  {activeMaid.rejectionReason || 'Please review your verification information and update your profile to resubmit.'}
                </p>
                <Button
                  size="sm"
                  onClick={() => router.push('/maid/register')}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs h-8 font-bold"
                >
                  Update & Resubmit Profile
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Profile Completion Indicator (only for draft/incomplete prior to submission) */}
        {profileCompletion < 100 && activeMaid.approvalStatus !== 'under_review' && activeMaid.approvalStatus !== 'approved' && activeMaid.approvalStatus !== 'rejected' && (
          <Card className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-[var(--text-primary)]">Profile Setup Progress</span>
              <span className="text-[var(--primary-600)]">{profileCompletion}%</span>
            </div>
            <Progress value={profileCompletion} />
            {activeMaid.verificationStatus !== 'verified' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/maid/register')}
                className="w-full text-xs h-8 mt-1"
              >
                Complete Registration & Verification
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
