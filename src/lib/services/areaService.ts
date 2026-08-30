import { fetchAppSettings } from './settingsService';
import { SUPPORTED_CITIES, SUPPORTED_AREAS } from '../mockData';

export async function fetchSupportedCitiesAndAreas(): Promise<{ cities: string[]; areas: Record<string, string[]> }> {
  try {
    const settings = await fetchAppSettings();
    if (settings.location.supportedCities.length > 0) {
      const cities = settings.location.supportedCities;
      const areas: Record<string, string[]> = {};
      cities.forEach(city => {
        areas[city] = SUPPORTED_AREAS[city] || [city];
      });
      return { cities, areas };
    }
  } catch (err) {
    console.error('Error fetching cities/areas from settings:', err);
  }
  return { cities: SUPPORTED_CITIES, areas: SUPPORTED_AREAS };
}
