'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { MaidCard, MaidCardSkeleton } from '@/components/customer/MaidCard';
import { useApp } from '@/lib/app-context';
import { subscribeToApprovedMaids } from '@/lib/services/maidService';
import { subscribeToServiceCategories } from '@/lib/services/serviceCategoryService';
import { Maid, ServiceCategory } from '@/lib/types';
import { Search, MapPin, ChevronDown, Sparkles, ChefHat, Baby, HeartPulse, Home as HomeIcon, Shirt, Sun, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LocationSelectorModal } from '@/components/location/LocationSelectorModal';

function renderCategoryIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes('clean')) return <Sparkles className="size-4 text-[var(--primary-600)]" />;
  if (n.includes('cook')) return <ChefHat className="size-4 text-[var(--accent-600)]" />;
  if (n.includes('baby')) return <Baby className="size-4 text-[var(--success-600)]" />;
  if (n.includes('elder')) return <HeartPulse className="size-4 text-[var(--error-500)]" />;
  if (n.includes('laundry')) return <Shirt className="size-4 text-[var(--info-600)]" />;
  if (n.includes('full')) return <Sun className="size-4 text-[var(--accent-500)]" />;
  if (n.includes('part')) return <Clock className="size-4 text-[var(--primary-500)]" />;
  return <HomeIcon className="size-4 text-[var(--primary-600)]" />;
}

export default function CustomerHomePage() {
  const router = useRouter();
  const { selectedArea, selectedCity } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAreaPicker, setShowAreaPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [maids, setMaids] = useState<Maid[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);

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

  const filteredMaids = useMemo(() => {
    return maids.filter(m => {
      const inArea = m.serviceAreas.some(a => a.toLowerCase().includes(selectedArea.toLowerCase())) || m.area.toLowerCase().includes(selectedArea.toLowerCase());
      if (selectedCategory) return inArea && m.services.some(s => s.toLowerCase() === selectedCategory.toLowerCase());
      return inArea;
    });
  }, [maids, selectedArea, selectedCategory]);

  return (
    <AppShell
      role="customer"
      headerProps={{ showLocation: true, showNotifications: true }}
    >
      <div className="animate-fade-in space-y-5">
        {/* Location & Greeting */}
        <div className="pt-1">
          <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] mb-1">
            Find Trusted Maids
          </h1>
          <button
            type="button"
            onClick={() => setShowAreaPicker(true)}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--primary-600)] transition-colors cursor-pointer"
          >
            <MapPin className="size-4 text-[var(--primary-600)] shrink-0" />
            <span>{selectedArea}, {selectedCity}</span>
            <ChevronDown className="size-4 text-[var(--text-muted)]" />
          </button>
        </div>

        {/* Search bar */}
        <div
          className="search-bar cursor-pointer"
          onClick={() => router.push('/search')}
        >
          <Search size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Search by name, area, or service...
          </span>
        </div>

        {/* Service Categories */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-[var(--text-primary)]">Services</span>
            {selectedCategory && (
              <button
                type="button"
                className="text-xs font-semibold text-[var(--primary-600)] hover:underline cursor-pointer"
                onClick={() => setSelectedCategory(null)}
              >
                Clear filter
              </button>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2.5">
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                className={`category-pill ${selectedCategory === cat.name ? 'selected' : ''}`}
                onClick={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
              >
                <span className="category-icon flex items-center justify-center">
                  {renderCategoryIcon(cat.name)}
                </span>
                <span className="category-name">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recommended Maids */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-[var(--text-primary)]">
              {selectedCategory ? `${selectedCategory} Maids` : 'Verified Maids'} Near {selectedArea}
            </span>
            <span className="text-xs text-[var(--text-secondary)] font-medium">
              {filteredMaids.length} available
            </span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {[1, 2, 3, 4].map(i => (
                <MaidCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredMaids.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Search size={36} style={{ color: 'var(--gray-400)' }} />
              </div>
              <div className="empty-state-title">No maids found</div>
              <div className="empty-state-desc">
                No maids available for &quot;{selectedCategory || selectedArea}&quot;. Try changing area or category.
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedCategory(null);
                  setShowAreaPicker(true);
                }}
                className="mt-3"
              >
                Change Area
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {filteredMaids.map(maid => (
                <MaidCard key={maid.id} maid={maid} />
              ))}
            </div>
          )}
        </div>

        {/* Location Selector Modal */}
        <LocationSelectorModal
          open={showAreaPicker}
          onOpenChange={setShowAreaPicker}
        />

        <div className="h-6" />
      </div>
    </AppShell>
  );
}
