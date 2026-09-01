import {
  collection,
  doc,
  setDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { CityConfig, LocalityConfig } from '../types';
import { SUPPORTED_CITIES, SUPPORTED_AREAS } from '../mockData';

const CITIES_COL = 'locations_cities';
const LOCALITIES_COL = 'locations_localities';

// Seed default cities & localities into Firestore if empty
async function seedDefaultLocationsIfNeeded() {
  try {
    const citySnap = await getDocs(collection(db, CITIES_COL));
    if (citySnap.empty) {
      console.log('Seeding default cities into Firestore...');
      for (const cityName of SUPPORTED_CITIES) {
        const cityId = `city-${cityName.toLowerCase().replace(/\s+/g, '-')}`;
        await setDoc(doc(db, CITIES_COL, cityId), {
          id: cityId,
          name: cityName,
          state: 'Chhattisgarh',
          isOperational: true,
          createdAt: new Date().toISOString(),
        });

        // Seed localities for this city
        const defaultAreas = SUPPORTED_AREAS[cityName] || [];
        for (const areaName of defaultAreas) {
          const locId = `loc-${cityName.toLowerCase()}-${areaName.toLowerCase().replace(/\s+/g, '-')}`;
          await setDoc(doc(db, LOCALITIES_COL, locId), {
            id: locId,
            cityName,
            name: areaName,
            isOperational: true,
            isCustomLocality: false,
            status: 'approved',
            createdAt: new Date().toISOString(),
          });
        }
      }
    }
  } catch (err: any) {
    const isPermissionError =
      err?.code === 'permission-denied' ||
      String(err?.message || err).includes('permission') ||
      String(err?.message || err).includes('permissions');
    if (isPermissionError) {
      console.info('Seeding default locations skipped (non-admin client uses mock fallback).');
    } else {
      console.warn('Seeding locations skipped or failed:', err);
    }
  }
}

// ----------------------------------------------------------------------
// CITIES SUBSCRIPTIONS & CRUD
// ----------------------------------------------------------------------

export function subscribeToAllCities(callback: (cities: CityConfig[]) => void) {
  seedDefaultLocationsIfNeeded().catch(() => {});
  const q = query(collection(db, CITIES_COL), orderBy('name', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        // Fallback mock cities
        const fallback: CityConfig[] = SUPPORTED_CITIES.map((c) => ({
          id: `city-${c.toLowerCase()}`,
          name: c,
          state: 'Chhattisgarh',
          isOperational: true,
          createdAt: new Date().toISOString(),
        }));
        callback(fallback);
        return;
      }
      const cities: CityConfig[] = snapshot.docs.map((d) => d.data() as CityConfig);
      callback(cities);
    },
    (err: any) => {
      if (err?.code === 'permission-denied' || String(err?.message || err).includes('permission')) {
        console.info('Using fallback cities list (Firestore permissions/fallback active).');
      } else {
        console.warn('Error in subscribeToAllCities:', err);
      }
      const fallback: CityConfig[] = SUPPORTED_CITIES.map((c) => ({
        id: `city-${c.toLowerCase()}`,
        name: c,
        state: 'Chhattisgarh',
        isOperational: true,
        createdAt: new Date().toISOString(),
      }));
      callback(fallback);
    }
  );
}

export function subscribeToOperationalCities(callback: (cities: CityConfig[]) => void) {
  seedDefaultLocationsIfNeeded().catch(() => {});
  const q = query(collection(db, CITIES_COL), where('isOperational', '==', true));
  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        const fallback: CityConfig[] = SUPPORTED_CITIES.map((c) => ({
          id: `city-${c.toLowerCase()}`,
          name: c,
          state: 'Chhattisgarh',
          isOperational: true,
          createdAt: new Date().toISOString(),
        }));
        callback(fallback);
        return;
      }
      const cities: CityConfig[] = snapshot.docs
        .map((d) => d.data() as CityConfig)
        .sort((a, b) => a.name.localeCompare(b.name));
      callback(cities);
    },
    (err: any) => {
      if (err?.code === 'permission-denied' || String(err?.message || err).includes('permission')) {
        console.info('Using fallback operational cities list (Firestore permissions/fallback active).');
      } else {
        console.warn('Error in subscribeToOperationalCities:', err);
      }
      const fallback: CityConfig[] = SUPPORTED_CITIES.map((c) => ({
        id: `city-${c.toLowerCase()}`,
        name: c,
        state: 'Chhattisgarh',
        isOperational: true,
        createdAt: new Date().toISOString(),
      }));
      callback(fallback);
    }
  );
}

