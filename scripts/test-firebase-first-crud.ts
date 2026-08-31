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
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot
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

async function runAudit() {
  console.log('====================================================');
  console.log('🔥 FIREBASE-FIRST DATA ARCHITECTURE & FULL CRUD AUDIT');
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

  const testEmail = `fb_test_${Date.now()}@maideasy.in`;
  const testPassword = 'Password123!';

  // --- 1. AUTHENTICATION & /users/{uid} CRUD ---
  console.log('--- 1. AUTHENTICATION & /users/{uid} CRUD ---');
  const userCred = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
  const uid = userCred.user.uid;
  assert(!!uid, 'Auth: User Created with UID', uid);

  // CREATE /users/{uid}
  const userDoc = {
    id: uid,
    role: 'customer' as const,
    name: 'Ananya Sharma',
    phone: '9876543210',
    email: testEmail,
    location: 'Bhilai',
    city: 'Bhilai',
    area: 'Sector 7',
    address: 'Flat 301, Pushpak Enclave',
    status: 'active' as const,
    profileCompleted: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await setDoc(doc(db, 'users', uid), userDoc);
  assert(true, 'Firestore Users: CREATE /users/{uid}');

  // READ /users/{uid}
  const userSnap = await getDoc(doc(db, 'users', uid));
  assert(userSnap.exists() && userSnap.data()?.name === 'Ananya Sharma', 'Firestore Users: READ /users/{uid}');

  // UPDATE /users/{uid}
  await updateDoc(doc(db, 'users', uid), { address: 'Flat 302, Pushpak Enclave' });
  const updatedUserSnap = await getDoc(doc(db, 'users', uid));
  assert(updatedUserSnap.data()?.address === 'Flat 302, Pushpak Enclave', 'Firestore Users: UPDATE /users/{uid}');

  // --- 2. CUSTOMERS COLLECTION CRUD ---
  console.log('\n--- 2. CUSTOMERS COLLECTION CRUD ---');
  const custDoc = { ...userDoc, totalBookings: 0 };
  await setDoc(doc(db, 'customers', uid), custDoc);
  const custSnap = await getDoc(doc(db, 'customers', uid));
  assert(custSnap.exists() && custSnap.data()?.id === uid, 'Firestore Customers: CREATE & READ /customers/{uid}');

  await updateDoc(doc(db, 'customers', uid), { totalBookings: 1 });
  const updatedCustSnap = await getDoc(doc(db, 'customers', uid));
  assert(updatedCustSnap.data()?.totalBookings === 1, 'Firestore Customers: UPDATE /customers/{uid}');

  // --- 3. MAIDS COLLECTION CRUD ---
  console.log('\n--- 3. MAIDS COLLECTION CRUD ---');
  const maidId = `maid-${uid}`;
  const maidDoc = {
    id: maidId,
    userId: uid,
    name: 'Sunita Bai',
    phone: '9876500001',
    gender: 'Female' as const,
    location: 'Bhilai',
    city: 'Bhilai',
    area: 'Nehru Nagar',
    address: 'Qtr 15, Nehru Nagar',
    pincode: '490020',
    serviceAreas: ['Nehru Nagar', 'Sector 7'],
    services: ['Cleaning', 'Cooking'],
    languages: ['Hindi', 'Chhattisgarhi'],
    experience: 5,
    qualification: 'High School',
    bio: 'Experienced home helper with 5 years experience.',
    hourlyPrice: 150,
    dailyPrice: 600,
    monthlyPrice: 5000,
    availability: 'available' as const,
    rating: 4.9,
    totalRatings: 1,
    totalBookings: 10,
    completedBookings: 9,
    profileViews: 100,
    approvalStatus: 'under_review' as const,
    verificationStatus: 'submitted' as const,
    selfieStatus: 'captured' as const,
    aadhaarMasked: 'XXXX-XXXX-9988',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await setDoc(doc(db, 'maids', maidId), maidDoc);
  const maidSnap = await getDoc(doc(db, 'maids', maidId));
  assert(maidSnap.exists() && maidSnap.data()?.name === 'Sunita Bai', 'Firestore Maids: CREATE /maids/{maidId}');

  // UPDATE Maid bio and pricing
  await updateDoc(doc(db, 'maids', maidId), { hourlyPrice: 160, bio: 'Updated bio verified.' });
  const updatedMaidSnap = await getDoc(doc(db, 'maids', maidId));
  assert(updatedMaidSnap.data()?.hourlyPrice === 160, 'Firestore Maids: UPDATE /maids/{maidId}');

  // --- 4. BOOKINGS COLLECTION CRUD & REAL-TIME LISTENER ---
  console.log('\n--- 4. BOOKINGS COLLECTION CRUD & REAL-TIME LISTENER ---');
  const bookingId = `bk-${Date.now()}`;
  const bookingDoc = {
    id: bookingId,
    bookingNumber: `BK${Date.now().toString().slice(-6)}`,
    customerId: uid,
    customerName: 'Ananya Sharma',
    customerPhone: '9876543210',
    customerAddress: 'Flat 302, Pushpak Enclave',
    customerArea: 'Sector 7',
    maidId,
    maidName: 'Sunita Bai',
    maidPhone: '9876500001',
    serviceName: 'Deep Cleaning',
    pricingType: 'hourly' as const,
    serviceAmount: 300,
    platformFee: 15,
    totalAmount: 315,
    discount: 0,
    date: '2026-09-05',
    time: '10:00 AM',
    duration: '2',
    bookingStatus: 'pending' as const,
    paymentStatus: 'unpaid' as const,
    paymentGateway: 'phonepe' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Test Real-Time onSnapshot Listener
  let realTimeReceivedStatus = '';
  const unsubBooking = onSnapshot(doc(db, 'bookings', bookingId), (snap) => {
    if (snap.exists()) {
      realTimeReceivedStatus = snap.data()?.bookingStatus || '';
    }
  });

  await setDoc(doc(db, 'bookings', bookingId), bookingDoc);
  const bkSnap = await getDoc(doc(db, 'bookings', bookingId));
  assert(bkSnap.exists() && bkSnap.data()?.bookingNumber === bookingDoc.bookingNumber, 'Firestore Bookings: CREATE /bookings/{bookingId}');

  // Update status in Firestore
  await updateDoc(doc(db, 'bookings', bookingId), { bookingStatus: 'confirmed', paymentStatus: 'paid' });
  
  // Wait brief ms for onSnapshot to fire
  await new Promise(r => setTimeout(r, 400));
  unsubBooking();
  assert(realTimeReceivedStatus === 'confirmed', 'Firestore Bookings: REAL-TIME onSnapshot Synchronization');

  // --- 5. REVIEWS COLLECTION CRUD ---
  console.log('\n--- 5. REVIEWS COLLECTION CRUD ---');
  const revId = `rev-${Date.now()}`;
  const revDoc = {
    id: revId,
    maidId,
    customerId: uid,
    customerName: 'Ananya Sharma',
    rating: 5,
    comment: 'Punctual and very thorough work!',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await setDoc(doc(db, 'reviews', revId), revDoc);
  const revSnap = await getDoc(doc(db, 'reviews', revId));
  assert(revSnap.exists() && revSnap.data()?.rating === 5, 'Firestore Reviews: CREATE & READ /reviews/{revId}');

  await updateDoc(doc(db, 'reviews', revId), { comment: 'Updated: Outstanding cleaning service!' });
  const updatedRevSnap = await getDoc(doc(db, 'reviews', revId));
  assert(updatedRevSnap.data()?.comment.includes('Outstanding'), 'Firestore Reviews: UPDATE /reviews/{revId}');

  // --- 6. NOTIFICATIONS COLLECTION CRUD ---
  console.log('\n--- 6. NOTIFICATIONS COLLECTION CRUD ---');
  const notifId = `notif-${Date.now()}`;
  const notifDoc = {
    id: notifId,
    userId: uid,
    title: 'Booking Confirmed',
    message: 'Your deep cleaning booking is confirmed for Sep 5.',
    type: 'booking' as const,
    read: false,
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(db, 'notifications', notifId), notifDoc);
  const notifSnap = await getDoc(doc(db, 'notifications', notifId));
  assert(notifSnap.exists() && notifSnap.data()?.title === 'Booking Confirmed', 'Firestore Notifications: CREATE & READ');

  await updateDoc(doc(db, 'notifications', notifId), { read: true });
  const updatedNotifSnap = await getDoc(doc(db, 'notifications', notifId));
  assert(updatedNotifSnap.data()?.read === true, 'Firestore Notifications: UPDATE (Mark Read)');

  // --- 7. PAYMENTS COLLECTION CRUD ---
  console.log('\n--- 7. PAYMENTS COLLECTION CRUD ---');
  const payId = `pay-${Date.now()}`;
  const payDoc = {
    id: payId,
    userId: uid,
    bookingId,
    amount: 315,
    gateway: 'phonepe',
    status: 'paid',
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(db, 'payments', payId), payDoc);
  const paySnap = await getDoc(doc(db, 'payments', payId));
  assert(paySnap.exists() && paySnap.data()?.amount === 315, 'Firestore Payments: CREATE & READ');

  // --- 8. DELETE OPERATIONS ---
  console.log('\n--- 8. DELETE OPERATIONS ---');
  await deleteDoc(doc(db, 'payments', payId));
  const delPaySnap = await getDoc(doc(db, 'payments', payId));
  assert(!delPaySnap.exists(), 'Firestore Payments: DELETE /payments/{payId}');

  await deleteDoc(doc(db, 'notifications', notifId));
  const delNotifSnap = await getDoc(doc(db, 'notifications', notifId));
  assert(!delNotifSnap.exists(), 'Firestore Notifications: DELETE /notifications/{notifId}');

  await deleteDoc(doc(db, 'reviews', revId));
  const delRevSnap = await getDoc(doc(db, 'reviews', revId));
  assert(!delRevSnap.exists(), 'Firestore Reviews: DELETE /reviews/{revId}');

  await deleteDoc(doc(db, 'bookings', bookingId));
  const delBkSnap = await getDoc(doc(db, 'bookings', bookingId));
  assert(!delBkSnap.exists(), 'Firestore Bookings: DELETE /bookings/{bookingId}');

  await deleteDoc(doc(db, 'maids', maidId));
  const delMaidSnap = await getDoc(doc(db, 'maids', maidId));
  assert(!delMaidSnap.exists(), 'Firestore Maids: DELETE /maids/{maidId}');

  await deleteDoc(doc(db, 'customers', uid));
  const delCustSnap = await getDoc(doc(db, 'customers', uid));
  assert(!delCustSnap.exists(), 'Firestore Customers: DELETE /customers/{uid}');

  await deleteDoc(doc(db, 'users', uid));
  const delUserSnap = await getDoc(doc(db, 'users', uid));
  assert(!delUserSnap.exists(), 'Firestore Users: DELETE /users/{uid}');

  await deleteUser(userCred.user);
  assert(true, 'Firebase Auth: DELETE User Cleaned Up');

  console.log('\n====================================================');
  console.log(`📊 SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

runAudit().catch((err) => {
  console.error('Firebase-First Audit Error:', err);
  process.exit(1);
});
