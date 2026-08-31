import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  deleteUser
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  deleteDoc
} from 'firebase/firestore';
import { completeUserProfile } from '../src/lib/services/userService';

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

async function testUndefinedFields() {
  console.log('====================================================');
  console.log('🧪 VERIFYING UNDEFINED FIELDS RESILIENCE IN FIRESTORE');
  console.log('====================================================\n');

  const testEmail = `phone_user_${Date.now()}@maideasy.in`;
  const testPassword = 'Password123!';

  const cred = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
  const uid = cred.user.uid;
  console.log(`Created test user UID: ${uid}`);

  // Intentionally pass undefined fields as happens with Phone OTP users
  const res = await completeUserProfile({
    id: uid,
    role: 'customer',
    name: 'Pooja Verma',
    phone: '9876543210',
    email: undefined,
    photoUrl: undefined,
    city: 'Bhilai',
    area: 'Sector 6',
    address: 'Street 12, Sector 6',
  });

  if (!res.success) {
    console.error('❌ completeUserProfile failed:', res.error);
    process.exit(1);
  }

  console.log('✅ completeUserProfile succeeded without error!');

  const snap = await getDoc(doc(db, 'users', uid));
  if (snap.exists() && snap.data()?.name === 'Pooja Verma' && snap.data()?.profileCompleted === true) {
    console.log('✅ Firestore /users/{uid} verified in database:', snap.data());
  } else {
    console.error('❌ Document does not match expected state.');
    process.exit(1);
  }

  // Cleanup
  await deleteDoc(doc(db, 'users', uid));
  await deleteDoc(doc(db, 'customers', uid));
  await deleteUser(cred.user);
  console.log('✅ Cleaned up test records');

  console.log('\n🎉 TEST PASSED! Undefined field error is completely resolved.');
}

testUndefinedFields().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
