import { doc, getDoc, setDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '../firebase/config';
import { AppSettings } from '../types';
import { DEFAULT_APP_SETTINGS } from '../mockData';

const SETTINGS_DOC_PATH = 'settings/global';

/**
 * READ: Fetch global app settings
 */
export async function fetchAppSettings(): Promise<AppSettings> {
  try {
    const docRef = doc(db, SETTINGS_DOC_PATH);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as AppSettings;
    }
  } catch (err) {
    console.warn('Failed to fetch settings from Firestore, using defaults:', err);
  }
  return DEFAULT_APP_SETTINGS;
}

/**
 * READ REAL-TIME: Subscribe to global app settings
 */
export function subscribeToAppSettings(
  callback: (settings: AppSettings) => void
): Unsubscribe {
  const docRef = doc(db, SETTINGS_DOC_PATH);
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as AppSettings);
    } else {
      callback(DEFAULT_APP_SETTINGS);
    }
  }, (err) => {
    console.warn('Settings subscription error:', err);
    callback(DEFAULT_APP_SETTINGS);
  });
}

/**
 * UPDATE: Update global app settings in Firestore
 */
export async function updateAppSettings(newSettings: Partial<AppSettings>): Promise<boolean> {
  try {
    const docRef = doc(db, SETTINGS_DOC_PATH);
    await setDoc(docRef, newSettings, { merge: true });
    return true;
  } catch (err) {
    console.error('Failed to update app settings in Firestore:', err);
    return false;
  }
}
