import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { SUPPORTED_CITIES, SUPPORTED_AREAS } from '../mockData';
import { CityConfig, LocalityConfig } from '../types';

export async function fetchSupportedCitiesAndAreas(): Promise<{ cities: string[]; areas: Record<string, string[]> }> {
  try {
    const citiesQ = query(collection(db, 'locations_cities'), where('isOperational', '==', true));
    const citiesSnap = await getDocs(citiesQ);

    if (!citiesSnap.empty) {
      const cities: string[] = citiesSnap.docs
        .map(d => (d.data() as CityConfig).name)
        .sort((a, b) => a.localeCompare(b));

      const locsQ = query(collection(db, 'locations_localities'), where('isOperational', '==', true));
      const locsSnap = await getDocs(locsQ);

      const areas: Record<string, string[]> = {};
      cities.forEach(c => {
        areas[c] = [];
      });

      if (!locsSnap.empty) {
        locsSnap.docs.forEach(d => {
          const loc = d.data() as LocalityConfig;
          if (loc.cityName && areas[loc.cityName]) {
            areas[loc.cityName].push(loc.name);
          }
        });
        // Sort localities
        Object.keys(areas).forEach(c => {
          areas[c].sort((a, b) => a.localeCompare(b));
          if (areas[c].length === 0) {
            areas[c] = SUPPORTED_AREAS[c] || [c];
          }
        });
      } else {
        cities.forEach(c => {
          areas[c] = SUPPORTED_AREAS[c] || [c];
        });
      }

      return { cities, areas };
    }
  } catch (err) {
    console.error('Error fetching operational cities/areas:', err);
  }
  return { cities: SUPPORTED_CITIES, areas: SUPPORTED_AREAS };
}
