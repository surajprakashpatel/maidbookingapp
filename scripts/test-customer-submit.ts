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
  deleteDoc,
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

async function testCustomerProfileSubmit() {
  console.log('--- TESTING EXACT CUSTOMER PROFILE SUBMISSION PATH ---');
  const timestamp = Date.now();
  const email = `testcust_${timestamp}@maideasy.in`;
  const password = 'Password123!';

  // 1. Sign up customer
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;
  console.log('Customer signed up with UID:', uid);

  // 2. Draft document created by onAuthStateChanged / Google Login
  await setDoc(doc(db, 'users', uid), {
    id: uid,
    role: 'customer',
    name: 'Initial Name',
    status: 'active',
    approvalStatus: 'approved',
    profileCompleted: false,
    createdAt: new Date().toISOString(),
  }, { merge: true });
  console.log('Draft user document created successfully');

  // 3. User fills wizard and submits complete profile
  const fullUserData = {
    id: uid,
    role: 'customer',
    name: 'Priyanshu Verma',
    phone: '9876543210',
    email: email,
    location: 'Bhilai',
    city: 'Bhilai',
    area: 'Sector 6',
    address: 'Street 12, Quarter 4-B',
    status: 'active',
    approvalStatus: 'approved',
    profileCompleted: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Both setDoc calls performed by completeUserProfile in userService.ts
  await setDoc(doc(db, 'users', uid), fullUserData, { merge: true });
  console.log('users/{uid} updated successfully with approvalStatus: approved');

  await setDoc(doc(db, 'customers', uid), {
    ...fullUserData,
    role: 'customer',
    totalBookings: 0,
  }, { merge: true });
  console.log('customers/{uid} created successfully with approvalStatus: approved');

  // Verify reads
  const userSnap = await getDoc(doc(db, 'users', uid));
  const custSnap = await getDoc(doc(db, 'customers', uid));

  if (userSnap.exists() && custSnap.exists() && userSnap.data()?.profileCompleted === true) {
    console.log('ALL CUSTOMER SUBMISSION WRITES SUCCEEDED WITHOUT PERMISSION ERROR!');
  } else {
    throw new Error('Document verification failed');
  }

  // Cleanup
  await deleteDoc(doc(db, 'users', uid));
  await deleteDoc(doc(db, 'customers', uid));
  await deleteUser(cred.user);
  console.log('Test cleanup complete.');
}

testCustomerProfileSubmit().catch((e) => {
  console.error('TEST FAILED:', e);
  process.exit(1);
});
