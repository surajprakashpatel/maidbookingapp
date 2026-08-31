'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/lib/auth-context';
import { useApp } from '@/lib/app-context';
import { fetchMaidById } from '@/lib/services/maidService';
import { Maid } from '@/lib/types';
import {
  Shield, Bell, MapPin, DollarSign,
  Loader, ChevronRight, Power, HelpCircle
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

export default function MaidSettingsPage() {
  const { user, logout } = useAuth();
  const { showToast } = useApp();
  const [loading, setLoading] = useState(true);
  const [maid, setMaid] = useState<Maid | null>(null);
  const [available, setAvailable] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [smsNotifs, setSmsNotifs] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) return;
      setLoading(true);
      const data = await fetchMaidById(user.id);
      setMaid(data);
      if (data) {
        setAvailable(data.availability === 'available');
      }
      setLoading(false);
    }
    load();
  }, [user]);

  const handleToggleAvailability = async (checked: boolean) => {
    setAvailable(checked);
    if (maid?.id) {
      const { updateMaidProfile } = await import('@/lib/services/maidService');
      await updateMaidProfile(maid.id, { availability: checked ? 'available' : 'busy' });
    }
    showToast(
      'info',
      checked ? 'Available for Bookings' : 'Set to Busy / Off Duty',
      checked ? 'Customers in your area can now book your services.' : 'You will not receive new booking requests.'
    );
  };

  if (loading) {
    return (
      <AppShell role="maid" headerProps={{ title: 'Maid Settings', showNotifications: true }}>
        <div className="flex items-center justify-center p-12">
          <Loader className="size-8 animate-spin text-[var(--primary-600)]" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role="maid" headerProps={{ title: 'Settings & Preferences', showNotifications: true }}>
      <div className="animate-fade-in space-y-4 max-w-2xl mx-auto">
        {/* Profile Card Header */}
        <Card className="p-4 bg-white border-[var(--border)] shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-full bg-[var(--primary-100)] text-[var(--primary-700)] flex items-center justify-center font-bold text-lg shrink-0">
              {maid?.name?.charAt(0) || user?.name?.charAt(0) || 'M'}
            </div>
            <div>
              <div className="font-bold text-base text-[var(--text-primary)]">{maid?.name || user?.name}</div>
              <div className="text-xs text-[var(--text-secondary)]">{maid?.phone || user?.phone}</div>
              <div className="text-[11px] font-semibold text-[var(--primary-600)] mt-0.5 capitalize">
                Status: {maid?.approvalStatus === 'approved' ? 'Approved Service Provider' : 'Under Review'}
              </div>
            </div>
          </div>
          <Link href="/maid/profile">
            <Button variant="outline" size="sm">Edit Profile</Button>
          </Link>
        </Card>

        {/* Availability Toggle */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Power className="size-4 text-[var(--primary-600)]" /> Work Availability
            </CardTitle>
            <CardDescription>Control whether you are currently accepting new bookings</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex items-center justify-between p-3 bg-[var(--gray-50)] rounded-xl border border-[var(--border-light)]">
              <div>
                <div className="text-xs font-bold text-[var(--text-primary)]">Accepting Bookings</div>
                <div className="text-[11px] text-[var(--text-secondary)]">
                  {available ? 'Online — Visible in search results' : 'Offline — Hidden from booking search'}
                </div>
              </div>
              <Switch checked={available} onCheckedChange={handleToggleAvailability} />
            </div>
          </CardContent>
        </Card>

        {/* Quick Settings Links */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">Manage Account Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 pt-1">
            {[
              { label: 'Work Areas & Radius', desc: `${maid?.serviceAreas?.length || 1} areas configured`, icon: MapPin, href: '/maid/profile' },
              { label: 'Services & Rate Cards', desc: 'Manage your hourly, daily, and monthly rates', icon: DollarSign, href: '/maid/profile' },
              { label: 'Identity & Aadhaar Verification', desc: `Status: ${maid?.verificationStatus || 'Verified'}`, icon: Shield, href: '/maid/verification' },
              { label: 'Help & FAQ Center', desc: 'Get instant support or view policies', icon: HelpCircle, href: '/help' },
            ].map(item => (
              <Link key={item.label} href={item.href} className="no-underline block">
                <div className="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--gray-50)] transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-[var(--gray-100)] text-[var(--text-primary)] flex items-center justify-center shrink-0">
                      <item.icon className="size-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[var(--text-primary)]">{item.label}</div>
                      <div className="text-[11px] text-[var(--text-secondary)]">{item.desc}</div>
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-[var(--text-muted)]" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Bell className="size-4 text-[var(--primary-600)]" /> Notification Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-[var(--text-primary)]">Push Notifications</div>
                <div className="text-[11px] text-[var(--text-secondary)]">Instant alerts for new booking requests</div>
              </div>
              <Switch checked={pushNotifs} onCheckedChange={setPushNotifs} />
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-[var(--border-light)]">
              <div>
                <div className="font-bold text-[var(--text-primary)]">SMS Notifications</div>
                <div className="text-[11px] text-[var(--text-secondary)]">Receive booking updates via SMS</div>
              </div>
              <Switch checked={smsNotifs} onCheckedChange={setSmsNotifs} />
            </div>
          </CardContent>
        </Card>

        {/* Logout */}
        <Button
          onClick={logout}
          variant="outline"
          className="w-full h-11 border-[var(--error-200)] text-[var(--error-600)] hover:bg-[var(--error-50)] font-bold"
        >
          Sign Out of Account
        </Button>

        <div className="h-6" />
      </div>
    </AppShell>
  );
}
