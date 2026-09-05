import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, onSnapshot, Unsubscribe
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { db, auth } from '../firebase/config';
import { Maid, MaidRegistrationForm, FilterState, ApprovalStatus, User } from '../types';
import { maskAadhaar, cleanFirestoreData } from '../utils';
import { uploadDataUrl, uploadFile } from './storageService';

/**
 * READ: Fetch maid by ID (supports both standard and prefixed IDs)
 */
export async function fetchMaidById(maidId: string): Promise<Maid | null> {
  try {
    const docRef = doc(db, 'maids', maidId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as Maid;
    }
    const altId = maidId.startsWith('maid-') ? maidId.replace('maid-', '') : `maid-${maidId}`;
    const altDocRef = doc(db, 'maids', altId);
    const altSnap = await getDoc(altDocRef);
    if (altSnap.exists()) {
      return altSnap.data() as Maid;
    }
  } catch (err) {
    console.warn('Error fetching maid by ID from Firestore:', err);
  }
  return null;
}

/**
 * READ REAL-TIME: Subscribe to single maid updates
 */
export function subscribeToMaidById(
  maidId: string,
  callback: (maid: Maid | null) => void
): Unsubscribe {
  const docRef = doc(db, 'maids', maidId);
  return onSnapshot(docRef, async (snap) => {
    if (snap.exists()) {
      callback(snap.data() as Maid);
    } else {
      const altId = maidId.startsWith('maid-') ? maidId.replace('maid-', '') : `maid-${maidId}`;
      const altSnap = await getDoc(doc(db, 'maids', altId)).catch(() => null);
      if (altSnap && altSnap.exists()) {
        callback(altSnap.data() as Maid);
      } else {
        callback(null);
      }
    }
  }, (err) => {
    console.warn('Maid subscription error:', err);
    callback(null);
  });
}

/**
 * READ: Fetch approved active maids
 */
export async function fetchApprovedMaids(filter?: Partial<FilterState>): Promise<Maid[]> {
  try {
    const maidsRef = collection(db, 'maids');
    const q = query(
      maidsRef,
      where('approvalStatus', '==', 'approved'),
      where('isActive', '==', true)
    );
    const snap = await getDocs(q);
    let list = snap.docs.map(d => d.data() as Maid);

    if (filter) {
      if (filter.area && filter.area !== 'all') {
        list = list.filter(m => m.area === filter.area || m.serviceAreas.includes(filter.area!));
      }
      if (filter.gender && filter.gender !== 'all') {
        list = list.filter(m => m.gender === filter.gender);
      }
      if (filter.service && filter.service !== 'all') {
        list = list.filter(m => m.services.includes(filter.service!));
      }
      if (filter.verifiedOnly) {
        list = list.filter(m => m.verificationStatus === 'verified');
      }
    }

    return list;
  } catch (err) {
    console.warn('Error fetching approved maids from Firestore:', err);
    return [];
  }
}

/**
 * READ REAL-TIME: Subscribe to approved maids
 */
export function subscribeToApprovedMaids(
  callback: (maids: Maid[]) => void,
  filter?: Partial<FilterState>
): Unsubscribe {
  const maidsRef = collection(db, 'maids');
  const q = query(
    maidsRef,
    where('approvalStatus', '==', 'approved'),
    where('isActive', '==', true)
  );

  return onSnapshot(q, (snap) => {
    let list = snap.docs.map(d => d.data() as Maid);

    if (filter) {
      if (filter.area && filter.area !== 'all') {
        list = list.filter(m => m.area === filter.area || m.serviceAreas.includes(filter.area!));
      }
      if (filter.gender && filter.gender !== 'all') {
        list = list.filter(m => m.gender === filter.gender);
      }
      if (filter.service && filter.service !== 'all') {
        list = list.filter(m => m.services.includes(filter.service!));
      }
      if (filter.verifiedOnly) {
        list = list.filter(m => m.verificationStatus === 'verified');
      }
    }

    callback(list);
  }, (err) => {
    console.warn('Approved maids subscription error:', err);
    callback([]);
  });
}

/**
 * READ: Fetch all maids for Admin
 */
