'use client';

import { useState, useEffect, useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useApp } from '@/lib/app-context';
import { CityConfig, LocalityConfig } from '@/lib/types';
import {
  subscribeToAllCities,
  subscribeToAllLocalities,
  addCity,
  updateCity,
  toggleCityOperational,
  addLocality,
  updateLocality,
  toggleLocalityOperational,
  deleteLocality,
} from '@/lib/services/locationManagementService';
import {
  MapPin,
  Building2,
  Plus,
  Search,
  XCircle,
  Edit2,
  Trash2,
  ArrowLeft,
  ChevronRight,
  Filter,
  X,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export default function AdminLocationsPage() {
  const { showToast } = useApp();

  const [cities, setCities] = useState<CityConfig[]>([]);
  const [localities, setLocalities] = useState<LocalityConfig[]>([]);
  const [loading, setLoading] = useState(true);

  // Active view: null means viewing all cities, string means viewing localities for that city
  const [selectedCityName, setSelectedCityName] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'operational' | 'disabled'>('all');

  // Modals state
  const [showAddCityModal, setShowAddCityModal] = useState(false);
  const [showEditCityModal, setShowEditCityModal] = useState(false);
  const [editingCity, setEditingCity] = useState<CityConfig | null>(null);

  const [showAddLocalityModal, setShowAddLocalityModal] = useState(false);
  const [showEditLocalityModal, setShowEditLocalityModal] = useState(false);
  const [editingLocality, setEditingLocality] = useState<LocalityConfig | null>(null);

  // Form states
  const [cityNameInput, setCityNameInput] = useState('');
  const [cityStateInput, setCityStateInput] = useState('Chhattisgarh');
  const [cityOperationalInput, setCityOperationalInput] = useState(true);

  const [localityNameInput, setLocalityNameInput] = useState('');
  const [localityCityInput, setLocalityCityInput] = useState('');
  const [localityOperationalInput, setLocalityOperationalInput] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Subscribe to real-time cities & localities
  useEffect(() => {
    setLoading(true);
    const unsubCities = subscribeToAllCities((citiesData) => {
      setCities(citiesData);
      setLoading(false);
    });

    const unsubLocs = subscribeToAllLocalities((localitiesData) => {
      setLocalities(localitiesData);
    });

    return () => {
      unsubCities();
      unsubLocs();
    };
  }, []);

  // Compute metrics
  const stats = useMemo(() => {
    const totalCities = cities.length;
    const operationalCities = cities.filter((c) => c.isOperational).length;
    const totalLocalities = localities.length;
    const operationalLocalities = localities.filter((l) => l.isOperational).length;
    const pendingCustomRequests = localities.filter((l) => l.status === 'pending').length;

    return {
      totalCities,
      operationalCities,
      totalLocalities,
      operationalLocalities,
      pendingCustomRequests,
    };
  }, [cities, localities]);

  // Filtered Cities list
  const filteredCities = useMemo(() => {
    return cities.filter((c) => {
      if (statusFilter === 'operational' && !c.isOperational) return false;
      if (statusFilter === 'disabled' && c.isOperational) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return c.name.toLowerCase().includes(q) || c.state.toLowerCase().includes(q);
      }
      return true;
    });
  }, [cities, statusFilter, searchQuery]);

  // Localities for selected city
  const selectedCityLocalities = useMemo(() => {
    if (!selectedCityName) return [];
    return localities.filter((l) => l.cityName.toLowerCase() === selectedCityName.toLowerCase());
  }, [localities, selectedCityName]);

  // Filtered Localities list
  const filteredLocalities = useMemo(() => {
    return selectedCityLocalities.filter((l) => {
      if (statusFilter === 'operational' && !l.isOperational) return false;
      if (statusFilter === 'disabled' && l.isOperational) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return l.name.toLowerCase().includes(q);
      }
      return true;
    });
  }, [selectedCityLocalities, statusFilter, searchQuery]);

  // Reset form error when modals close
  const resetForm = () => {
    setFormError('');
    setCityNameInput('');
    setCityStateInput('Chhattisgarh');
    setCityOperationalInput(true);
    setLocalityNameInput('');
    setLocalityCityInput(selectedCityName || (cities[0]?.name ?? 'Bhilai'));
    setLocalityOperationalInput(true);
    setEditingCity(null);
    setEditingLocality(null);
  };

  // ----------------------------------------------------------------------
  // CITY HANDLERS
  // ----------------------------------------------------------------------

  const handleOpenAddCity = () => {
    resetForm();
    setShowAddCityModal(true);
  };

  const handleAddCitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!cityNameInput.trim()) {
      setFormError('Please enter city name.');
      return;
    }

    setSubmitting(true);
    const res = await addCity(cityNameInput.trim(), cityStateInput.trim(), cityOperationalInput);
    setSubmitting(false);

    if (res.success) {
      showToast('success', 'City Added', `"${cityNameInput.trim()}" is now registered.`);
      setShowAddCityModal(false);
      resetForm();
    } else {
      setFormError(res.error || 'Failed to add city.');
    }
  };

  const handleOpenEditCity = (city: CityConfig) => {
    resetForm();
    setEditingCity(city);
    setCityNameInput(city.name);
    setCityStateInput(city.state || 'Chhattisgarh');
    setCityOperationalInput(city.isOperational);
    setShowEditCityModal(true);
  };

  const handleEditCitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCity) return;
    setFormError('');

    setSubmitting(true);
    const res = await updateCity(editingCity.id, {
      name: cityNameInput.trim(),
      state: cityStateInput.trim(),
      isOperational: cityOperationalInput,
    });
    setSubmitting(false);

    if (res.success) {
      showToast('success', 'City Updated', `Changes saved for "${cityNameInput.trim()}".`);
      setShowEditCityModal(false);
      resetForm();
    } else {
      setFormError(res.error || 'Failed to update city.');
    }
  };

  const handleToggleCityStatus = async (city: CityConfig) => {
    const nextState = !city.isOperational;
    const res = await toggleCityOperational(city.id, nextState);
    if (res.success) {
      showToast(
        'info',
        `City ${nextState ? 'Activated' : 'Disabled'}`,
        `"${city.name}" is now ${nextState ? 'Operational' : 'Disabled'}.`
      );
    } else {
      showToast('error', 'Update Failed', res.error || 'Could not update status.');
    }
  };

  // ----------------------------------------------------------------------
  // LOCALITY HANDLERS
  // ----------------------------------------------------------------------

  const handleOpenAddLocality = () => {
    resetForm();
    setLocalityCityInput(selectedCityName || cities[0]?.name || 'Bhilai');
    setShowAddLocalityModal(true);
  };

  const handleAddLocalitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!localityCityInput) {
      setFormError('Please select a city.');
      return;
    }
    if (!localityNameInput.trim()) {
      setFormError('Please enter locality name.');
      return;
    }

    setSubmitting(true);
    const res = await addLocality(localityCityInput, localityNameInput.trim(), localityOperationalInput, false);
    setSubmitting(false);

    if (res.success) {
      showToast('success', 'Locality Added', `"${localityNameInput.trim()}" added to ${localityCityInput}.`);
      setShowAddLocalityModal(false);
      resetForm();
    } else {
      setFormError(res.error || 'Failed to add locality.');
    }
  };

  const handleOpenEditLocality = (loc: LocalityConfig) => {
    resetForm();
    setEditingLocality(loc);
    setLocalityNameInput(loc.name);
    setLocalityCityInput(loc.cityName);
    setLocalityOperationalInput(loc.isOperational);
    setShowEditLocalityModal(true);
  };

  const handleEditLocalitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLocality) return;
    setFormError('');

    setSubmitting(true);
    const res = await updateLocality(editingLocality.id, {
      name: localityNameInput.trim(),
      cityName: localityCityInput,
      isOperational: localityOperationalInput,
      status: 'approved',
    });
    setSubmitting(false);

    if (res.success) {
      showToast('success', 'Locality Updated', `Updated "${localityNameInput.trim()}".`);
      setShowEditLocalityModal(false);
      resetForm();
    } else {
      setFormError(res.error || 'Failed to update locality.');
    }
  };

  const handleToggleLocalityStatus = async (loc: LocalityConfig) => {
    const nextState = !loc.isOperational;
    const res = await toggleLocalityOperational(loc.id, nextState);
    if (res.success) {
      showToast(
        'info',
        `Locality ${nextState ? 'Activated' : 'Disabled'}`,
        `"${loc.name}" is now ${nextState ? 'Operational' : 'Disabled'}.`
      );
    } else {
      showToast('error', 'Update Failed', res.error || 'Could not update status.');
    }
  };

  const handleDeleteLocality = async (loc: LocalityConfig) => {
    if (!confirm(`Are you sure you want to remove "${loc.name}"?`)) return;
    const res = await deleteLocality(loc.id);
    if (res.success) {
      showToast('success', 'Locality Removed', `"${loc.name}" was removed.`);
    } else {
      showToast('error', 'Delete Failed', res.error || 'Could not remove locality.');
    }
  };

  return (
    <AppShell role="admin" headerProps={{ title: 'Location Management' }}>
      <div className="animate-fade-in space-y-6 pb-12">
        {/* Header & Subtitle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              {selectedCityName && (
                <button
                  type="button"
                  onClick={() => setSelectedCityName(null)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl transition-colors cursor-pointer mr-1"
                >
                  <ArrowLeft className="size-3.5" /> All Cities
                </button>
              )}
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {selectedCityName ? `Localities in ${selectedCityName}` : 'Operational Locations'}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {selectedCityName
                ? `Manage localities and availability for ${selectedCityName}.`
                : 'Control operational cities and localities served across MaidEasy.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!selectedCityName ? (
              <Button
                onClick={handleOpenAddCity}
                className="gap-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-sm cursor-pointer"
              >
                <Plus className="size-4" /> Add City
              </Button>
            ) : (
              <Button
                onClick={handleOpenAddLocality}
                className="gap-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-sm cursor-pointer"
              >
                <Plus className="size-4" /> Add Locality to {selectedCityName}
              </Button>
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <Card className="border-slate-200/80 shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500">Operational Cities</p>
                <h3 className="text-xl font-extrabold text-slate-900">
                  {stats.operationalCities} <span className="text-xs font-medium text-slate-400">/ {stats.totalCities}</span>
                </h3>
              </div>
              <div className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Building2 className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500">Operational Localities</p>
                <h3 className="text-xl font-extrabold text-slate-900">
                  {stats.operationalLocalities} <span className="text-xs font-medium text-slate-400">/ {stats.totalLocalities}</span>
                </h3>
              </div>
              <div className="size-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <MapPin className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500">Disabled Cities</p>
                <h3 className="text-xl font-extrabold text-amber-600">
                  {stats.totalCities - stats.operationalCities}
                </h3>
              </div>
              <div className="size-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <XCircle className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500">Custom Requests</p>
                <h3 className="text-xl font-extrabold text-purple-600">
                  {stats.pendingCustomRequests}
                </h3>
              </div>
              <div className="size-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Sparkles className="size-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              type="text"
              placeholder={selectedCityName ? `Search locality in ${selectedCityName}...` : 'Search city or state...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 text-xs sm:text-sm border-slate-200 rounded-xl focus-visible:ring-2 focus-visible:ring-blue-600 bg-slate-50/50 focus:bg-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto shrink-0">
            <Filter className="size-3.5 text-slate-400 shrink-0" />
            {(['all', 'operational', 'disabled'] as const).map((filterKey) => (
              <button
                key={filterKey}
                type="button"
                onClick={() => setStatusFilter(filterKey)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors cursor-pointer ${
                  statusFilter === filterKey
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {filterKey}
              </button>
            ))}
          </div>
        </div>

        {/* MAIN VIEW: CITIES OR LOCALITIES */}
        {loading ? (
          <div className="py-12 text-center space-y-3">
            <Loader2 className="size-8 animate-spin text-blue-600 mx-auto" />
            <p className="text-xs font-semibold text-slate-500">Loading location data from server...</p>
          </div>
        ) : !selectedCityName ? (
          /* ================= CITY LIST VIEW ================= */
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCities.map((city) => {
                const cityLocs = localities.filter(
                  (l) => l.cityName.toLowerCase() === city.name.toLowerCase()
                );
                const opCount = cityLocs.filter((l) => l.isOperational).length;

                return (
                  <Card
                    key={city.id}
                    className={`border transition-all duration-200 rounded-3xl overflow-hidden ${
                      city.isOperational
                        ? 'border-slate-200/80 bg-white hover:shadow-md'
                        : 'border-amber-200 bg-amber-50/20'
                    }`}
                  >
                    <CardHeader className="p-5 pb-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className={`size-10 rounded-2xl flex items-center justify-center font-bold text-base shrink-0 ${
                            city.isOperational ? 'bg-blue-50 text-blue-600' : 'bg-amber-100 text-amber-700'
                          }`}>
                            <Building2 className="size-5" />
                          </div>
                          <div>
                            <CardTitle className="text-base font-extrabold text-slate-900">
                              {city.name}
                            </CardTitle>
                            <span className="text-xs text-slate-500 font-medium">{city.state || 'Chhattisgarh'}</span>
                          </div>
                        </div>

                        <Badge
                          variant={city.isOperational ? 'success' : 'secondary'}
                          className="px-2.5 py-0.5 text-[11px] font-bold"
                        >
                          {city.isOperational ? '🟢 Operational' : '🔴 Disabled'}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="p-5 pt-2 space-y-4">
                      <div className="flex items-center justify-between text-xs text-slate-600 p-3 bg-slate-50 rounded-2xl">
                        <span>Available Localities</span>
                        <span className="font-bold text-slate-900">
                          {opCount} / {cityLocs.length} Operational
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                        {/* Toggle Operational */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleCityStatus(city)}
                          className={`flex-1 text-xs font-bold rounded-xl ${
                            city.isOperational
                              ? 'text-amber-700 border-amber-200 hover:bg-amber-50'
                              : 'text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                          }`}
                        >
                          {city.isOperational ? 'Disable City' : 'Enable City'}
                        </Button>

                        {/* Manage Localities */}
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            setSelectedCityName(city.name);
                            setSearchQuery('');
                          }}
                          className="flex-1 text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl gap-1"
                        >
                          Localities ({cityLocs.length}) <ChevronRight className="size-3.5" />
                        </Button>

                        {/* Edit */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditCity(city)}
                          className="px-2.5 text-slate-500 hover:text-slate-900 rounded-xl"
                        >
                          <Edit2 className="size-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredCities.length === 0 && (
              <div className="py-12 text-center space-y-3 bg-white rounded-3xl border border-slate-200 p-6">
                <Building2 className="size-10 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">No cities found matching filter</p>
                <Button onClick={handleOpenAddCity} className="gap-2 text-xs font-bold rounded-xl">
                  <Plus className="size-4" /> Add New City
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* ================= LOCALITIES LIST VIEW ================= */
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredLocalities.map((loc) => (
                <Card
                  key={loc.id}
                  className={`border transition-all rounded-2xl overflow-hidden ${
                    loc.isOperational
                      ? 'border-slate-200 bg-white'
                      : 'border-amber-200 bg-amber-50/20'
                  }`}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <MapPin className={`size-4 shrink-0 ${loc.isOperational ? 'text-blue-600' : 'text-slate-400'}`} />
                        <span className="font-bold text-slate-900 text-sm truncate">{loc.name}</span>
                      </div>

                      <Badge
                        variant={loc.isOperational ? 'success' : 'secondary'}
                        className="px-2 py-0.5 text-[10px] font-bold shrink-0"
                      >
                        {loc.isOperational ? '🟢 Active' : '🔴 Disabled'}
                      </Badge>
                    </div>

                    {loc.isCustomLocality && (
                      <div className="flex items-center justify-between text-[11px] p-2 bg-purple-50 rounded-xl text-purple-700 font-medium">
                        <span>User Custom Request</span>
                        <span className="font-bold capitalize">{loc.status || 'Pending'}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleLocalityStatus(loc)}
                        className={`flex-1 text-[11px] font-bold rounded-xl h-8 ${
                          loc.isOperational
                            ? 'text-amber-700 border-amber-200 hover:bg-amber-50'
                            : 'text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                        }`}
                      >
                        {loc.isOperational ? 'Disable' : 'Enable'}
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEditLocality(loc)}
                        className="h-8 px-2.5 text-slate-500 hover:text-slate-900 rounded-xl"
                      >
                        <Edit2 className="size-3.5" />
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteLocality(loc)}
                        className="h-8 px-2.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredLocalities.length === 0 && (
              <div className="py-12 text-center space-y-3 bg-white rounded-3xl border border-slate-200 p-6">
                <MapPin className="size-10 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">No localities in {selectedCityName}</p>
                <Button onClick={handleOpenAddLocality} className="gap-2 text-xs font-bold rounded-xl">
                  <Plus className="size-4" /> Add Locality
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ================= MODAL: ADD CITY ================= */}
        <Dialog open={showAddCityModal} onOpenChange={setShowAddCityModal}>
          <DialogContent className="sm:max-w-md rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle>Add New City</DialogTitle>
              <DialogDescription>Register a new operational city in MaidEasy.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddCitySubmit} className="space-y-4 pt-2">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs font-semibold text-red-700 flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0 text-red-600" />
                  <span>{formError}</span>
                </div>
              )}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">City Name *</label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Korba"
                  value={cityNameInput}
                  onChange={(e) => setCityNameInput(e.target.value)}
                  className="rounded-2xl h-11 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">State</label>
                <Input
                  type="text"
                  placeholder="Chhattisgarh"
                  value={cityStateInput}
                  onChange={(e) => setCityStateInput(e.target.value)}
                  className="rounded-2xl h-11 text-xs sm:text-sm"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700">Operational Status</span>
                <button
                  type="button"
                  onClick={() => setCityOperationalInput(!cityOperationalInput)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    cityOperationalInput
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                      : 'bg-amber-100 text-amber-700 border border-amber-300'
                  }`}
                >
                  {cityOperationalInput ? '🟢 Operational' : '🔴 Disabled'}
                </button>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowAddCityModal(false)} className="flex-1 rounded-2xl">
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold">
                  {submitting ? <Loader2 className="size-4 animate-spin" /> : 'Save City'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* ================= MODAL: EDIT CITY ================= */}
        <Dialog open={showEditCityModal} onOpenChange={setShowEditCityModal}>
          <DialogContent className="sm:max-w-md rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle>Edit City</DialogTitle>
              <DialogDescription>Update city settings and operational state.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditCitySubmit} className="space-y-4 pt-2">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs font-semibold text-red-700 flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0 text-red-600" />
                  <span>{formError}</span>
                </div>
              )}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">City Name *</label>
                <Input
                  type="text"
                  required
                  value={cityNameInput}
                  onChange={(e) => setCityNameInput(e.target.value)}
                  className="rounded-2xl h-11 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">State</label>
                <Input
                  type="text"
                  value={cityStateInput}
                  onChange={(e) => setCityStateInput(e.target.value)}
                  className="rounded-2xl h-11 text-xs sm:text-sm"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700">Operational Status</span>
                <button
                  type="button"
                  onClick={() => setCityOperationalInput(!cityOperationalInput)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    cityOperationalInput
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                      : 'bg-amber-100 text-amber-700 border border-amber-300'
                  }`}
                >
                  {cityOperationalInput ? '🟢 Operational' : '🔴 Disabled'}
                </button>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowEditCityModal(false)} className="flex-1 rounded-2xl">
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold">
                  {submitting ? <Loader2 className="size-4 animate-spin" /> : 'Update City'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* ================= MODAL: ADD LOCALITY ================= */}
        <Dialog open={showAddLocalityModal} onOpenChange={setShowAddLocalityModal}>
          <DialogContent className="sm:max-w-md rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle>Add New Locality</DialogTitle>
              <DialogDescription>Add a locality to an operational city.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddLocalitySubmit} className="space-y-4 pt-2">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs font-semibold text-red-700 flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0 text-red-600" />
                  <span>{formError}</span>
                </div>
              )}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">City *</label>
                <select
                  value={localityCityInput}
                  onChange={(e) => setLocalityCityInput(e.target.value)}
                  className="w-full h-11 px-3 text-xs sm:text-sm font-semibold bg-white border border-slate-200 rounded-2xl"
                >
                  {cities.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Locality Name *</label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Nehru Nagar East"
                  value={localityNameInput}
                  onChange={(e) => setLocalityNameInput(e.target.value)}
                  className="rounded-2xl h-11 text-xs sm:text-sm"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700">Operational Status</span>
                <button
                  type="button"
                  onClick={() => setLocalityOperationalInput(!localityOperationalInput)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    localityOperationalInput
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                      : 'bg-amber-100 text-amber-700 border border-amber-300'
                  }`}
                >
                  {localityOperationalInput ? '🟢 Operational' : '🔴 Disabled'}
                </button>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowAddLocalityModal(false)} className="flex-1 rounded-2xl">
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold">
                  {submitting ? <Loader2 className="size-4 animate-spin" /> : 'Save Locality'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* ================= MODAL: EDIT LOCALITY ================= */}
        <Dialog open={showEditLocalityModal} onOpenChange={setShowEditLocalityModal}>
          <DialogContent className="sm:max-w-md rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle>Edit Locality</DialogTitle>
              <DialogDescription>Update locality details and operational status.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditLocalitySubmit} className="space-y-4 pt-2">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs font-semibold text-red-700 flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0 text-red-600" />
                  <span>{formError}</span>
                </div>
              )}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">City *</label>
                <select
                  value={localityCityInput}
                  onChange={(e) => setLocalityCityInput(e.target.value)}
                  className="w-full h-11 px-3 text-xs sm:text-sm font-semibold bg-white border border-slate-200 rounded-2xl"
                >
                  {cities.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Locality Name *</label>
                <Input
                  type="text"
                  required
                  value={localityNameInput}
                  onChange={(e) => setLocalityNameInput(e.target.value)}
                  className="rounded-2xl h-11 text-xs sm:text-sm"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700">Operational Status</span>
                <button
                  type="button"
                  onClick={() => setLocalityOperationalInput(!localityOperationalInput)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    localityOperationalInput
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                      : 'bg-amber-100 text-amber-700 border border-amber-300'
                  }`}
                >
                  {localityOperationalInput ? '🟢 Operational' : '🔴 Disabled'}
                </button>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowEditLocalityModal(false)} className="flex-1 rounded-2xl">
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold">
                  {submitting ? <Loader2 className="size-4 animate-spin" /> : 'Update Locality'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