export async function addCity(cityName: string, state = 'Chhattisgarh', isOperational = true): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const trimmedName = cityName.trim();
    if (!trimmedName) return { success: false, error: 'City name is required.' };

    // Check duplicate
    const q = query(collection(db, CITIES_COL));
    const existing = await getDocs(q);
    const isDuplicate = existing.docs.some(
      (d) => (d.data() as CityConfig).name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      return { success: false, error: `City "${trimmedName}" already exists.` };
    }

    const cityId = `city-${Date.now()}`;
    const newCity: CityConfig = {
      id: cityId,
      name: trimmedName,
      state: state.trim() || 'Chhattisgarh',
      isOperational,
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, CITIES_COL, cityId), newCity);
    return { success: true, id: cityId };
  } catch (err: any) {
    console.error('Error adding city:', err);
    return { success: false, error: err.message || 'Failed to add city.' };
  }
}

export async function updateCity(cityId: string, partial: Partial<CityConfig>): Promise<{ success: boolean; error?: string }> {
  try {
    const docRef = doc(db, CITIES_COL, cityId);
    await updateDoc(docRef, {
      ...partial,
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (err: any) {
    console.error('Error updating city:', err);
    return { success: false, error: err.message || 'Failed to update city.' };
  }
}

export async function toggleCityOperational(cityId: string, isOperational: boolean): Promise<{ success: boolean; error?: string }> {
  return updateCity(cityId, { isOperational });
}

// ----------------------------------------------------------------------
// LOCALITIES SUBSCRIPTIONS & CRUD
// ----------------------------------------------------------------------

export function subscribeToAllLocalities(callback: (localities: LocalityConfig[]) => void) {
  seedDefaultLocationsIfNeeded().catch(() => {});
  const q = query(collection(db, LOCALITIES_COL), orderBy('name', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const localities: LocalityConfig[] = snapshot.docs.map((d) => d.data() as LocalityConfig);
      callback(localities);
    },
    (err) => {
      console.error('Error in subscribeToAllLocalities:', err);
      callback([]);
    }
  );
}

export function subscribeToCityLocalities(cityName: string, callback: (localities: LocalityConfig[]) => void) {
  seedDefaultLocationsIfNeeded().catch(() => {});
  const q = query(collection(db, LOCALITIES_COL), where('cityName', '==', cityName));
  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        // Fallback default localities if none in db yet
        const defaultAreas = SUPPORTED_AREAS[cityName] || [];
        const fallback: LocalityConfig[] = defaultAreas.map((a) => ({
          id: `loc-${cityName.toLowerCase()}-${a.toLowerCase()}`,
          cityName,
          name: a,
          isOperational: true,
          isCustomLocality: false,
          status: 'approved',
          createdAt: new Date().toISOString(),
        }));
        callback(fallback);
        return;
      }
      const localities: LocalityConfig[] = snapshot.docs
        .map((d) => d.data() as LocalityConfig)
        .sort((a, b) => a.name.localeCompare(b.name));
      callback(localities);
    },
    (err: any) => {
      if (err?.code === 'permission-denied' || String(err?.message || err).includes('permission')) {
        console.info(`Using fallback localities for ${cityName} (Firestore permissions/fallback active).`);
      } else {
        console.warn(`Error in subscribeToCityLocalities for ${cityName}:`, err);
      }
      const defaultAreas = SUPPORTED_AREAS[cityName] || [];
      const fallback: LocalityConfig[] = defaultAreas.map((a) => ({
        id: `loc-${cityName.toLowerCase()}-${a.toLowerCase()}`,
        cityName,
        name: a,
        isOperational: true,
        isCustomLocality: false,
        status: 'approved',
        createdAt: new Date().toISOString(),
      }));
      callback(fallback);
    }
  );
}

