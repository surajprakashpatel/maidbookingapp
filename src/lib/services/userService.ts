import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs,
  query, where, onSnapshot, Unsubscribe
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { User, Customer, UserRole, ApprovalStatus } from '../types';
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
    if (!data.id) {
      return { success: false, error: 'User ID is required.' };
    }

    const trimmedName = (data.name || '').trim();
    if (trimmedName.length < 2 || trimmedName.startsWith('User ') || trimmedName === 'Google User') {
      return { success: false, error: 'Please provide a valid full name (at least 2 characters).' };
    }

    const cleanPhone = (data.phone || '').replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      return { success: false, error: 'Please enter a valid 10-digit mobile number.' };
    }

    const resolvedCity = (data.city || data.location || '').trim();
    if (!resolvedCity) {
      return { success: false, error: 'City is required.' };
    }

    const resolvedArea = (data.area || '').trim();
    if (!resolvedArea) {
      return { success: false, error: 'Area / locality is required.' };
    }

    const resolvedRole: UserRole = data.role === 'maid' ? 'maid' : 'customer';

    if (resolvedRole === 'customer') {
      const trimmedAddress = (data.address || '').trim();
      if (trimmedAddress.length < 5) {
        return { success: false, error: 'Street / house address is required (at least 5 characters).' };
      }
    }

    // Preserve existing document values if present
    const userRef = doc(db, 'users', data.id);
    const existingSnap = await getDoc(userRef).catch(() => null);
    const existingData = existingSnap?.exists() ? (existingSnap.data() as User) : null;

    // Customer accounts are automatically approved upon completing profile; Maid accounts require admin review
    const approvalStatus: ApprovalStatus = resolvedRole === 'customer'
      ? 'approved'
      : (existingData?.approvalStatus === 'approved' ? 'approved' : 'pending');

    const fullUser: User = {
      id: data.id,
      role: resolvedRole,
      name: trimmedName,
      phone: cleanPhone,
      email: (data.email || existingData?.email || '').trim() || undefined,
      photoUrl: data.photoUrl || existingData?.photoUrl || undefined,
      location: resolvedCity,
      city: resolvedCity,
      area: resolvedArea,
      address: (data.address || existingData?.address || '').trim(),
      status: existingData?.status || 'active',
      approvalStatus,
      rejectionReason: existingData?.rejectionReason || undefined,
      profileCompleted: true,
      createdAt: existingData?.createdAt || data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const sanitizedUser = cleanFirestoreData(fullUser);
    await setDoc(userRef, sanitizedUser, { merge: true });

    if (resolvedRole === 'customer') {
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
    const existingSnap = await getDoc(userRef).catch(() => null);
    const existingData = existingSnap?.exists() ? (existingSnap.data() as User) : null;

    // Preserve privileged security fields to prevent client-side tampering
    const safeRole = existingData?.role || user.role || 'customer';
    const safeApprovalStatus = existingData?.approvalStatus || user.approvalStatus || (safeRole === 'customer' ? 'approved' : 'pending');
    const safeStatus = existingData?.status || user.status || 'active';
    const safeCreatedAt = existingData?.createdAt || user.createdAt || new Date().toISOString();

    const sanitizedUser = cleanFirestoreData({
      ...user,
      role: safeRole,
      status: safeStatus,
      approvalStatus: safeApprovalStatus,
      rejectionReason: existingData?.rejectionReason,
      createdAt: safeCreatedAt,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(userRef, sanitizedUser, { merge: true });

    if (safeRole === 'customer') {
      const custRef = doc(db, 'customers', user.id);
      const customerData: Partial<Customer> = {
        id: user.id,
        role: 'customer',
        name: user.name,
        phone: user.phone,
        email: user.email,
        location: user.location || user.city,
        city: user.city || user.location,
        area: user.area,
        address: user.address,
        photoUrl: user.photoUrl,
        status: safeStatus,
        approvalStatus: safeApprovalStatus,
        rejectionReason: existingData?.rejectionReason,
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
 * READ: Fetch all customers for Admin (with optional approvalStatus filter)
 */
export async function fetchAllCustomers(statusFilter?: ApprovalStatus | 'all'): Promise<Customer[]> {
  try {
    const q = query(collection(db, 'users'), where('role', '==', 'customer'));
    const snap = await getDocs(q);
    let list = snap.docs.map(d => {
      const dData = d.data() as Customer;
      // Normalize legacy active customers without approvalStatus to approved
      if (!dData.approvalStatus) {
        dData.approvalStatus = dData.status === 'active' ? 'approved' : 'pending';
      }
      return dData;
    });

    if (statusFilter && statusFilter !== 'all') {
      list = list.filter(c => {
        if (statusFilter === 'pending') {
          return c.approvalStatus === 'pending' || c.approvalStatus === 'under_review';
        }
        return c.approvalStatus === statusFilter;
      });
    }

    return list;
  } catch (err) {
    console.warn('Error fetching customers from Firestore:', err);
    return [];
  }
}

/**
 * READ REAL-TIME: Subscribe to all customers for Admin
 */
export function subscribeToAllCustomers(
  callback: (customers: Customer[]) => void,
  statusFilter?: ApprovalStatus | 'all'
): Unsubscribe {
  const q = query(collection(db, 'users'), where('role', '==', 'customer'));
  return onSnapshot(q, (snap) => {
    let list = snap.docs.map(d => {
      const dData = d.data() as Customer;
      if (!dData.approvalStatus) {
        dData.approvalStatus = dData.status === 'active' ? 'approved' : 'pending';
      }
      return dData;
    });

    if (statusFilter && statusFilter !== 'all') {
      list = list.filter(c => {
        if (statusFilter === 'pending') {
          return c.approvalStatus === 'pending' || c.approvalStatus === 'under_review';
        }
        return c.approvalStatus === statusFilter;
      });
    }

    callback(list);
  }, (err) => {
    console.warn('Customers subscription error:', err);
    callback([]);
  });
}

/**
 * UPDATE: Admin updates Customer Approval Status (Approve / Reject)
 */
export async function updateCustomerApprovalStatus(
  userId: string,
  approvalStatus: ApprovalStatus,
  reason?: string
): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', userId);
    const updates: Partial<User> & { rejectionReason?: string } = {
      approvalStatus,
      updatedAt: new Date().toISOString(),
    };
    if (reason) {
      updates.rejectionReason = reason;
    }
    if (approvalStatus === 'approved') {
      updates.status = 'active';
    }

    await updateDoc(userRef, cleanFirestoreData(updates));

    const custRef = doc(db, 'customers', userId);
    await updateDoc(custRef, cleanFirestoreData(updates)).catch(() => {});

    // Dispatch in-app notification to customer
    try {
      const { sendAppNotification } = await import('./notificationService');
      if (approvalStatus === 'approved') {
        await sendAppNotification({
          userId,
          title: 'Account Approved! 🎉',
          message: 'Your account has been approved by administrator. You can now explore and book verified home services on MaidEasy!',
          type: 'account',
        });
      } else if (approvalStatus === 'rejected') {
        await sendAppNotification({
          userId,
          title: 'Account Registration Update',
          message: reason
            ? `Your registration requires attention: ${reason}`
            : 'Your account registration could not be approved at this time.',
          type: 'account',
        });
      }
    } catch {
      // Notification dispatch failure should not block database persistence
    }

    return true;
  } catch (err) {
    console.error('Error updating customer approval status in Firestore:', err);
    return false;
  }
}

/**
 * UPDATE: Update user status (active vs suspended)
 */
export async function updateUserStatus(userId: string, status: 'active' | 'suspended'): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { status, updatedAt: new Date().toISOString() });
    const custRef = doc(db, 'customers', userId);
    await updateDoc(custRef, { status, updatedAt: new Date().toISOString() }).catch(() => {});
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
