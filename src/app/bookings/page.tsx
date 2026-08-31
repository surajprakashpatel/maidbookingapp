'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { AppShell } from '@/components/layout/AppShell';
import { BookingCard, BookingCardSkeleton } from '@/components/customer/BookingCard';
import { subscribeToCustomerBookings } from '@/lib/services/bookingService';
import { Booking } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
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
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const unsub = subscribeToCustomerBookings(user.id, (liveBookings) => {
      setBookings(liveBookings);
      setIsLoading(false);
    });
    return () => unsub();
  }, [user?.id]);

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
          <div className="empty-state flex flex-col items-center justify-center p-6 text-center bg-white rounded-2xl border border-gray-100 shadow-xs space-y-3">
            <div className="w-full max-w-[200px] flex justify-center">
              <Image
                src="/illustrations/empty_state_bookings.jpg"
                alt="No Bookings"
                width={200}
                height={150}
                className="w-full h-auto object-contain rounded-xl"
              />
            </div>
            <div className="text-base font-extrabold text-[var(--text-primary)]">No {TABS[activeTab].toLowerCase()} bookings</div>
            <div className="text-xs text-[var(--text-secondary)] max-w-xs">You don&apos;t have any {TABS[activeTab].toLowerCase()} service appointments scheduled.</div>
            <Button onClick={() => router.push('/search')} className="mt-2 font-bold px-6">
              Book a Maid Service
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
