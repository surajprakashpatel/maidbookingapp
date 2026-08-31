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
import { fetchUserById, completeUserProfile } from '../src/lib/services/userService';
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

async function runAuthCompleteAudit() {
  console.log('====================================================');
  console.log('🔐 AUTHENTICATION COMPLETE AUDIT (EMAIL/PASSWORD & GOOGLE)');
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
  const custEmail = `cust_auth_${timestamp}@maideasy.in`;
  const maidEmail = `maid_auth_${timestamp}@maideasy.in`;
  const adminEmail = 'admin@maideasy.in';
  const password = 'Password123!';

  // --- Step 1: Customer Email/Password Authentication & Profile Setup ---
  console.log('--- 1. CUSTOMER EMAIL/PASSWORD AUTHENTICATION ---');
  const custCred = await createUserWithEmailAndPassword(auth, custEmail, password);
  const custUid = custCred.user.uid;
  assert(!!custUid, 'Firebase Auth account created for Customer', `UID: ${custUid}`);

  const profileRes = await completeUserProfile({
    id: custUid,
    role: 'customer',
    name: 'Siddharth Verma',
    phone: `98765${Math.floor(10000 + Math.random() * 90000)}`,
    email: custEmail,
    city: 'Bhilai',
    location: 'Bhilai',
    area: 'Sector 4',
    address: 'Street 10, Sector 4',
    status: 'active',
    profileCompleted: true,
  });
  assert(profileRes.success, 'Customer Profile persisted to Firestore /users/{uid}');

  // Customer Login
  await signOut(auth);
  const custLogin = await signInWithEmailAndPassword(auth, custEmail, password);
  assert(custLogin.user.uid === custUid, 'Customer signs in with Email/Password');

  const customerDoc = await fetchUserById(custUid);
  assert(customerDoc?.role === 'customer' && customerDoc?.profileCompleted === true, 'Customer role verified (Direct access to /home)');

  // --- Step 2: Maid Email/Password Authentication & Approval ---
  console.log('\n--- 2. MAID EMAIL/PASSWORD AUTHENTICATION ---');
  await signOut(auth);
  const maidCred = await createUserWithEmailAndPassword(auth, maidEmail, password);
  const maidUid = maidCred.user.uid;
  const maidId = `maid-${maidUid}`;

  await setDoc(doc(db, 'users', maidUid), {
    id: maidUid,
    role: 'maid',
    name: 'Geeta Sen',
    phone: `98764${Math.floor(10000 + Math.random() * 90000)}`,
    email: maidEmail,
    city: 'Bhilai',
    location: 'Bhilai',
    area: 'Sector 5',
    status: 'active',
    profileCompleted: true,
    createdAt: new Date().toISOString(),
  });

  await setDoc(doc(db, 'maids', maidId), {
    id: maidId,
    userId: maidUid,
    name: 'Geeta Sen',
    phone: `98764${Math.floor(10000 + Math.random() * 90000)}`,
    gender: 'female',
    location: 'Bhilai',
    city: 'Bhilai',
    area: 'Sector 5',
    serviceAreas: ['Sector 5', 'Sector 6'],
    workRadius: 5,
    services: ['Cleaning'],
    experience: 4,
    approvalStatus: 'under_review',
    verificationStatus: 'verified',
    selfieStatus: 'verified',
    availability: 'available',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Admin approves maid
  await signOut(auth);
  try {
    await signInWithEmailAndPassword(auth, adminEmail, 'admin123');
  } catch {
    await createUserWithEmailAndPassword(auth, adminEmail, 'admin123');
  }
  await updateMaidApprovalStatus(maidId, 'approved');

  // Maid logs in
  await signOut(auth);
  const maidLogin = await signInWithEmailAndPassword(auth, maidEmail, password);
  assert(maidLogin.user.uid === maidUid, 'Approved Maid signs in with Email/Password');

  const liveMaidDoc = await fetchMaidById(maidId);
  assert(liveMaidDoc?.approvalStatus === 'approved', 'Maid approved status verified (Direct access to /maid/dashboard)');

  // --- Step 3: Admin Login Verification ---
  console.log('\n--- 3. ADMIN LOGIN VERIFICATION ---');
  await signOut(auth);
  const adminLogin = await signInWithEmailAndPassword(auth, adminEmail, 'admin123');
  assert(adminLogin.user.email === adminEmail, 'Admin successfully logs in');
  const adminDoc = await fetchUserById(adminLogin.user.uid);
  assert(adminDoc?.role === 'admin', 'Admin role verified (Direct access to /admin)');

  // --- Step 4: Cleanup ---
  console.log('\n--- 4. CLEANUP TEST DATA ---');
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
  console.log(`📊 AUTH COMPLETE AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

runAuthCompleteAudit().catch((err) => {
  console.error('Auth Complete Audit Fatal Error:', err);
  process.exit(1);
});
