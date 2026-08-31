import {
  collection, doc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, onSnapshot, Unsubscribe
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Notification } from '../types';
import { cleanFirestoreData } from '../utils';

/**
 * READ: Fetch notifications for a user
 */
export async function fetchUserNotifications(userId: string): Promise<Notification[]> {
  try {
    const ref = collection(db, 'notifications');
    const q = query(ref, where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Notification);
  } catch (err) {
    console.warn('Error fetching notifications from Firestore:', err);
    return [];
  }
}

/**
 * READ REAL-TIME: Subscribe to user notifications
 */
export function subscribeToUserNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void
): Unsubscribe {
  const ref = collection(db, 'notifications');
  const q = query(ref, where('userId', '==', userId));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map(d => d.data() as Notification);
    // Sort newest first
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(list);
  }, (err) => {
    console.warn('Notifications subscription error:', err);
    callback([]);
  });
}

/**
 * CREATE: Send a notification to a user
 */
export async function sendAppNotification(notif: Omit<Notification, 'id' | 'read' | 'createdAt'>): Promise<boolean> {
  try {
    const notifId = `notif-${Date.now()}`;
    const newNotif: Notification = {
      ...notif,
      id: notifId,
      read: false,
      createdAt: new Date().toISOString(),
    };

    const docRef = doc(db, 'notifications', notifId);
    await setDoc(docRef, cleanFirestoreData(newNotif));
    return true;
  } catch (err) {
    console.error('Error sending app notification to Firestore:', err);
    return false;
  }
}

/**
 * UPDATE: Mark notification as read
 */
export async function markNotificationAsRead(notifId: string): Promise<boolean> {
  try {
    const docRef = doc(db, 'notifications', notifId);
    await updateDoc(docRef, { read: true });
    return true;
  } catch (err) {
    console.error('Error marking notification read in Firestore:', err);
    return false;
  }
}

/**
 * DELETE: Delete a notification from Firestore
 */
export async function deleteNotification(notifId: string): Promise<boolean> {
  try {
    const docRef = doc(db, 'notifications', notifId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error('Error deleting notification from Firestore:', err);
    return false;
  }
}