export function subscribeToOperationalLocalities(cityName: string, callback: (localities: LocalityConfig[]) => void) {
  seedDefaultLocationsIfNeeded().catch(() => {});
  const q = query(
    collection(db, LOCALITIES_COL),
    where('cityName', '==', cityName),
    where('isOperational', '==', true)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        const defaultAreas = SUPPORTED_AREAS[cityName] || [];
        const fallback: LocalityConfig[] = defaultAreas.map((a) => ({
          id: `loc-${cityName.toLowerCase()}-${a.toLowerCase()}`,
          cityName,
          name: a,
          isOperational: true,
          isCustomLocality: false,
          status: 'approved',
          createdAt: new Date().toISOString(),
        }));
        callback(fallback);
        return;
      }
      const localities: LocalityConfig[] = snapshot.docs
        .map((d) => d.data() as LocalityConfig)
        .sort((a, b) => a.name.localeCompare(b.name));
      callback(localities);
    },
    (err: any) => {
      if (err?.code === 'permission-denied' || String(err?.message || err).includes('permission')) {
        console.info(`Using fallback operational localities for ${cityName} (Firestore permissions/fallback active).`);
      } else {
        console.warn(`Error in subscribeToOperationalLocalities for ${cityName}:`, err);
      }
      const defaultAreas = SUPPORTED_AREAS[cityName] || [];
      const fallback: LocalityConfig[] = defaultAreas.map((a) => ({
        id: `loc-${cityName.toLowerCase()}-${a.toLowerCase()}`,
        cityName,
        name: a,
        isOperational: true,
        isCustomLocality: false,
        status: 'approved',
        createdAt: new Date().toISOString(),
      }));
      callback(fallback);
    }
  );
}

export async function addLocality(
  cityName: string,
  localityName: string,
  isOperational = true,
  isCustomLocality = false
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const trimmedCity = cityName.trim();
    const trimmedName = localityName.trim();
    if (!trimmedCity) return { success: false, error: 'City name is required.' };
    if (!trimmedName) return { success: false, error: 'Locality name is required.' };

    // Duplicate check within same city
    const q = query(collection(db, LOCALITIES_COL), where('cityName', '==', trimmedCity));
    const existing = await getDocs(q);
    const isDuplicate = existing.docs.some(
      (d) => (d.data() as LocalityConfig).name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      return { success: false, error: `Locality "${trimmedName}" already exists in ${trimmedCity}.` };
    }

    const locId = `loc-${Date.now()}`;
    const newLocality: LocalityConfig = {
      id: locId,
      cityName: trimmedCity,
      name: trimmedName,
      isOperational,
      isCustomLocality,
      status: isCustomLocality ? 'pending' : 'approved',
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, LOCALITIES_COL, locId), newLocality);
    return { success: true, id: locId };
  } catch (err: any) {
    console.error('Error adding locality:', err);
    return { success: false, error: err.message || 'Failed to add locality.' };
  }
}

export async function updateLocality(locId: string, partial: Partial<LocalityConfig>): Promise<{ success: boolean; error?: string }> {
  try {
    const docRef = doc(db, LOCALITIES_COL, locId);
    await updateDoc(docRef, {
      ...partial,
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (err: any) {
    console.error('Error updating locality:', err);
    return { success: false, error: err.message || 'Failed to update locality.' };
  }
}

export async function toggleLocalityOperational(locId: string, isOperational: boolean): Promise<{ success: boolean; error?: string }> {
  return updateLocality(locId, { isOperational });
}

export async function deleteLocality(locId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteDoc(doc(db, LOCALITIES_COL, locId));
    return { success: true };
  } catch (err: any) {
    console.error('Error deleting locality:', err);
    return { success: false, error: err.message || 'Failed to delete locality.' };
  }
}

// User-submitted custom locality request
export async function addCustomLocalityRequest(cityName: string, localityName: string): Promise<{ success: boolean; error?: string }> {
  return addLocality(cityName, localityName, true, true);
}
