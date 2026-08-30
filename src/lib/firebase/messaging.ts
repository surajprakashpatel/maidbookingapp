import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { app } from './config';

export async function initMessaging(): Promise<Messaging | null> {
  if (typeof window === 'undefined') return null;
  const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
  if (!isSupported) return null;

  try {
    const messaging = getMessaging(app);
    return messaging;
  } catch (error) {
    console.warn('Firebase Messaging initialisation failed:', error);
    return null;
  }
}

export async function requestFCMToken(): Promise<string | null> {
  try {
    const messaging = await initMessaging();
    if (!messaging) return null;

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    const token = await getToken(messaging, { vapidKey });
    return token || null;
  } catch (error) {
    console.warn('Failed to obtain FCM token:', error);
    return null;
  }
}

export function onForegroundNotification(callback: (payload: unknown) => void) {
  initMessaging().then((messaging) => {
    if (messaging) {
      onMessage(messaging, (payload) => {
        callback(payload);
      });
    }
  });
}
