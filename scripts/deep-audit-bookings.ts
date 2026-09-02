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
const auth = getAuth(app);
const db = getFirestore(app);

async function inspectAllBookings() {
  console.log('=== LOGGING IN AS ADMIN ===');
  await signInWithEmailAndPassword(auth, 'admin@maideasy.in', 'admin123');
  console.log('Logged in successfully.\n');

  // Check possible root collections
  const candidates = ['bookings', 'booking', 'Bookings', 'Booking', 'maid_bookings', 'user_bookings', 'customer_bookings'];
  for (const c of candidates) {
    try {
      const snap = await getDocs(collection(db, c));
      console.log(`Collection "${c}": ${snap.size} documents.`);
      snap.docs.forEach(d => {
        console.log(`  [${c}] Doc ID: ${d.id}, status: ${d.data().bookingStatus || d.data().status}, customer: ${d.data().customerName || d.data().customerId}, maid: ${d.data().maidName || d.data().maidId}`);
      });
    } catch (e: any) {
      console.log(`Collection "${c}" query error: ${e.message}`);
    }
  }

  // Check subcollections
  console.log('\n=== CHECKING SUBCOLLECTIONS ===');
  const userSnap = await getDocs(collection(db, 'users'));
  console.log(`Checking ${userSnap.size} users for subcollections...`);
  for (const u of userSnap.docs) {
    for (const sub of ['bookings', 'booking']) {
      try {
        const subSnap = await getDocs(collection(db, `users/${u.id}/${sub}`));
        if (subSnap.size > 0) {
          console.log(`🚨 FOUND SUBCOLLECTION users/${u.id}/${sub} (${subSnap.size} docs)!`);
          subSnap.docs.forEach(d => console.log(`   Sub Doc: ${d.id}`, d.data()));
        }
      } catch (e) {}
    }
  }

  const maidSnap = await getDocs(collection(db, 'maids'));
  console.log(`Checking ${maidSnap.size} maids for subcollections...`);
  for (const m of maidSnap.docs) {
    for (const sub of ['bookings', 'booking']) {
      try {
        const subSnap = await getDocs(collection(db, `maids/${m.id}/${sub}`));
        if (subSnap.size > 0) {
          console.log(`🚨 FOUND SUBCOLLECTION maids/${m.id}/${sub} (${subSnap.size} docs)!`);
          subSnap.docs.forEach(d => console.log(`   Sub Doc: ${d.id}`, d.data()));
        }
      } catch (e) {}
    }
  }

  const custSnap = await getDocs(collection(db, 'customers'));
  console.log(`Checking ${custSnap.size} customers for subcollections...`);
  for (const c of custSnap.docs) {
    for (const sub of ['bookings', 'booking']) {
      try {
        const subSnap = await getDocs(collection(db, `customers/${c.id}/${sub}`));
        if (subSnap.size > 0) {
          console.log(`🚨 FOUND SUBCOLLECTION customers/${c.id}/${sub} (${subSnap.size} docs)!`);
          subSnap.docs.forEach(d => console.log(`   Sub Doc: ${d.id}`, d.data()));
        }
      } catch (e) {}
    }
  }

  console.log('\n=== CHECK COMPLETE ===');
  process.exit(0);
}

inspectAllBookings().catch((err) => {
  console.error('Error during inspection:', err);
  process.exit(1);
});
