import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signOut,
  deleteUser
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  deleteDoc
} from 'firebase/firestore';
import { submitMaidRegistration } from '../src/lib/services/maidService';
import { MaidRegistrationForm } from '../src/lib/types';

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

async function testUnauthenticatedMaidRegistration() {
  console.log('====================================================');
  console.log('🧪 TESTING MAID REGISTRATION AUTHENTICATION RESILIENCE');
  console.log('====================================================\n');

  // Start with signed-out state (auth.currentUser is null)
  await signOut(auth);
  console.log('Auth state: Signed out (auth.currentUser is null)');

  const timestamp = Date.now();
  const testPhone = `987${timestamp.toString().slice(-7)}`;
  const testEmail = `maid_reg_${timestamp}@maideasy.in`;

  // 1x1 transparent PNG data URL for selfie testing
  const dummySelfieDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  const form: MaidRegistrationForm = {
    name: 'Anita Sahu',
    phone: testPhone,
    email: testEmail,
    dateOfBirth: '1995-05-10',
    gender: 'female',
    profilePhoto: null,
    profilePhotoPreview: '',
    aadhaarNumber: '123456789012',
    selfieDataUrl: dummySelfieDataUrl,
    selfieStatus: 'captured',
    location: 'Bhilai',
    city: 'Bhilai',
    area: 'Sector 6',
    address: 'Qtr 15, Sector 6',
    pincode: '490006',
    serviceAreas: ['Sector 6', 'Sector 7'],
    workRadius: 5,
    qualification: 'High School',
    experience: 4,
    services: ['Cleaning', 'Cooking'],
    languages: ['Hindi'],
    bio: 'Experienced house helper',
    hourlyEnabled: true,
    hourlyPrice: '150',
    dailyEnabled: true,
    dailyPrice: '600',
    monthlyEnabled: true,
    monthlyPrice: '5000',
  };

  console.log(`Submitting registration for ${form.name} (${form.phone})...`);
  const res = await submitMaidRegistration(form, '');

  if (!res.success) {
    console.error('❌ Maid Registration failed:', res.error);
    process.exit(1);
  }

  console.log(`✅ Maid Registration succeeded! MaidId: ${res.maidId}, UserId: ${res.userId}`);

  const maidSnap = await getDoc(doc(db, 'maids', res.maidId!));
  if (maidSnap.exists() && maidSnap.data()?.name === 'Anita Sahu' && maidSnap.data()?.approvalStatus === 'under_review') {
    console.log('✅ Firestore /maids document verified: status is under_review');
    console.log('Selfie URL in Firestore:', maidSnap.data()?.selfieUrl);
  } else {
    console.error('❌ Maid document missing or incorrect in Firestore.');
    process.exit(1);
  }

  const userSnap = await getDoc(doc(db, 'users', res.userId!));
  if (userSnap.exists() && userSnap.data()?.role === 'maid') {
    console.log('✅ Firestore /users document verified: role is maid');
  } else {
    console.error('❌ User document missing or incorrect in Firestore.');
    process.exit(1);
  }

  // Cleanup
  await deleteDoc(doc(db, 'maids', res.maidId!));
  await deleteDoc(doc(db, 'users', res.userId!));
  if (auth.currentUser) {
    await deleteUser(auth.currentUser);
  }
  console.log('✅ Cleaned up test records');

  console.log('\n🎉 ALL CHECKS PASSED: Unauthenticated Maid Registration handles Storage & Firestore cleanly.');
}

testUnauthenticatedMaidRegistration().catch((err) => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
