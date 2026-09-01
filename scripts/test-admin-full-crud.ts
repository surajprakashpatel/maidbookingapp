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
} from 'firebase/firestore';
import {
  updateMaidApprovalStatus,
  updateMaidProfile,
  deleteMaid,
  fetchMaidById
} from '../src/lib/services/maidService';
import {
  updateCustomerStatus,
  deleteUser as deleteUserService,
  fetchUserById
} from '../src/lib/services/userService';
import {
  createBooking,
  fetchBookingById,
  updateBookingStatus,
  deleteBooking
} from '../src/lib/services/bookingService';
import {
  updateAppSettings,
  fetchAppSettings
} from '../src/lib/services/settingsService';
import {
  createReview,
  deleteReview,
  fetchMaidReviews
} from '../src/lib/services/reviewService';

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

async function runAdminCrudAudit() {
  console.log('====================================================');
  console.log('👑 ADMIN — FULL PROJECT CRUD & SECURITY AUDIT');
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
  const adminEmail = 'admin@maideasy.in';
  const adminPass = 'admin123';
  const custEmail = `cust_adm_${timestamp}@maideasy.in`;
  const maidEmail = `maid_adm_${timestamp}@maideasy.in`;
  const testPass = 'Password123!';

  // --- Step 0: Ensure Admin User Exists & Sign In ---
  try {
    await signInWithEmailAndPassword(auth, adminEmail, adminPass);
  } catch {
    await createUserWithEmailAndPassword(auth, adminEmail, adminPass);
  }
  await setDoc(doc(db, 'users', auth.currentUser!.uid), {
    id: auth.currentUser!.uid,
    role: 'admin',
    email: adminEmail,
    name: 'Platform Administrator',
    status: 'active',
    profileCompleted: true,
    createdAt: new Date().toISOString(),
  });

  console.log('--- 1. ADMIN MAID CRUD ---');
  const testMaidId = `maid-admin-test-${timestamp}`;
  // CREATE (Under review)
  await setDoc(doc(db, 'maids', testMaidId), {
    id: testMaidId,
    userId: `uid-${timestamp}`,
    name: 'Sushila Devi',
    phone: '9876543210',
    email: `sushila_${timestamp}@maideasy.in`,
    gender: 'female',
    location: 'Bhilai',
    city: 'Bhilai',
    area: 'Sector 6',
    serviceAreas: ['Sector 6'],
    services: ['Cleaning'],
    hourlyPrice: 180,
    dailyPrice: 700,
    monthlyPrice: 6500,
    approvalStatus: 'under_review',
    verificationStatus: 'submitted',
    selfieStatus: 'pending',
    availability: 'available',
    isActive: false,
    createdAt: new Date().toISOString(),
  });
  const maidSnap1 = await fetchMaidById(testMaidId);
  assert(maidSnap1?.approvalStatus === 'under_review', 'CREATE: Maid Application Created in Firestore');

  // UPDATE: Approve Maid
  const approveRes = await updateMaidApprovalStatus(testMaidId, 'approved');
  assert(approveRes, 'UPDATE: Admin Approves Maid Application');

  // UPDATE: Change Pricing
  const updatePriceRes = await updateMaidProfile(testMaidId, { hourlyPrice: 220, availability: 'busy' });
  assert(updatePriceRes, 'UPDATE: Admin Edits Maid Profile & Rates');

  // READ: Verify Updates
  const maidSnap2 = await fetchMaidById(testMaidId);
  assert(maidSnap2?.approvalStatus === 'approved' && maidSnap2?.hourlyPrice === 220, 'READ: Maid Record Updates Verified in Firestore');

  // DELETE: Delete Maid
  const deleteMaidRes = await deleteMaid(testMaidId);
  assert(deleteMaidRes, 'DELETE: Admin Deletes Maid Record from Firestore');
  const maidSnap3 = await fetchMaidById(testMaidId);
  assert(!maidSnap3, 'VERIFY: Maid Record Successfully Removed');

  console.log('\n--- 2. ADMIN CUSTOMER CRUD ---');
  const testCustId = `user-admin-cust-${timestamp}`;
  // CREATE
  await setDoc(doc(db, 'users', testCustId), {
    id: testCustId,
    role: 'customer',
    name: 'Aditi Rao',
    phone: '9876511111',
    email: `aditi_${timestamp}@maideasy.in`,
    location: 'Bhilai',
    city: 'Bhilai',
    area: 'Nehru Nagar',
    status: 'active',
    profileCompleted: true,
    createdAt: new Date().toISOString(),
  });
  const custSnap1 = await fetchUserById(testCustId);
  assert(custSnap1?.status === 'active', 'CREATE: Customer Account Created in Firestore');

  // UPDATE: Suspend Account
  const suspendRes = await updateCustomerStatus(testCustId, 'suspended');
  assert(suspendRes, 'UPDATE: Admin Suspends Customer Account');
  const custSnap2 = await fetchUserById(testCustId);
  assert(custSnap2?.status === 'suspended', 'READ: Customer Suspended Status Verified');

  // DELETE
  const deleteCustRes = await deleteUserService(testCustId);
  assert(deleteCustRes, 'DELETE: Admin Deletes Customer Record');
  const custSnap3 = await fetchUserById(testCustId);
  assert(!custSnap3, 'VERIFY: Customer Record Successfully Removed');

  console.log('\n--- 3. ADMIN BOOKING CRUD ---');
  const bookRes = await createBooking({
    customerId: 'cust-adm-demo',
    customerName: 'Test Customer',
    customerPhone: '9876543210',
    customerAddress: 'Flat 101, Nehru Nagar',
    customerArea: 'Nehru Nagar',
    maidId: 'maid-adm-demo',
    maidName: 'Test Maid',
    serviceId: 'cleaning',
    serviceName: 'Cleaning',
    pricingType: 'hourly',
    duration: 2,
    date: '2026-09-25',
    time: '11:00 AM',
    serviceAmount: 300,
    tax: 0,
    discount: 0,
    bookingStatus: 'awaiting_maid',
    paymentStatus: 'unpaid',
    paymentGateway: 'phonepe',
  });
  const testBookingId = bookRes.bookingId!;
  assert(bookRes.success && !!testBookingId, 'CREATE: Booking Record Created in Firestore');

  // UPDATE: Admin Overrides Status
  const overrideRes = await updateBookingStatus(testBookingId, 'completed', 'paid');
  assert(overrideRes, 'UPDATE: Admin Force Overrides Booking Status to Completed & Paid');
  const bookSnap = await fetchBookingById(testBookingId);
  assert(bookSnap?.bookingStatus === 'completed' && bookSnap?.paymentStatus === 'paid', 'READ: Updated Booking Verified in Firestore');

  // DELETE: Delete Booking
  const deleteBookRes = await deleteBooking(testBookingId);
  assert(deleteBookRes, 'DELETE: Admin Deletes Booking from Firestore');
  const bookSnap2 = await fetchBookingById(testBookingId);
  assert(!bookSnap2, 'VERIFY: Booking Record Successfully Removed');

  console.log('\n--- 4. ADMIN SETTINGS CRUD ---');
  const originalSettings = await fetchAppSettings();
  const newFee = originalSettings.pricing.platformFeePercent === 5 ? 7 : 5;
  const updateSettingsRes = await updateAppSettings({
    ...originalSettings,
    pricing: { ...originalSettings.pricing, platformFeePercent: newFee }
  });
  assert(updateSettingsRes, 'UPDATE: Admin Modifies Global Platform Fee in Firestore');
  const updatedSettings = await fetchAppSettings();
  assert(updatedSettings.pricing.platformFeePercent === newFee, 'READ: Updated Settings Verified in Firestore');
  // Restore original settings for subsequent tests
  await updateAppSettings(originalSettings);

  console.log('\n--- 5. ADMIN REVIEW MODERATION ---');
  const testReviewId = `rev-${timestamp}`;
  await setDoc(doc(db, 'reviews', testReviewId), {
    id: testReviewId,
    bookingId: 'bk-fake',
    customerId: 'cust-fake',
    customerName: 'Fake Customer',
    maidId: 'maid-fake',
    rating: 1,
    comment: 'Spam review to test admin moderation deletion.',
    serviceName: 'Cleaning',
    createdAt: new Date().toISOString(),
  });
  const deleteReviewRes = await deleteReview(testReviewId);
  assert(deleteReviewRes, 'DELETE: Admin Moderates & Deletes Spam Review from Firestore');

  console.log('\n--- 6. SECURITY: PRIVILEGE ESCALATION BLOCK CHECKS ---');
  // Sign in as non-admin Customer
  await signOut(auth);
  const custCred = await createUserWithEmailAndPassword(auth, custEmail, testPass);
  const custUid = custCred.user.uid;
  await setDoc(doc(db, 'users', custUid), {
    id: custUid,
    role: 'customer',
    name: 'Regular Customer',
    email: custEmail,
    status: 'active',
    profileCompleted: true,
    createdAt: new Date().toISOString(),
  });

  // Attempt 1: Customer tries to elevate own role to 'admin'
  let roleEscalationBlocked = false;
  try {
    await updateDoc(doc(db, 'users', custUid), { role: 'admin' });
  } catch {
    roleEscalationBlocked = true;
  }
  assert(roleEscalationBlocked, 'SECURITY: Customer Role Elevation to Admin Blocked by Rules');

  // Attempt 2: Customer tries to self-approve a maid
  let selfApprovalBlocked = false;
  try {
    await setDoc(doc(db, 'maids', `maid-${custUid}`), {
      id: `maid-${custUid}`,
      userId: custUid,
      name: 'Unapproved Maid',
      approvalStatus: 'approved', // Unauthorized
    });
  } catch {
    selfApprovalBlocked = true;
  }
  assert(selfApprovalBlocked, 'SECURITY: Non-Admin Direct Maid Approval Blocked by Rules');

  // Cleanup Customer Test User
  await deleteDoc(doc(db, 'users', custUid));
  await deleteUser(custCred.user);

  console.log('\n====================================================');
  console.log(`📊 ADMIN FULL CRUD & SECURITY SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

runAdminCrudAudit().catch((err) => {
  console.error('Admin CRUD Fatal Error:', err);
  process.exit(1);
});
