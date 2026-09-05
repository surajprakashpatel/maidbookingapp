import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  deleteUser as deleteAuthUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { isProfileComplete } from '../src/lib/auth-context';
import {
  completeUserProfile,
  saveUserData,
  updateCustomerApprovalStatus,
  fetchUserById,
} from '../src/lib/services/userService';
import { User } from '../src/lib/types';

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

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${msg}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${msg}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 GOOGLE LOGIN COMPLETE PROFILE + ADMIN APPROVAL TESTS');
  console.log('======================================================\n');

  const timestamp = Date.now();
  const testUserEmail = `googleuser.${timestamp}@example.com`;
  const testPassword = 'Password123!';
  let testUserCred: any = null;
  let testUid = '';

  try {
    // -------------------------------------------------------------
    // PHASE 1: isProfileComplete UNIT CHECKS
    // -------------------------------------------------------------
    console.log('--- Phase 1: isProfileComplete Detection ---');

    // Case 1.1: Typical Google Login initial profile (Name + Email + Photo, NO phone, NO address)
    const googleRawProfile: Partial<User> = {
      id: `mock-${timestamp}`,
      role: 'customer',
      name: 'Priya Sharma',
      email: 'priya.sharma@example.com',
      photoUrl: 'https://lh3.googleusercontent.com/test-photo',
      profileCompleted: false,
    };
    assert(!isProfileComplete(googleRawProfile), 'Initial Google profile without phone/address is NOT complete');

    // Case 1.2: Profile with phone but invalid (< 10 digits)
    assert(!isProfileComplete({
      ...googleRawProfile,
      phone: '12345',
      city: 'Bhilai',
      area: 'Nehru Nagar',
      address: 'House 123, Sector 5',
    }), 'Profile with invalid phone (< 10 digits) is NOT complete');

    // Case 1.3: Profile with valid phone but missing address
    assert(!isProfileComplete({
      ...googleRawProfile,
      phone: '9876543210',
      city: 'Bhilai',
      area: 'Nehru Nagar',
      address: '',
    }), 'Customer profile without house address is NOT complete');

    // Case 1.4: Profile with short address (< 5 chars)
    assert(!isProfileComplete({
      ...googleRawProfile,
      phone: '9876543210',
      city: 'Bhilai',
      area: 'Nehru Nagar',
      address: 'Flat',
    }), 'Customer profile with address < 5 chars is NOT complete');

    // Case 1.5: Profile with placeholder/default name
    assert(!isProfileComplete({
      ...googleRawProfile,
      name: 'Google User',
      phone: '9876543210',
      city: 'Bhilai',
      area: 'Nehru Nagar',
      address: 'House 123, Street 5',
    }), 'Profile with "Google User" placeholder name is NOT complete');

    // Case 1.6: Explicitly profileCompleted: false flag prevents completion
    assert(!isProfileComplete({
      ...googleRawProfile,
      phone: '9876543210',
      city: 'Bhilai',
      area: 'Nehru Nagar',
      address: 'House 123, Street 5',
      profileCompleted: false,
    }), 'Profile explicitly flagged profileCompleted: false is NOT complete');

    // Case 1.7: Valid complete profile
    const completeCustomer: Partial<User> = {
      id: `mock-${timestamp}`,
      role: 'customer',
      name: 'Priya Sharma',
      email: 'priya.sharma@example.com',
      phone: '9876543210',
      city: 'Bhilai',
      location: 'Bhilai',
      area: 'Nehru Nagar',
      address: 'House 123, Street 5, Near Civic Center',
      profileCompleted: true,
    };
    assert(isProfileComplete(completeCustomer), 'Valid complete customer profile is detected as complete');

    // Case 1.8: Maid profile requires profileCompleted: true from full maid registration
    assert(!isProfileComplete({
      id: `mock-${timestamp}`,
      role: 'maid',
      name: 'Sunita Bai',
      phone: '9876543210',
      city: 'Bhilai',
      area: 'Nehru Nagar',
    }), 'Maid profile without full maid registration profileCompleted is NOT complete');

    // Case 1.9: Admin role is always complete
    assert(isProfileComplete({ role: 'admin' }), 'Admin account is always complete');

    // -------------------------------------------------------------
    // PHASE 2: AUTHENTICATED BACKEND VALIDATION VIA completeUserProfile
    // -------------------------------------------------------------
    console.log('\n--- Phase 2: Authenticated Backend Validation & Profile Submission ---');

    // Create Firebase Auth user (simulating Google Auth account creation)
    testUserCred = await createUserWithEmailAndPassword(auth, testUserEmail, testPassword);
    testUid = testUserCred.user.uid;
    console.log(`  Authenticated as test user UID: ${testUid}`);

    // Attempt to submit incomplete profile (missing phone)
    const resNoPhone = await completeUserProfile({
      id: testUid,
      role: 'customer',
      name: 'Priya Sharma',
      phone: '',
      city: 'Bhilai',
      area: 'Nehru Nagar',
      address: 'House 123, Street 5',
    });
    assert(!resNoPhone.success, 'Backend rejects profile submission without phone');

    // Attempt to submit incomplete profile (short address)
    const resShortAddr = await completeUserProfile({
      id: testUid,
      role: 'customer',
      name: 'Priya Sharma',
      phone: '9876543210',
      city: 'Bhilai',
      area: 'Nehru Nagar',
      address: 'Fl 1',
    });
    assert(!resShortAddr.success, 'Backend rejects customer profile with address < 5 chars');

    // Valid submission with auto-filled Google data and user-filled mandatory fields
    const resValid = await completeUserProfile({
      id: testUid,
      role: 'customer',
      name: 'Priya Sharma',
      email: testUserEmail,
      photoUrl: 'https://lh3.googleusercontent.com/test-photo',
      phone: '9876543210',
      city: 'Bhilai',
      location: 'Bhilai',
      area: 'Nehru Nagar',
      address: 'Flat 402, Sunshine Apartments, Nehru Nagar',
    });

    assert(resValid.success, 'Valid complete profile is saved successfully');
    assert(resValid.user?.profileCompleted === true, 'Saved user has profileCompleted: true');
    assert(resValid.user?.approvalStatus === 'pending', 'Saved user has approvalStatus: pending');

    // Verify Firestore document integrity
    const userSnap = await getDoc(doc(db, 'users', testUid));
    assert(userSnap.exists(), 'User document exists in users collection');
    const userData = userSnap.data() as User;
    assert(userData.name === 'Priya Sharma', 'Firestore contains user real name');
    assert(userData.phone === '9876543210', 'Firestore contains user mobile number');
    assert(userData.email === testUserEmail, 'Firestore preserves Google email');
    assert(userData.photoUrl === 'https://lh3.googleusercontent.com/test-photo', 'Firestore preserves Google photoUrl');
    assert(userData.address === 'Flat 402, Sunshine Apartments, Nehru Nagar', 'Firestore contains full house address');
    assert(userData.profileCompleted === true, 'Firestore has profileCompleted: true');
    assert(userData.approvalStatus === 'pending', 'Firestore has approvalStatus: pending');

    // Verify customer document synchronized
    const custSnap = await getDoc(doc(db, 'customers', testUid));
    assert(custSnap.exists(), 'Customer document synchronized in customers collection');
    assert(custSnap.data()?.totalBookings === 0, 'Customer has totalBookings: 0 initialized');

    // -------------------------------------------------------------
    // PHASE 3: ADMIN APPROVAL FLOW
    // -------------------------------------------------------------
    console.log('\n--- Phase 3: Admin Review & Approval ---');

    // Sign in as Admin to inspect approval queue and notifications
    await signOut(auth);
    for (const pass of ['admin123', 'Password123!', 'admin@123']) {
      try {
        await signInWithEmailAndPassword(auth, 'admin@maideasy.in', pass);
        break;
      } catch {}
    }

    // Verify admin notification was created
    const notifQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', 'admin'),
      where('data.targetId', '==', testUid)
    );
    const notifSnap = await getDocs(notifQuery);
    assert(!notifSnap.empty, 'Admin received new registration approval request notification');
    const adminNotif = notifSnap.docs[0]?.data();
    assert(adminNotif?.title?.includes('New Customer Registration'), 'Notification title describes customer approval request');
    assert(adminNotif?.message?.includes('Priya Sharma'), 'Notification message mentions customer name');

    // Admin reviews customer profile: all details must be present
    const fetchedUser = await fetchUserById(testUid);
    assert(fetchedUser !== null, 'Admin can fetch customer record');
    assert(fetchedUser?.name === 'Priya Sharma', 'Admin sees customer name');
    assert(fetchedUser?.phone === '9876543210', 'Admin sees customer phone');
    assert(fetchedUser?.address !== undefined && fetchedUser.address.length > 10, 'Admin sees full customer address');
    assert(fetchedUser?.approvalStatus === 'pending', 'Admin sees status as pending');

    // Admin approves the customer
    const approveSuccess = await updateCustomerApprovalStatus(testUid, 'approved');
    assert(approveSuccess, 'Admin approves customer account successfully');

    // Verify updated status in users collection
    const approvedSnap = await getDoc(doc(db, 'users', testUid));
    const approvedData = approvedSnap.data() as User;
    assert(approvedData.approvalStatus === 'approved', 'User approvalStatus is now approved');
    assert(approvedData.status === 'active', 'User status is active');

    // Verify user received approval notification
    const userNotifQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', testUid),
      where('type', '==', 'account')
    );
    const userNotifSnap = await getDocs(userNotifQuery);
    assert(!userNotifSnap.empty, 'User received account approval notification');
    const userNotif = userNotifSnap.docs[0]?.data();
    assert(userNotif?.title?.includes('Account Approved'), 'User notification confirms approval');

    // -------------------------------------------------------------
    // PHASE 4: POST-APPROVAL PROFILE UPDATE & PRIVILEGE PROTECTION
    // -------------------------------------------------------------
    console.log('\n--- Phase 4: Post-Approval Profile Update & Security ---');

    // Sign back in as the approved customer
    await signOut(auth);
    await signInWithEmailAndPassword(auth, testUserEmail, testPassword);

    // User updates their address and area after approval
    const updatedUserObj: User = {
      ...approvedData,
      name: 'Priya Sharma (Updated)',
      address: 'Flat 505, Royal Palm Residency, Nehru Nagar East',
      area: 'Nehru Nagar East',
    };

    const updateSuccess = await saveUserData(updatedUserObj);
    assert(updateSuccess, 'saveUserData succeeds for approved user');

    // Verify update persisted
    const updatedSnap = await getDoc(doc(db, 'users', testUid));
    const finalData = updatedSnap.data() as User;
    assert(finalData.name === 'Priya Sharma (Updated)', 'Updated name persisted');
    assert(finalData.address === 'Flat 505, Royal Palm Residency, Nehru Nagar East', 'Updated address persisted');
    assert(finalData.approvalStatus === 'approved', 'approvalStatus remained approved after profile update');

    // Attempt malicious tampering: try to modify role to admin via saveUserData
    const maliciousUserObj: User = {
      ...finalData,
      role: 'admin' as any,
    };
    await saveUserData(maliciousUserObj);

    const recheckSnap = await getDoc(doc(db, 'users', testUid));
    const recheckData = recheckSnap.data() as User;
    assert(recheckData.role === 'customer', 'Security: Malicious role escalation blocked; remains customer');
    assert(recheckData.approvalStatus === 'approved', 'Security: Malicious approvalStatus alteration blocked; remains approved');

    console.log('\n--- Cleaning up test artifacts ---');
    // Switch to admin to clean up
    await signOut(auth);
    for (const pass of ['admin123', 'Password123!', 'admin@123']) {
      try {
        await signInWithEmailAndPassword(auth, 'admin@maideasy.in', pass);
        break;
      } catch {}
    }
    await deleteDoc(doc(db, 'users', testUid));
    await deleteDoc(doc(db, 'customers', testUid));
    for (const d of notifSnap.docs) {
      await deleteDoc(d.ref);
    }
    for (const d of userNotifSnap.docs) {
      await deleteDoc(d.ref);
    }
    // Delete auth user
    if (testUserCred?.user) {
      await signOut(auth);
      await signInWithEmailAndPassword(auth, testUserEmail, testPassword);
      await deleteAuthUser(auth.currentUser!).catch(() => {});
    }
    console.log('  Cleaned up test documents.\n');

  } catch (err) {
    console.error('Test execution exception:', err);
    failed++;
  }

  console.log('======================================================');
  console.log(`🏁 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Fatal error in tests:', e);
  process.exit(1);
});
