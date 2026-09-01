'use client';

import { useState, useMemo, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { MaidCard, MaidCardSkeleton } from '@/components/customer/MaidCard';
import { useApp } from '@/lib/app-context';
import { subscribeToApprovedMaids } from '@/lib/services/maidService';
import { subscribeToServiceCategories } from '@/lib/services/serviceCategoryService';
import { Maid, ServiceCategory, LocalityConfig } from '@/lib/types';
import { SUPPORTED_AREAS } from '@/lib/mockData';
import { subscribeToCityLocalities } from '@/lib/services/locationManagementService';
import { Search, SlidersHorizontal, UserX, Check } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FilterState {
  service: string;
  area: string;
  gender: string;
  maxPrice: number;
}

export default function SearchPage() {
  const { selectedCity, selectedArea } = useApp();
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [maids, setMaids] = useState<Maid[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [localities, setLocalities] = useState<LocalityConfig[]>([]);

  const [filters, setFilters] = useState<FilterState>({
    service: '',
    area: selectedArea,
    gender: '',
    maxPrice: 20000,
  });

  // Subscribe to operational localities for current city
  useEffect(() => {
    const cityName = selectedCity || 'Bhilai';
    const unsubLocs = subscribeToCityLocalities(cityName, (liveLocs) => {
      setLocalities(liveLocs.filter(l => l.isOperational));
    });
    return () => unsubLocs();
  }, [selectedCity]);


  useEffect(() => {
    setIsLoading(true);
    const unsubMaids = subscribeToApprovedMaids((liveMaids) => {
      setMaids(liveMaids);
      setIsLoading(false);
    });
    const unsubCats = subscribeToServiceCategories((liveCats) => {
      setCategories(liveCats);
    });

    return () => {
      unsubMaids();
      unsubCats();
    };
  }, []);


  const updateFilter = (key: keyof FilterState, val: string | number) => {
    setFilters(prev => ({ ...prev, [key]: val }));
  };

  const resetFilters = () => {
    setFilters({
      service: '',
      area: selectedArea,
      gender: '',
      maxPrice: 20000,
    });
    setQuery('');
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.service) count++;
    if (filters.area && filters.area !== selectedArea) count++;
    if (filters.gender) count++;
    if (filters.maxPrice < 20000) count++;
    return count;
  }, [filters, selectedArea]);

  const filteredMaids = useMemo(() => {
    return maids.filter(m => {
      if (query) {
        const q = query.toLowerCase();
        const matchesName = m.name.toLowerCase().includes(q);
        const matchesService = m.services.some(s => s.toLowerCase().includes(q));
        const matchesArea = m.area.toLowerCase().includes(q) || m.serviceAreas.some(a => a.toLowerCase().includes(q));
        if (!matchesName && !matchesService && !matchesArea) return false;
      }
      if (filters.service) {
        const hasService = m.services.some(s => s.toLowerCase() === filters.service.toLowerCase());
        if (!hasService) return false;
      }
      if (filters.area) {
        const inArea = m.serviceAreas.some(a => a.toLowerCase().includes(filters.area.toLowerCase())) || m.area.toLowerCase().includes(filters.area.toLowerCase());
        if (!inArea) return false;
      }
      if (filters.gender && m.gender !== filters.gender) return false;
      if (filters.maxPrice) {
        const minRate = Math.min(
          m.hourlyPrice ?? 999999,
          m.dailyPrice ?? 999999,
          m.monthlyPrice ?? 999999
        );
        if (minRate > filters.maxPrice) return false;
      }
      return true;
    });
  }, [maids, query, filters]);

  return (
    <AppShell role="customer" headerProps={{ title: 'Search Maids', showBack: true }}>
      <div className="animate-fade-in space-y-4">
        {/* Search controls */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--text-muted)]" />
            <Input
              type="search"
              placeholder="Search maid name, skill, area..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>

          <Button
            variant={activeFilterCount > 0 ? 'default' : 'outline'}
            size="default"
            onClick={() => setShowFilters(true)}
            className="shrink-0 relative h-11 px-3.5"
          >
            <SlidersHorizontal className="size-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-[var(--accent-500)] text-[10px] font-extrabold text-white">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
          <span>{filteredMaids.length} maid{filteredMaids.length !== 1 ? 's' : ''} available</span>
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={resetFilters}
              className="font-semibold text-[var(--primary-600)] hover:underline cursor-pointer"
            >
              Reset filters
            </button>
          )}
        </div>

        {/* Maid list */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {[1, 2, 3, 4].map(i => (
              <MaidCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredMaids.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <UserX size={36} style={{ color: 'var(--gray-400)' }} />
            </div>
            <div className="empty-state-title">No matching maids</div>
            <div className="empty-state-desc">Try clearing search query or adjusting your filters.</div>
            <Button variant="outline" size="sm" onClick={resetFilters} className="mt-3">
              Clear All Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredMaids.map(maid => (
              <MaidCard key={maid.id} maid={maid} />
            ))}
          </div>
        )}

        {/* Filter Sheet / Drawer */}
        <Sheet open={showFilters} onOpenChange={setShowFilters}>
          <SheetContent side="bottom" className="space-y-4">
            <SheetHeader>
              <SheetTitle>Filter Maids</SheetTitle>
              <SheetDescription>Refine search results by service, location, and rates</SheetDescription>
            </SheetHeader>

            <div className="space-y-4 py-2">
              {/* Service filter */}
              <div>
                <label className="text-xs font-bold text-[var(--text-primary)] mb-2 block">Service Required</label>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => updateFilter('service', filters.service === cat.name ? '' : cat.name)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        filters.service === cat.name
                          ? 'border-[var(--primary-600)] bg-[var(--primary-600)] text-white'
                          : 'border-[var(--border)] bg-white text-[var(--text-primary)] hover:bg-[var(--gray-50)]'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gender filter */}
              <div>
                <label className="text-xs font-bold text-[var(--text-primary)] mb-2 block">Gender Preference</label>
                <div className="flex gap-2">
                  {[
                    { label: 'Any', value: '' },
                    { label: 'Female', value: 'female' },
                    { label: 'Male', value: 'male' },
                  ].map(g => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => updateFilter('gender', g.value)}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        filters.gender === g.value
                          ? 'border-[var(--primary-600)] bg-[var(--primary-600)] text-white'
                          : 'border-[var(--border)] bg-white text-[var(--text-primary)] hover:bg-[var(--gray-50)]'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Area filter */}
              <div>
                <label className="text-xs font-bold text-[var(--text-primary)] mb-2 block">
                  Area / Locality {selectedCity ? `(${selectedCity})` : ''}
                </label>
                <select
                  className="input-base text-xs sm:text-sm"
                  value={filters.area}
                  onChange={e => updateFilter('area', e.target.value)}
                >
                  <option value="">All Areas in {selectedCity || 'City'}</option>
                  {(localities.length > 0
                    ? localities.map(l => l.name)
                    : (SUPPORTED_AREAS[selectedCity || 'Bhilai'] || SUPPORTED_AREAS['Bhilai'] || [])
                  ).map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

            </div>

            <SheetFooter>
              <Button variant="outline" onClick={resetFilters} className="flex-1">
                Reset
              </Button>
              <Button onClick={() => setShowFilters(false)} className="flex-1">
                <Check className="size-4" /> Apply Filters
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <div className="h-6" />
      </div>
    </AppShell>
  );
}
