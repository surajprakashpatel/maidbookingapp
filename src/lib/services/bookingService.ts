import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, onSnapshot, Unsubscribe
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Booking, BookingStatus, PaymentStatus } from '../types';
import { generateBookingNumber, cleanFirestoreData } from '../utils';
import { fetchAppSettings } from './settingsService';

/**
 * Check if a maid has an active booking on the specified date and time slot
 */
export async function checkBookingSlotConflict(
  maidId: string,
  date: string,
  time?: string
): Promise<boolean> {
  try {
    const ref = collection(db, 'bookings');
    const q = query(
      ref,
      where('maidId', '==', maidId),
      where('date', '==', date)
    );
    const snap = await getDocs(q);
    const activeBookings = snap.docs
      .map(d => d.data() as Booking)
      .filter(b => b.bookingStatus === 'pending' || b.bookingStatus === 'awaiting_maid' || b.bookingStatus === 'confirmed' || b.bookingStatus === 'paid' || b.bookingStatus === 'in_progress');

    if (!time) return activeBookings.length > 0;

    return activeBookings.some(b => b.time === time);
  } catch (err) {
    console.warn('Error checking booking conflict in Firestore:', err);
    return false;
  }
}

/**
 * CREATE: Create a new booking in Firestore
 */
export async function createBooking(
  data: Omit<Booking, 'id' | 'bookingNumber' | 'createdAt' | 'updatedAt' | 'platformFee' | 'totalAmount'>
): Promise<{ success: boolean; bookingId?: string; bookingNumber?: string; error?: string }> {
  try {
    const isConflicted = await checkBookingSlotConflict(data.maidId, data.date, data.time);
    if (isConflicted) {
      return {
        success: false,
        error: 'The selected maid is already booked for this date and time slot. Please choose another slot.'
      };
    }

    const appSettings = await fetchAppSettings();
    const platformFeePercent = appSettings.pricing.platformFeePercent || 5;

    const bookingId = `bk-${Date.now()}`;
    const bookingNumber = generateBookingNumber();

    const platformFee = Math.round(data.serviceAmount * (platformFeePercent / 100));
    const totalAmount = data.serviceAmount + platformFee - (data.discount || 0);

    const booking: Booking = {
      ...data,
      id: bookingId,
      bookingNumber,
      platformFee,
      totalAmount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = doc(db, 'bookings', bookingId);
    await setDoc(docRef, cleanFirestoreData(booking));

    return { success: true, bookingId, bookingNumber };
  } catch (err) {
    console.error('Error creating booking in Firestore:', err);
    return { success: false, error: 'Failed to create booking. Please try again.' };
  }
}

/**
 * READ: Fetch a single booking by ID
 */
export async function fetchBookingById(bookingId: string): Promise<Booking | null> {
  try {
    const docRef = doc(db, 'bookings', bookingId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as Booking;
    }
  } catch (err) {
    console.warn('Error fetching booking by ID from Firestore:', err);
  }
  return null;
}

/**
 * READ REAL-TIME: Subscribe to single booking updates
 */
export function subscribeToBookingById(
  bookingId: string,
  callback: (booking: Booking | null) => void
): Unsubscribe {
  const docRef = doc(db, 'bookings', bookingId);
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as Booking);
    } else {
      callback(null);
    }
  }, (err) => {
    console.warn('Booking subscription error:', err);
    callback(null);
  });
}

/**
 * READ: Fetch customer bookings
 */
export async function fetchCustomerBookings(customerId: string): Promise<Booking[]> {
  try {
    const ref = collection(db, 'bookings');
    const q = query(ref, where('customerId', '==', customerId));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Booking);
  } catch (err) {
    console.warn('Error fetching customer bookings from Firestore:', err);
    return [];
  }
}

/**
 * READ REAL-TIME: Subscribe to customer bookings
 */
export function subscribeToCustomerBookings(
  customerId: string,
  callback: (bookings: Booking[]) => void
): Unsubscribe {
  const ref = collection(db, 'bookings');
  const q = query(ref, where('customerId', '==', customerId));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map(d => d.data() as Booking);
    callback(list);
  }, (err) => {
    console.warn('Customer bookings subscription error:', err);
    callback([]);
  });
}

/**
 * READ: Fetch maid bookings
 */
export async function fetchMaidBookings(maidId: string): Promise<Booking[]> {
  try {
    const ref = collection(db, 'bookings');
    const ids = [maidId];
    if (maidId.startsWith('maid-')) {
      ids.push(maidId.replace('maid-', ''));
    } else {
      ids.push(`maid-${maidId}`);
    }
    const q = query(ref, where('maidId', 'in', ids));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Booking);
  } catch (err) {
    console.warn('Error fetching maid bookings from Firestore:', err);
    return [];
  }
}

/**
 * READ REAL-TIME: Subscribe to maid bookings
 */
export function subscribeToMaidBookings(
  maidId: string,
  callback: (bookings: Booking[]) => void
): Unsubscribe {
  const ref = collection(db, 'bookings');
  const ids = [maidId];
  if (maidId.startsWith('maid-')) {
    ids.push(maidId.replace('maid-', ''));
  } else {
    ids.push(`maid-${maidId}`);
  }
  const q = query(ref, where('maidId', 'in', ids));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map(d => d.data() as Booking);
    callback(list);
  }, (err) => {
    console.warn('Maid bookings subscription error:', err);
    callback([]);
  });
}

/**
 * READ: Fetch all bookings for Admin
 */
export async function fetchAllBookingsAdmin(): Promise<Booking[]> {
  try {
    const ref = collection(db, 'bookings');
    const snap = await getDocs(ref);
    return snap.docs.map(d => d.data() as Booking);
  } catch (err) {
    console.warn('Error fetching all admin bookings from Firestore:', err);
    return [];
  }
}

/**
 * READ REAL-TIME: Subscribe to all bookings for Admin
 */
export function subscribeToAllBookingsAdmin(
  callback: (bookings: Booking[]) => void
): Unsubscribe {
  const ref = collection(db, 'bookings');
  return onSnapshot(ref, (snap) => {
    const list = snap.docs.map(d => d.data() as Booking);
    callback(list);
  }, (err) => {
    console.warn('Admin bookings subscription error:', err);
    callback([]);
  });
}

/**
 * UPDATE: Update booking status and payment status in Firestore
 */
export async function updateBookingStatus(
  bookingId: string,
  bookingStatus: BookingStatus,
  paymentStatus?: PaymentStatus
): Promise<boolean> {
  try {
    const docRef = doc(db, 'bookings', bookingId);
    const updates: Partial<Booking> = {
      bookingStatus,
      updatedAt: new Date().toISOString(),
    };
    if (paymentStatus) {
      updates.paymentStatus = paymentStatus;
    }
    await updateDoc(docRef, cleanFirestoreData(updates));
    return true;
  } catch (err) {
    console.error('Error updating booking status in Firestore:', err);
    return false;
  }
}

/**
 * DELETE: Delete a booking from Firestore
 */
export async function deleteBooking(bookingId: string): Promise<boolean> {
  try {
    const docRef = doc(db, 'bookings', bookingId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error('Error deleting booking from Firestore:', err);
    return false;
  }
}
