import {
  collection, doc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, onSnapshot, Unsubscribe, writeBatch
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
    const notifId = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
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
 * CREATE BATCH: Send broadcast notification to multiple target groups
 */
export async function broadcastNotification(
  target: 'all' | 'customers' | 'maids',
  title: string,
  message: string,
  type: Notification['type'] = 'system'
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const userIds = new Set<string>();

    if (target === 'all' || target === 'customers') {
      const customersSnap = await getDocs(collection(db, 'customers'));
      customersSnap.docs.forEach(d => userIds.add(d.id));
      
      const usersSnap = await getDocs(collection(db, 'users'));
      usersSnap.docs.forEach(d => {
        const data = d.data();
        if (target === 'all' || data.role === 'customer') {
          userIds.add(d.id);
        }
      });
    }

    if (target === 'all' || target === 'maids') {
      const maidsSnap = await getDocs(collection(db, 'maids'));
      maidsSnap.docs.forEach(d => userIds.add(d.id));
    }

    if (userIds.size === 0) {
      return { success: true, count: 0 };
    }

    const idsArray = Array.from(userIds);
    // Firestore batch supports up to 500 operations
    const chunkSize = 400;
    const now = new Date().toISOString();
    let sentCount = 0;

    for (let i = 0; i < idsArray.length; i += chunkSize) {
      const batch = writeBatch(db);
      const chunk = idsArray.slice(i, i + chunkSize);

      chunk.forEach(uid => {
        const notifId = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const notifDocRef = doc(db, 'notifications', notifId);
        const newNotif: Notification = {
          id: notifId,
          userId: uid,
          title,
          message,
          type,
          read: false,
          createdAt: now,
        };
        batch.set(notifDocRef, cleanFirestoreData(newNotif));
        sentCount++;
      });

      await batch.commit();
    }

    return { success: true, count: sentCount };
  } catch (err: unknown) {
    console.error('Error broadcasting notification:', err);
    return { success: false, count: 0, error: err instanceof Error ? err.message : 'Broadcast failed' };
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


