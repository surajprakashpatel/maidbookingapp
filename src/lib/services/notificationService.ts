import { collection, doc, getDocs, setDoc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Notification } from '../types';
import { MOCK_NOTIFICATIONS } from '../mockData';

export async function fetchUserNotifications(userId: string): Promise<Notification[]> {
  try {
    const ref = collection(db, 'notifications');
    const q = query(ref, where('userId', '==', userId));
    const snap = await getDocs(q);
    const list = snap.docs.map(d => d.data() as Notification);
    if (list.length > 0) return list;
  } catch (err) {
    console.error('Error fetching notifications:', err);
  }
  return MOCK_NOTIFICATIONS.filter(n => n.userId === userId || userId === 'cust-1');
}

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
    await setDoc(docRef, newNotif);
    return true;
  } catch (err) {
    console.error('Error sending app notification:', err);
    return false;
  }
}

export async function markNotificationAsRead(notifId: string): Promise<boolean> {
  try {
    const docRef = doc(db, 'notifications', notifId);
    await updateDoc(docRef, { read: true });
    return true;
  } catch (err) {
    console.error('Error marking notification read:', err);
    return false;
  }
}
