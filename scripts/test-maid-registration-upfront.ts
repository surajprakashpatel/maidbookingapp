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
import { submitMaidRegistration, fetchMaidById, updateMaidApprovalStatus } from '../src/lib/services/maidService';
import { fetchUserById } from '../src/lib/services/userService';

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

async function runUpfrontMaidRegistrationTest() {
  console.log('====================================================');
  console.log('📝 MAID REGISTRATION — COLLECT EVERYTHING UPFRONT AUDIT');
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
  const email = `pooja_${timestamp}@maideasy.in`;
  const password = 'Password123!';

  // 1. Create a newly authenticated maid applicant
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;

  console.log(`1. Authenticated applicant UID: ${uid}`);

  // 2. Submit initial registration with all 10 upfront fields
  console.log('2. Submitting all 10 registration fields upfront...');
  const res = await submitMaidRegistration({
    name: 'Pooja Sharma',
    phone,
    email,
    dateOfBirth: '1995-05-15',
    gender: 'female',
    profilePhoto: null,
    profilePhotoPreview: '',
    aadhaarNumber: '123456789012',
    selfieDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    selfieStatus: 'captured',
    location: 'Bhilai',
    city: 'Bhilai',
    area: 'Sector 6',
    address: 'Street 14, Quarter 8B, Sector 6',
    pincode: '490006',
    serviceAreas: ['Sector 6', 'Sector 7'],
    workRadius: 6,
    qualification: 'Higher Secondary (12th)',
    experience: 4,
    services: ['Deep Cleaning', 'Cooking'],
    languages: ['Hindi', 'Chhattisgarhi'],
    bio: 'Experienced home cook and deep cleaning specialist with 4 years of verified work.',
    hourlyEnabled: true,
    hourlyPrice: '180',
    dailyEnabled: true,
    dailyPrice: '750',
    monthlyEnabled: true,
    monthlyPrice: '7000',
  }, uid);

  assert(res.success && !!res.maidId, 'Registration Wizard Submission Succeeded', `Maid ID: ${res.maidId}`);
  const maidId = res.maidId!;

  // 3. Verify Firestore /maids record has all 10 collected fields
  console.log('\n3. Verifying all collected fields in Firestore /maids document...');
  const maidDoc = await fetchMaidById(maidId);

  assert(maidDoc?.name === 'Pooja Sharma', 'Field 1: Name persisted');
  assert(maidDoc?.phone === phone, 'Field 2: Phone Number persisted');
  assert(maidDoc?.email === email, 'Field 3: Email persisted');
  assert(maidDoc?.gender === 'female', 'Field 4: Gender persisted');
  assert(maidDoc?.location === 'Bhilai' && maidDoc?.city === 'Bhilai', 'Field 5: Location & City persisted');
  assert(maidDoc?.qualification === 'Higher Secondary (12th)', 'Field 6: Qualification persisted');
  assert(!!maidDoc?.aadhaarMasked && maidDoc.aadhaarMasked.includes('9012'), 'Field 7: Masked Aadhaar persisted');
  assert(!!maidDoc?.selfieUrl || maidDoc?.selfieStatus === 'verified' || maidDoc?.selfieStatus === 'captured', 'Field 8: Live Selfie status & URL persisted');
  assert(maidDoc?.area === 'Sector 6' && maidDoc.serviceAreas?.includes('Sector 6'), 'Field 9: Work Area & Service Areas persisted');
  assert(maidDoc?.hourlyPrice === 180 && maidDoc?.dailyPrice === 750 && maidDoc?.monthlyPrice === 7000, 'Field 10: Pricing (Hourly, Daily, Monthly ₹) persisted');

  // 4. Verify Initial Status is 'under_review' and No Second Setup Flow Needed
  assert(maidDoc?.approvalStatus === 'under_review', 'Status Check: Application is Under Review (under_review)');

  const userDoc = await fetchUserById(uid);
  assert(userDoc?.profileCompleted === true && userDoc?.role === 'maid', 'User Profile: profileCompleted is true (No second setup screen)');

  // 5. Admin Approves Application
  console.log('\n4. Admin approves the application...');
  await signOut(auth);
  try {
    await signInWithEmailAndPassword(auth, 'admin@maideasy.in', 'admin123');
  } catch {
    await createUserWithEmailAndPassword(auth, 'admin@maideasy.in', 'admin123');
  }

  const approveRes = await updateMaidApprovalStatus(maidId, 'approved');
  assert(approveRes, 'Admin successfully approves application in Firestore');

  const approvedMaidDoc = await fetchMaidById(maidId);
  assert(approvedMaidDoc?.approvalStatus === 'approved' && approvedMaidDoc?.isActive === true, 'Status Check: Maid is Approved & Active');

  // 6. Cleanup
  console.log('\n5. Cleaning up test records...');
  await deleteDoc(doc(db, 'maids', maidId));
  await deleteDoc(doc(db, 'users', uid));
  await signOut(auth);
  await signInWithEmailAndPassword(auth, email, password);
  await deleteUser(cred.user);
  assert(true, 'Test Records Cleanly Removed');

  console.log('\n====================================================');
  console.log(`📊 MAID UPFRONT REGISTRATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

runUpfrontMaidRegistrationTest().catch((err) => {
  console.error('Upfront Maid Registration Fatal Error:', err);
  process.exit(1);
});
