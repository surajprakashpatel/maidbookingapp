import { fetchAppSettings, subscribeToAppSettings } from './settingsService';
import { ServiceCategory } from '../types';
import { SERVICE_CATEGORIES } from '../mockData';
import { Unsubscribe } from 'firebase/firestore';

/**
 * READ: Fetch active service categories
 */
export async function fetchServiceCategories(): Promise<ServiceCategory[]> {
  try {
    const settings = await fetchAppSettings();
    if (settings.services && settings.services.length > 0) {
      return settings.services.filter(s => s.active);
    }
  } catch (err) {
    console.error('Error fetching service categories:', err);
  }
  return SERVICE_CATEGORIES.filter(s => s.active);
}

/**
 * READ REAL-TIME: Subscribe to service categories
 */
export function subscribeToServiceCategories(
  callback: (categories: ServiceCategory[]) => void
): Unsubscribe {
  return subscribeToAppSettings((settings) => {
    if (settings.services && settings.services.length > 0) {
      callback(settings.services.filter(s => s.active));
    } else {
      callback(SERVICE_CATEGORIES.filter(s => s.active));
    }
  });
}
