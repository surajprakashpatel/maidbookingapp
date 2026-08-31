import { doc, setDoc, getDocs, deleteDoc, collection } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Payment, PaymentGateway, PaymentStatus } from '../types';

export async function recordPaymentTransaction(data: {
  bookingId: string;
  bookingNumber: string;
  userId: string;
  gateway: PaymentGateway;
  transactionId: string;
  amount: number;
  status: PaymentStatus;
}): Promise<{ success: boolean; paymentId?: string; error?: string }> {
  try {
    const paymentId = `pay-${Date.now()}`;
    const paymentRecord: Payment = {
      id: paymentId,
      ...data,
      createdAt: new Date().toISOString(),
    };

    const docRef = doc(db, 'payments', paymentId);
    await setDoc(docRef, paymentRecord);

    return { success: true, paymentId };
  } catch (err) {
    console.error('Error recording payment transaction:', err);
    return { success: false, error: 'Payment record creation failed.' };
  }
}

export async function fetchAllPaymentsAdmin(): Promise<Payment[]> {
  try {
    const ref = collection(db, 'payments');
    const snap = await getDocs(ref);
    return snap.docs.map(d => d.data() as Payment);
  } catch (err) {
    console.warn('Error fetching payments from Firestore:', err);
    return [];
  }
}

export async function deletePaymentRecord(paymentId: string): Promise<boolean> {
  try {
    const docRef = doc(db, 'payments', paymentId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error('Error deleting payment record:', err);
    return false;
  }
}

// Payment Gateway Verification Stubs (Server-Side Ready)
export async function createRazorpayOrder(amount: number, bookingNumber: string) {
  return {
    id: `order_${Math.random().toString(36).substring(2, 12)}`,
    amount,
    currency: 'INR',
    receipt: bookingNumber,
  };
}

export async function verifyRazorpaySignature(paymentId: string, orderId: string, signature: string): Promise<boolean> {
  return !!(paymentId && orderId && signature);
}

export async function createPhonePeTxn(amount: number, bookingNumber: string) {
  return {
    merchantTransactionId: `MT${Date.now()}`,
    amount,
    currency: 'INR',
    bookingNumber,
  };
}
