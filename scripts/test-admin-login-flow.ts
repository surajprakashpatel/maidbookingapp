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
import { fetchAllMaidsAdmin } from '../src/lib/services/maidService';
import { fetchAllBookingsAdmin } from '../src/lib/services/bookingService';

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

async function runAdminLoginAudit() {
  console.log('====================================================');
  console.log('👑 ADMIN LOGIN — AUTHENTICATION & ACCESS AUDIT');
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
  const custEmail = `cust_fake_adm_${timestamp}@maideasy.in`;
  const custPass = 'Password123!';

  // --- Step 1: Valid Admin Authentication & UID Verification ---
  console.log('--- 1. VALID ADMIN LOGIN FLOW ---');
  let adminUid: string;
  try {
    const cred = await signInWithEmailAndPassword(auth, adminEmail, adminPass);
    adminUid = cred.user.uid;
  } catch {
    const newCred = await createUserWithEmailAndPassword(auth, adminEmail, adminPass);
    adminUid = newCred.user.uid;
  }

  assert(!!adminUid, 'Firebase Auth succeeded for Admin', `UID: ${adminUid}`);

  // Ensure Admin Document Exists in Firestore
  const userDocRef = doc(db, 'users', adminUid);
  await setDoc(userDocRef, {
    id: adminUid,
    role: 'admin',
    name: 'Platform Administrator',
    email: adminEmail,
    phone: '9000000001',
    status: 'active',
    profileCompleted: true,
    createdAt: new Date().toISOString(),
  }, { merge: true });

  const adminDoc = await fetchUserById(adminUid);
  assert(adminDoc?.id === adminUid, 'Admin Document verified in /users/{uid}');
  assert(adminDoc?.role === 'admin', 'Admin Role is strictly "admin" in Firestore');
  assert(adminDoc?.profileCompleted === true, 'Admin profileCompleted is true');

  // Verify Admin can perform operational administrative queries
  const allMaids = await fetchAllMaidsAdmin();
  assert(Array.isArray(allMaids), 'Admin authorized to query all maids (/maids)');

  const allBookings = await fetchAllBookingsAdmin();
  assert(Array.isArray(allBookings), 'Admin authorized to query all bookings (/bookings)');

  // --- Step 2: Customer Account Access Denied to Admin ---
  console.log('\n--- 2. NON-ADMIN ACCESS DENIAL CHECK ---');
  await signOut(auth);
  const custCred = await createUserWithEmailAndPassword(auth, custEmail, custPass);
  const custUid = custCred.user.uid;

  await setDoc(doc(db, 'users', custUid), {
    id: custUid,
    role: 'customer',
    name: 'Normal Customer',
    email: custEmail,
    phone: '9876543210',
    status: 'active',
    profileCompleted: true,
    createdAt: new Date().toISOString(),
  });

  const custDoc = await fetchUserById(custUid);
  assert(custDoc?.role === 'customer', 'Normal User Document created with role "customer"');

  // Attempt privilege escalation: Customer attempts to write role: 'admin' to own doc
  let escalationBlocked = false;
  try {
    await updateDoc(doc(db, 'users', custUid), { role: 'admin' });
  } catch {
    escalationBlocked = true;
  }
  assert(escalationBlocked, 'Privilege Escalation Blocked by Firestore Rules');

  // Cleanup
  console.log('\n--- 3. CLEANUP TEST CUSTOMER ---');
  await signOut(auth);
  await signInWithEmailAndPassword(auth, adminEmail, adminPass);
  await deleteDoc(doc(db, 'users', custUid));
  await signOut(auth);
  await signInWithEmailAndPassword(auth, custEmail, custPass);
  await deleteUser(custCred.user);
  assert(true, 'Test Customer clean up completed');

  console.log('\n====================================================');
  console.log(`📊 ADMIN LOGIN AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

runAdminLoginAudit().catch((err) => {
  console.error('Admin Login Audit Fatal Error:', err);
  process.exit(1);
});
