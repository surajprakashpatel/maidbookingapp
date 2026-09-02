import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc
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
const auth = getAuth(app);
const db = getFirestore(app);

async function inspectFirestore() {
  console.log('==================================================');
  console.log('🔍 FIRESTORE AUTHENTICATED LIVE AUDIT');
  console.log('==================================================\n');

  try {
    const cred = await signInWithEmailAndPassword(auth, 'admin@maideasy.in', 'admin123');
    console.log(`✅ Logged in as Admin: ${cred.user.email} (UID: ${cred.user.uid})\n`);
  } catch (err: any) {
    console.error('Failed to log in as admin:', err.message);
    return;
  }

  const candidateCollections = [
    'bookings',
    'booking',
    'Bookings',
    'Booking',
    'orders',
    'appointments',
    'users',
    'maids',
    'customers',
    'notifications',
    'payments',
    'reviews',
    'service_categories',
    'settings',
    'locations_cities',
    'locations_localities'
  ];

  for (const colName of candidateCollections) {
    try {
      const snap = await getDocs(collection(db, colName));
      console.log(`📂 Collection "${colName}": ${snap.size} documents found.`);
      if (snap.size > 0) {
        snap.docs.forEach((d) => {
          console.log(`   - Doc ID: ${d.id}`);
          if (colName.toLowerCase().includes('book') || colName === 'orders') {
            console.log(`     Data:`, JSON.stringify(d.data(), null, 2));
          }
        });
      }
    } catch (err: any) {
      console.log(`❌ Error querying "${colName}":`, err.message || err);
    }
  }

  // Check subcollections under users, maids, customers
  console.log('\n--- Checking Subcollections ---');
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    for (const uDoc of usersSnap.docs) {
      try {
        const subSnap = await getDocs(collection(db, `users/${uDoc.id}/bookings`));
        if (subSnap.size > 0) {
          console.log(`Found subcollection users/${uDoc.id}/bookings with ${subSnap.size} docs:`);
          subSnap.docs.forEach(d => console.log(`   - ${d.id}:`, JSON.stringify(d.data(), null, 2)));
        }
      } catch (e) {}
    }

    const maidsSnap = await getDocs(collection(db, 'maids'));
    for (const mDoc of maidsSnap.docs) {
      try {
        const subSnap = await getDocs(collection(db, `maids/${mDoc.id}/bookings`));
        if (subSnap.size > 0) {
          console.log(`Found subcollection maids/${mDoc.id}/bookings with ${subSnap.size} docs:`);
          subSnap.docs.forEach(d => console.log(`   - ${d.id}:`, JSON.stringify(d.data(), null, 2)));
        }
      } catch (e) {}
    }

    const custSnap = await getDocs(collection(db, 'customers'));
    for (const cDoc of custSnap.docs) {
      try {
        const subSnap = await getDocs(collection(db, `customers/${cDoc.id}/bookings`));
        if (subSnap.size > 0) {
          console.log(`Found subcollection customers/${cDoc.id}/bookings with ${subSnap.size} docs:`);
          subSnap.docs.forEach(d => console.log(`   - ${d.id}:`, JSON.stringify(d.data(), null, 2)));
        }
      } catch (e) {}
    }
  } catch (err: any) {
    console.log('Error checking subcollections:', err.message);
  }

  console.log('\n==================================================');
}

inspectFirestore().catch(console.error);
