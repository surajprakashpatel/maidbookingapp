'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/lib/auth-context';
import { useApp } from '@/lib/app-context';
import { saveUserData } from '@/lib/services/userService';
import { subscribeToAllCities, subscribeToCityLocalities } from '@/lib/services/locationManagementService';
import { SUPPORTED_CITIES, SUPPORTED_AREAS } from '@/lib/mockData';
import { CityConfig, LocalityConfig } from '@/lib/types';
import { Loader2, Save, MapPin, User, Home, Mail, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { showToast } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState(SUPPORTED_CITIES[0] || 'Bhilai');
  const [area, setArea] = useState('');
  const [customArea, setCustomArea] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);

  const [cities, setCities] = useState<CityConfig[]>([]);
  const [localities, setLocalities] = useState<LocalityConfig[]>([]);

  useEffect(() => {
    const unsubCities = subscribeToAllCities((liveCities) => {
      setCities(liveCities.filter(c => c.isOperational));
    });
    return () => unsubCities();
  }, []);

  useEffect(() => {
    if (!city) return;
    const unsubLocs = subscribeToCityLocalities(city, (liveLocs) => {
      setLocalities(liveLocs.filter(l => l.isOperational));
    });
    return () => unsubLocs();
  }, [city]);

  useEffect(() => {
    if (user) {
      setName(user.name ?? '');
      setEmail(user.email ?? '');
      const userCity = user.city || user.location || 'Bhilai';
      setCity(userCity);
      setArea(user.area ?? '');
      setAddress(user.address ?? '');
    }
  }, [user]);

  const availableCityNames = cities.length > 0 ? cities.map(c => c.name) : SUPPORTED_CITIES;
  const availableAreaNames = localities.length > 0
    ? localities.map(l => l.name)
    : (SUPPORTED_AREAS[city] || SUPPORTED_AREAS['Bhilai'] || []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name.trim()) {
      showToast('error', 'Name Required', 'Please enter your full name.');
      return;
    }

    setSaving(true);
    const finalArea = area === '__custom__' ? customArea.trim() : (area || availableAreaNames[0] || 'Sector 1');
    const updatedUser = {
      ...user,
      name: name.trim(),
      email: email.trim(),
      city,
      location: city,
      area: finalArea,
      address: address.trim(),
    };

    const success = await saveUserData(updatedUser);
    setSaving(false);

    if (success) {
      updateUser(updatedUser);
      showToast('success', 'Profile Updated', 'Your details have been saved.');
    } else {
      showToast('error', 'Save Failed', 'Could not update settings.');
    }
  };

  return (
    <AppShell role={user?.role || 'customer'} headerProps={{ title: 'Settings & Profile', showBack: true }}>
      <div className="animate-fade-in space-y-4 max-w-xl mx-auto pb-10">
        <form onSubmit={handleSave} className="space-y-4">
          {/* Personal Details Card */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <User className="size-4 text-blue-600" /> Personal Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Full Name</label>
                <Input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="rounded-xl h-10 text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <Input
                    type="text"
                    disabled
                    value={user?.phone ?? ''}
                    className="pl-9 bg-slate-100 text-slate-500 rounded-xl h-10 text-xs sm:text-sm cursor-not-allowed"
                  />
                </div>
                <span className="text-[10px] text-slate-400">Mobile number is verified and tied to your login identity</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <Input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="pl-9 rounded-xl h-10 text-xs sm:text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location & Address Card */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <MapPin className="size-4 text-blue-600" /> Location & Service Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">City</label>
                  <select
                    value={city}
                    onChange={e => {
                      setCity(e.target.value);
                      setArea('');
                    }}
                    className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  >
                    {availableCityNames.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Area / Locality</label>
                  <select
                    value={area}
                    onChange={e => setArea(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  >
                    {availableAreaNames.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                    <option value="__custom__">+ Add Custom Locality</option>
                  </select>
                </div>
              </div>

              {area === '__custom__' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Custom Locality Name</label>
                  <Input
                    type="text"
                    placeholder="Enter your locality / colony"
                    value={customArea}
                    onChange={e => setCustomArea(e.target.value)}
                    className="rounded-xl h-10 text-xs sm:text-sm"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Street / Flat Address</label>
                <div className="relative">
                  <Home className="absolute left-3 top-3 size-4 text-slate-400" />
                  <textarea
                    rows={3}
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Flat / House number, Apartment building, Landmark..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 resize-none"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            disabled={saving}
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl gap-2 shadow-xs"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <><Save className="size-4" /> Save Profile</>}
          </Button>
        </form>
      </div>
    </AppShell>
  );
}

