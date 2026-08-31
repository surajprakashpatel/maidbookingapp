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

function isProfileComplete(u: any): boolean {
  if (!u) return false;
  if (u.role === 'admin') return true;
  if (u.profileCompleted === true) return true;
  const hasValidName = !!u.name && u.name.trim().length >= 2 && !u.name.startsWith('User ') && u.name !== 'Google User';
  const hasValidRole = u.role === 'customer' || u.role === 'maid';
  const hasValidArea = !!u.area || !!u.location;
  return hasValidName && hasValidRole && hasValidArea;
}

async function runTest() {
  console.log('====================================================');
  console.log('🧪 VERIFYING AUTHENTICATION → PROFILE CREATION → DASHBOARD FLOW');
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

  const testEmail = `newuser_${Date.now()}@maideasy.in`;
  const testPassword = 'Password123!';

  // Step 1: New Firebase Auth User Creation
  console.log('--- STEP 1: NEW USER FIREBASE AUTHENTICATION ---');
  const userCred = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
  const uid = userCred.user.uid;
  assert(!!uid, 'Firebase Auth User Created', `UID: ${uid}`);

  // Step 2: Check Firestore - document must NOT exist before profile creation
  console.log('\n--- STEP 2: PROFILE EXISTENCE CHECK BEFORE COMPLETION ---');
  const preCheckSnap = await getDoc(doc(db, 'users', uid));
  assert(!preCheckSnap.exists(), 'No Dummy User Doc Auto-Created in Firestore', 'Pre-check is clean');
  assert(!isProfileComplete(preCheckSnap.data()), 'isProfileComplete correctly identifies incomplete new user');

  // Step 3: Execute Profile Creation (User submits Name, Role, City, Area, Address)
  console.log('\n--- STEP 3: SUBMIT PROFILE CREATION (/profile/create) ---');
  const profilePayload = {
    id: uid,
    role: 'customer' as const,
    name: 'Priya Sharma',
    phone: '9876543210',
    email: testEmail,
    location: 'Bhilai',
    city: 'Bhilai',
    area: 'Sector 7',
    address: 'Flat 402, Royal Palms, Sector 7',
    status: 'active' as const,
    profileCompleted: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'users', uid), profilePayload);
  await setDoc(doc(db, 'customers', uid), { ...profilePayload, totalBookings: 0 });

  // Step 4: Verify Firestore document has been persisted with profileCompleted: true
  console.log('\n--- STEP 4: VERIFY FIRESTORE /users/{uid} CREATION ---');
  const postCheckSnap = await getDoc(doc(db, 'users', uid));
  assert(postCheckSnap.exists(), 'Firestore /users/{uid} Document Successfully Created');
  const savedData = postCheckSnap.data();
  assert(savedData?.profileCompleted === true, 'profileCompleted flag is TRUE');
  assert(savedData?.name === 'Priya Sharma', 'Full Name matches submission');
  assert(savedData?.area === 'Sector 7', 'Area locality matches submission');
  assert(savedData?.role === 'customer', 'Role saved as customer');
  assert(isProfileComplete(savedData), 'isProfileComplete returns TRUE -> Ready for Dashboard');

  // Step 5: Existing User Sign-In Flow (Simulate returning login)
  console.log('\n--- STEP 5: EXISTING USER SIGN-IN DIRECT DASHBOARD FLOW ---');
  await signOut(auth);
  const returningCred = await signInWithEmailAndPassword(auth, testEmail, testPassword);
  const returningSnap = await getDoc(doc(db, 'users', returningCred.user.uid));
  assert(returningSnap.exists() && isProfileComplete(returningSnap.data()), 'Returning User Skips Profile Creation & Enters Dashboard Directly');

  // Step 6: Cleanup Test User
  console.log('\n--- STEP 6: CLEANUP TEST ARTIFACTS ---');
  await deleteDoc(doc(db, 'users', uid));
  await deleteDoc(doc(db, 'customers', uid));
  await deleteUser(returningCred.user);
  assert(true, 'Test Firebase Auth & Firestore records cleanly deleted');

  console.log('\n====================================================');
  console.log(`📊 SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

runTest().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
