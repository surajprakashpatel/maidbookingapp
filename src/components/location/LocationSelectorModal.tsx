'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp } from '@/lib/app-context';
import { SUPPORTED_CITIES, SUPPORTED_AREAS } from '@/lib/mockData';
import {
  subscribeToOperationalCities,
  subscribeToOperationalLocalities,
  addCustomLocalityRequest,
} from '@/lib/services/locationManagementService';
import {
  MapPin,
  Search,
  Building2,
  ChevronRight,
  ArrowLeft,
  Plus,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';

interface LocationSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectLocation?: (city: string, area: string, isCustom?: boolean) => void;
  initialCity?: string;
  initialArea?: string;
}

type SelectionStep = 'city' | 'locality' | 'custom_locality';

export function LocationSelectorModal({
  open,
  onOpenChange,
  onSelectLocation,
  initialCity,
  initialArea,
}: LocationSelectorModalProps) {
  const { selectedCity: globalCity, selectedArea: globalArea, setSelectedCity, setSelectedArea } = useApp();

  const [step, setStep] = useState<SelectionStep>('city');
  const [cityList, setCityList] = useState<string[]>(SUPPORTED_CITIES);
  const [areaMap, setAreaMap] = useState<Record<string, string[]>>(SUPPORTED_AREAS);

  const [chosenCity, setChosenCity] = useState<string>(initialCity || globalCity || 'Bhilai');
  const [chosenArea, setChosenArea] = useState<string>(initialArea || globalArea || '');
  const [customAreaInput, setCustomAreaInput] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const unsubCities = subscribeToOperationalCities((citiesData) => {
      const cityNames = citiesData.map(c => c.name);
      if (cityNames.length > 0) {
        setCityList(cityNames);
      }
    });

    return () => {
      unsubCities();
    };
  }, []);

  // Real-time localities for chosen city
  useEffect(() => {
    if (!chosenCity) return;
    const unsub = subscribeToOperationalLocalities(chosenCity, (locsData) => {
      const locNames = locsData.map(l => l.name);
      setAreaMap(prev => ({
        ...prev,
        [chosenCity]: locNames,
      }));
    });
    return () => unsub();
  }, [chosenCity]);

  // Sync state when modal opens
  useEffect(() => {
    if (open) {
      const activeCity = initialCity || globalCity || cityList[0] || 'Bhilai';
      const activeArea = initialArea || globalArea || '';
      setChosenCity(activeCity);
      setChosenArea(activeArea);
      setCustomAreaInput('');
      setSearchQuery('');
      setError('');
      // If city is already chosen, start at locality step, otherwise city step
      setStep(activeCity ? 'locality' : 'city');
    }
  }, [open, initialCity, initialArea, globalCity, globalArea, cityList]);

  // Available localities for chosen city
  const currentLocalities = useMemo(() => {
    if (!chosenCity) return [];
    return areaMap[chosenCity] || areaMap['Bhilai'] || [];
  }, [chosenCity, areaMap]);

  // Filtered localities by search
  const filteredLocalities = useMemo(() => {
    if (!searchQuery.trim()) return currentLocalities;
    const q = searchQuery.toLowerCase().trim();
    return currentLocalities.filter((loc) => loc.toLowerCase().includes(q));
  }, [currentLocalities, searchQuery]);

  // Step 1: Select City
  const handleSelectCity = (city: string) => {
    setChosenCity(city);
    setChosenArea(''); // Reset area on city change
    setSearchQuery('');
    setError('');
    setStep('locality');
  };

  // Step 2: Select Existing Locality
  const handleSelectLocality = (locality: string) => {
    setChosenArea(locality);
    setError('');
    saveLocation(chosenCity, locality, false);
  };

  // Step 3: Switch to Custom Locality
  const handleStartCustomLocality = (prefill = '') => {
    setCustomAreaInput(prefill || searchQuery || '');
    setError('');
    setStep('custom_locality');
  };

  // Save Custom Locality Submit
  const handleSaveCustomLocality = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customAreaInput.trim();
    if (!chosenCity) {
      setError('Please select your city.');
      setStep('city');
      return;
    }
    if (!trimmed) {
      setError('Please enter your locality name.');
      return;
    }
    setChosenArea(trimmed);
    setError('');
    // Submit custom locality to database for admin review
    addCustomLocalityRequest(chosenCity, trimmed).catch(() => {});
    saveLocation(chosenCity, trimmed, true);
  };

  // Save final location
  const saveLocation = (city: string, area: string, isCustom = false) => {
    if (!city) {
      setError('Please select your city.');
      setStep('city');
      return;
    }
    if (!area) {
      setError('Please select or enter your locality.');
      return;
    }

    // Update global app state
    setSelectedCity(city);
    setSelectedArea(area);

    // Call optional callback
    if (onSelectLocation) {
      onSelectLocation(city, area, isCustom);
    }

    // Close modal
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-[calc(100%-2rem)] max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-3xl border-slate-200 shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-5 pb-3 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center justify-between gap-2">
            {step !== 'city' ? (
              <button
                type="button"
                onClick={() => {
                  setError('');
                  if (step === 'custom_locality') setStep('locality');
                  else setStep('city');
                }}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                <ArrowLeft className="size-3.5" />
                <span>{step === 'custom_locality' ? 'Back to Localities' : 'Change City'}</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <Building2 className="size-3.5 text-blue-600" />
                <span>Step 1 of 2</span>
              </div>
            )}

            {chosenCity && step !== 'city' && (
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setStep('city');
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 text-[11px] font-bold hover:bg-blue-100 transition-colors cursor-pointer"
              >
                <MapPin className="size-3 text-blue-600 shrink-0" />
                <span className="truncate max-w-[110px]">{chosenCity}</span>
                <ChevronRight className="size-3 text-blue-500 shrink-0" />
              </button>
            )}
          </div>

          <DialogTitle className="text-lg font-extrabold text-slate-900 mt-2">
            {step === 'city' && 'Select Your City'}
            {step === 'locality' && 'Select Your Locality'}
            {step === 'custom_locality' && 'Enter Your Locality'}
          </DialogTitle>

          <DialogDescription className="text-xs text-slate-500 mt-0.5">
            {step === 'city' && 'Choose your city to find available localities and maids.'}
            {step === 'locality' && `Browse localities in ${chosenCity} or add your own.`}
            {step === 'custom_locality' && `Type your exact area name in ${chosenCity}.`}
          </DialogDescription>
        </DialogHeader>

        {/* Modal Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-2xl text-xs font-semibold text-red-700 animate-fade-in">
              <AlertCircle className="size-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: SELECT CITY */}
          {step === 'city' && (
            <div className="space-y-3 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {cityList.map((city) => {
                  const isSelected = chosenCity === city;
                  const count = (areaMap[city] || []).length;
                  return (
                    <button
                      key={city}
                      type="button"
                      onClick={() => handleSelectCity(city)}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between group ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/80 shadow-xs ring-2 ring-blue-600/20'
                          : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50/70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`size-9 rounded-xl flex items-center justify-center font-bold text-sm transition-colors ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600'
                        }`}>
                          <Building2 className="size-4" />
                        </div>
                        <div>
                          <div className={`text-sm font-bold ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
                            {city}
                          </div>
                          <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                            {count > 0 ? `${count} Localities` : 'Available'}
                          </div>
                        </div>
                      </div>
                      {isSelected ? (
                        <Check className="size-4 text-blue-600 font-bold" />
                      ) : (
                        <ChevronRight className="size-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: SELECT LOCALITY */}
          {step === 'locality' && (
            <div className="space-y-3.5 animate-fade-in">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder={`Search locality in ${chosenCity}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-9 h-11 text-xs sm:text-sm border-slate-200 rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-600 bg-slate-50/60 focus:bg-white transition-all"
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

              {/* Localities Grid */}
              {filteredLocalities.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                  {filteredLocalities.map((loc) => {
                    const isSelected = chosenArea.toLowerCase() === loc.toLowerCase();
                    return (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => handleSelectLocality(loc)}
                        className={`p-3 rounded-2xl border text-left text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-600/20'
                            : 'border-slate-200/80 bg-white text-slate-700 hover:border-blue-300 hover:bg-slate-50/80'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <MapPin className={`size-3.5 shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                          <span className="truncate">{loc}</span>
                        </div>
                        {isSelected && <Check className="size-3.5 text-blue-600 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="py-6 text-center space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-4">
                  <div className="size-10 rounded-full bg-slate-200/70 text-slate-500 flex items-center justify-center mx-auto">
                    <Search className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      No locality matching &quot;{searchQuery}&quot; in {chosenCity}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      You can manually enter your locality below.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleStartCustomLocality(searchQuery)}
                    className="gap-1.5 text-xs font-bold text-blue-600 border-blue-200 hover:bg-blue-50 rounded-xl"
                  >
                    <Plus className="size-3.5" /> Add &quot;{searchQuery}&quot; as Locality
                  </Button>
                </div>
              )}

              {/* Add Custom Locality Option */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleStartCustomLocality()}
                  className="w-full p-3 rounded-2xl border border-dashed border-blue-300 bg-blue-50/40 text-blue-700 text-xs font-bold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="size-4 text-blue-600" />
                  <span>+ Add Your Locality (If not listed)</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: ENTER CUSTOM LOCALITY */}
          {step === 'custom_locality' && (
            <form onSubmit={handleSaveCustomLocality} className="space-y-4 animate-fade-in">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-blue-600" />
                  Enter Your Locality in {chosenCity}
                </label>
                <Input
                  type="text"
                  autoFocus
                  placeholder="e.g. XYZ Nagar, Phase 2, Near Station"
                  value={customAreaInput}
                  onChange={(e) => {
                    setCustomAreaInput(e.target.value);
                    if (error) setError('');
                  }}
                  className="h-11 text-xs sm:text-sm border-slate-200 rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-600"
                />
                <p className="text-[11px] text-slate-500">
                  Enter your neighborhood or colony name.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('locality')}
                  className="flex-1 rounded-2xl text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 rounded-2xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md cursor-pointer"
                >
                  Save & Continue
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
