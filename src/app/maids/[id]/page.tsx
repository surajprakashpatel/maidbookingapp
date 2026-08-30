'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { fetchMaidById } from '@/lib/services/maidService';
import { Maid } from '@/lib/types';
import { formatINR } from '@/lib/utils';
import {
  MapPin, CheckCircle, Shield,
  Languages, Briefcase, UserX, Calendar, Star
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

export default function MaidProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [maid, setMaid] = useState<Maid | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const m = await fetchMaidById(id);
      setMaid(m);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <AppShell role="customer" headerProps={{ title: 'Maid Profile', showBack: true }}>
        <div className="space-y-4">
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </AppShell>
    );
  }

  if (!maid) {
    return (
      <AppShell role="customer" headerProps={{ title: 'Maid Profile', showBack: true }}>
        <div className="empty-state">
          <div className="empty-state-icon"><UserX size={36} style={{ color: 'var(--gray-400)' }} /></div>
          <div className="empty-state-title">Maid not found</div>
          <Button onClick={() => router.push('/home')} className="mt-3">Back to Home</Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role="customer" headerProps={{ title: maid.name, showBack: true }}>
      <div className="animate-fade-in space-y-5">
        {/* Profile Card Banner */}
        <Card className="border-none bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-600)] text-white p-6 rounded-3xl shadow-md">
          <div className="flex items-center gap-4">
            <div className="size-20 rounded-full border-3 border-white/40 bg-white/20 flex items-center justify-center font-bold text-2xl overflow-hidden shrink-0">
              {maid.profilePhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={maid.profilePhoto} alt={maid.name} className="size-full object-cover" />
              ) : (
                maid.name.charAt(0)
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-white truncate">{maid.name}</h1>
                <Badge variant="success" className="bg-white/20 text-white border-white/30">
                  <Shield className="size-3 text-white" /> Verified
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-xs text-white/80 mt-1">
                <MapPin className="size-3.5" /> {maid.area}, {maid.city}
              </div>
              <div className="flex items-center gap-3 text-xs text-white/90 font-medium mt-2">
                <span className="flex items-center gap-1"><Briefcase className="size-3.5" /> {maid.experience} yrs exp</span>
                <span className="flex items-center gap-1"><Star className="size-3.5 fill-amber-300 text-amber-300" /> {maid.rating || 4.8}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Pricing Rates Grid */}
        <div className="grid grid-cols-3 gap-2.5">
          <Card className="text-center p-3">
            <div className="text-[11px] text-[var(--text-muted)] font-medium">Hourly</div>
            <div className="text-base font-extrabold text-[var(--primary-700)] mt-1">
              {maid.hourlyPrice ? formatINR(maid.hourlyPrice) : 'N/A'}
            </div>
          </Card>
          <Card className="text-center p-3">
            <div className="text-[11px] text-[var(--text-muted)] font-medium">Daily</div>
            <div className="text-base font-extrabold text-[var(--primary-700)] mt-1">
              {maid.dailyPrice ? formatINR(maid.dailyPrice) : 'N/A'}
            </div>
          </Card>
          <Card className="text-center p-3">
            <div className="text-[11px] text-[var(--text-muted)] font-medium">Monthly</div>
            <div className="text-base font-extrabold text-[var(--primary-700)] mt-1">
              {maid.monthlyPrice ? formatINR(maid.monthlyPrice) : 'N/A'}
            </div>
          </Card>
        </div>

        {/* Profile Tabs */}
        <Tabs defaultValue="services" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="services" className="flex-1">Services</TabsTrigger>
            <TabsTrigger value="about" className="flex-1">About & Skills</TabsTrigger>
            <TabsTrigger value="verification" className="flex-1">Verification</TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold">Services Provided</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {maid.services.map(s => (
                    <Badge key={s} variant="secondary" className="px-3 py-1 text-xs">
                      <CheckCircle className="size-3 text-[var(--success-600)]" /> {s}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="about" className="mt-4 space-y-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold">Bio & Experience</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                  {maid.bio || 'Experienced maid with proven track record in Bhilai.'}
                </p>
                <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                  <Languages className="size-4 text-[var(--primary-600)] shrink-0" />
                  <span>Languages: {maid.languages?.join(', ') || 'Hindi'}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="verification" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold">Verification Checklist</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                <div className="flex items-center justify-between p-2.5 bg-[var(--success-50)] rounded-xl text-xs text-[var(--success-700)] font-semibold">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="size-4 text-[var(--success-600)]" />
                    <span>Aadhaar ID Verified ({maid.aadhaarMasked || 'XXXX-XXXX-1234'})</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-[var(--success-50)] rounded-xl text-xs text-[var(--success-700)] font-semibold">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="size-4 text-[var(--success-600)]" />
                    <span>Live Camera Selfie Verified</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-[var(--success-50)] rounded-xl text-xs text-[var(--success-700)] font-semibold">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="size-4 text-[var(--success-600)]" />
                    <span>Admin Background Approval</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* CTA Button */}
        <Button
          onClick={() => router.push(`/booking?maidId=${maid.id}`)}
          className="w-full h-12 text-base font-bold shadow-md"
        >
          <Calendar className="size-5" /> Book {maid.name} Now
        </Button>

        <div className="h-6" />
      </div>
    </AppShell>
  );
}
