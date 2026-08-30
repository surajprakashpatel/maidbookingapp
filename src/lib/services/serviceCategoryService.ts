import { fetchAppSettings } from './settingsService';
import { ServiceCategory } from '../types';
import { SERVICE_CATEGORIES } from '../mockData';

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
