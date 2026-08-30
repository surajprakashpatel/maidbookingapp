import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { User, Customer } from '../types';

export async function fetchUserById(uid: string): Promise<User | null> {
  try {
    const docRef = doc(db, 'users', uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as User;
    }
  } catch (err) {
    console.error('Error fetching user:', err);
  }
  return null;
}

export async function saveUserData(user: User): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', user.id);
    await setDoc(userRef, {
      ...user,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    if (user.role === 'customer') {
      const custRef = doc(db, 'customers', user.id);
      const customerData: Partial<Customer> = {
        id: user.id,
        role: 'customer',
        name: user.name,
        phone: user.phone,
        email: user.email,
        location: user.location,
        area: user.area,
        address: user.address,
        photoUrl: user.photoUrl,
        status: user.status,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(custRef, customerData, { merge: true });
    }
    return true;
  } catch (err) {
    console.error('Error saving user data:', err);
    return false;
  }
}

export async function fetchAllCustomers(): Promise<Customer[]> {
  try {
    const q = query(collection(db, 'users'), where('role', '==', 'customer'));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Customer);
  } catch (err) {
    console.error('Error fetching customers:', err);
    return [];
  }
}

export async function updateUserStatus(userId: string, status: 'active' | 'suspended'): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { status, updatedAt: new Date().toISOString() });
    return true;
  } catch (err) {
    console.error('Error updating user status:', err);
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

