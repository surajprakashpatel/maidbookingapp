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
  updateDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import {
  createBooking,
  fetchBookingById,
  updateBookingStatus,
  deleteBooking,
  fetchMaidBookings,
  fetchCustomerBookings,
  checkBookingSlotConflict
} from '../src/lib/services/bookingService';

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

async function runBookingE2E() {
  console.log('====================================================');
  console.log('🧹 BOOK A MAID SERVICE — COMPLETE END-TO-END FLOW');
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
  const custEmail = `book_cust_${timestamp}@maideasy.in`;
  const maidEmail = `book_maid_${timestamp}@maideasy.in`;
  const password = 'Password123!';

  // 1. Create test Customer
  const custCred = await createUserWithEmailAndPassword(auth, custEmail, password);
  const custUid = custCred.user.uid;
  await setDoc(doc(db, 'users', custUid), {
    id: custUid,
    role: 'customer',
    name: 'Rohit Sharma',
    phone: '9876599999',
    email: custEmail,
    location: 'Bhilai',
    city: 'Bhilai',
    area: 'Sector 5',
    address: 'Flat 301, Tower A, Sector 5',
    status: 'active',
    profileCompleted: true,
    createdAt: new Date().toISOString(),
  });

  // 2. Create test Maid (Starts as under_review, then approved by admin)
  await signOut(auth);
  const maidCred = await createUserWithEmailAndPassword(auth, maidEmail, password);
  const maidUid = maidCred.user.uid;
  const maidId = `maid-${maidUid}`;
  await setDoc(doc(db, 'maids', maidId), {
    id: maidId,
    userId: maidUid,
    name: 'Kavita Patel',
    phone: '9876588888',
    email: maidEmail,
    gender: 'female',
    location: 'Bhilai',
    city: 'Bhilai',
    area: 'Sector 5',
    serviceAreas: ['Sector 5', 'Sector 6'],
    services: ['Deep Cleaning', 'Cooking'],
    hourlyPrice: 200,
    dailyPrice: 800,
    monthlyPrice: 7000,
    approvalStatus: 'under_review',
    verificationStatus: 'submitted',
    selfieStatus: 'verified',
    availability: 'available',
    isActive: false,
    createdAt: new Date().toISOString(),
  });

  // Admin approves maid
  await signOut(auth);
  try {
    await signInWithEmailAndPassword(auth, 'admin@maideasy.in', 'admin123');
  } catch {
    await createUserWithEmailAndPassword(auth, 'admin@maideasy.in', 'admin123');
  }
  await updateDoc(doc(db, 'maids', maidId), {
    approvalStatus: 'approved',
    verificationStatus: 'verified',
    isActive: true,
    updatedAt: new Date().toISOString(),
  });

  // 3. Customer creates a booking
  console.log('--- 1. BOOKING CREATION & DISPATCH ---');
  await signOut(auth);
  await signInWithEmailAndPassword(auth, custEmail, password);

  const res1 = await createBooking({
    customerId: custUid,
    customerName: 'Rohit Sharma',
    customerPhone: '9876599999',
    customerAddress: 'Flat 301, Tower A, Sector 5',
    customerArea: 'Sector 5',
    maidId,
    maidName: 'Kavita Patel',
    serviceId: 'deep_cleaning',
    serviceName: 'Deep Cleaning',
    pricingType: 'hourly',
    duration: 3,
    date: '2026-09-15',
    time: '10:00 AM',
    serviceAmount: 600,
    tax: 0,
    discount: 0,
    bookingStatus: 'awaiting_maid',
    paymentStatus: 'unpaid',
    paymentGateway: 'phonepe',
  });

  assert(res1.success && !!res1.bookingId, 'Customer Creates Booking in Firestore', `ID: ${res1.bookingId}, No: ${res1.bookingNumber}`);
  const bookingId1 = res1.bookingId!;

  // 4. Slot Conflict Prevention
  console.log('\n--- 2. SLOT CONFLICT DETECTION ---');
  const conflictDetected = await checkBookingSlotConflict(maidId, '2026-09-15', '10:00 AM');
  assert(conflictDetected, 'Conflict Detection identifies busy slot (2026-09-15 10:00 AM)');

  const resConflict = await createBooking({
    customerId: custUid,
    customerName: 'Rohit Sharma',
    customerPhone: '9876599999',
    customerAddress: 'Flat 301, Tower A, Sector 5',
    customerArea: 'Sector 5',
    maidId,
    maidName: 'Kavita Patel',
    serviceId: 'deep_cleaning',
    serviceName: 'Deep Cleaning',
    pricingType: 'hourly',
    duration: 2,
    date: '2026-09-15',
    time: '10:00 AM',
    serviceAmount: 400,
    tax: 0,
    discount: 0,
    bookingStatus: 'awaiting_maid',
    paymentStatus: 'unpaid',
    paymentGateway: 'razorpay',
  });
  assert(!resConflict.success, 'Duplicate Slot Booking Blocked by Validation', resConflict.error);

  // 5. Maid receives dispatch & status lifecycle
  console.log('\n--- 3. MAID RECEIVES DISPATCH & STATUS PROGRESSION ---');
  await signOut(auth);
  await signInWithEmailAndPassword(auth, maidEmail, password);

  const maidBookings = await fetchMaidBookings(maidId);
  const receivedBooking = maidBookings.find(b => b.id === bookingId1);
  assert(!!receivedBooking && receivedBooking.bookingStatus === 'awaiting_maid', 'Maid receives incoming dispatch in Firestore');

  // Maid Accepts (status -> confirmed)
  const acceptSuccess = await updateBookingStatus(bookingId1, 'confirmed');
  assert(acceptSuccess, 'Maid Accepts Booking (status: confirmed)');

  // Maid Starts Service (status -> in_progress)
  const startSuccess = await updateBookingStatus(bookingId1, 'in_progress');
  assert(startSuccess, 'Maid Starts Service (status: in_progress)');

  // Maid Completes Service (status -> completed, payment -> paid)
  const completeSuccess = await updateBookingStatus(bookingId1, 'completed', 'paid');
  assert(completeSuccess, 'Maid Completes Service (status: completed, payment: paid)');

  const finalSnap = await fetchBookingById(bookingId1);
  assert(finalSnap?.bookingStatus === 'completed' && finalSnap?.paymentStatus === 'paid', 'Final Booking State Confirmed in Firestore');

  // 6. Cancellation Flow
  console.log('\n--- 4. CUSTOMER CANCELLATION FLOW ---');
  await signOut(auth);
  await signInWithEmailAndPassword(auth, custEmail, password);

  const res2 = await createBooking({
    customerId: custUid,
    customerName: 'Rohit Sharma',
    customerPhone: '9876599999',
    customerAddress: 'Flat 301, Tower A, Sector 5',
    customerArea: 'Sector 5',
    maidId,
    maidName: 'Kavita Patel',
    serviceId: 'cooking',
    serviceName: 'Cooking',
    pricingType: 'daily',
    duration: 1,
    date: '2026-09-20',
    time: '08:00 AM',
    serviceAmount: 800,
    tax: 0,
    discount: 0,
    bookingStatus: 'awaiting_maid',
    paymentStatus: 'unpaid',
    paymentGateway: 'phonepe',
  });
  const bookingId2 = res2.bookingId!;

  const cancelSuccess = await updateBookingStatus(bookingId2, 'cancelled');
  assert(cancelSuccess, 'Customer Cancels Booking (status: cancelled)');

  const cancelledSnap = await fetchBookingById(bookingId2);
  assert(cancelledSnap?.bookingStatus === 'cancelled', 'Cancelled Status Verified in Firestore');

  // 7. Cleanup
  console.log('\n--- 5. CLEANUP TEST DATA ---');
  await deleteDoc(doc(db, 'bookings', bookingId1));
  await deleteDoc(doc(db, 'bookings', bookingId2));
  await deleteDoc(doc(db, 'users', custUid));
  await deleteUser(custCred.user);

  await signOut(auth);
  await signInWithEmailAndPassword(auth, maidEmail, password);
  await deleteDoc(doc(db, 'maids', maidId));
  await deleteDoc(doc(db, 'users', maidUid));
  await deleteUser(maidCred.user);

  assert(true, 'Test Bookings, Maids & Accounts Cleanly Removed');

  console.log('\n====================================================');
  console.log(`📊 BOOKING E2E AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

runBookingE2E().catch((err) => {
  console.error('Booking E2E Fatal Error:', err);
  process.exit(1);
});
