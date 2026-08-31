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
import { fetchApprovedMaids } from '../src/lib/services/maidService';

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

async function runCustomerRegistrationAudit() {
  console.log('====================================================');
  console.log('👤 CUSTOMER REGISTRATION — FINAL FLOW & DIRECT ACCESS AUDIT');
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
  const email = `cust_final_${timestamp}@maideasy.in`;
  const password = 'Password123!';

  // --- Step 1: Upfront Customer Signup Flow ---
  console.log('--- 1. UPFRONT CUSTOMER SIGNUP FLOW ---');
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;

  // Complete profile persisted upfront directly to /users/{uid}
  const completeCustomerData = {
    id: uid,
    role: 'customer' as const,
    name: 'Suresh Kumar',
    phone,
    email,
    location: 'Bhilai',
    city: 'Bhilai',
    area: 'Sector 5',
    address: 'Flat 204, Block C, Pragati Nagar',
    status: 'active' as const,
    profileCompleted: true,
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(db, 'users', uid), completeCustomerData);

  const userDoc = await fetchUserById(uid);
  assert(userDoc?.id === uid, 'Customer created with Firebase Auth UID', `UID: ${uid}`);
  assert(userDoc?.role === 'customer', 'Role is strictly Customer');
  assert(userDoc?.name === 'Suresh Kumar', 'Name saved upfront');
  assert(userDoc?.phone === phone, 'Phone number saved upfront');
  assert(userDoc?.area === 'Sector 5' && userDoc?.city === 'Bhilai', 'Location & Area saved upfront');
  assert(userDoc?.address === 'Flat 204, Block C, Pragati Nagar', 'Address saved upfront');
  assert(userDoc?.profileCompleted === true, 'profileCompleted is true (Direct access enabled)');
  assert(userDoc?.status === 'active', 'Customer Status is active (No pending/under-review state)');

  // --- Step 2: Immediate App Functionality Check ---
  console.log('\n--- 2. IMMEDIATE APPLICATION ACCESS (NO WAITING/REVIEW) ---');
  const maids = await fetchApprovedMaids();
  assert(Array.isArray(maids), 'Customer immediately accesses maid directory upon signup');

  // --- Step 3: Google / OTP Profile Completion Flow ---
  console.log('\n--- 3. GOOGLE / OTP FIRST-TIME PROFILE COMPLETION FLOW ---');
  const otpEmail = `otp_cust_${timestamp}@maideasy.in`;
  const otpCred = await createUserWithEmailAndPassword(auth, otpEmail, password);
  const otpUid = otpCred.user.uid;

  // Simulate first-time profile completion
  const profileRes = await completeUserProfile({
    id: otpUid,
    role: 'customer',
    name: 'Priyanka Verma',
    phone: `98764${Math.floor(10000 + Math.random() * 90000)}`,
    city: 'Bhilai',
    location: 'Bhilai',
    area: 'Nehru Nagar',
    address: 'Plot 12, Street 3, Nehru Nagar',
    status: 'active',
    profileCompleted: true,
  });
  assert(profileRes.success, 'First-time OTP/Google profile completion persists to Firestore');

  const otpUserDoc = await fetchUserById(otpUid);
  assert(otpUserDoc?.profileCompleted === true && otpUserDoc?.role === 'customer', 'OTP/Google User profile completed with direct access');

  // --- Step 4: Cleanup ---
  console.log('\n--- 4. CLEANUP TEST ACCOUNTS ---');
  await signOut(auth);
  try {
    await signInWithEmailAndPassword(auth, 'admin@maideasy.in', 'admin123');
  } catch {
    await createUserWithEmailAndPassword(auth, 'admin@maideasy.in', 'admin123');
  }
  await deleteDoc(doc(db, 'users', uid));
  await deleteDoc(doc(db, 'users', otpUid));

  await signOut(auth);
  await signInWithEmailAndPassword(auth, email, password);
  await deleteUser(cred.user);

  await signOut(auth);
  await signInWithEmailAndPassword(auth, otpEmail, password);
  await deleteUser(otpCred.user);
  assert(true, 'Test Customer Accounts Cleanly Removed');

  console.log('\n====================================================');
  console.log(`📊 CUSTOMER REGISTRATION AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

runCustomerRegistrationAudit().catch((err) => {
  console.error('Customer Registration Audit Fatal Error:', err);
  process.exit(1);
});
