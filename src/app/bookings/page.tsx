'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { BookingCard, BookingCardSkeleton } from '@/components/customer/BookingCard';
import { fetchCustomerBookings } from '@/lib/services/bookingService';
import { Booking } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TABS = ['Upcoming', 'Active', 'Completed', 'Cancelled'];

const TAB_STATUSES = {
  Upcoming:  ['pending', 'awaiting_maid', 'confirmed', 'payment_pending', 'paid'],
  Active:    ['in_progress'],
  Completed: ['completed'],
  Cancelled: ['cancelled', 'rejected', 'expired'],
};

export default function BookingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    async function load() {
      if (!user) return;
      setIsLoading(true);
      const list = await fetchCustomerBookings(user.id);
      setBookings(list);
      setIsLoading(false);
    }
    load();
  }, [user]);

  const currentStatuses = TAB_STATUSES[TABS[activeTab] as keyof typeof TAB_STATUSES];
  const filtered = bookings.filter(b => currentStatuses.includes(b.bookingStatus));

  return (
    <AppShell role="customer" headerProps={{ title: 'My Bookings', showNotifications: true }}>
      <div className="animate-fade-in space-y-4">
        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-[var(--gray-100)] rounded-xl">
          {TABS.map((tab, i) => {
            const count = bookings.filter(b => (TAB_STATUSES[tab as keyof typeof TAB_STATUSES]).includes(b.bookingStatus)).length;
            return (
              <button
                key={tab}
                type="button"
                className={`flex-1 min-w-[70px] px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap text-center ${
                  activeTab === i
                    ? 'bg-white text-[var(--primary-600)] shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
                onClick={() => setActiveTab(i)}
              >
                {tab} ({count})
              </button>
            );
          })}
        </div>

        {/* Bookings list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <BookingCardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <CalendarDays size={36} style={{ color: 'var(--gray-400)' }} />
            </div>
            <div className="empty-state-title">No {TABS[activeTab].toLowerCase()} bookings</div>
            <div className="empty-state-desc">You don&apos;t have any {TABS[activeTab].toLowerCase()} service appointments.</div>
            <Button onClick={() => router.push('/search')} className="mt-3">
              Book a Service
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(b => (
              <BookingCard key={b.id} booking={b} />
            ))}
          </div>
        )}

        <div className="h-6" />
      </div>
    </AppShell>
  );
}