export async function fetchAllMaidsAdmin(statusFilter?: ApprovalStatus | 'all'): Promise<Maid[]> {
  try {
    const maidsRef = collection(db, 'maids');
    let q = query(maidsRef);
    if (statusFilter && statusFilter !== 'all') {
      if (statusFilter === 'under_review' || statusFilter === 'pending') {
        q = query(maidsRef, where('approvalStatus', 'in', ['under_review', 'pending']));
      } else {
        q = query(maidsRef, where('approvalStatus', '==', statusFilter));
      }
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Maid);
  } catch (err) {
    console.warn('Error fetching admin maids list from Firestore:', err);
    return [];
  }
}

/**
 * READ REAL-TIME: Subscribe to all maids for Admin
 */
export function subscribeToAllMaidsAdmin(
  callback: (maids: Maid[]) => void,
  statusFilter?: ApprovalStatus | 'all'
): Unsubscribe {
  const maidsRef = collection(db, 'maids');
  let q = query(maidsRef);
  if (statusFilter && statusFilter !== 'all') {
    if (statusFilter === 'under_review' || statusFilter === 'pending') {
      q = query(maidsRef, where('approvalStatus', 'in', ['under_review', 'pending']));
    } else {
      q = query(maidsRef, where('approvalStatus', '==', statusFilter));
    }
  }

  return onSnapshot(q, (snap) => {
    const list = snap.docs.map(d => d.data() as Maid);
    callback(list);
  }, (err) => {
    console.warn('Admin maids subscription error:', err);
    callback([]);
  });
}

/**
 * CREATE: Register / Submit Maid Profile
 */
