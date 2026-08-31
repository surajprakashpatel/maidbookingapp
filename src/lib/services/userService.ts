import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs,
  query, where, onSnapshot, Unsubscribe
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { User, Customer, UserRole } from '../types';
import { cleanFirestoreData } from '../utils';

/**
 * READ: Fetch single user by ID
 */
export async function fetchUserById(uid: string): Promise<User | null> {
  try {
    const docRef = doc(db, 'users', uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as User;
    }
  } catch (err) {
    console.warn('Error fetching user from Firestore:', err);
  }
  return null;
}

/**
 * READ REAL-TIME: Subscribe to user by ID
 */
export function subscribeToUserById(
  uid: string,
  callback: (user: User | null) => void
): Unsubscribe {
  const docRef = doc(db, 'users', uid);
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as User);
    } else {
      callback(null);
    }
  }, (err) => {
    console.warn('User subscription error:', err);
    callback(null);
  });
}

/**
 * CREATE / COMPLETE: Save completed user profile to Firestore
 */
export async function completeUserProfile(
  data: Partial<User> & { id: string; role: UserRole; name: string }
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const fullUser: User = {
      id: data.id,
      role: data.role,
      name: data.name,
      phone: data.phone || '',
      email: data.email || undefined,
      photoUrl: data.photoUrl || undefined,
      location: data.location || data.city || 'Bhilai',
      city: data.city || data.location || 'Bhilai',
      area: data.area || 'Nehru Nagar',
      address: data.address || '',
      status: 'active',
      profileCompleted: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const sanitizedUser = cleanFirestoreData(fullUser);
    const userRef = doc(db, 'users', data.id);
    await setDoc(userRef, sanitizedUser, { merge: true });

    if (data.role === 'customer') {
      const custRef = doc(db, 'customers', data.id);
      const customerData: Customer = {
        ...fullUser,
        role: 'customer',
        totalBookings: 0,
      };
      await setDoc(custRef, cleanFirestoreData(customerData), { merge: true });
    }

    return { success: true, user: fullUser };
  } catch (err: unknown) {
    console.error('Error completing user profile in Firestore:', err);
    return { success: false, error: (err as Error)?.message || 'Failed to save profile.' };
  }
}

/**
 * UPDATE: Save / Merge user data
 */
export async function saveUserData(user: User): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', user.id);
    const sanitizedUser = cleanFirestoreData({
      ...user,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(userRef, sanitizedUser, { merge: true });

    if (user.role === 'customer') {
      const custRef = doc(db, 'customers', user.id);
      const customerData: Partial<Customer> = {
        id: user.id,
        role: 'customer',
        name: user.name,
        phone: user.phone,
        email: user.email,
        location: user.location,
        city: user.city,
        area: user.area,
        address: user.address,
        photoUrl: user.photoUrl,
        status: user.status,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(custRef, cleanFirestoreData(customerData), { merge: true });
    }
    return true;
  } catch (err) {
    console.error('Error saving user data in Firestore:', err);
    return false;
  }
}

/**
 * READ: Fetch all customers for Admin
 */
export async function fetchAllCustomers(): Promise<Customer[]> {
  try {
    const q = query(collection(db, 'users'), where('role', '==', 'customer'));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Customer);
  } catch (err) {
    console.warn('Error fetching customers from Firestore:', err);
    return [];
  }
}

/**
 * READ REAL-TIME: Subscribe to all customers for Admin
 */
export function subscribeToAllCustomers(
  callback: (customers: Customer[]) => void
): Unsubscribe {
  const q = query(collection(db, 'users'), where('role', '==', 'customer'));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map(d => d.data() as Customer);
    callback(list);
  }, (err) => {
    console.warn('Customers subscription error:', err);
    callback([]);
  });
}

/**
 * UPDATE: Update user status (active vs suspended)
 */
export async function updateUserStatus(userId: string, status: 'active' | 'suspended'): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { status, updatedAt: new Date().toISOString() });
    return true;
  } catch (err) {
    console.error('Error updating user status in Firestore:', err);
    return false;
  }
}

export async function fetchCustomerById(uid: string): Promise<Customer | null> {
  const user = await fetchUserById(uid);
  return user ? (user as unknown as Customer) : null;
}

export async function updateCustomerStatus(userId: string, status: 'active' | 'suspended'): Promise<boolean> {
  return updateUserStatus(userId, status);
}

/**
 * DELETE: Delete user and customer profile from Firestore
 */
export async function deleteUser(userId: string): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
    const custRef = doc(db, 'customers', userId);
    await deleteDoc(custRef).catch(() => {});
    return true;
  } catch (err) {
    console.error('Error deleting user from Firestore:', err);
    return false;
  }
}
