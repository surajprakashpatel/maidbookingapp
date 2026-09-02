import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  getDocs
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

async function printBookings() {
  await signInWithEmailAndPassword(auth, 'admin@maideasy.in', 'admin123');
  const snap = await getDocs(collection(db, 'bookings'));
  console.log(`Total documents in 'bookings': ${snap.size}`);
  snap.docs.forEach((d, i) => {
    console.log(`\n--- Booking #${i+1} [ID: ${d.id}] ---`);
    console.log(JSON.stringify(d.data(), null, 2));
  });
  process.exit(0);
}

printBookings().catch(console.error);