export async function submitMaidRegistration(
  form: MaidRegistrationForm,
  userId: string
): Promise<{ success: boolean; maidId?: string; userId?: string; error?: string }> {
  try {
    // 1. Ensure effective user ID exists
    let effectiveUserId = userId;
    if (!effectiveUserId) {
      if (auth.currentUser) {
        effectiveUserId = auth.currentUser.uid;
      } else {
        const cleanPhone = form.phone ? form.phone.replace(/\D/g, '') : `${Date.now()}`;
        const email = form.email || `${cleanPhone}@maideasy.in`;
        try {
          const cred = await signInWithEmailAndPassword(auth, email, 'Password123!');
          effectiveUserId = cred.user.uid;
        } catch {
          const cred = await createUserWithEmailAndPassword(auth, email, 'Password123!');
          effectiveUserId = cred.user.uid;
        }
      }
    }

    const maidId = `maid-${effectiveUserId}`;
    const maskedAadhaar = form.aadhaarNumber ? maskAadhaar(form.aadhaarNumber) : '';

    let photoUrl = form.profilePhotoPreview || undefined;
    let selfieUrl = form.selfieDataUrl || undefined;

    if (form.profilePhoto) {
      try {
        photoUrl = await uploadFile(`maids/${maidId}/profile-photo.jpg`, form.profilePhoto);
      } catch (e) {
        console.warn('Storage upload for profilePhoto skipped or failed:', e);
      }
    }

    if (form.selfieDataUrl && form.selfieDataUrl.startsWith('data:')) {
      try {
        selfieUrl = await uploadDataUrl(`maids/${maidId}/selfie.png`, form.selfieDataUrl);
      } catch (e) {
        console.warn('Storage upload for selfieUrl skipped or failed:', e);
      }
    }

    const newMaid: Maid = {
      id: maidId,
      userId: effectiveUserId,
      name: form.name,
      phone: form.phone,
      email: form.email || undefined,
      gender: form.gender,
      profilePhoto: photoUrl,
      selfieUrl: selfieUrl,
      verificationStatus: selfieUrl ? 'verified' : 'submitted',
      selfieStatus: selfieUrl ? 'verified' : 'captured',
      approvalStatus: 'under_review',
      aadhaarMasked: maskedAadhaar,
      location: form.location,
      city: form.city || form.location,
      area: form.area,
      address: form.address,
      pincode: form.pincode,
      serviceAreas: (form.serviceAreas && form.serviceAreas.length > 0) ? form.serviceAreas : (form.area ? [form.area] : []),
      workRadius: form.workRadius || 5,
      qualification: form.qualification,
      experience: form.experience,
      services: form.services,
      languages: form.languages,
      bio: form.bio,
      hourlyPrice: form.hourlyPrice ? Number(form.hourlyPrice) : undefined,
      dailyPrice: form.dailyPrice ? Number(form.dailyPrice) : undefined,
      monthlyPrice: form.monthlyPrice ? Number(form.monthlyPrice) : undefined,
      availability: 'available',
      rating: undefined,
      totalRatings: 0,
      totalBookings: 0,
      completedBookings: 0,
      profileViews: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = doc(db, 'maids', maidId);
    await setDoc(docRef, cleanFirestoreData(newMaid), { merge: true });

    // Also update user profile with role 'maid'
    const userDocRef = doc(db, 'users', effectiveUserId);
    await setDoc(userDocRef, cleanFirestoreData({
      id: effectiveUserId,
      role: 'maid',
      name: form.name,
      phone: form.phone,
      email: form.email || undefined,
      location: form.location,
      city: form.city || form.location,
      area: form.area,
      address: form.address,
      status: 'active',
      approvalStatus: 'under_review',
      profileCompleted: true,
      updatedAt: new Date().toISOString(),
    }), { merge: true }).catch(() => {});

    // Notify administrators about new maid application
    try {
      const { notifyAdminsNewRegistration } = await import('./notificationService');
      await notifyAdminsNewRegistration({
        id: maidId,
        name: form.name,
        role: 'maid',
        phone: form.phone,
        email: form.email || undefined,
      });
    } catch (e) {
      console.warn('Failed to notify admins of maid registration:', e);
    }

    return { success: true, maidId, userId: effectiveUserId };
  } catch (err) {
    console.error('Error submitting maid registration to Firestore:', err);
    return { success: false, error: 'Registration failed. Please check your data and retry.' };
  }
}

/**
 * UPDATE: Admin approval status
 */
export async function updateMaidApprovalStatus(
  maidId: string,
  approvalStatus: ApprovalStatus,
  reason?: string
): Promise<boolean> {
  try {
    const docRef = doc(db, 'maids', maidId);
    const updates: Partial<Maid> & { rejectionReason?: string } = {
      approvalStatus,
      updatedAt: new Date().toISOString(),
    };
    if (reason) {
      updates.rejectionReason = reason;
    }
    if (approvalStatus === 'approved') {
      updates.verificationStatus = 'verified';
      updates.selfieStatus = 'verified';
      updates.isActive = true;
    } else if (approvalStatus === 'suspended' || approvalStatus === 'rejected') {
      updates.isActive = false;
    }
    await updateDoc(docRef, cleanFirestoreData(updates));

    // Non-blocking automated notification dispatch and user doc sync
    try {
      const snap = await getDoc(docRef);
      const mData = snap.exists() ? (snap.data() as Maid) : null;
      const targetUserId = mData?.userId || maidId.replace('maid-', '');
      if (targetUserId) {
        // Sync user document approvalStatus
        const userDocRef = doc(db, 'users', targetUserId);
        const userUpdates: Partial<User> & { rejectionReason?: string } = {
          approvalStatus,
          updatedAt: new Date().toISOString(),
        };
        if (reason) userUpdates.rejectionReason = reason;
        await updateDoc(userDocRef, cleanFirestoreData(userUpdates)).catch(() => {});

        const { sendAppNotification } = await import('./notificationService');
        if (approvalStatus === 'approved') {
          await sendAppNotification({
            userId: targetUserId,
            title: 'Profile Approved! 🎉',
            message: 'Your maid partner application has been approved. You are now live and discoverable for customer bookings!',
            type: 'maid',
          });
        } else if (approvalStatus === 'rejected') {
          await sendAppNotification({
            userId: targetUserId,
            title: 'Application Update',
            message: reason ? `Your application requires revision: ${reason}` : 'Your partner application could not be approved at this time.',
            type: 'maid',
          });
        }
      }
    } catch {
      // Ignore notification dispatch error
    }

    return true;
  } catch (err) {
    console.error('Error updating maid approval status in Firestore:', err);
    return false;
  }
}

/**
 * UPDATE: Maid profile details
 */
export async function updateMaidProfile(
  maidId: string,
  updates: Partial<Maid>
): Promise<boolean> {
  try {
    const docRef = doc(db, 'maids', maidId);
    await updateDoc(docRef, cleanFirestoreData({
      ...updates,
      updatedAt: new Date().toISOString(),
    }));
    return true;
  } catch (err) {
    console.error('Error updating maid profile in Firestore:', err);
    return false;
  }
}

/**
 * DELETE: Delete maid document from Firestore
 */
export async function deleteMaid(maidId: string): Promise<boolean> {
  try {
    const docRef = doc(db, 'maids', maidId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error('Error deleting maid from Firestore:', err);
    return false;
  }
}
