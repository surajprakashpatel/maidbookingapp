'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useApp } from '@/lib/app-context';
import { fetchAppSettings, updateAppSettings } from '@/lib/services/settingsService';
import { AppSettings } from '@/lib/types';
import { DEFAULT_APP_SETTINGS } from '@/lib/mockData';
import { Loader, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function AdminSettingsPage() {
  const { showToast } = useApp();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const s = await fetchAppSettings();
      setSettings(s);
      setLoading(false);
    }
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    const success = await updateAppSettings(settings);
    setSaving(false);
    if (success) {
      showToast('success', 'Settings saved!', 'Platform settings updated in Firestore.');
    } else {
      showToast('error', 'Save Failed', 'Could not save settings to Firestore.');
    }
  };

  if (loading) {
    return (
      <AppShell role="admin" headerProps={{ title: 'Platform Settings', showNotifications: false }}>
        <div className="py-12 text-center">
          <Loader size={28} className="animate-spin text-[var(--primary-600)] mx-auto mb-3" />
          <div className="text-[var(--text-secondary)] text-sm font-medium">Loading platform settings...</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role="admin" headerProps={{ title: 'Platform Settings', showNotifications: false }}>
      <div className="animate-fade-in space-y-5">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="pricing">Pricing & Fees</TabsTrigger>
            <TabsTrigger value="registration">Maid Rules</TabsTrigger>
            <TabsTrigger value="support">Support Contact</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold">General Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">App Name</label>
                  <Input
                    type="text"
                    value={settings.general.appName}
                    onChange={e => setSettings(prev => ({ ...prev, general: { ...prev.general, appName: e.target.value } }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">App Description</label>
                  <Input
                    type="text"
                    value={settings.general.appDescription}
                    onChange={e => setSettings(prev => ({ ...prev, general: { ...prev.general, appDescription: e.target.value } }))}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold">Pricing & Commission</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">Platform Fee (%)</label>
                  <Input
                    type="number"
                    value={settings.pricing.platformFeePercent}
                    onChange={e => setSettings(prev => ({ ...prev, pricing: { ...prev.pricing, platformFeePercent: Number(e.target.value) } }))}
                  />
                  <span className="text-[11px] text-[var(--text-muted)]">Applied to customer total amount</span>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">GST / Tax (%)</label>
                  <Input
                    type="number"
                    value={settings.pricing.taxPercent}
                    onChange={e => setSettings(prev => ({ ...prev, pricing: { ...prev.pricing, taxPercent: Number(e.target.value) } }))}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="registration" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold">Maid Registration Rules</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--gray-50)] border border-[var(--border)]">
                  <div>
                    <div className="text-sm font-semibold text-[var(--text-primary)]">Admin Approval Required</div>
                    <div className="text-xs text-[var(--text-secondary)] font-normal">Profiles must be reviewed before publishing</div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings.maid.approvalRequired}
                    className={`toggle ${settings.maid.approvalRequired ? 'on' : ''}`}
                    onClick={() => setSettings(prev => ({ ...prev, maid: { ...prev.maid, approvalRequired: !prev.maid.approvalRequired } }))}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="support" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold">Support Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">Support Email</label>
                  <Input
                    type="email"
                    value={settings.general.supportEmail}
                    onChange={e => setSettings(prev => ({ ...prev, general: { ...prev.general, supportEmail: e.target.value } }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">Support Phone</label>
                  <Input
                    type="text"
                    value={settings.general.supportPhone}
                    onChange={e => setSettings(prev => ({ ...prev, general: { ...prev.general, supportPhone: e.target.value } }))}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Button onClick={save} disabled={saving} className="w-full h-12 text-base font-bold">
          {saving ? <Loader className="size-5 animate-spin" /> : <><Save className="size-5" /> Save All Settings</>}
        </Button>

        <div className="h-6" />
      </div>
    </AppShell>
  );
}
