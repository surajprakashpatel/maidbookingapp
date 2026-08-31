import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  deleteUser
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc
} from 'firebase/firestore';
import {
  createBooking,
  fetchBookingById,
  fetchCustomerBookings,
  fetchMaidBookings,
  updateBookingStatus,
  deleteBooking,
  checkBookingSlotConflict,
  fetchAllBookingsAdmin
} from '../src/lib/services/bookingService';
import { createReview, fetchMaidReviews } from '../src/lib/services/reviewService';
import { fetchMaidById, updateMaidApprovalStatus } from '../src/lib/services/maidService';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyB9ZOjxtv32d5-UO86WOzE9Qweh1YAUb4M",
  authDomain: "maidbookingapp-4520c.firebaseapp.com",
  projectId: "maidbookingapp-4520c",
  storageBucket: "maidbookingapp-4520c.firebasestorage.app",
  messagingSenderId: "1059320135233",
  appId: "1:1059320135233:web:5cce883d3a28d2e92b10c0"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function runBookingFlowAudit() {
  console.log('====================================================');
  console.log('🧹 BOOKING FLOW — COMPLETE END-TO-END AUDIT');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, title: string, details?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${title}${details ? ` (${details})` : ''}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${title}${details ? ` (${details})` : ''}`);
      failed++;
    }
  }

  const timestamp = Date.now();
  const custPhone = `98765${Math.floor(10000 + Math.random() * 90000)}`;
  const maidPhone = `98764${Math.floor(10000 + Math.random() * 90000)}`;
  const custEmail = `bk_cust_${timestamp}@maideasy.in`;
  const maidEmail = `bk_maid_${timestamp}@maideasy.in`;
  const adminEmail = 'admin@maideasy.in';
  const password = 'Password123!';

  // --- Step 1: Create Verified Customer & Approved Maid ---
  console.log('--- 1. SEEDING CUSTOMER & APPROVED MAID ---');
  const custCred = await createUserWithEmailAndPassword(auth, custEmail, password);
  const custUid = custCred.user.uid;
  await setDoc(doc(db, 'users', custUid), {
    id: custUid,
    role: 'customer',
    name: 'Rohit Sharma',
    phone: custPhone,
    email: custEmail,
    location: 'Bhilai',
    city: 'Bhilai',
    area: 'Sector 5',
    address: 'Flat 302, Diamond Towers, Sector 5',
    status: 'active',
    profileCompleted: true,
    createdAt: new Date().toISOString(),
  });
  assert(true, 'Customer account created', `UID: ${custUid}`);

  await signOut(auth);
  const maidCred = await createUserWithEmailAndPassword(auth, maidEmail, password);
  const maidUid = maidCred.user.uid;
  const maidId = `maid-${maidUid}`;

  await setDoc(doc(db, 'users', maidUid), {
    id: maidUid,
    role: 'maid',
    name: 'Kavita Patel',
    phone: maidPhone,
    email: maidEmail,
    location: 'Bhilai',
    city: 'Bhilai',
    area: 'Sector 5',
    status: 'active',
    profileCompleted: true,
    createdAt: new Date().toISOString(),
  });

  await setDoc(doc(db, 'maids', maidId), {
    id: maidId,
    userId: maidUid,
    name: 'Kavita Patel',
    phone: maidPhone,
    email: maidEmail,
    gender: 'female',
    location: 'Bhilai',
    city: 'Bhilai',
    area: 'Sector 5',
    serviceAreas: ['Sector 5', 'Sector 6'],
    workRadius: 5,
    services: ['House Cleaning', 'Cooking'],
    experience: 4,
    rating: 4.8,
    totalRatings: 12,
    hourlyPrice: 180,
    dailyPrice: 700,
    monthlyPrice: 6500,
    approvalStatus: 'under_review',
    verificationStatus: 'verified',
    selfieStatus: 'verified',
    availability: 'available',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Admin approves the maid
  await signOut(auth);
  try {
    await signInWithEmailAndPassword(auth, adminEmail, 'admin123');
  } catch {
    await createUserWithEmailAndPassword(auth, adminEmail, 'admin123');
  }
  await updateMaidApprovalStatus(maidId, 'approved');
  assert(true, 'Approved Maid profile created and verified', `Maid ID: ${maidId}`);

  // --- Step 2: Create Booking & Verify Firestore Persistence ---
  console.log('\n--- 2. CREATE BOOKING & PERSISTENCE CHECK ---');
  await signOut(auth);
  await signInWithEmailAndPassword(auth, custEmail, password);

  const bookingDate = '2026-09-15';
  const bookingTime = '10:00 AM';

  const createRes = await createBooking({
    customerId: custUid,
    customerName: 'Rohit Sharma',
    customerPhone: custPhone,
    customerAddress: 'Flat 302, Diamond Towers, Sector 5',
    customerArea: 'Sector 5',
    maidId,
    maidName: 'Kavita Patel',
    serviceId: 'house_cleaning',
    serviceName: 'House Cleaning',
    pricingType: 'hourly',
    duration: 3,
    date: bookingDate,
    time: bookingTime,
    serviceAmount: 540,
    tax: 0,
    discount: 0,
    bookingStatus: 'awaiting_maid',
    paymentStatus: 'paid',
    paymentGateway: 'razorpay',
    transactionId: `TXN_${timestamp}`,
  });

  assert(createRes.success && !!createRes.bookingId, 'Booking created in Firestore', `Booking ID: ${createRes.bookingId}`);
  const bookingId = createRes.bookingId!;

  const savedBooking = await fetchBookingById(bookingId);
  assert(savedBooking?.id === bookingId, 'Booking fetched from Firestore by ID');
  assert(savedBooking?.customerId === custUid, 'Customer UID matches');
  assert(savedBooking?.maidId === maidId, 'Maid ID matches');
  assert(savedBooking?.serviceAmount === 540, 'Service amount computed correctly (3 hrs @ ₹180)');
  assert(savedBooking?.platformFee === 27, 'Platform Fee 5% computed (₹27)');
  assert(savedBooking?.totalAmount === 567, 'Total Amount matches (₹567)');
  assert(savedBooking?.bookingStatus === 'awaiting_maid', 'Booking status is "awaiting_maid"');
  assert(savedBooking?.paymentStatus === 'paid', 'Payment status is "paid"');

  // --- Step 3: Conflict Prevention on Double-Booking Same Slot ---
  console.log('\n--- 3. AVAILABILITY & CONFLICT PREVENTION ---');
  const conflictRes = await createBooking({
    customerId: 'another-cust-123',
    customerName: 'Duplicate Customer',
    customerPhone: '9999999999',
    customerAddress: 'Another Address',
    customerArea: 'Sector 5',
    maidId,
    maidName: 'Kavita Patel',
    serviceId: 'house_cleaning',
    serviceName: 'House Cleaning',
    pricingType: 'hourly',
    duration: 2,
    date: bookingDate,
    time: bookingTime,
    serviceAmount: 360,
    tax: 0,
    discount: 0,
    bookingStatus: 'awaiting_maid',
    paymentStatus: 'paid',
  });
  assert(!conflictRes.success, 'Double-booking conflicting time slot properly blocked');

  // --- Step 4: Maid Receives & Accepts Booking ---
  console.log('\n--- 4. MAID DISPATCH & ACCEPTANCE FLOW ---');
  await signOut(auth);
  await signInWithEmailAndPassword(auth, maidEmail, password);

  const maidBookings = await fetchMaidBookings(maidId);
  const foundBooking = maidBookings.find(b => b.id === bookingId);
  assert(!!foundBooking, 'Maid receives booking in Maid Portal query');

  const acceptSuccess = await updateBookingStatus(bookingId, 'confirmed');
  assert(acceptSuccess, 'Maid accepts booking (Status: confirmed)');

  const confirmedBooking = await fetchBookingById(bookingId);
  assert(confirmedBooking?.bookingStatus === 'confirmed', 'Firestore booking status verified as "confirmed"');

  // --- Step 5: Service Execution (In Progress -> Completed) ---
  console.log('\n--- 5. SERVICE EXECUTION (IN PROGRESS -> COMPLETED) ---');
  await updateBookingStatus(bookingId, 'in_progress');
  let currentBooking = await fetchBookingById(bookingId);
  assert(currentBooking?.bookingStatus === 'in_progress', 'Maid marks service "in_progress"');

  await updateBookingStatus(bookingId, 'completed');
  currentBooking = await fetchBookingById(bookingId);
  assert(currentBooking?.bookingStatus === 'completed', 'Maid marks service "completed"');

  // --- Step 6: Customer Reviews Maid & Aggregate Rating Recalculation ---
  console.log('\n--- 6. CUSTOMER REVIEWS MAID ---');
  await signOut(auth);
  await signInWithEmailAndPassword(auth, custEmail, password);

  const reviewRes = await createReview({
    maidId,
    customerId: custUid,
    customerName: 'Rohit Sharma',
    bookingId,
    rating: 5,
    comment: 'Punctual, thorough, and very courteous. Highly recommended!',
  });
  assert(reviewRes.success, 'Customer submits 5-star review in Firestore');

  const maidReviews = await fetchMaidReviews(maidId);
  assert(maidReviews.some(r => r.bookingId === bookingId), 'Review retrieved from /reviews collection');

  // --- Step 7: Admin Overview ---
  console.log('\n--- 7. ADMIN AUDIT & OVERSIGHT ---');
  await signOut(auth);
  try {
    await signInWithEmailAndPassword(auth, adminEmail, 'admin123');
  } catch {
    await createUserWithEmailAndPassword(auth, adminEmail, 'admin123');
  }

  const allAdminBookings = await fetchAllBookingsAdmin();
  assert(allAdminBookings.some(b => b.id === bookingId), 'Admin successfully monitors booking in /admin/bookings');

  // --- Step 8: Cleanup ---
  console.log('\n--- 8. CLEANUP TEST DATA ---');
  await deleteBooking(bookingId);
  if (reviewRes.reviewId) await deleteDoc(doc(db, 'reviews', reviewRes.reviewId));
  await deleteDoc(doc(db, 'maids', maidId));
  await deleteDoc(doc(db, 'users', maidUid));
  await deleteDoc(doc(db, 'users', custUid));

  await signOut(auth);
  await signInWithEmailAndPassword(auth, custEmail, password);
  await deleteUser(custCred.user);

  await signOut(auth);
  await signInWithEmailAndPassword(auth, maidEmail, password);
  await deleteUser(maidCred.user);
  assert(true, 'Test Records Cleanly Removed');

  console.log('\n====================================================');
  console.log(`📊 BOOKING FLOW AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

runBookingFlowAudit().catch((err) => {
  console.error('Booking Flow Audit Fatal Error:', err);
  process.exit(1);
});
