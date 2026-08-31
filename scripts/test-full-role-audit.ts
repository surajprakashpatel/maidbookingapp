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
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';

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

async function runRoleAudit() {
  console.log('====================================================');
  console.log('🏠 CUSTOMER / MAID / ADMIN COMPLETE ROLE AUDIT');
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
  const custEmail = `audit_cust_${timestamp}@maideasy.in`;
  const maidEmail = `audit_maid_${timestamp}@maideasy.in`;
  const adminEmail = `admin@maideasy.in`;
  const password = 'Password123!';

  // ==========================================
  // 1. CUSTOMER SIGNUP & PROFILE
  // ==========================================
  console.log('--- 1. CUSTOMER AUTHENTICATION & PROFILE ---');
  const custCred = await createUserWithEmailAndPassword(auth, custEmail, password);
  const custUid = custCred.user.uid;
  assert(!!custUid, 'Customer Firebase Auth Created', custUid);

  const customerUser = {
    id: custUid,
    role: 'customer' as const,
    name: 'Siddharth Rao',
    phone: '9876500010',
    email: custEmail,
    location: 'Bhilai',
    city: 'Bhilai',
    area: 'Sector 7',
    address: 'B-102, Pushpak Nagar',
    status: 'active' as const,
    profileCompleted: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'users', custUid), customerUser);
  await setDoc(doc(db, 'customers', custUid), { ...customerUser, totalBookings: 0 });

  const savedCust = await getDoc(doc(db, 'users', custUid));
  assert(savedCust.exists() && savedCust.data()?.name === 'Siddharth Rao', 'Customer Profile Persisted in Firestore');

  // ==========================================
  // 2. MAID ONBOARDING WIZARD & REGISTRATION
  // ==========================================
  console.log('\n--- 2. MAID REGISTRATION & WIZARD FLOW ---');
  await signOut(auth);
  const maidCred = await createUserWithEmailAndPassword(auth, maidEmail, password);
  const maidUid = maidCred.user.uid;
  const maidId = `maid-${maidUid}`;
  assert(!!maidUid, 'Maid Firebase Auth Created', maidUid);

  // Submit Maid Registration with under_review status
  const maidRegistrationData = {
    id: maidId,
    userId: maidUid,
    name: 'Meena Dewangan',
    phone: '9876500020',
    email: maidEmail,
    gender: 'female' as const,
    location: 'Bhilai',
    city: 'Bhilai',
    area: 'Nehru Nagar',
    address: 'Qtr 42, Zone 2, Nehru Nagar',
    pincode: '490020',
    serviceAreas: ['Nehru Nagar', 'Sector 7', 'Smriti Nagar'],
    services: ['Deep Cleaning', 'Cooking', 'Laundry'],
    languages: ['Hindi', 'Chhattisgarhi'],
    experience: 6,
    qualification: 'Intermediate',
    bio: 'Professional cook and cleaning specialist with 6 years experience in Bhilai.',
    hourlyPrice: 180,
    dailyPrice: 700,
    monthlyPrice: 6000,
    availability: 'available' as const,
    rating: 5.0,
    totalRatings: 0,
    totalBookings: 0,
    completedBookings: 0,
    profileViews: 0,
    approvalStatus: 'under_review' as const,
    verificationStatus: 'submitted' as const,
    selfieStatus: 'verified' as const,
    selfieUrl: 'https://storage.googleapis.com/test-selfie.jpg',
    aadhaarMasked: 'XXXX-XXXX-4433',
    isActive: false, // inactive until approved
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'maids', maidId), maidRegistrationData);
  const savedMaid = await getDoc(doc(db, 'maids', maidId));
  assert(savedMaid.exists() && savedMaid.data()?.approvalStatus === 'under_review', 'Maid Application Saved with status: under_review');

  // ==========================================
  // 3. UNAPPROVED MAID ISOLATION & SECURITY CHECK
  // ==========================================
  console.log('\n--- 3. UNAPPROVED MAID ISOLATION & SECURITY RULES ---');
  const approvedQuery = query(collection(db, 'maids'), where('approvalStatus', '==', 'approved'), where('isActive', '==', true));
  const approvedSnap = await getDocs(approvedQuery);
  const isPendingMaidInSearch = approvedSnap.docs.some(d => d.id === maidId);
  assert(!isPendingMaidInSearch, 'Unapproved Maid is NOT Discoverable by Customers');

  // Verify Maid CANNOT self-approve (Blocked by security rules)
  let selfApprovalBlocked = false;
  try {
    await updateDoc(doc(db, 'maids', maidId), { approvalStatus: 'approved' });
  } catch (err: any) {
    if (err.code === 'permission-denied') {
      selfApprovalBlocked = true;
    }
  }
  assert(selfApprovalBlocked, 'Security Rules: Maid Self-Approval BLOCKED');

  // ==========================================
  // 4. ADMIN APPLICATION REVIEW & APPROVAL
  // ==========================================
  console.log('\n--- 4. ADMIN REVIEW & APPROVAL ---');
  await signOut(auth);

  // Authenticate as Admin
  let adminCred;
  try {
    adminCred = await signInWithEmailAndPassword(auth, adminEmail, 'admin123');
  } catch {
    adminCred = await createUserWithEmailAndPassword(auth, adminEmail, 'admin123');
  }

  // Ensure admin user profile exists with role: admin
  const adminUid = adminCred.user.uid;
  await setDoc(doc(db, 'users', adminUid), {
    id: adminUid,
    role: 'admin',
    name: 'Platform Admin',
    email: adminEmail,
    status: 'active',
    profileCompleted: true,
    updatedAt: new Date().toISOString(),
  }, { merge: true });

  // Admin inspects application
  const adminMaidSnap = await getDoc(doc(db, 'maids', maidId));
  const maidUnderReview = adminMaidSnap.data();
  assert(!!maidUnderReview?.selfieUrl && !!maidUnderReview?.aadhaarMasked, 'Admin Inspects Live Selfie & Masked Aadhaar');

  // Admin approves maid
  await updateDoc(doc(db, 'maids', maidId), {
    approvalStatus: 'approved',
    verificationStatus: 'verified',
    selfieStatus: 'verified',
    isActive: true,
    updatedAt: new Date().toISOString(),
  });

  const approvedMaidSnap = await getDoc(doc(db, 'maids', maidId));
  assert(approvedMaidSnap.data()?.approvalStatus === 'approved' && approvedMaidSnap.data()?.isActive === true, 'Admin Approves Maid Application (approvalStatus: approved)');

  // ==========================================
  // 5. CUSTOMER DISCOVERS APPROVED MAID & BOOKS
  // ==========================================
  console.log('\n--- 5. CUSTOMER DISCOVERY & BOOKING DISPATCH ---');
  await signOut(auth);
  await signInWithEmailAndPassword(auth, custEmail, password);

  const postApprovalSnap = await getDocs(approvedQuery);
  const isApprovedMaidInSearch = postApprovalSnap.docs.some(d => d.id === maidId);
  assert(isApprovedMaidInSearch, 'Approved Maid IS NOW Discoverable in Customer Search');

  // Customer creates booking
  const bookingId = `bk-audit-${timestamp}`;
  const bookingData = {
    id: bookingId,
    bookingNumber: `BK${timestamp.toString().slice(-6)}`,
    customerId: custUid,
    customerName: 'Siddharth Rao',
    customerPhone: '9876500010',
    customerAddress: 'B-102, Pushpak Nagar',
    customerArea: 'Sector 7',
    maidId,
    maidName: 'Meena Dewangan',
    maidPhone: '9876500020',
    serviceName: 'Deep Cleaning',
    pricingType: 'hourly' as const,
    serviceAmount: 360,
    platformFee: 18,
    totalAmount: 378,
    discount: 0,
    date: '2026-09-08',
    time: '09:00 AM',
    duration: '2',
    bookingStatus: 'awaiting_maid' as const,
    paymentStatus: 'unpaid' as const,
    paymentGateway: 'phonepe' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'bookings', bookingId), bookingData);
  const bookingSnap = await getDoc(doc(db, 'bookings', bookingId));
  assert(bookingSnap.exists() && bookingSnap.data()?.bookingStatus === 'awaiting_maid', 'Customer Dispatches Booking (status: awaiting_maid)');

  // ==========================================
  // 6. MAID ACCEPTS & COMPLETES BOOKING
  // ==========================================
  console.log('\n--- 6. MAID ACCEPTS & COMPLETES BOOKING ---');
  await signOut(auth);
  await signInWithEmailAndPassword(auth, maidEmail, password);

  await updateDoc(doc(db, 'bookings', bookingId), {
    bookingStatus: 'confirmed',
    updatedAt: new Date().toISOString(),
  });
  const confirmedSnap = await getDoc(doc(db, 'bookings', bookingId));
  assert(confirmedSnap.data()?.bookingStatus === 'confirmed', 'Maid Accepts Booking (status: confirmed)');

  await updateDoc(doc(db, 'bookings', bookingId), {
    bookingStatus: 'completed',
    paymentStatus: 'paid',
    updatedAt: new Date().toISOString(),
  });
  const completedSnap = await getDoc(doc(db, 'bookings', bookingId));
  assert(completedSnap.data()?.bookingStatus === 'completed' && completedSnap.data()?.paymentStatus === 'paid', 'Booking Completed & Paid (status: completed)');

  // ==========================================
  // 7. CLEANUP AUDIT TEST DATA
  // ==========================================
  console.log('\n--- 7. CLEANUP AUDIT RECORDS ---');
  // Delete maid's own records as maid
  await deleteDoc(doc(db, 'maids', maidId));
  await deleteDoc(doc(db, 'users', maidUid));
  await deleteUser(maidCred.user);

  // Authenticate as customer to delete customer records & booking
  await signInWithEmailAndPassword(auth, custEmail, password);
  await deleteDoc(doc(db, 'bookings', bookingId));
  await deleteDoc(doc(db, 'customers', custUid));
  await deleteDoc(doc(db, 'users', custUid));
  await deleteUser(custCred.user);

  assert(true, 'Test Records & Firebase Auth Accounts Cleanly Removed');

  console.log('\n====================================================');
  console.log(`📊 ROLE AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

runRoleAudit().catch((err) => {
  console.error('Role Audit Error:', err);
  process.exit(1);
});
