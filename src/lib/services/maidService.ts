import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  query, where
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Maid, MaidRegistrationForm, FilterState, ApprovalStatus } from '../types';
import { maskAadhaar } from '../utils';
import { MOCK_MAIDS } from '../mockData';

export async function fetchMaidById(maidId: string): Promise<Maid | null> {
  try {
    const docRef = doc(db, 'maids', maidId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as Maid;
    }
  } catch (err) {
    console.error('Error fetching maid by ID:', err);
  }
  // Fallback to mock item if doc is not in Firestore yet
  return MOCK_MAIDS.find(m => m.id === maidId) || null;
}

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

    if (list.length === 0) {
      list = MOCK_MAIDS.filter(m => m.approvalStatus === 'approved');
    }

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
    console.error('Error fetching approved maids:', err);
    return MOCK_MAIDS.filter(m => m.approvalStatus === 'approved');
  }
}

export async function fetchAllMaidsAdmin(statusFilter?: ApprovalStatus | 'all'): Promise<Maid[]> {
  try {
    const maidsRef = collection(db, 'maids');
    let q = query(maidsRef);
    if (statusFilter && statusFilter !== 'all') {
      q = query(maidsRef, where('approvalStatus', '==', statusFilter));
    }
    const snap = await getDocs(q);
    const result = snap.docs.map(d => d.data() as Maid);
    if (result.length > 0) return result;
  } catch (err) {
    console.error('Error fetching admin maids list:', err);
  }
  if (statusFilter && statusFilter !== 'all') {
    return MOCK_MAIDS.filter(m => m.approvalStatus === statusFilter);
  }
  return MOCK_MAIDS;
}

export async function submitMaidRegistration(form: MaidRegistrationForm, userId: string): Promise<{ success: boolean; maidId?: string; error?: string }> {
  try {
    const maidId = `maid-${Date.now()}`;
    const maskedAadhaar = form.aadhaarNumber ? maskAadhaar(form.aadhaarNumber) : '';

    const newMaid: Maid = {
      id: maidId,
      userId,
      name: form.name,
      phone: form.phone,
      email: form.email || undefined,
      gender: form.gender,
      dateOfBirth: form.dateOfBirth || undefined,
      profilePhoto: form.profilePhotoPreview || undefined,
      selfieUrl: form.selfieDataUrl || undefined, // Stored securely
      verificationStatus: form.selfieDataUrl ? 'pending' : 'not_submitted',
      selfieStatus: form.selfieDataUrl ? 'captured' : 'not_captured',
      approvalStatus: 'under_review',
      aadhaarMasked: maskedAadhaar,
      location: form.city,
      city: form.city,
      area: form.area,
      address: form.address || undefined,
      pincode: form.pincode || undefined,
      serviceAreas: form.serviceAreas,
      workRadius: form.workRadius,
      qualification: form.qualification || undefined,
      experience: form.experience,
      services: form.services,
      languages: form.languages,
      bio: form.bio || undefined,
      hourlyPrice: form.hourlyEnabled && form.hourlyPrice ? Number(form.hourlyPrice) : undefined,
      dailyPrice: form.dailyEnabled && form.dailyPrice ? Number(form.dailyPrice) : undefined,
      monthlyPrice: form.monthlyEnabled && form.monthlyPrice ? Number(form.monthlyPrice) : undefined,
      availability: 'available',
      rating: 5.0,
      totalRatings: 0,
      totalBookings: 0,
      completedBookings: 0,
      profileViews: 1,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = doc(db, 'maids', maidId);
    await setDoc(docRef, newMaid);

    return { success: true, maidId };
  } catch (err) {
    console.error('Error submitting maid registration:', err);
    return { success: false, error: 'Registration failed. Please try again.' };
  }
}

export async function updateMaidApprovalStatus(
  maidId: string,
  approvalStatus: ApprovalStatus,
  rejectionReason?: string
): Promise<boolean> {
  try {
    const docRef = doc(db, 'maids', maidId);
    const updates: Partial<Maid> = {
      approvalStatus,
      updatedAt: new Date().toISOString(),
    };

    if (approvalStatus === 'approved') {
      updates.verificationStatus = 'verified';
      updates.selfieStatus = 'verified';
    } else if (approvalStatus === 'rejected') {
      updates.rejectionReason = rejectionReason || 'Information verification failed.';
      updates.verificationStatus = 'failed';
    }

    await updateDoc(docRef, updates);
    return true;
  } catch (err) {
    console.error('Error updating maid approval status:', err);
    return false;
  }
}
