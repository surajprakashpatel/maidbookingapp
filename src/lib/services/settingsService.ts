import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { AppSettings } from '../types';
import { DEFAULT_APP_SETTINGS } from '../mockData';

const SETTINGS_DOC_PATH = 'settings/global';

export async function fetchAppSettings(): Promise<AppSettings> {
  try {
    const docRef = doc(db, SETTINGS_DOC_PATH);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as AppSettings;
    }
  } catch (err) {
    console.warn('Failed to fetch settings from Firestore, using default settings:', err);
  }
  return DEFAULT_APP_SETTINGS;
}

export async function updateAppSettings(newSettings: Partial<AppSettings>): Promise<boolean> {
  try {
    const docRef = doc(db, SETTINGS_DOC_PATH);
    await setDoc(docRef, newSettings, { merge: true });
    return true;
  } catch (err) {
    console.error('Failed to update app settings:', err);
    return false;
  }
}
