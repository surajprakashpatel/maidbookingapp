import {
  doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, collection,
  query, where, onSnapshot, Unsubscribe
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Review } from '../types';
import { cleanFirestoreData } from '../utils';

/**
 * CREATE: Create review in Firestore and update Maid rating aggregate
 */
export async function createReview(
  data: Omit<Review, 'id' | 'createdAt'>
): Promise<{ success: boolean; reviewId?: string; error?: string }> {
  try {
    const reviewId = `rev-${Date.now()}`;
    const newReview: Review = {
      ...data,
      id: reviewId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = doc(db, 'reviews', reviewId);
    await setDoc(docRef, cleanFirestoreData(newReview));

    // Recalculate maid rating aggregate
    try {
      const maidReviews = await fetchMaidReviews(data.maidId);
      const totalRatings = maidReviews.length;
      const averageRating = totalRatings > 0
        ? Number((maidReviews.reduce((sum, r) => sum + r.rating, 0) / totalRatings).toFixed(1))
        : data.rating;

      const maidDocRef = doc(db, 'maids', data.maidId);
      await updateDoc(maidDocRef, {
        rating: averageRating,
        totalRatings,
      }).catch(() => {});
    } catch {
      // Ignore aggregate calculation failure
    }

    return { success: true, reviewId };
  } catch (err) {
    console.error('Error creating review in Firestore:', err);
    return { success: false, error: 'Failed to submit review.' };
  }
}

/**
 * READ: Fetch reviews for a specific maid
 */
export async function fetchMaidReviews(maidId: string): Promise<Review[]> {
  try {
    const ref = collection(db, 'reviews');
    const q = query(ref, where('maidId', '==', maidId));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Review);
  } catch (err) {
    console.warn('Error fetching maid reviews from Firestore:', err);
    return [];
  }
}

/**
 * READ REAL-TIME: Subscribe to maid reviews
 */
export function subscribeToMaidReviews(
  maidId: string,
  callback: (reviews: Review[]) => void
): Unsubscribe {
  const ref = collection(db, 'reviews');
  const q = query(ref, where('maidId', '==', maidId));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map(d => d.data() as Review);
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(list);
  }, (err) => {
    console.warn('Maid reviews subscription error:', err);
    callback([]);
  });
}

/**
 * READ: Fetch review by ID
 */
export async function fetchReviewById(reviewId: string): Promise<Review | null> {
  try {
    const docRef = doc(db, 'reviews', reviewId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as Review;
    }
  } catch (err) {
    console.error('Error fetching review by ID from Firestore:', err);
  }
  return null;
}

/**
 * UPDATE: Update review comment or rating
 */
export async function updateReview(
  reviewId: string,
  updates: Partial<Pick<Review, 'rating' | 'comment'>>
): Promise<boolean> {
  try {
    const docRef = doc(db, 'reviews', reviewId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    console.error('Error updating review in Firestore:', err);
    return false;
  }
}

/**
 * DELETE: Delete review from Firestore
 */
export async function deleteReview(reviewId: string): Promise<boolean> {
  try {
    const docRef = doc(db, 'reviews', reviewId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error('Error deleting review from Firestore:', err);
    return false;
  }
}
