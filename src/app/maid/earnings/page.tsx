'use client';

import { useState, useEffect, useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/lib/auth-context';
import { subscribeToMaidBookings } from '@/lib/services/bookingService';
import { Booking } from '@/lib/types';
import { formatINR, formatINRCompact, formatDate } from '@/lib/utils';
import { TrendingUp, Wallet, Clock, CheckCircle, Lightbulb, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function MaidEarningsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsub = subscribeToMaidBookings(user.id, (liveBookings) => {
      setBookings(liveBookings);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  // Derive live statistics
  const stats = useMemo(() => {
    const completedBookings = bookings.filter(b => b.bookingStatus === 'completed');
    const pendingBookings = bookings.filter(b => ['pending', 'awaiting_maid', 'confirmed', 'in_progress'].includes(b.bookingStatus));

    // Gross volume of completed jobs
    const grossCompleted = completedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    // Net earnings for maid (95%)
    const netEarnings = Math.round(grossCompleted * 0.95);
    const platformFee = grossCompleted - netEarnings;

    // Pending gross volume
    const grossPending = pendingBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const netPending = Math.round(grossPending * 0.95);

    // Current month earnings
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const thisMonthCompleted = completedBookings.filter(b => {
      const d = new Date(b.date || b.createdAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const thisMonthGross = thisMonthCompleted.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const thisMonthNet = Math.round(thisMonthGross * 0.95);

    return {
      completedCount: completedBookings.length,
      pendingCount: pendingBookings.length,
      netEarnings,
      platformFee,
      netPending,
      thisMonthNet,
    };
  }, [bookings]);

  return (
    <AppShell role="maid" headerProps={{ title: 'Earnings & Payouts', showNotifications: false }}>
      <div className="animate-fade-in space-y-5 pb-8">
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <Loader2 className="size-8 animate-spin text-blue-600 mx-auto" />
            <p className="text-xs font-semibold text-slate-500">Loading your real-time earnings data...</p>
          </div>
        ) : (
          <>
            {/* Overview cards */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-4 border-slate-200 shadow-xs">
                <div className="flex justify-between items-start">
                  <div className="size-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <Wallet className="size-5" />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    95% Net
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                  {formatINR(stats.netEarnings)}
                </div>
                <div className="text-xs text-slate-500 font-medium">Total Net Earned</div>
              </Card>

              <Card className="p-4 border-slate-200 shadow-xs">
                <div className="flex justify-between items-start">
                  <div className="size-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <TrendingUp className="size-5" />
                  </div>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                    This Month
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                  {formatINR(stats.thisMonthNet)}
                </div>
                <div className="text-xs text-slate-500 font-medium">Monthly Payout</div>
              </Card>

              <Card className="p-4 border-slate-200 shadow-xs">
                <div className="flex justify-between items-start">
                  <div className="size-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <Clock className="size-5" />
                  </div>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                    {stats.pendingCount} active
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                  {formatINR(stats.netPending)}
                </div>
                <div className="text-xs text-slate-500 font-medium">Pending Release</div>
              </Card>

              <Card className="p-4 border-slate-200 shadow-xs">
                <div className="flex justify-between items-start">
                  <div className="size-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <CheckCircle className="size-5" />
                  </div>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                    Verified
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                  {stats.completedCount}
                </div>
                <div className="text-xs text-slate-500 font-medium">Completed Jobs</div>
              </Card>
            </div>

            {/* Platform fee note */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-600 flex items-center gap-2.5">
              <Lightbulb className="size-4 text-blue-600 shrink-0" />
              <span>
                Platform retains 5% service commission per booking. Payouts are credited directly after customer job completion.
              </span>
            </div>

            {/* Real Transactions Log */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-900">Recent Service Payments</h2>

              {bookings.length === 0 ? (
                <div className="py-10 text-center bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
                  <Wallet className="size-10 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No bookings recorded yet</p>
                  <p className="text-[11px] text-slate-400">Your completed jobs and payments will appear here in real time.</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xs divide-y divide-slate-100">
                  {bookings.map((b) => {
                    const isCompleted = b.bookingStatus === 'completed';
                    const netShare = Math.round(b.totalAmount * 0.95);

                    return (
                      <div key={b.id} className="p-4 flex items-center gap-3">
                        <div className={`size-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                          isCompleted ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {isCompleted ? <CheckCircle className="size-5" /> : <Clock className="size-5" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-slate-900 truncate">{b.serviceName}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {b.customerName} • {formatDate(b.date || b.createdAt)}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">#{b.bookingNumber}</div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className={`font-extrabold text-sm ${isCompleted ? 'text-emerald-700' : 'text-amber-700'}`}>
                            +{formatINR(netShare)}
                          </div>
                          <div className="text-[10px] font-semibold text-slate-400 mt-0.5">
                            {isCompleted ? 'Credited (95%)' : 'In Progress'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

