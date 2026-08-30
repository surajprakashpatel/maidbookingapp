import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  query, where
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Booking, BookingStatus, PaymentStatus } from '../types';
import { generateBookingNumber } from '../utils';
import { fetchAppSettings } from './settingsService';
import { MOCK_BOOKINGS, MOCK_MAID_BOOKINGS } from '../mockData';

export async function createBooking(data: Omit<Booking, 'id' | 'bookingNumber' | 'createdAt' | 'updatedAt' | 'platformFee' | 'totalAmount'>): Promise<{ success: boolean; bookingId?: string; bookingNumber?: string; error?: string }> {
  try {
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
    await setDoc(docRef, booking);

    return { success: true, bookingId, bookingNumber };
  } catch (err) {
    console.error('Error creating booking:', err);
    return { success: false, error: 'Failed to create booking. Please try again.' };
  }
}

export async function fetchBookingById(bookingId: string): Promise<Booking | null> {
  try {
    const docRef = doc(db, 'bookings', bookingId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as Booking;
    }
  } catch (err) {
    console.error('Error fetching booking by ID:', err);
  }
  return MOCK_BOOKINGS.find(b => b.id === bookingId) || null;
}

export async function fetchCustomerBookings(customerId: string): Promise<Booking[]> {
  try {
    const ref = collection(db, 'bookings');
    const q = query(ref, where('customerId', '==', customerId));
    const snap = await getDocs(q);
    const list = snap.docs.map(d => d.data() as Booking);
    if (list.length > 0) return list;
  } catch (err) {
    console.error('Error fetching customer bookings:', err);
  }
  return MOCK_BOOKINGS;
}

export async function fetchMaidBookings(maidId: string): Promise<Booking[]> {
  try {
    const ref = collection(db, 'bookings');
    const q = query(ref, where('maidId', '==', maidId));
    const snap = await getDocs(q);
    const list = snap.docs.map(d => d.data() as Booking);
    if (list.length > 0) return list;
  } catch (err) {
    console.error('Error fetching maid bookings:', err);
  }
  return MOCK_MAID_BOOKINGS;
}

export async function fetchAllBookingsAdmin(): Promise<Booking[]> {
  try {
    const ref = collection(db, 'bookings');
    const snap = await getDocs(ref);
    const list = snap.docs.map(d => d.data() as Booking);
    if (list.length > 0) return list;
  } catch (err) {
    console.error('Error fetching all admin bookings:', err);
  }
  return MOCK_BOOKINGS;
}

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
    await updateDoc(docRef, updates);
    return true;
  } catch (err) {
    console.error('Error updating booking status:', err);
    return false;
  }
}
