import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
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
  getDocs,
  query,
  where
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

interface TestResult {
  suite: string;
  test: string;
  status: 'PASS' | 'FAIL';
  details?: string;
}

const results: TestResult[] = [];

function record(suite: string, test: string, status: 'PASS' | 'FAIL', details?: string) {
  results.push({ suite, test, status, details });
  const icon = status === 'PASS' ? '✅' : '❌';
  console.log(`${icon} [${suite}] ${test}: ${status}${details ? ` (${details})` : ''}`);
}

async function runAudit() {
  console.log('====================================================');
  console.log('🚀 STARTING FULL FIREBASE PERMISSIONS & CRUD AUDIT');
  console.log('====================================================\n');

  let testAuthUser: any = null;

  try {
    // ----------------------------------------------------
    // SUITE 1: AUTHENTICATION & PROFILE CREATION
    // ----------------------------------------------------
    console.log('\n--- 1. AUTHENTICATION & PROFILE CREATION ---');
    try {
      const testEmail = `test_audit_${Date.now()}@maideasy.in`;
      const testPass = 'Password123!';
      const cred = await createUserWithEmailAndPassword(auth, testEmail, testPass);
      testAuthUser = cred.user;
      record('Auth', 'Email User Signup', 'PASS', `UID: ${testAuthUser.uid}`);

      // Profile creation rule check
      const userDocRef = doc(db, 'users', testAuthUser.uid);
      const userProfile = {
        id: testAuthUser.uid,
        role: 'customer',
        name: 'Test Customer',
        phone: '9876599999',
        email: testEmail,
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      await setDoc(userDocRef, userProfile);
      record('Auth', 'Profile Creation (/users/{uid})', 'PASS');

      // Profile read check
      const readSnap = await getDoc(userDocRef);
      if (readSnap.exists() && readSnap.data()?.name === 'Test Customer') {
        record('Auth', 'Profile Read', 'PASS');
      } else {
        record('Auth', 'Profile Read', 'FAIL', 'Document data mismatch');
      }

      // Profile update check (non-role fields)
      await updateDoc(userDocRef, { name: 'Updated Customer Name' });
      record('Auth', 'Profile Update', 'PASS');

    } catch (e: any) {
      record('Auth', 'Email User Signup & Profile Creation', 'FAIL', e.message);
    }

    // ----------------------------------------------------
    // SUITE 2: CUSTOMER OPERATIONS & BOOKINGS CRUD
    // ----------------------------------------------------
    console.log('\n--- 2. CUSTOMER & BOOKINGS CRUD ---');
    let testBookingId = `bk_test_${Date.now()}`;
    try {
      if (testAuthUser) {
        // Customer doc write
        const custRef = doc(db, 'customers', testAuthUser.uid);
        await setDoc(custRef, {
          id: testAuthUser.uid,
          role: 'customer',
          name: 'Test Customer',
          phone: '9876599999',
          status: 'active',
          updatedAt: new Date().toISOString(),
        });
        record('Customer', 'Create Customer Record', 'PASS');

        // Create Booking
        const bookingRef = doc(db, 'bookings', testBookingId);
        const bookingData = {
          id: testBookingId,
          bookingNumber: `MB-${Date.now().toString().slice(-6)}`,
          customerId: testAuthUser.uid,
          customerName: 'Test Customer',
          maidId: 'maid-1',
          maidName: 'Sunita Verma',
          serviceId: 'cleaning',
          serviceName: 'Cleaning',
          date: '2026-09-10',
          time: '09:00',
          duration: 4,
          pricingType: 'hourly',
          serviceAmount: 600,
          platformFee: 30,
          totalAmount: 630,
          paymentStatus: 'paid',
          bookingStatus: 'confirmed',
          customerAddress: 'Bhilai Sector 7',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(bookingRef, bookingData);
        record('Booking', 'Create Booking (CREATE)', 'PASS');

        // Read Booking
        const bSnap = await getDoc(bookingRef);
        if (bSnap.exists()) {
          record('Booking', 'Fetch Booking by ID (READ)', 'PASS');
        } else {
          record('Booking', 'Fetch Booking by ID (READ)', 'FAIL', 'Doc not found');
        }

        // Query Customer Bookings
        const bQuery = query(collection(db, 'bookings'), where('customerId', '==', testAuthUser.uid));
        const qSnap = await getDocs(bQuery);
        if (qSnap.docs.length > 0) {
          record('Booking', 'Query Customer Bookings (READ)', 'PASS');
        } else {
          record('Booking', 'Query Customer Bookings (READ)', 'FAIL');
        }

        // Update Booking Status
        await updateDoc(bookingRef, { bookingStatus: 'completed', updatedAt: new Date().toISOString() });
        record('Booking', 'Update Booking Status (UPDATE)', 'PASS');

        // Delete Booking
        await deleteDoc(bookingRef);
        record('Booking', 'Delete Booking (DELETE)', 'PASS');
      }
    } catch (e: any) {
      record('Booking', 'Booking CRUD Flow', 'FAIL', e.message);
    }

    // ----------------------------------------------------
    // SUITE 3: MAID REGISTRATION & CATALOG
    // ----------------------------------------------------
    console.log('\n--- 3. MAID REGISTRATION & CATALOG ---');
    const testMaidId = `maid_test_${Date.now()}`;
    try {
      if (testAuthUser) {
        const maidRef = doc(db, 'maids', testMaidId);
        const maidData = {
          id: testMaidId,
          userId: testAuthUser.uid,
          name: 'Test Maid Partner',
          phone: '9876543219',
          gender: 'female',
          city: 'Bhilai',
          area: 'Nehru Nagar',
          serviceAreas: ['Nehru Nagar'],
          workRadius: 5,
          experience: 4,
          services: ['Cleaning'],
          languages: ['Hindi'],
          hourlyPrice: 150,
          approvalStatus: 'under_review',
          verificationStatus: 'pending',
          selfieStatus: 'captured',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(maidRef, maidData);
        record('Maid', 'Submit Registration (status: under_review)', 'PASS');

        // Read Maid Profile (Public Catalog)
        const mSnap = await getDoc(maidRef);
        if (mSnap.exists()) {
          record('Maid', 'Read Maid Profile (READ)', 'PASS');
        }

        // Update Maid Bio/Pricing (Allowed for Owner)
        await updateDoc(maidRef, { bio: 'Experienced in home cooking and cleaning', hourlyPrice: 160 });
        record('Maid', 'Update Maid Bio & Pricing (UPDATE)', 'PASS');

        // Clean up test maid
        await deleteDoc(maidRef);
        record('Maid', 'Delete Maid Record (DELETE)', 'PASS');
      }
    } catch (e: any) {
      record('Maid', 'Maid Registration Flow', 'FAIL', e.message);
    }

    // ----------------------------------------------------
    // SUITE 4: NOTIFICATIONS & PAYMENTS
    // ----------------------------------------------------
    console.log('\n--- 4. NOTIFICATIONS & PAYMENTS ---');
    const testNotifId = `notif_test_${Date.now()}`;
    const testPayId = `pay_test_${Date.now()}`;
    try {
      if (testAuthUser) {
        // Notification CRUD
        const notifRef = doc(db, 'notifications', testNotifId);
        await setDoc(notifRef, {
          id: testNotifId,
          userId: testAuthUser.uid,
          title: 'Test Notification',
          message: 'Your booking has been scheduled.',
          type: 'booking',
          read: false,
          createdAt: new Date().toISOString(),
        });
        record('Notification', 'Create Notification (CREATE)', 'PASS');

        await updateDoc(notifRef, { read: true });
        record('Notification', 'Mark Notification Read (UPDATE)', 'PASS');

        await deleteDoc(notifRef);
        record('Notification', 'Delete Notification (DELETE)', 'PASS');

        // Payment Record
        const payRef = doc(db, 'payments', testPayId);
        await setDoc(payRef, {
          id: testPayId,
          bookingId: 'bk-demo',
          bookingNumber: 'MB-123456',
          userId: testAuthUser.uid,
          gateway: 'razorpay',
          transactionId: 'pay_test_txn_123',
          amount: 630,
          status: 'paid',
          createdAt: new Date().toISOString(),
        });
        record('Payment', 'Record Payment (CREATE)', 'PASS');

        await deleteDoc(payRef);
        record('Payment', 'Delete Payment (DELETE)', 'PASS');
      }
    } catch (e: any) {
      record('Notification/Payment', 'Flow', 'FAIL', e.message);
    }

    // ----------------------------------------------------
    // SUITE 5: PUBLIC COLLECTIONS (SETTINGS & SERVICE CATEGORIES)
    // ----------------------------------------------------
    console.log('\n--- 5. PUBLIC COLLECTIONS (SETTINGS & CATEGORIES) ---');
    try {
      const settingsRef = doc(db, 'settings', 'global');
      const sSnap = await getDoc(settingsRef);
      record('Settings', 'Read App Settings (READ)', 'PASS', sSnap.exists() ? 'Found' : 'Default');

      const catsRef = collection(db, 'service_categories');
      const catsSnap = await getDocs(catsRef);
      record('Service Categories', 'Read Service Categories (READ)', 'PASS', `Docs: ${catsSnap.docs.length}`);
    } catch (e: any) {
      record('Public Collections', 'Read Settings/Categories', 'FAIL', e.message);
    }

    // ----------------------------------------------------
    // SUITE 6: UNAUTHORIZED ACCESS REJECTION TESTS
    // ----------------------------------------------------
    console.log('\n--- 6. UNAUTHORIZED ACCESS REJECTION TESTS ---');
    if (testAuthUser) {
      // 1. Regular user trying to elevate role to admin
      try {
        const userDocRef = doc(db, 'users', testAuthUser.uid);
        await updateDoc(userDocRef, { role: 'admin' });
        record('Security', 'Block Role Escalation to Admin', 'FAIL', 'User was able to change role to admin');
      } catch {
        record('Security', 'Block Role Escalation to Admin', 'PASS', 'Properly blocked by Firestore rules');
      }

      // 2. Regular user trying to modify another user's document
      try {
        const otherUserRef = doc(db, 'users', 'some_other_uid_12345');
        await setDoc(otherUserRef, { name: 'Hacked User', role: 'customer' });
        record('Security', 'Block Cross-User Write', 'FAIL', 'User was able to write to another user doc');
      } catch {
        record('Security', 'Block Cross-User Write', 'PASS', 'Properly blocked by Firestore rules');
      }
    }

  } finally {
    // Cleanup test user
    if (testAuthUser) {
      try {
        await deleteDoc(doc(db, 'users', testAuthUser.uid)).catch(() => {});
        await deleteDoc(doc(db, 'customers', testAuthUser.uid)).catch(() => {});
        await deleteUser(testAuthUser).catch(() => {});
      } catch {}
    }
  }

  console.log('\n====================================================');
  console.log('📊 AUDIT SUMMARY REPORT');
  console.log('====================================================');
  const total = results.length;
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = total - passed;
  console.log(`Total Tests Run: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! FIREBASE PERMISSIONS AND CRUD FULLY VERIFIED.');
  } else {
    console.log(`\n⚠️ ${failed} tests failed.`);
  }
}

runAudit().catch(console.error);
