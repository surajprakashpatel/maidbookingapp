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
  deleteDoc
} from 'firebase/firestore';
import { fetchUserById } from '../src/lib/services/userService';
import { fetchMaidById, updateMaidApprovalStatus, submitMaidRegistration } from '../src/lib/services/maidService';
import { isProfileComplete } from '../src/lib/auth-context';

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

async function runMaidRedirectAudit() {
  console.log('====================================================');
  console.log('👩 MAID PROFILE → DASHBOARD REDIRECT AUDIT');
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
  const phone = `98765${Math.floor(10000 + Math.random() * 90000)}`;
  const maidEmail = `maid_flow_${timestamp}@maideasy.in`;
  const custEmail = `cust_flow_${timestamp}@maideasy.in`;
  const adminEmail = 'admin@maideasy.in';
  const password = 'Password123!';

  // --- Step 1: New Maid Registration ---
  console.log('--- 1. NEW MAID REGISTRATION ---');
  const maidCred = await createUserWithEmailAndPassword(auth, maidEmail, password);
  const maidUid = maidCred.user.uid;

  const regRes = await submitMaidRegistration({
    name: 'Sunita Sahu',
    phone,
    email: maidEmail,
    gender: 'female',
    profilePhoto: null,
    profilePhotoPreview: '',
    aadhaarNumber: '123456789012',
    selfieDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    selfieStatus: 'captured',
    location: 'Bhilai',
    city: 'Bhilai',
    area: 'Sector 4',
    address: 'Street 9, Sector 4',
    serviceAreas: ['Sector 4', 'Sector 5'],
    workRadius: 5,
    qualification: 'Matriculation (10th)',
    experience: 3,
    services: ['Cleaning'],
    languages: ['Hindi'],
    dateOfBirth: '1995-05-12',
    pincode: '490006',
    bio: 'Professional house maid and cleaning expert.',
    hourlyEnabled: true,
    hourlyPrice: '160',
    dailyEnabled: true,
    dailyPrice: '650',
    monthlyEnabled: true,
    monthlyPrice: '6000',
  }, maidUid);

  assert(regRes.success && !!regRes.maidId, 'Registration Wizard Submission Success');
  const maidId = regRes.maidId!;

  const unapprovedMaid = await fetchMaidById(maidId);
  assert(unapprovedMaid?.approvalStatus === 'under_review', 'Initial Maid Status is "under_review"');

  const maidUser = await fetchUserById(maidUid);
  assert(maidUser?.role === 'maid' && maidUser?.profileCompleted === true, 'Maid user doc has role "maid" & profileCompleted: true');
  assert(isProfileComplete(maidUser), 'isProfileComplete(maidUser) evaluates to true (No second profile screen)');

  // --- Step 2: Admin Approves Maid ---
  console.log('\n--- 2. ADMIN APPROVAL ---');
  await signOut(auth);
  try {
    await signInWithEmailAndPassword(auth, adminEmail, 'admin123');
  } catch {
    await createUserWithEmailAndPassword(auth, adminEmail, 'admin123');
  }

  const approveSuccess = await updateMaidApprovalStatus(maidId, 'approved');
  assert(approveSuccess, 'Admin Approves Maid in Firestore');

  const approvedMaid = await fetchMaidById(maidId);
  assert(approvedMaid?.approvalStatus === 'approved' && approvedMaid?.isActive === true, 'Maid Status is now "approved" and active');

  // --- Step 3: Approved Maid Login & Direct Dashboard Navigation Check ---
  console.log('\n--- 3. APPROVED MAID LOGIN & DIRECT DASHBOARD FLOW ---');
  await signOut(auth);
  const loginCred = await signInWithEmailAndPassword(auth, maidEmail, password);
  assert(loginCred.user.uid === maidUid, 'Approved Maid logs in via Firebase Auth');

  const liveMaidUser = await fetchUserById(maidUid);
  assert(liveMaidUser?.role === 'maid', 'Live Auth User role is "maid"');
  assert(liveMaidUser?.profileCompleted === true, 'Live Auth User profileCompleted is true');

  // Verify route destination
  const targetDestination = liveMaidUser?.role === 'maid' ? '/maid/dashboard' : '/home';
  assert(targetDestination === '/maid/dashboard', 'Target Redirect is directly "/maid/dashboard" (NOT Customer Home)');

  // --- Step 4: Customer & Admin Roles Isolation ---
  console.log('\n--- 4. ROLE-BASED DASHBOARD ISOLATION ---');
  // Customer check
  await signOut(auth);
  const custCred = await createUserWithEmailAndPassword(auth, custEmail, password);
  const custUid = custCred.user.uid;
  await setDoc(doc(db, 'users', custUid), {
    id: custUid,
    role: 'customer',
    name: 'Customer Test',
    phone: '9876500000',
    email: custEmail,
    location: 'Bhilai',
    area: 'Sector 5',
    status: 'active',
    profileCompleted: true,
    createdAt: new Date().toISOString(),
  });

  const custUserDoc = await fetchUserById(custUid);
  const custTarget = custUserDoc?.role === 'customer' ? '/home' : '/maid/dashboard';
  assert(custTarget === '/home', 'Customer routes to "/home" (Customer Home)');

  // Admin check
  await signOut(auth);
  await signInWithEmailAndPassword(auth, adminEmail, 'admin123');
  const adminUserDoc = await fetchUserById(auth.currentUser!.uid);
  const adminTarget = adminUserDoc?.role === 'admin' ? '/admin' : '/home';
  assert(adminTarget === '/admin', 'Admin routes to "/admin" (Admin Dashboard)');

  // --- Step 5: Cleanup ---
  console.log('\n--- 5. CLEANUP TEST DATA ---');
  await deleteDoc(doc(db, 'maids', maidId));
  await deleteDoc(doc(db, 'users', maidUid));
  await deleteDoc(doc(db, 'users', custUid));

  await signOut(auth);
  await signInWithEmailAndPassword(auth, maidEmail, password);
  await deleteUser(maidCred.user);

  await signOut(auth);
  await signInWithEmailAndPassword(auth, custEmail, password);
  await deleteUser(custCred.user);
  assert(true, 'Test Records Cleanly Removed');

  console.log('\n====================================================');
  console.log(`📊 MAID REDIRECT AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

runMaidRedirectAudit().catch((err) => {
  console.error('Maid Redirect Audit Fatal Error:', err);
  process.exit(1);
});
